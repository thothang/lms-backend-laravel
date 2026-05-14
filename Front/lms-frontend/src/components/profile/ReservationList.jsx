import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import { useCancelReservation } from '../../hooks/queries';
import { BookmarkPlus, CheckCircle, AlertCircle, Loader2, X, Calendar, DollarSign, FileText, Info, User } from 'lucide-react';
import { Button } from '../ui/Button';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';
import ConfirmModal from '../ui/ConfirmModal';

const ReservationList = () => {
  const queryClient = useQueryClient();

  const [cancelId, setCancelId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailReservation, setDetailReservation] = useState(null);
  
  const cancelMutation = useCancelReservation();

  // Use React Query for data fetching with caching
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ['user', 'reservations'],
    queryFn: () => userService.getMyReservations().then(res => res.data || res || []),
  });

  const handleCancel = (id) => {
    setCancelId(id);
  };

  const handleShowDetail = (reservation) => {
    setDetailReservation(reservation);
    setShowDetailModal(true);
  };

  const executeCancel = async () => {
    if (!cancelId) return;
    try {
      await cancelMutation.mutateAsync(cancelId);
      setCancelId(null);
    } catch (err) {
      // Error handled by mutation toast
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'fulfilled': return 'bg-emerald-100 text-emerald-700';
      case 'cancelled': return 'bg-slate-100 text-slate-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'pending': return 'Đang vào hàng chờ';
      case 'fulfilled': return 'Đã có sách';
      case 'cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <BookmarkPlus className="text-indigo-600" /> Sách đặt trước
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : reservations.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          Bạn chưa có yêu cầu đặt trước nào.
        </div>
      ) : (
        <div className="space-y-4">
          {reservations.map(res => (
            <div key={res.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50 border border-slate-100 p-4 rounded-xl hover:bg-slate-100 transition-colors gap-4 cursor-pointer" onClick={() => handleShowDetail(res)}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-semibold text-slate-800 line-clamp-1">
                    {res.book?.title || 'Sách ID: ' + res.book_id}
                  </h3>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusColor(res.status)}`}>
                    {getStatusText(res.status)}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-2 text-sm text-slate-600">
                  <div>Vị trí hàng đợi: <span className="font-bold text-indigo-600">#{res.queue_position || '?'}</span></div>
                  <div>Phí đặt cọc: <span className="font-semibold text-rose-600">{Number(res.deposit_fee || 0).toLocaleString('vi-VN')} ₫</span></div>
                  <div>Dự kiến mượn: {res.expected_days} ngày</div>
                </div>
              </div>

              {res.status === 'pending' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleCancel(res.id); }}
                  className="shrink-0 px-4 py-2 bg-white border border-slate-200 hover:border-rose-300 hover:bg-rose-50 text-rose-600 text-sm font-medium rounded-lg transition-colors"
                >
                  Hủy đặt trước
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      <ConfirmModal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={executeCancel}
        title="Xác nhận hủy đặt trước"
        message="Bạn có chắc chắn muốn hủy đặt trước này không? Phí đặt cọc có thể không được hoàn lại theo một số trường hợp nhất định."
        confirmText="Xác nhận hủy"
        cancelText="Để sau"
        type="warning"
        isLoading={cancelMutation.isPending}
      />

      {showDetailModal && detailReservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <BookmarkPlus className="text-indigo-600" /> Chi tiết đặt trước
              </h3>
              <button onClick={() => setShowDetailModal(false)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Record ID */}
              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Mã phiếu đặt trước
                </h4>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-indigo-600 font-mono">#{detailReservation.id}</span>
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
                    <span className="font-semibold text-slate-800">{detailReservation.book?.title || 'Sách ID: ' + detailReservation.book_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Tác giả:</span>
                    <span className="text-slate-800">{detailReservation.book?.author_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Thể loại:</span>
                    <span className="text-slate-800">{detailReservation.book?.category?.name || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Queue Info */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <Info size={18} className="text-indigo-600" /> Hàng đợi
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Vị trí trong hàng:</span>
                    <span className="font-bold text-indigo-600">#{detailReservation.queue_position || '?'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Ngày đặt:</span>
                    <span className="font-semibold text-slate-800">{detailReservation.created_at ? new Date(detailReservation.created_at).toLocaleDateString('vi-VN') : '---'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Dự kiến mượn:</span>
                    <span className="font-semibold text-slate-800">{detailReservation.expected_days} ngày</span>
                  </div>
                </div>
              </div>

              {/* Financial Info */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-indigo-600" /> Chi phí
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Phí đặt cọc:</span>
                    <span className="font-semibold text-rose-600">{Number(detailReservation.deposit_fee || 0).toLocaleString('vi-VN')} ₫</span>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="bg-slate-50 p-4 rounded-xl">
                <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                  <CheckCircle size={18} className="text-indigo-600" /> Trạng thái
                </h4>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(detailReservation.status)}`}>
                    {getStatusText(detailReservation.status)}
                  </span>
                </div>
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

export default ReservationList;
