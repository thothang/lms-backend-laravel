<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BorrowRecord;
use App\Models\Transaction;
use App\Models\User;
use App\Models\Ebook;
use App\Models\EbookPurchase;
use App\Models\Reservation;
use App\Models\WithdrawalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class ReportController extends Controller
{
    /**
     * Get full overview report with all statistics
     */
    public function overview(): JsonResponse
    {
        $today = Carbon::now()->startOfDay();
        $thisMonth = Carbon::now()->startOfMonth();

        // === USERS ===
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $lockedUsers = User::where('status', 'locked')->count();
        $usersByRole = User::select('role', DB::raw('COUNT(*) as count'))
            ->groupBy('role')
            ->pluck('count', 'role');
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

        // === BOOKS ===
        $totalBooks = \App\Models\Book::count();
        $totalCopies = \App\Models\BookCopy::count();
        $availableCopies = \App\Models\BookCopy::where('status', 'available')->count();
        $borrowedCopies = \App\Models\BookCopy::where('status', 'borrowed')->count();
        $lostCopies = \App\Models\BookCopy::where('status', 'lost')->count();
        $totalCategories = \App\Models\BookCategory::count();

        // === EBOOKS ===
        $totalEbooks = Ebook::count();
        $approvedEbooks = Ebook::where('status', 'approved')->count();
        $pendingEbooks = Ebook::where('status', 'pending')->count();
        $rejectedEbooks = Ebook::where('status', 'rejected')->count();
        $freeEbooks = Ebook::where('is_free', true)->count();
        $paidEbooks = Ebook::where('is_free', false)->count();
        $totalEbookPurchases = EbookPurchase::count();

        // === BORROWS ===
        $totalBorrows = BorrowRecord::count();
        $activeBorrows = BorrowRecord::whereIn('status', ['active', 'overdue'])->count();
        $overdueBorrows = BorrowRecord::where('status', 'overdue')->count();
        $returnedBorrows = BorrowRecord::where('status', 'returned')->count();
        $todayBorrows = BorrowRecord::whereDate('borrow_date', $today)->count();
        $todayReturns = BorrowRecord::whereDate('return_date', $today)->count();
        $thisMonthBorrows = BorrowRecord::where('borrow_date', '>=', $thisMonth)->count();

        // === RESERVATIONS ===
        $totalReservations = Reservation::count();
        $pendingReservations = Reservation::where('status', 'pending')->count();
        $confirmedReservations = Reservation::where('status', 'confirmed')->count();
        $cancelledReservations = Reservation::where('status', 'cancelled')->count();
        $expiredReservations = Reservation::where('status', 'expired')->count();

        // === REVENUE ===
        $revenueQuery = Transaction::where('status', 'success');
        $totalRevenue = (clone $revenueQuery)->sum('amount');
        $thisMonthRevenue = (clone $revenueQuery)->where('created_at', '>=', $thisMonth)->sum('amount');
        $todayRevenue = (clone $revenueQuery)->whereDate('created_at', $today)->sum('amount');

        $revenueByType = Transaction::where('status', 'success')
            ->select('type', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('type')
            ->get()
            ->keyBy('type')
            ->map(fn($item) => ['total' => $item->total, 'count' => $item->count]);

        $ebookRevenue = $revenueByType['ebook_purchase']['total'] ?? 0;
        $libraryShare = $ebookRevenue * 0.4;

        // === WITHDRAWALS ===
        $totalWithdrawals = WithdrawalRequest::count();
        $pendingWithdrawals = WithdrawalRequest::where('status', 'pending')->count();
        $completedWithdrawals = WithdrawalRequest::where('status', 'completed')->count();
        $totalWithdrawnAmount = WithdrawalRequest::where('status', 'completed')->sum('amount');

        // === RECENT BORROWS ===
        $recentBorrows = BorrowRecord::with(['user:id,name', 'copy.book:id,title'])
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'user' => $b->user?->name ?? ($b->guest_name ?? 'N/A'),
                'book' => $b->copy?->book?->title ?? 'N/A',
                'status' => $b->status,
                'borrow_date' => $b->borrow_date,
                'due_date' => $b->due_date,
            ]);

        // === MONTHLY TRENDS (last 6 months) ===
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $month = Carbon::now()->subMonths($i);
            $monthStart = $month->copy()->startOfMonth();
            $monthEnd = $month->copy()->endOfMonth();

            $monthlyTrends[] = [
                'month' => $month->format('Y-m'),
                'borrows' => BorrowRecord::whereBetween('borrow_date', [$monthStart, $monthEnd])->count(),
                'returns' => BorrowRecord::whereBetween('return_date', [$monthStart, $monthEnd])->count(),
                'revenue' => Transaction::where('status', 'success')
                    ->whereBetween('created_at', [$monthStart, $monthEnd])
                    ->sum('amount'),
                'new_users' => User::whereBetween('created_at', [$monthStart, $monthEnd])->count(),
            ];
        }

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
                'locked' => $lockedUsers,
                'by_role' => $usersByRole,
                'new_this_month' => $newUsersThisMonth,
            ],
            'books' => [
                'total_titles' => $totalBooks,
                'total_copies' => $totalCopies,
                'available_copies' => $availableCopies,
                'borrowed_copies' => $borrowedCopies,
                'lost_copies' => $lostCopies,
                'total_categories' => $totalCategories,
            ],
            'ebooks' => [
                'total' => $totalEbooks,
                'approved' => $approvedEbooks,
                'pending' => $pendingEbooks,
                'rejected' => $rejectedEbooks,
                'free' => $freeEbooks,
                'paid' => $paidEbooks,
                'total_purchases' => $totalEbookPurchases,
            ],
            'borrows' => [
                'total' => $totalBorrows,
                'active' => $activeBorrows,
                'overdue' => $overdueBorrows,
                'returned' => $returnedBorrows,
                'today_borrows' => $todayBorrows,
                'today_returns' => $todayReturns,
                'this_month' => $thisMonthBorrows,
            ],
            'reservations' => [
                'total' => $totalReservations,
                'pending' => $pendingReservations,
                'confirmed' => $confirmedReservations,
                'cancelled' => $cancelledReservations,
                'expired' => $expiredReservations,
            ],
            'revenue' => [
                'total' => $totalRevenue,
                'today' => $todayRevenue,
                'this_month' => $thisMonthRevenue,
                'by_type' => $revenueByType,
                'ebook_revenue' => $ebookRevenue,
                'library_share' => $libraryShare,
            ],
            'withdrawals' => [
                'total' => $totalWithdrawals,
                'pending' => $pendingWithdrawals,
                'completed' => $completedWithdrawals,
                'total_withdrawn' => $totalWithdrawnAmount,
            ],
            'recent_borrows' => $recentBorrows,
            'monthly_trends' => $monthlyTrends,
        ]);
    }

    /**
     * Get borrowing report
     */
    public function borrowings(Request $request): JsonResponse
    {
        $query = BorrowRecord::with(['user:id,name', 'copy.book:id,title'])
            ->orderBy('created_at', 'desc');

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('borrow_date', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('borrow_date', '<=', $request->to_date);
        }

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        $borrows = $query->paginate(50);

        return response()->json($borrows);
    }

    /**
     * Get revenue report
     */
    public function revenue(Request $request): JsonResponse
    {
        $query = Transaction::where('status', 'success');

        // Filter by date range
        if ($request->has('from_date')) {
            $query->whereDate('created_at', '>=', $request->from_date);
        }
        if ($request->has('to_date')) {
            $query->whereDate('created_at', '<=', $request->to_date);
        }

        // Group by type
        $byType = (clone $query)->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get()
            ->pluck('total', 'type');

        $totalRevenue = (clone $query)->sum('amount');

        // Calculate library's share from ebook purchases
        $ebookRevenue = $byType['ebook_purchase'] ?? 0;
        $libraryShare = $ebookRevenue * 0.4; // 40% to library

        return response()->json([
            'total_revenue' => $totalRevenue,
            'by_type' => $byType,
            'ebook_revenue' => $ebookRevenue,
            'library_share' => $libraryShare,
        ]);
    }
}
