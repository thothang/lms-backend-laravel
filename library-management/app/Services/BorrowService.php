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
    public function borrow(User $user, BookCopy $copy, array $data = []): array
    {
        return DB::transaction(function () use ($user, $copy, $data) {
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
            $borrowDays = config('library.default_borrow_days', 9);

            // Check balance
            if ($user->balance < $depositAmount) {
                return [
                    'success' => false,
                    'message' => 'Số dư không đủ để đặt cọc',
                ];
            }

            // Deduct deposit
            $user->subtractBalance($depositAmount);

            // Create borrow record
            $borrowRecord = BorrowRecord::create([
                'user_id' => $user->id,
                'copy_id' => $copy->id,
                'borrow_date' => Carbon::now(),
                'due_date' => Carbon::now()->addDays($borrowDays),
                'daily_fee_applied' => $dailyFee,
                'deposit_amount' => $depositAmount,
                'renew_count' => 0,
                'status' => 'active',
            ]);

            // Create deposit hold transaction
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $depositAmount,
                'type' => 'deposit_hold',
                'status' => 'success',
                'metadata' => [
                    'borrow_id' => $borrowRecord->id,
                    'copy_id' => $copy->id,
                ],
            ]);

            // Update copy status
            $copy->update(['status' => 'borrowed']);

            // Update book available copies
            $book->updateAvailableCopies();

            // Log action
            AuditLog::log(
                $user->id,
                'BORROW_BOOK',
                'borrow_records',
                $borrowRecord->id,
                null,
                ['copy_id' => $copy->id, 'deposit' => $depositAmount]
            );

            // Send notification
            $this->sendNotification(
                $user->id,
                'Mượn sách thành công',
                "Bạn đã mượn sách '{$book->title}'. Hạn trả: {$borrowRecord->due_date->format('d/m/Y')}"
            );

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'borrowed'));

            return [
                'success' => true,
                'message' => 'Mượn sách thành công',
                'borrow_record' => [
                    'id' => $borrowRecord->id,
                    'copy_id' => $copy->id,
                    'book_title' => $book->title,
                    'borrow_date' => $borrowRecord->borrow_date->format('Y-m-d'),
                    'due_date' => $borrowRecord->due_date->format('Y-m-d'),
                    'daily_fee' => $dailyFee,
                    'deposit_amount' => $depositAmount,
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

        // Check reservation queue
        $firstReservation = $book->reservations()
            ->where('status', 'pending')
            ->orderBy('queue_order')
            ->first();

        if ($firstReservation && $firstReservation->user_id !== $user->id) {
            return [
                'success' => false,
                'message' => 'Sách đã có người đặt trước',
            ];
        }

        // Check balance for deposit
        $depositAmount = $book->getDepositAmount();
        if ($user->balance < $depositAmount) {
            return [
                'success' => false,
                'message' => 'Số dư không đủ để đặt cọc',
            ];
        }

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
            $borrowRecord = BorrowRecord::lockForUpdate()->with('copy.book')->find($borrowRecord->id);
            $copy = $borrowRecord->copy;
            $book = $copy->book;
            $user = $borrowRecord->user;

            // Calculate fee
            $feeData = $borrowRecord->calculateFee();

            if ($feeData['extra_amount_needed'] > 0) {
                // Not enough deposit, create pending return
                // Create transaction to collect extra amount
                $transaction = Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $feeData['extra_amount_needed'],
                    'type' => 'borrow_fee',
                    'status' => 'pending',
                    'metadata' => [
                        'borrow_id' => $borrowRecord->id,
                    ],
                ]);

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

            // Refund to user
            if ($refundAmount > 0) {
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
            ]);

            // Update copy status
            $copy->update(['status' => 'available']);
            $book->updateAvailableCopies();

            // Process reservation queue
            $this->processReservationQueue($book);

            // Log action
            AuditLog::log(
                $user->id,
                'RETURN_BOOK',
                'borrow_records',
                $borrowRecord->id,
                ['status' => 'active'],
                ['status' => 'returned']
            );

            // Send notification
            $this->sendNotification(
                $user->id,
                'Trả sách thành công',
                "Bạn đã trả sách '{$book->title}'. Phí mượn: " . number_format($feeData['borrow_fee']) . " VNĐ. Hoàn cọc: " . number_format($refundAmount) . " VNĐ"
            );

            // Broadcast event
            broadcast(new BorrowStatusChanged($borrowRecord, 'returned'));

            return [
                'message' => 'Trả sách thành công',
                'borrow_fee' => $feeData['borrow_fee'],
                'deposit' => $feeData['deposit'],
                'refund' => $refundAmount,
            ];
        });
    }

    /**
     * Finalize a pending return after payment
     */
    public function finalizePendingReturn(BorrowRecord $borrowRecord): void
    {
        DB::transaction(function () use ($borrowRecord) {
            $borrowRecord = BorrowRecord::lockForUpdate()->with('copy.book')->find($borrowRecord->id);
            $copy = $borrowRecord->copy;
            $book = $copy->book;

            // Update borrow record
            $borrowRecord->update([
                'status' => 'returned',
                'return_date' => Carbon::now(),
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
            $renewalFee = $borrowRecord->daily_fee_applied * $days;
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
            $borrowRecord->update([
                'due_date' => $newDueDate,
                'renew_count' => $borrowRecord->renew_count + 1,
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
}
