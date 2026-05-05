import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { Book, Clock, CheckCircle, AlertCircle, Loader2, MapPin, XCircle, Info, X, Calendar, DollarSign, User, FileText } from 'lucide-react';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import RenewModal from '../catalog/RenewModal';
import ConfirmModal from '../ui/ConfirmModal';
import { useUserBorrows, useRenewBook } from '../../hooks/queries';

const BorrowHistory = () => {
  // Sử dụng React Query hooks từ queries.js
  const { data: borrows = [], isLoading } = useUserBorrows();
  const renewMutation = useRenewBook();

  const [showRenewModal, setShowRenewModal] = useState(false);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailBorrow, setDetailBorrow] = useState(null);

  const handleRenew = (borrow) => {
    setSelectedBorrow(borrow);
    setShowRenewModal(true);
  };

  const handleShowDetail = (borrow) => {
    setDetailBorrow(borrow);
    setShowDetailModal(true);
  };

  const executeRenew = async (days) => {
    if (!selectedBorrow) return;

    // Sử dụng mutation hook - tự invalidate queries sau khi thành công
    renewMutation.mutate(
      { borrowId: selectedBorrow.id, days },
      {
        onSuccess: (data) => {
          const updatedBorrow = data.borrow_record || data.borrow || data.data || data;
          const newDue = updatedBorrow.due_date;
          const dailyFee = Number(selectedBorrow?.daily_fee_applied || selectedBorrow?.book?.daily_fee || 0);
          const additionalFee = dailyFee * days;

          let msg = `✅ Gia hạn thành công ${days} ngày!`;
          if (newDue) msg += ` Hạn trả mới: ${new Date(newDue).toLocaleDateString('vi-VN')}.`;
          if (additionalFee) msg += ` Đã thu thêm: ${Number(additionalFee).toLocaleString('vi-VN')} ₫.`;

          showSuccess(msg);
          setShowRenewModal(false);
        },
      }
    );
  };





  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending_pickup': return 'bg-amber-100 text-amber-700';
      case 'borrowed':
      case 'active': return 'bg-blue-100 text-blue-700';
      case 'pending_return': return 'bg-orange-100 text-orange-700';
      case 'returned': return 'bg-emerald-100 text-emerald-700';
      case 'overdue': return 'bg-red-100 text-red-700';
      case 'cancelled': return 'bg-slate-100 text-slate-500';
      case 'lost': return 'bg-rose-100 text-rose-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status) => {
    switch(status?.toLowerCase()) {
      case 'pending_pickup': return 'Chờ nhận sách';
      case 'borrowed':
      case 'active': return 'Đang mượn';
      case 'pending_return': return 'Chờ thanh toán';
      case 'returned': return 'Đã trả';
      case 'overdue': return 'Quá hạn';
      case 'cancelled': return 'Đã hủy';
      case 'lost': return 'Mất sách';
      default: return status;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Book className="text-indigo-600" /> Sách đang mượn & Lịch sử
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : borrows.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          Bạn chưa có bản ghi mượn sách nào.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-xs p-4 text-slate-500 uppercase tracking-wider">
                <th className="pb-3 px-4 font-bold">Thông tin Sách</th>
                <th className="pb-3 px-4 font-bold">Ngày mượn</th>
                <th className="pb-3 px-4 font-bold">Ngày trả / Hạn trả</th>
                <th className="pb-3 px-4 font-bold text-center">Tiền cọc</th>
                <th className="pb-3 px-4 font-bold text-center">Phí / Đã thu</th>
                <th className="pb-3 px-4 font-bold">Trạng thái</th>
                <th className="pb-3 px-4 font-bold text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="before:block before:h-2">
              {borrows.map(record => {
                const bookTitle = record.book?.title || record.copy?.book?.title || record.book_title || 'Sách ID: ' + (record.book_id || record.id);
                const copyId = record.book_copy_id || record.copy_id || record.copy?.id;
                const borrowDate = record.borrowed_at || record.borrow_date || record.created_at;
                const dueDate = record.due_date;
                const returnDate = record.returned_at || record.return_date;
                const isOngoing = ['borrowed', 'active', 'overdue'].includes(record.status?.toLowerCase());
                const isPendingPickup = record.status?.toLowerCase() === 'pending_pickup';
                
                const prepaidAmount = record.prepaid_amount || 0;
                const actualFee = record.actual_fee;
                const depositAmount = record.deposit_amount || 0;
                
                return (
                  <tr key={record.id} className="bg-white border border-slate-100 hover:shadow-md transition-all group cursor-pointer" onClick={() => handleShowDetail(record)}>
                    <td className="py-4 px-4 border-y border-l border-slate-100 first:rounded-l-2xl">
                      <div className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors">
                        {bookTitle}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-tighter">Copy: {copyId || 'N/A'}</div>
                    </td>
                    <td className="py-4 px-4 border-y border-slate-100 text-sm text-slate-600">
                      <div className="font-medium">{borrowDate ? new Date(borrowDate).toLocaleDateString('vi-VN') : '---'}</div>
                    </td>
                    <td className="py-4 px-4 border-y border-slate-100 text-sm">
                      {returnDate ? (
                        <div className="text-emerald-600 font-bold flex items-center gap-1">
                          <CheckCircle size={14} />
                          {new Date(returnDate).toLocaleDateString('vi-VN')}
                        </div>
                      ) : (
                        <div className="text-amber-600 font-medium flex items-center gap-1">
                          <Clock size={14} />
                          {dueDate ? new Date(dueDate).toLocaleDateString('vi-VN') : '---'}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 border-y border-slate-100 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-semibold text-slate-700">
                          {Number(depositAmount).toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter bg-slate-50 px-1 py-0.5 rounded mt-1">Cọc</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 border-y border-slate-100 text-center">
                      {isOngoing ? (
                        <div className="flex flex-col items-center">
                           <span className="text-sm font-bold text-blue-600">
                             {Number(prepaidAmount).toLocaleString('vi-VN')} ₫
                           </span>
                           <span className="text-[9px] text-blue-400 font-bold uppercase tracking-tighter bg-blue-50 px-1 py-0.5 rounded mt-1">Đã thu</span>
                        </div>
                      ) : (
                        <span className="text-sm font-black text-indigo-600">
                          {Number(actualFee || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 border-y border-slate-100">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${getStatusColor(record.status)}`}>
                        {getStatusText(record.status)}
                      </span>
                    </td>
                    <td className="py-4 px-4 border-y border-r border-slate-100 last:rounded-r-2xl text-right">
                      {isPendingPickup ? (
                        <div className="flex items-center justify-end gap-1.5 text-amber-600" onClick={(e) => e.stopPropagation()}>
                          <MapPin size={14} />
                          <span className="text-xs font-bold">Đến thư viện nhận</span>
                        </div>
                      ) : isOngoing ? (
                        <div className="flex flex-col items-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleRenew(record)}
                            title="Gia hạn thêm thời gian"
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white rounded-xl transition-all"
                          >
                            <Clock size={14} /> Gia hạn
                          </button>
                          <span className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                            <Info size={10} /> Mang trả tại thư viện
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 font-medium px-4">Đã hoàn tất</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}


      {showRenewModal && selectedBorrow && (
        <RenewModal
          isOpen={showRenewModal}
          onClose={() => setShowRenewModal(false)}
          borrow={selectedBorrow}
          onConfirm={executeRenew}
          isLoading={renewMutation.isPending}
        />
      )}

      {showDetailModal && detailBorrow && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Book className="text-indigo-600" /> Chi tiết phiếu mượn
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Record ID */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Mã phiếu mượn
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-600 font-mono">#{detailBorrow.id}</span>
                  <span className="text-xs text-slate-500">Dùng mã này để thủ thư tìm kiếm</span>
                </div>
              </div>

              {/* Book Info */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-indigo-600" /> Thông tin sách
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tên sách:</span>
                    <span className="font-semibold text-slate-800">{detailBorrow.book?.title || detailBorrow.copy?.book?.title || detailBorrow.book_title || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Mã bản sao:</span>
                    <span className="font-mono text-slate-800">{detailBorrow.book_copy_id || detailBorrow.copy_id || detailBorrow.copy?.id || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tác giả:</span>
                    <span className="text-slate-800">{detailBorrow.book?.author_name || detailBorrow.copy?.book?.author_name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-600" /> Thời gian
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ngày mượn:</span>
                    <span className="font-semibold text-slate-800">{detailBorrow.borrowed_at || detailBorrow.borrow_date || detailBorrow.created_at ? new Date(detailBorrow.borrowed_at || detailBorrow.borrow_date || detailBorrow.created_at).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Hạn trả:</span>
                    <span className="font-semibold text-amber-600">{detailBorrow.due_date ? new Date(detailBorrow.due_date).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                  {detailBorrow.returned_at && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Ngày trả thực tế:</span>
                      <span className="font-semibold text-emerald-600">{new Date(detailBorrow.returned_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Financial Info */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" /> Chi phí
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tiền cọc:</span>
                    <span className="font-semibold text-slate-800">{Number(detailBorrow.deposit_amount || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí mượn tạm thu:</span>
                    <span className="font-semibold text-blue-600">{Number(detailBorrow.prepaid_amount || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                  {detailBorrow.actual_fee && (
                    <div className="flex justify-between">
                      <span className="text-slate-600">Phí thực tế:</span>
                      <span className="font-semibold text-indigo-600">{Number(detailBorrow.actual_fee).toLocaleString('vi-VN')} ₫</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí/ngày:</span>
                    <span className="text-slate-800">{Number(detailBorrow.daily_fee_applied || detailBorrow.book?.daily_fee || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Trạng thái
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(detailBorrow.status)}`}>
                    {getStatusText(detailBorrow.status)}
                  </span>
                </div>
                {detailBorrow.renew_count > 0 && (
                  <div className="mt-2 text-sm text-slate-600">
                    Đã gia hạn: <span className="font-semibold">{detailBorrow.renew_count}</span> lần
                  </div>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-slate-100">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BorrowHistory;
