<?php

namespace App\Services;

use App\Models\Book;
use App\Models\BookCopy;
use App\Models\BorrowRecord;
use App\Models\User;
use App\Models\Transaction;
use App\Models\UserDebt;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\BorrowStatusChanged;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class BorrowService
{
    /**
     * Borrow a book
     */
    public function borrow(User $user, BookCopy $copy, int $days = 9): array
    {
        return DB::transaction(function () use ($user, $copy, $days) {
            // Lock the copy row
            $copy = BookCopy::lockForUpdate()->find($copy->id);
            $book = $copy->book;

            // Check eligibility
            $eligibility = $this->checkBorrowEligibility($user, $copy);
            if (!$eligibility['success']) {
                return [
                    'success' => false,
                    'message' => $eligibility['message'],
                ];
            }

            // Calculate deposit
            $depositAmount = $book->getDepositAmount();
            $dailyFee = $book->getEffectiveDailyFee();
            $borrowDays = $days;
            $prepaidFee = $dailyFee * $borrowDays;
            $totalDeduction = $depositAmount + $prepaidFee;

            // Check balance
            if ($user->balance < $totalDeduction) {
                return [
                    'success' => false,
                    'message' => 'Số dư không đủ để thanh toán tiền cọc và phí mượn tạm tính',
                ];
            }

            // Deduct total amount
            $user->subtractBalance($totalDeduction);

            // Create borrow record
            $borrowRecord = BorrowRecord::create([
                'user_id' => $user->id,
                'copy_id' => $copy->id,
                'borrow_date' => Carbon::now(),
                'due_date' => Carbon::now()->addDays($borrowDays),
                'daily_fee_applied' => $dailyFee,
                'deposit_amount' => $depositAmount,
                'prepaid_amount' => $prepaidFee,
                'renew_count' => 0,
                'status' => 'pending_pickup', // Thay đổi: pending thay vì active
            ]);

            // Create deposit hold transaction
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $totalDeduction,
                'type' => 'deposit_hold',
                'status' => 'success',
                'metadata' => [
                    'borrow_id' => $borrowRecord->id,
                    'copy_id' => $copy->id,
                    'deposit' => $depositAmount,
                    'prepaid_fee' => $prepaidFee,
                ],
            ]);

            // Copy vẫn là available (chưa lấy)
            // Không cập nhật copy status ở đây

            // Log action
            AuditLog::log(
                $user->id,
                'BORROW_REQUEST', // Thay đổi log name
                'borrow_records',
                $borrowRecord->id,
                null,
                ['copy_id' => $copy->id, 'deposit' => $depositAmount]
            );

            // Send notification cho thủ thư
            $librarians = User::where('role', 'librarian')->orWhere('role', 'admin')->get();
            foreach ($librarians as $librarian) {
                $this->sendNotification(
                    $librarian->id,
                    'Yêu cầu mượn sách mới',
                    "Người dùng '{$user->name}' muốn mượn sách '{$book->title}'. Vui lòng xác nhận khi họ đến lấy."
                );
            }

            // Send notification cho user
            $this->sendNotification(
                $user->id,
                'Yêu cầu mượn sách đã được gửi',
                "Bạn đã yêu cầu mượn sách '{$book->title}'. Vui lòng đến thư viện để nhận sách. Mã phiếu: #{$borrowRecord->id}"
            );

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'pending_pickup'));

            return [
                'success' => true,
                'message' => 'Yêu cầu mượn sách đã được gửi. Vui lòng đến thư viện để nhận sách.',
                'borrow_record' => [
                    'id' => $borrowRecord->id,
                    'copy_id' => $copy->id,
                    'book_title' => $book->title,
                    'borrow_date' => $borrowRecord->borrow_date->format('Y-m-d'),
                    'due_date' => $borrowRecord->due_date->format('Y-m-d'),
                    'daily_fee' => $dailyFee,
                    'deposit_amount' => $depositAmount,
                    'prepaid_amount' => $prepaidFee,
                    'status' => $borrowRecord->status,
                ],
            ];
        });
    }

    /**
     * Check if user can borrow a specific copy
     */
    public function checkBorrowEligibility(User $user, BookCopy $copy): array
    {
        // Check if account is active
        $canBorrow = $user->canBorrow();
        if (!$canBorrow[0]) {
            return [
                'success' => false,
                'message' => $canBorrow[1],
            ];
        }

        // Check if copy is available
        if (!$copy->isAvailable()) {
            return [
                'success' => false,
                'message' => 'Sách không còn bản sao khả dụng',
            ];
        }

        $book = $copy->book;

        // Check if user already has this book borrowed
        $existingBorrow = BorrowRecord::where('user_id', $user->id)
            ->where('copy_id', $copy->id)
            ->whereIn('status', ['active', 'overdue'])
            ->first();

        if ($existingBorrow) {
            return [
                'success' => false,
                'message' => 'Bạn đang mượn sách này',
            ];
        }

        // Check if user already has this book borrowed (same book_id via different copies)
        $sameBookBorrow = BorrowRecord::where('user_id', $user->id)
            ->whereHas('copy', function ($q) use ($book) {
                $q->where('book_id', $book->id);
            })
            ->whereIn('status', ['active', 'overdue'])
            ->first();

        if ($sameBookBorrow) {
            return [
                'success' => false,
                'message' => 'Bạn đang mượn đầu sách này rồi',
            ];
        }

        // Check reservation queue - Rule: only allow borrow if supply > demand
        $pendingReservationsCount = $book->reservations()->where('status', 'pending')->count();
        $availableCopiesCount = $book->available_copies;
        
        // If someone is waiting, and we don't have enough copies to cover all waitlisted people + this borrower
        if ($pendingReservationsCount > 0) {
            // Check if current user is the NEXT person in line
            $nextInLine = $book->reservations()
                ->where('status', 'pending')
                ->orderBy('queue_order')
                ->first();
                
            if (!$nextInLine || $nextInLine->user_id !== $user->id) {
                // If not next in line, we must have more copies than reservations
                if ($availableCopiesCount <= $pendingReservationsCount) {
                    return [
                        'success' => false,
                        'message' => 'Sách hiện đã có người đặt trước trong hàng chờ. Vui lòng sử dụng chức năng "Đặt trước" thay vì mượn ngay.',
                    ];
                }
            }
        }

        // Skip individual balance check here as we check total deduction in borrow()

        return [
            'success' => true,
            'message' => 'Có thể mượn sách',
        ];
    }

    /**
     * Return a book
     */
    public function returnBook(BorrowRecord $borrowRecord): array
    {
        return DB::transaction(function () use ($borrowRecord) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with(['copy.book', 'user'])->find($borrowRecord->id);
            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Calculate fee
            $feeData = $borrowRecord->calculateFee();

            if ($feeData['extra_amount_needed'] > 0) {
                // Not enough deposit, create pending return
                // Create transaction to collect extra amount
                if ($user) {
                    Transaction::create([
                        'user_id' => $user->id,
                        'amount' => $feeData['extra_amount_needed'],
                        'type' => 'borrow_fee',
                        'status' => 'pending',
                        'metadata' => [
                            'borrow_id' => $borrowRecord->id,
                        ],
                    ]);
                }

                $borrowRecord->update(['status' => 'pending_return']);

                return [
                    'message' => 'Phí mượn vượt quá tiền cọc, vui lòng thanh toán phần còn lại',
                    'borrow_fee' => $feeData['borrow_fee'],
                    'deposit' => $feeData['deposit'],
                    'extra_amount_needed' => $feeData['extra_amount_needed'],
                    'payment_url' => null, // Will be generated by Sepay
                    'borrow_record_status' => 'pending_return',
                ];
            }

            // Enough deposit - process refund
            $refundAmount = $feeData['refund'];
            $borrowFee = $feeData['borrow_fee'];

            // Add borrow fee to admin's earnings
            $admin = User::where('role', 'admin')->first();
            if ($admin && $borrowFee > 0) {
                $admin->addEarnings($borrowFee);

                Transaction::create([
                    'user_id' => $admin->id,
                    'amount' => $borrowFee,
                    'type' => 'library_fee_income',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                        'book_title' => $book->title,
                        'description' => 'Phí mượn sách vật lý',
                    ],
                ]);
            }

            // Refund to user
            if ($refundAmount > 0 && $user) {
                $user->addBalance($refundAmount);

                Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $refundAmount,
                    'type' => 'deposit_refund',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                    ],
                ]);
            }

            // Update borrow record
            $borrowRecord->update([
                'status' => 'returned',
                'return_date' => Carbon::now(),
                'actual_fee' => $feeData['borrow_fee'],
            ]);

            // Update copy status
            $copy->update(['status' => 'available']);
            $book->updateAvailableCopies();

            // Process reservation queue
            $this->processReservationQueue($book);

            // Log action
            AuditLog::log(
                $user?->id,
                'RETURN_BOOK',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'active'],
                ['status' => 'returned']
            );

            // Send notification
            if ($user) {
                $this->sendNotification(
                    $user->id,
                    'Trả sách thành công',
                    "Bạn đã trả sách '{$book->title}'. Tổng tiền đã giữ: " . number_format($feeData['total_held']) . " VNĐ. Phí mượn ({$feeData['total_days']} ngày): " . number_format($feeData['borrow_fee']) . " VNĐ. Tiền hoàn: " . number_format($refundAmount) . " VNĐ."
                );
            }

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'returned'));

            return [
                'message' => 'Trả sách thành công',
                'borrow_fee' => $feeData['borrow_fee'],
                'deposit' => $feeData['deposit'],
                'refund' => $refundAmount,
                'library_earnings' => $borrowFee,
            ];
        });
    }

    /**
     * Finalize a pending return after payment
     */
    public function finalizePendingReturn(BorrowRecord $borrowRecord): void
    {
        DB::transaction(function () use ($borrowRecord) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with(['copy.book', 'user'])->find($borrowRecord->id);
            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Calculate fee
            $feeData = $borrowRecord->calculateFee();
            $borrowFee = $feeData['borrow_fee'];

            // Add borrow fee to admin's earnings
            $admin = User::where('role', 'admin')->first();
            if ($admin && $borrowFee > 0) {
                $admin->addEarnings($borrowFee);

                Transaction::create([
                    'user_id' => $admin->id,
                    'amount' => $borrowFee,
                    'type' => 'library_fee_income',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                        'book_title' => $book->title,
                        'description' => 'Phí mượn sách vật lý (thanh toán trễ)',
                    ],
                ]);
            }

            // Update borrow record
            $borrowRecord->update([
                'status' => 'returned',
                'return_date' => Carbon::now(),
                'actual_fee' => $borrowFee,
            ]);

            // Update copy status
            $copy->update(['status' => 'available']);
            $book->updateAvailableCopies();

            // Process reservation queue
            $this->processReservationQueue($book);

            // Log action
            AuditLog::log(
                $borrowRecord->user_id,
                'FINALIZE_RETURN',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'pending_return'],
                ['status' => 'returned']
            );

            // Send notification
            if ($user) {
                $this->sendNotification(
                    $user->id,
                    'Thanh toán phí mượn thành công',
                    "Phí mượn sách '{$book->title}' đã được thanh toán: " . number_format($borrowFee) . " VNĐ."
                );
            }

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'returned'));
        });
    }

    /**
     * Renew a borrow
     */
    public function renew(BorrowRecord $borrowRecord, int $days = 9): array
    {
        return DB::transaction(function () use ($borrowRecord, $days) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with('copy.book')->find($borrowRecord->id);

            // Check if can renew
            $canRenew = $borrowRecord->canRenew();
            if (!$canRenew[0]) {
                return [
                    'success' => false,
                    'message' => $canRenew[1],
                ];
            }

            // Calculate renewal fee
            $renewalFee = (float) $borrowRecord->daily_fee_applied * $days;
            $user = $borrowRecord->user;

            // Check balance
            if ($user->balance < $renewalFee) {
                return [
                    'success' => false,
                    'message' => 'Số dư không đủ để gia hạn',
                ];
            }

            // Deduct fee
            $user->subtractBalance($renewalFee);

            // Update borrow record
            $newDueDate = $borrowRecord->due_date->copy()->addDays($days);
            $newPrepaidAmount = (float)$borrowRecord->prepaid_amount + $renewalFee;
            $borrowRecord->update([
                'due_date' => $newDueDate,
                'renew_count' => $borrowRecord->renew_count + 1,
                'prepaid_amount' => $newPrepaidAmount,
            ]);

            // Create transaction
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $renewalFee,
                'type' => 'borrow_fee',
                'status' => 'success',
                'metadata' => [
                    'borrow_id' => $borrowRecord->id,
                    'renew_days' => $days,
                ],
            ]);

            // Log action
            AuditLog::log(
                $user->id,
                'RENEW_BOOK',
                'borrow_records',
                $borrowRecord->id,
                ['due_date' => $borrowRecord->getOriginal('due_date')],
                ['due_date' => $newDueDate, 'renew_count' => $borrowRecord->renew_count]
            );

            // Send notification
            $this->sendNotification(
                $user->id,
                'Gia hạn sách thành công',
                "Sách '{$borrowRecord->copy->book->title}' đã được gia hạn đến {$newDueDate->format('d/m/Y')}"
            );

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'renewed'));

            return [
                'success' => true,
                'message' => 'Gia hạn sách thành công',
                'borrow_record' => [
                    'id' => $borrowRecord->id,
                    'due_date' => $newDueDate->format('Y-m-d'),
                    'renew_count' => $borrowRecord->renew_count,
                ],
            ];
        });
    }

    /**
     * Process reservation queue for a book
     */
    protected function processReservationQueue(Book $book): void
    {
        // Find next pending reservation
        $nextReservation = $book->reservations()
            ->where('status', 'pending')
            ->orderBy('queue_order')
            ->first();

        if ($nextReservation) {
            $nextReservation->update(['status' => 'fulfilled']);

            $this->sendNotification(
                $nextReservation->user_id,
                'Đặt trước đã được xác nhận',
                "Sách '{$book->title}' đã sẵn sàng để bạn mượn"
            );
        }
    }

    /**
     * Send notification to user
     */
    protected function sendNotification(int $userId, string $title, string $content): void
    {
        Notification::create([
            'user_id' => $userId,
            'title' => $title,
            'content' => $content,
            'type' => 'web',
        ]);
    }

    /**
     * Librarian confirms user has picked up the book
     */
    public function confirmPickup(BorrowRecord $borrowRecord, int $librarianId): array
    {
        return DB::transaction(function () use ($borrowRecord, $librarianId) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with(['copy.book', 'user'])->find($borrowRecord->id);

            // Check if can be picked up
            if (!$borrowRecord->canBePickedUp()) {
                return [
                    'success' => false,
                    'message' => 'Phiếu mượn không ở trạng thái chờ nhận sách',
                ];
            }

            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Update borrow record status
            $borrowRecord->update([
                'status' => 'active',
                'actual_pickup_date' => Carbon::now(), // Thêm field mới
            ]);

            // Update copy status to borrowed
            $copy->update(['status' => 'borrowed']);

            // Update book available copies
            $book->updateAvailableCopies();

            // Log action
            AuditLog::log(
                $librarianId,
                'CONFIRM_PICKUP',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'pending_pickup'],
                ['status' => 'active']
            );

            // Send notification to user
            if ($user) {
                $this->sendNotification(
                    $user->id,
                    'Đã nhận sách thành công',
                    "Bạn đã nhận sách '{$book->title}'. Hạn trả: {$borrowRecord->due_date->format('d/m/Y')}"
                );
            }

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'active'));

            return [
                'success' => true,
                'message' => 'Đã xác nhận người dùng nhận sách',
                'borrow_record' => $borrowRecord,
            ];
        });
    }

    /**
     * Librarian confirms user has returned the book
     */
    public function confirmReturn(BorrowRecord $borrowRecord, int $librarianId): array
    {
        return DB::transaction(function () use ($borrowRecord, $librarianId) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with(['copy.book', 'user'])->find($borrowRecord->id);
            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Calculate fee
            $feeData = $borrowRecord->calculateFee();

            // Refund hoặc thu thêm
            if ($feeData['extra_amount_needed'] > 0) {
                // Tạo pending payment cho user
                if ($user) {
                    Transaction::create([
                        'user_id' => $user->id,
                        'amount' => $feeData['extra_amount_needed'],
                        'type' => 'borrow_fee',
                        'status' => 'pending',
                        'metadata' => [
                            'borrow_id' => $borrowRecord->id,
                            'description' => 'Phí mượn vượt quá tiền cọc',
                        ],
                    ]);
                }

                $borrowRecord->update([
                    'status' => 'pending_return',
                    'return_date' => Carbon::now(),
                ]);

                return [
                    'success' => true,
                    'message' => 'Đã xác nhận trả sách. Phí mượn vượt quá tiền cọc, vui lòng thanh toán phần còn lại.',
                    'borrow_record' => $borrowRecord,
                    'fee_details' => [
                        'total_days' => $feeData['total_days'],
                        'borrow_fee' => $feeData['borrow_fee'],
                        'deposit' => $feeData['deposit'],
                        'extra_amount_needed' => $feeData['extra_amount_needed'],
                    ],
                ];
            }

            // Đủ tiền cọc - xử lý hoàn tiền
            $refundAmount = $feeData['refund'];
            $borrowFee = $feeData['borrow_fee'];

            // Thêm phí vào thu nhập thư viện
            $admin = User::where('role', 'admin')->first();
            if ($admin && $borrowFee > 0) {
                $admin->addEarnings($borrowFee);

                Transaction::create([
                    'user_id' => $admin->id,
                    'amount' => $borrowFee,
                    'type' => 'library_fee_income',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                        'book_title' => $book->title,
                        'description' => 'Phí mượn sách vật lý',
                    ],
                ]);
            }

            // Hoàn tiền cho user
            if ($refundAmount > 0 && $user) {
                $user->addBalance($refundAmount);

                Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $refundAmount,
                    'type' => 'deposit_refund',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                    ],
                ]);
            }

            // Update borrow record
            $borrowRecord->update([
                'status' => 'returned',
                'return_date' => Carbon::now(),
                'actual_fee' => $feeData['borrow_fee'],
            ]);

            // Update copy status
            $copy->update(['status' => 'available']);
            $book->updateAvailableCopies();

            // Process reservation queue
            $this->processReservationQueue($book);

            // Log action
            AuditLog::log(
                $librarianId,
                'LIBRARIAN_RETURN',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'active'],
                ['status' => 'returned']
            );

            // Send notification
            if ($user) {
                $this->sendNotification(
                    $user->id,
                    'Trả sách thành công',
                    "Bạn đã trả sách '{$book->title}'. Phí mượn: " . number_format($feeData['borrow_fee']) . " VNĐ. Tiền hoàn: " . number_format($refundAmount) . " VNĐ."
                );
            }

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'returned'));

            return [
                'success' => true,
                'message' => 'Đã xác nhận người dùng trả sách',
                'borrow_record' => $borrowRecord,
                'fee_details' => [
                    'total_days' => $feeData['total_days'],
                    'borrow_fee' => $feeData['borrow_fee'],
                    'deposit' => $feeData['deposit'],
                    'refund' => $refundAmount,
                ],
            ];
        });
    }

    /**
     * Librarian cancels a pending pickup request
     */
    public function cancelPickup(BorrowRecord $borrowRecord, int $librarianId): array
    {
        return DB::transaction(function () use ($borrowRecord, $librarianId) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with(['copy.book', 'user'])->find($borrowRecord->id);

            if (!$borrowRecord->canBePickedUp()) {
                return [
                    'success' => false,
                    'message' => 'Phiếu mượn không ở trạng thái chờ nhận sách',
                ];
            }

            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Hoàn tiền cho user (không mượn nữa)
            $totalDeducted = (float)$borrowRecord->deposit_amount + (float)$borrowRecord->prepaid_amount;
            if ($user && $totalDeducted > 0) {
                $user->addBalance($totalDeducted);

                Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $totalDeducted,
                    'type' => 'deposit_refund',
                    'status' => 'success',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                        'reason' => 'cancel_pickup',
                    ],
                ]);
            }

            // Update borrow record status
            $borrowRecord->update([
                'status' => 'cancelled',
                'return_date' => Carbon::now(),
            ]);

            // Copy vẫn available (chưa lấy)

            // Log action
            AuditLog::log(
                $librarianId,
                'CANCEL_PICKUP',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'pending_pickup'],
                ['status' => 'cancelled']
            );

            // Send notification to user
            if ($user) {
                $this->sendNotification(
                    $user->id,
                    'Yêu cầu mượn sách đã bị hủy',
                    "Yêu cầu mượn sách '{$book->title}' đã bị hủy. Tiền đã trừ đã được hoàn: " . number_format($totalDeducted) . " VNĐ."
                );
            }

            return [
                'success' => true,
                'message' => 'Đã hủy yêu cầu mượn sách và hoàn tiền',
                'refunded_amount' => $totalDeducted,
            ];
        });
    }
}
