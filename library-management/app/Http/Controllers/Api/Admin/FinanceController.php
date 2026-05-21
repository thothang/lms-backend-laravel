<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\WithdrawalRequest;
use App\Models\EbookPurchase;
use App\Models\BorrowRecord;
use App\Models\AuditLog;
use App\Models\Notification;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Tymon\JWTAuth\Facades\JWTAuth;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class FinanceController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get withdrawal requests
     */
    public function withdrawalRequests(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $query = WithdrawalRequest::with('author:id,name,email');

            if ($request->has('status')) {
                $query->where('status', $request->status);
            }

            $limit = $request->input('limit', 20);
            $requests = $query->orderBy('created_at', 'desc')->paginate($limit);
            
            return response()->json($requests);
        }, 'Không thể lấy danh sách yêu cầu rút tiền');
    }

    /**
     * Get all ebook purchase earnings (for admin)
     */
    public function ebookEarnings(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $authorPercent = config('library.ebook_author_revenue_percent', 60);

            $query = EbookPurchase::with(['ebook:id,title,price,author_id,author_name', 'user:id,name,email'])
                ->whereHas('ebook', function ($q) {
                    $q->whereNotNull('author_id');
                })
                ->orderBy('purchase_date', 'desc');

            if ($request->has('author_id')) {
                $query->whereHas('ebook', function ($q) use ($request) {
                    $q->where('author_id', $request->author_id);
                });
            }

            if ($request->has('from_date')) {
                $query->whereDate('purchase_date', '>=', $request->from_date);
            }
            if ($request->has('to_date')) {
                $query->whereDate('purchase_date', '<=', $request->to_date);
            }

            $limit = $request->input('limit', 50);
            $purchases = $query->paginate($limit);

            $data = $purchases->getCollection()->map(function ($purchase) use ($authorPercent) {
                $totalAmount = (float) $purchase->amount;
                $authorEarnings = ($totalAmount * $authorPercent) / 100;
                $platformFee = $totalAmount - $authorEarnings;

                return [
                    'id' => $purchase->id,
                    'ebook_title' => $purchase->ebook->title,
                    'ebook_id' => $purchase->ebook->id,
                    'author_id' => $purchase->ebook->author_id,
                    'author_name' => $purchase->ebook->author ? $purchase->ebook->author->name : $purchase->ebook->author_name,
                    'buyer_name' => $purchase->user->name,
                    'buyer_email' => $purchase->user->email,
                    'purchase_date' => $purchase->purchase_date->format('Y-m-d H:i'),
                    'total_amount' => $totalAmount,
                    'platform_fee' => round($platformFee, 2),
                    'author_earnings' => round($authorEarnings, 2),
                    'author_percent' => $authorPercent,
                ];
            });

            return response()->json([
                'author_percent' => $authorPercent,
                'data' => $data,
                'pagination' => [
                    'current_page' => $purchases->currentPage(),
                    'last_page' => $purchases->lastPage(),
                    'per_page' => $purchases->perPage(),
                    'total' => $purchases->total(),
                ],
            ]);
        }, 'Không thể lấy doanh thu ebook');
    }

    /**
     * Get summary earnings by author (for admin)
     */
    public function authorEarningsSummary(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $authorPercent = config('library.ebook_author_revenue_percent', 60);

            $authorEarnings = EbookPurchase::selectRaw('
                ebooks.author_id,
                users.name as author_name,
                COUNT(DISTINCT ebooks.id) as total_ebooks,
                SUM(ebook_purchases.amount) as total_revenue
            ')
            ->join('ebooks', 'ebook_purchases.ebook_id', '=', 'ebooks.id')
            ->join('users', 'ebooks.author_id', '=', 'users.id')
            ->whereNotNull('ebooks.author_id')
            ->where('ebooks.status', 'approved')
            ->groupBy('ebooks.author_id', 'users.name')
            ->get()
            ->map(function ($item) use ($authorPercent) {
                return [
                    'author_id' => $item->author_id,
                    'author_name' => $item->author_name,
                    'total_ebooks' => $item->total_ebooks,
                    'total_revenue' => round($item->total_revenue, 2),
                    'author_earnings' => round(($item->total_revenue * $authorPercent) / 100, 2),
                    'platform_fee' => round($item->total_revenue - ($item->total_revenue * $authorPercent) / 100, 2),
                ];
            });

            return response()->json([
                'author_percent' => $authorPercent,
                'data' => $authorEarnings,
            ]);
        }, 'Không thể lấy tổng hợp doanh thu tác giả');
    }

    /**
     * Get admin revenue summary
     */
    public function revenue(): JsonResponse
    {
        return $this->withApiExceptionHandling(function () {
            $admin = JWTAuth::parseToken()->authenticate();

            if (!$admin) {
                return response()->json(['error' => 'Không tìm thấy người dùng'], 401);
            }

            $adminUser = User::find($admin->id);

            if (!$adminUser) {
                return response()->json(['error' => 'Không tìm thấy tài khoản admin'], 404);
            }

            $ebookIncome = \App\Models\Transaction::where('type', 'ebook_purchase')
                ->where('status', 'success')
                ->where('metadata->uploaded_by_admin', true)
                ->sum('amount');

            $authorEbookCommission = \App\Models\Transaction::where('type', 'ebook_purchase')
                ->where('status', 'success')
                ->where(function($q) {
                    $q->whereNull('metadata->uploaded_by_admin')
                      ->orWhere('metadata->uploaded_by_admin', false);
                })
                ->whereNotNull('metadata->author_id')
                ->sum('amount') * 0.4;

            $borrowFeeIncome = \App\Models\Transaction::where('type', 'library_fee_income')
                ->where('status', 'success')
                ->sum('amount');

            $penaltyIncome = \App\Models\Transaction::where('type', 'penalty')
                ->where('status', 'success')
                ->sum('amount');

            $reservationIncome = \App\Models\Transaction::where('type', 'deposit')
                ->where('status', 'success')
                ->whereNotNull('metadata->reservation_id')
                ->sum('amount');

            $depositIncome = \App\Models\Transaction::where('type', 'deposit_hold')
                ->where('status', 'success')
                ->whereNotNull('metadata->borrow_id')
                ->sum('amount');

            $refundedDeposits = \App\Models\Transaction::where('type', 'deposit_refund')
                ->where('status', 'success')
                ->whereNotNull('metadata->borrow_id')
                ->sum('amount');

            $actualConfiscated = $depositIncome - $refundedDeposits;
            if ($actualConfiscated < 0) $actualConfiscated = 0;

            $totalIncome = $ebookIncome + $authorEbookCommission + $borrowFeeIncome + $penaltyIncome + $reservationIncome + $actualConfiscated;

            $totalEarnings = $adminUser->earnings_balance ?? 0;
            
            $totalEarned = $totalIncome;

            $withdrawnAmount = \App\Models\WithdrawalRequest::where('author_id', $admin->id)
                ->where('status', 'completed')
                ->sum('amount');

            // To avoid missing ebookTransactions variable that was left out from AdminController refactor
            // get recent transactions directly
            $ebookTransactions = \App\Models\Transaction::where('type', 'ebook_purchase')
                ->where('status', 'success')
                ->orderBy('created_at', 'desc')
                ->take(20)
                ->get();
            
            $recentEbookSales = $ebookTransactions->map(function ($t) {
                $metadata = is_array($t->metadata) ? $t->metadata : [];
                return [
                    'id' => $t->id,
                    'type' => 'ebook_sale',
                    'amount' => $t->amount,
                    'description' => 'Bán ebook: ' . ($metadata['ebook_title'] ?? 'N/A'),
                    'buyer_id' => $t->user_id,
                    'created_at' => $t->created_at,
                ];
            })->values();

            return response()->json([
                'earnings_balance' => $totalEarnings,
                'total_earned' => $totalEarned,
                'withdrawn' => $withdrawnAmount,
                'available_to_withdraw' => $totalEarnings,
                'breakdown' => [
                    'ebook_income' => $ebookIncome,
                    'author_ebook_commission' => $authorEbookCommission,
                    'borrow_fee_income' => $borrowFeeIncome,
                    'penalty_income' => $penaltyIncome,
                    'reservation_income' => $reservationIncome,
                    'deposit_income' => $actualConfiscated,
                    'total_income' => $totalIncome,
                ],
                'recent_transactions' => $recentEbookSales,
            ]);
        }, 'Không thể lấy doanh thu admin');
    }

    /**
     * Get deposit summary for admin
     */
    public function depositSummary(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            return response()->json(
                Cache::remember('admin.deposit_summary', 300, function() {
                    $activeBorrows = BorrowRecord::whereIn('status', ['active', 'returned', 'overdue'])
                        ->where(function ($q) {
                            $q->whereNotNull('prepaid_amount')
                              ->where('prepaid_amount', '>', 0);
                        })
                        ->get();

                    $totalDepositHeld = $activeBorrows->sum('prepaid_amount');
                    $totalRecords = $activeBorrows->count();

                    $pendingRefund = BorrowRecord::where('status', 'returned')
                        ->where('prepaid_amount', '>', 0)
                        ->whereNull('deposit_refunded_at')
                        ->sum('prepaid_amount');

                    $refundedDeposits = BorrowRecord::whereNotNull('deposit_refunded_at')
                        ->where('prepaid_amount', '>', 0)
                        ->sum('prepaid_amount');

                    return [
                        'total_deposit_held' => round($totalDepositHeld, 2),
                        'active_borrow_records' => $totalRecords,
                        'pending_refund' => round($pendingRefund, 2),
                        'already_refunded' => round($refundedDeposits, 2),
                    ];
                })
            );
        }, 'Không thể lấy thống kê đặt cọc');
    }

    /**
     * Get borrow statistics for admin
     */
    public function borrowStats(): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () {
            return response()->json(
                Cache::remember('admin.borrow_stats', 300, function() {
                    $today = Carbon::now()->startOfDay();
                    $thisMonth = Carbon::now()->startOfMonth();

                    $totalBorrowed = BorrowRecord::whereIn('status', ['active', 'overdue'])->count();
                    $overdueCount = BorrowRecord::where('status', 'overdue')->count();
                    $monthlyBorrows = BorrowRecord::where('borrow_date', '>=', $thisMonth)->count();

                    return [
                        'total_borrowed' => $totalBorrowed,
                        'overdue_count' => $overdueCount,
                        'monthly_borrows' => $monthlyBorrows,
                    ];
                })
            );
        }, 'Không thể lấy thống kê mượn sách');
    }

    /**
     * Process withdrawal request
     */
    public function processWithdrawal(Request $request, int $id): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request, $id) {
            $request->validate([
                'action' => 'required|in:approve,reject',
                'notes' => 'nullable|string|max:500',
            ]);

            $admin = JWTAuth::parseToken()->authenticate();
            $withdrawal = WithdrawalRequest::find($id);

            if (!$withdrawal) {
                return response()->json(['error' => 'Yêu cầu không tồn tại'], 404);
            }

            if ($withdrawal->status !== 'pending') {
                return response()->json(['error' => 'Yêu cầu đã được xử lý'], 422);
            }

            if ($request->action === 'approve') {
                $withdrawal->approve($request->notes);
                $withdrawal->markCompleted();
            } else {
                $withdrawal->reject($request->notes);
            }

            Cache::forget('reports.overview');
            Cache::forget('admin.revenue');
            Cache::forget('admin.transactions');
            Cache::forget("author.{$withdrawal->author_id}.earnings");

            Notification::create([
                'user_id' => $withdrawal->author_id,
                'title' => $request->action === 'approve' ? 'Yêu cầu rút tiền được duyệt' : 'Yêu cầu rút tiền bị từ chối',
                'content' => $request->action === 'approve'
                    ? "Yêu cầu rút tiền " . number_format($withdrawal->amount) . " VNĐ đã được duyệt và chuyển thành công."
                    : "Yêu cầu rút tiền " . number_format($withdrawal->amount) . " VNĐ đã bị từ chối. " . ($request->notes ? "Lý do: {$request->notes}" : "Số tiền đã được hoàn vào tài khoản."),
                'type' => Notification::TYPE_WEB,
            ]);

            AuditLog::log(
                $admin->id,
                strtoupper($request->action) . '_WITHDRAWAL',
                'withdrawal_requests',
                $withdrawal->id,
                ['status' => 'pending'],
                ['status' => $request->action === 'approve' ? 'completed' : 'rejected']
            );

            return response()->json([
                'message' => $request->action === 'approve' ? 'Duyệt yêu cầu rút tiền thành công' : 'Từ chối yêu cầu rút tiền thành công',
            ]);
        }, 'Không thể xử lý yêu cầu rút tiền');
    }
}
