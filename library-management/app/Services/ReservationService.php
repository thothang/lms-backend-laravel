<?php

namespace App\Services;

use App\Models\User;
use App\Models\Book;
use App\Models\Reservation;
use App\Models\Transaction;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Events\ReservationExpired;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class ReservationService
{
    /**
     * Reserve a book
     */
    public function reserve(User $user, int $bookId, int $expectedDays = 9): array
    {
        return DB::transaction(function () use ($user, $bookId, $expectedDays) {
            $book = Book::find($bookId);

            if (!$book) {
                return [
                    'success' => false,
                    'message' => 'Sách không tồn tại',
                ];
            }

            // Rule 1: Can only reserve if NO copies are available
            if ($book->available_copies > 0) {
                return [
                    'success' => false,
                    'message' => 'Sách hiện đang có sẵn bản sao, vui lòng mượn trực tiếp thay vì xếp hàng chờ',
                ];
            }

            // Rule 2: Max queue size = Total copies
            $pendingCount = Reservation::where('book_id', $bookId)
                ->where('status', 'pending')
                ->count();
            
            if ($pendingCount >= $book->total_copies) {
                return [
                    'success' => false,
                    'message' => 'Hàng chờ cho sách này đã đầy (giới hạn bằng tổng số lượng sách)',
                ];
            }

            // Check eligibility
            // Check if user already has this book borrowed
            $existingBorrow = $user->borrowRecords()
                ->whereHas('copy', function ($q) use ($bookId) {
                    $q->where('book_id', $bookId);
                })
                ->whereIn('status', ['active', 'overdue'])
                ->first();

            if ($existingBorrow) {
                return [
                    'success' => false,
                    'message' => 'Bạn đang mượn sách này',
                ];
            }

            // Check if user already has a pending reservation for this book
            $existingReservation = Reservation::where('user_id', $user->id)
                ->where('book_id', $bookId)
                ->where('status', 'pending')
                ->first();

            if ($existingReservation) {
                return [
                    'success' => false,
                    'message' => 'Bạn đã có reservation pending cho sách này',
                ];
            }

            // Calculate fee (10% of estimated borrow fee)
            $dailyFee = $book->getEffectiveDailyFee();
            $estimatedFee = $dailyFee * $expectedDays;
            $reservationFee = ($estimatedFee * config('library.reservation_fee_percent', 10)) / 100;

            // Check balance
            if ($user->balance < $reservationFee) {
                return [
                    'success' => false,
                    'message' => 'Số dư không đủ để đặt trước',
                ];
            }

            // Deduct fee
            $user->subtractBalance($reservationFee);

            // Calculate queue order
            $maxQueueOrder = Reservation::where('book_id', $bookId)
                ->where('status', 'pending')
                ->max('queue_order') ?? 0;
            $queueOrder = $maxQueueOrder + 1;

            // Calculate expiry date
            $expiryDays = config('library.reservation_expiry_days', 3);

            // Create reservation
            $reservation = Reservation::create([
                'user_id' => $user->id,
                'book_id' => $bookId,
                'expected_borrow_days' => $expectedDays,
                'reservation_date' => Carbon::now(),
                'expiry_date' => Carbon::now()->addDays($expiryDays),
                'fee_paid' => $reservationFee,
                'queue_order' => $queueOrder,
                'status' => 'pending',
            ]);

            // Create transaction
            Transaction::create([
                'user_id' => $user->id,
                'amount' => $reservationFee,
                'type' => 'deposit',
                'status' => 'success',
                'metadata' => [
                    'reservation_id' => $reservation->id,
                    'book_id' => $bookId,
                ],
            ]);

            // Log action
            AuditLog::log(
                $user->id,
                'CREATE_RESERVATION',
                'reservations',
                $reservation->id,
                null,
                ['book_id' => $bookId, 'fee_paid' => $reservationFee]
            );

            // Notify librarians/admin about new reservation
            $librarians = User::where('role', 'librarian')->orWhere('role', 'admin')->get();
            foreach ($librarians as $librarian) {
                $this->sendNotification(
                    $librarian->id,
                    'Yêu cầu đặt trước mới',
                    "Người dùng '{$user->name}' đã đặt trước sách '{$book->title}'. Vị trí trong hàng chờ: #{$queueOrder}."
                );
            }

            return [
                'success' => true,
                'reservation_id' => $reservation->id,
                'fee_paid' => $reservationFee,
                'queue_position' => $queueOrder,
            ];
        });
    }

    /**
     * Cancel a reservation
     */
    public function cancel(User $user, int $reservationId): array
    {
        return DB::transaction(function () use ($user, $reservationId) {
            $reservation = Reservation::where('id', $reservationId)
                ->where('user_id', $user->id)
                ->where('status', 'pending')
                ->first();

            if (!$reservation) {
                return [
                    'success' => false,
                    'message' => 'Reservation không tồn tại hoặc không thể hủy',
                ];
            }

            $reservation->update(['status' => 'cancelled']);

            // Refund fee to user
            $book = \App\Models\Book::find($reservation->book_id);
            if ($book && $reservation->fee_paid > 0) {
                $user = $reservation->user;
                $user->addBalance($reservation->fee_paid);

                \App\Models\Transaction::create([
                    'user_id' => $user->id,
                    'amount' => $reservation->fee_paid,
                    'type' => 'deposit_refund',
                    'status' => 'success',
                    'metadata' => [
                        'reservation_id' => $reservation->id,
                        'reason' => 'cancelled_by_user',
                    ],
                ]);

                // Notify user about refund
                Notification::create([
                    'user_id' => $user->id,
                    'title' => 'Đặt trước đã bị hủy - Hoàn tiền',
                    'content' => "Đặt trước sách '{$book->title}' đã bị hủy. Phí đặt trước " . number_format($reservation->fee_paid) . " VNĐ đã được hoàn vào tài khoản.",
                    'type' => Notification::TYPE_WEB,
                ]);
            }

            // Log action
            AuditLog::log(
                $user->id,
                'CANCEL_RESERVATION',
                'reservations',
                $reservation->id
            );

            return [
                'success' => true,
            ];
        });
    }

    /**
     * Assign next reservation for a book
     */
    public function assignNextReservation(Book $book): ?Reservation
    {
        return DB::transaction(function () use ($book) {
            // Lock the reservations table to prevent race condition
            $reservation = Reservation::where('book_id', $book->id)
                ->where('status', 'pending')
                ->orderBy('queue_order')
                ->lockForUpdate()
                ->first();

            if ($reservation) {
                $reservation->update(['status' => 'fulfilled']);

                $this->sendNotification(
                    $reservation->user_id,
                    'Đặt trước đã được xác nhận',
                    "Sách '{$book->title}' đã sẵn sàng để bạn mượn"
                );
            }

            return $reservation;
        });
    }

    /**
     * Send notification
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
