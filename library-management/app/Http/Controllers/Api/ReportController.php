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
use Illuminate\Support\Facades\Cache;

class ReportController extends Controller
{
    /**
     * Get full overview report with all statistics
     */
    public function overview(): JsonResponse
    {
        return response()->json(
            Cache::remember('reports.overview', 300, function() {
                $today = Carbon::now()->startOfDay();
                $thisMonth = Carbon::now()->startOfMonth();

                // === USERS ===
                $usersByRole = User::select('role', DB::raw('COUNT(*) as count'))
                    ->groupBy('role')
                    ->pluck('count', 'role');
                $totalUsers = $usersByRole->sum();
                $activeUsers = User::where('status', 'active')->count();
                $lockedUsers = User::where('status', 'locked')->count();
                $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

                // === BOOKS ===
                $totalBooks = \App\Models\Book::count();
                $copiesByStatus = \App\Models\BookCopy::select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status');
                $totalCopies = $copiesByStatus->sum();
                $availableCopies = $copiesByStatus['available'] ?? 0;
                $borrowedCopies = $copiesByStatus['borrowed'] ?? 0;
                $lostCopies = $copiesByStatus['lost'] ?? 0;
                $totalCategories = \App\Models\BookCategory::count();

                // === EBOOKS ===
                $ebooksByStatus = Ebook::select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status');
                $totalEbooks = $ebooksByStatus->sum();
                $approvedEbooks = $ebooksByStatus['approved'] ?? 0;
                $pendingEbooks = $ebooksByStatus['pending'] ?? 0;
                $rejectedEbooks = $ebooksByStatus['rejected'] ?? 0;
                
                $ebooksByFree = Ebook::select('is_free', DB::raw('COUNT(*) as count'))
                    ->groupBy('is_free')
                    ->pluck('count', 'is_free');
                $freeEbooks = $ebooksByFree[1] ?? 0;
                $paidEbooks = $ebooksByFree[0] ?? 0;
                $totalEbookPurchases = EbookPurchase::count();

                // === BORROWS ===
                $borrowsByStatus = BorrowRecord::select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status');
                $totalBorrows = $borrowsByStatus->sum();
                $activeBorrows = ($borrowsByStatus['active'] ?? 0) + ($borrowsByStatus['overdue'] ?? 0);
                $overdueBorrows = $borrowsByStatus['overdue'] ?? 0;
                $returnedBorrows = $borrowsByStatus['returned'] ?? 0;
                $todayBorrows = BorrowRecord::whereDate('borrow_date', $today)->count();
                $todayReturns = BorrowRecord::whereDate('actual_return_date', $today)->count();
                $thisMonthBorrows = BorrowRecord::where('borrow_date', '>=', $thisMonth)->count();

                // === RESERVATIONS ===
                $reservationsByStatus = Reservation::select('status', DB::raw('COUNT(*) as count'))
                    ->groupBy('status')
                    ->pluck('count', 'status');
                $totalReservations = $reservationsByStatus->sum();
                $pendingReservations = $reservationsByStatus['pending'] ?? 0;
                $confirmedReservations = $reservationsByStatus['confirmed'] ?? 0;
                $cancelledReservations = $reservationsByStatus['cancelled'] ?? 0;
                $expiredReservations = $reservationsByStatus['expired'] ?? 0;

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
                $withdrawalsByStatus = WithdrawalRequest::select('status', DB::raw('COUNT(*) as count'), DB::raw('SUM(amount) as total'))
                    ->where('status', 'completed')
                    ->groupBy('status')
                    ->first();
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

                // === MONTHLY TRENDS (last 6 months) - OPTIMIZED with single query ===
                $sixMonthsAgo = Carbon::now()->subMonths(5)->startOfMonth();
                
                $monthlyBorrows = BorrowRecord::select(
                        DB::raw('DATE_FORMAT(borrow_date, "%Y-%m") as month'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->where('borrow_date', '>=', $sixMonthsAgo)
                    ->groupBy('month')
                    ->pluck('count', 'month');
                
                $monthlyReturns = BorrowRecord::select(
                        DB::raw('DATE_FORMAT(return_date, "%Y-%m") as month'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->where('actual_return_date', '>=', $sixMonthsAgo)
                    ->groupBy('month')
                    ->pluck('count', 'month');
                
                $monthlyRevenue = Transaction::select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                        DB::raw('SUM(amount) as total')
                    )
                    ->where('status', 'success')
                    ->where('created_at', '>=', $sixMonthsAgo)
                    ->groupBy('month')
                    ->pluck('total', 'month');
                
                $monthlyNewUsers = User::select(
                        DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
                        DB::raw('COUNT(*) as count')
                    )
                    ->where('created_at', '>=', $sixMonthsAgo)
                    ->groupBy('month')
                    ->pluck('count', 'month');
                
                $monthlyTrends = [];
                for ($i = 5; $i >= 0; $i--) {
                    $month = Carbon::now()->subMonths($i);
                    $monthKey = $month->format('Y-m');
                    
                    $monthlyTrends[] = [
                        'month' => $monthKey,
                        'borrows' => $monthlyBorrows[$monthKey] ?? 0,
                        'returns' => $monthlyReturns[$monthKey] ?? 0,
                        'revenue' => $monthlyRevenue[$monthKey] ?? 0,
                        'new_users' => $monthlyNewUsers[$monthKey] ?? 0,
                    ];
                }

                return [
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
                ];
            })
        );
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
