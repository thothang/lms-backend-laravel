<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Transaction;
use App\Models\PaymentTransaction;
use App\Models\EbookPurchase;
use App\Models\BorrowRecord;
use App\Models\Reservation;
use App\Models\WithdrawalRequest;
use App\Traits\HandlesApiExceptions;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SystemController extends Controller
{
    use HandlesApiExceptions;

    /**
     * Get audit logs
     */
    public function auditLogs(Request $request): \Symfony\Component\HttpFoundation\Response
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $query = AuditLog::with('user:id,name');

            if ($request->has('action')) {
                $query->where('action', $request->action);
            }

            if ($request->has('table_name')) {
                $query->where('table_name', $request->table_name);
            }

            if ($request->has('user_id')) {
                $query->where('user_id', $request->user_id);
            }

            $logs = $query->orderBy('created_at', 'desc')->paginate(50);

            return response()->json($logs);
        }, 'Không thể lấy nhật ký audit');
    }

    /**
     * Get recent transactions (all financial transactions)
     */
    public function transactions(Request $request): JsonResponse
    {
        return $this->withApiExceptionHandling(function () use ($request) {
            $limit = $request->input('limit', 10);

            return response()->json(
                Cache::remember('admin.transactions', 300, function() use ($limit) {
                    $paymentTransactions = PaymentTransaction::with('user:id,name')
                        ->orderBy('created_at', 'desc')
                        ->take($limit)
                        ->get()
                        ->map(function ($t) {
                            $metadata = is_array($t->metadata) ? $t->metadata : [];
                            return [
                                'id' => 'pt-' . $t->id,
                                'type' => $t->type,
                                'amount' => $t->amount,
                                'description' => $this->getTransactionDescription($t->type, $metadata),
                                'user' => $t->user,
                                'created_at' => $t->created_at,
                                'source' => 'payment_transaction',
                            ];
                        });

                    $ebookPurchases = EbookPurchase::with(['user:id,name', 'ebook:id,title'])
                        ->orderBy('purchase_date', 'desc')
                        ->take($limit)
                        ->get()
                        ->map(function ($p) {
                            return [
                                'id' => 'ep-' . $p->id,
                                'type' => 'ebook_purchase',
                                'amount' => $p->amount,
                                'description' => 'Mua ebook: ' . ($p->ebook->title ?? 'N/A'),
                                'user' => $p->user,
                                'created_at' => $p->purchase_date,
                                'source' => 'ebook_purchase',
                            ];
                        });

                    $borrowRecords = BorrowRecord::with(['user:id,name', 'copy.book:id,title'])
                        ->whereNotNull('actual_fee')
                        ->where('actual_fee', '>', 0)
                        ->orderBy('created_at', 'desc')
                        ->take($limit)
                        ->get()
                        ->map(function ($b) {
                            return [
                                'id' => 'br-' . $b->id,
                                'type' => 'borrow_fee',
                                'amount' => $b->actual_fee,
                                'description' => 'Phí mượn sách: ' . ($b->copy->book->title ?? 'N/A'),
                                'user' => $b->user,
                                'created_at' => $b->created_at,
                                'source' => 'borrow_record',
                            ];
                        });

                    $reservations = Reservation::with(['user:id,name', 'book:id,title'])
                        ->where('fee_paid', '>', 0)
                        ->orderBy('created_at', 'desc')
                        ->take($limit)
                        ->get()
                        ->map(function ($r) {
                            return [
                                'id' => 'res-' . $r->id,
                                'type' => 'reservation_fee',
                                'amount' => $r->fee_paid,
                                'description' => 'Phí đặt trước: ' . ($r->book->title ?? 'N/A'),
                                'user' => $r->user,
                                'created_at' => $r->created_at,
                                'source' => 'reservation',
                            ];
                        });

                    $withdrawals = WithdrawalRequest::with(['author:id,name'])
                        ->orderBy('created_at', 'desc')
                        ->take($limit)
                        ->get()
                        ->map(function ($w) {
                            return [
                                'id' => 'wd-' . $w->id,
                                'type' => 'withdrawal',
                                'amount' => $w->amount,
                                'description' => 'Yêu cầu rút tiền: ' . ($w->status === 'completed' ? 'Hoàn thành' : ($w->status === 'pending' ? 'Đang xử lý' : 'Đã từ chối')),
                                'user' => $w->author,
                                'created_at' => $w->created_at,
                                'source' => 'withdrawal_request',
                            ];
                        });

                    $allTransactions = collect()
                        ->concat($paymentTransactions)
                        ->concat($ebookPurchases)
                        ->concat($borrowRecords)
                        ->concat($reservations)
                        ->concat($withdrawals)
                        ->sortByDesc('created_at')
                        ->take($limit)
                        ->values();

                    return $allTransactions;
                })
            );
        }, 'Không thể lấy danh sách giao dịch');
    }

    /**
     * Get transaction description based on type
     */
    private function getTransactionDescription(string $type, array $metadata): string
    {
        switch ($type) {
            case 'topup':
                return 'Nạp tiền';
            case 'deposit':
                return 'Thanh toán đặt cọc';
            case 'fine':
                return 'Thanh toán phạt';
            case 'borrow_fee':
                return 'Phí mượn sách';
            case 'ebook_purchase':
                return 'Mua ebook: ' . ($metadata['ebook_title'] ?? 'N/A');
            default:
                return 'Giao dịch';
        }
    }
}
