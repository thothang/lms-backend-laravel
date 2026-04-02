<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BorrowRecord;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Carbon\Carbon;
use DB;

class ReportController extends Controller
{
    /**
     * Get overview report
     */
    public function overview(): JsonResponse
    {
        $totalUsers = User::count();
        $activeUsers = User::where('status', 'active')->count();
        $totalBooks = \App\Models\Book::count();
        $availableBooks = \App\Models\Book::sum('available_copies');

        $activeBorrows = BorrowRecord::whereIn('status', ['active', 'overdue'])->count();
        $overdueBorrows = BorrowRecord::where('status', 'overdue')->count();

        $today = Carbon::now()->startOfDay();
        $todayBorrows = BorrowRecord::whereDate('borrow_date', $today)->count();
        $todayReturns = BorrowRecord::whereDate('return_date', $today)->count();

        return response()->json([
            'users' => [
                'total' => $totalUsers,
                'active' => $activeUsers,
            ],
            'books' => [
                'total' => $totalBooks,
                'available' => $availableBooks,
            ],
            'borrows' => [
                'active' => $activeBorrows,
                'overdue' => $overdueBorrows,
                'today_borrows' => $todayBorrows,
                'today_returns' => $todayReturns,
            ],
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
        $byType = $query->select('type', DB::raw('SUM(amount) as total'))
            ->groupBy('type')
            ->get()
            ->pluck('total', 'type');

        $totalRevenue = $query->sum('amount');

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
