import React, { useState } from 'react';
import { Search, Filter, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLibrarianReservations, useConfirmReservation } from '../../hooks/queries';
import { handleApiError } from '../../utils/toastHelper';
import DetailModal from '../../components/ui/DetailModal';

const ManageReservations = () => {
  const [filter, setFilter] = useState('all'); // all, pending, fulfilled, cancelled
  const [processingId, setProcessingId] = useState(null);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [showReservationModal, setShowReservationModal] = useState(false);

  const { data: rawReservations, isLoading } = useLibrarianReservations({
    limit: 100,
    ...(filter !== 'all' ? { status: filter } : {}),
  });

  // Ensure reservations is always an array
  const reservations = Array.isArray(rawReservations) ? rawReservations : (rawReservations?.data || []);

  const confirmReservation = useConfirmReservation();

  const handleConfirm = (id) => {
    setProcessingId(id);
    confirmReservation.mutate(id, {
      onSettled: () => {
        setProcessingId(null);
      },
    });
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'pending': 
        return <span className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"><Clock size={12}/> Chờ duyệt</span>;
      case 'fulfilled': 
        return <span className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"><CheckCircle size={12}/> Hoàn tất</span>;
      case 'cancelled': 
        return <span className="flex items-center gap-1 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest"><XCircle size={12}/> Đã hủy</span>;
      default: 
        return <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <AlertCircle className="text-indigo-600" size={32} />
              Yêu cầu đặt trước
            </h1>
            <p className="text-slate-500 font-medium mt-2">Duyệt yêu cầu giữ sách của bạn đọc từ hệ thống phân phối tự động.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-6">
          {['all', 'pending', 'fulfilled', 'cancelled'].map(f => (
             <button 
               key={f}
               onClick={() => setFilter(f)}
               className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
             >
               {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Đang chờ' : f === 'fulfilled' ? 'Hoàn thành' : 'Đã hủy'}
             </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
             <div className="py-20 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             </div>
          ) : reservations.length === 0 ? (
             <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
                <AlertCircle size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-bold">Không tìm thấy yêu cầu đặt trước nào!</p>
             </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Độc giả</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đầu sách yêu cầu</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {reservations.map((res, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    key={res.id} 
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={(e) => {
                      if (e.target.closest('button')) return;
                      setSelectedReservation(res);
                      setShowReservationModal(true);
                    }}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{res.user?.name || 'Khách'}</div>
                      <div className="text-xs text-slate-500">{res.user?.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-indigo-600 line-clamp-1">{res.book?.title}</div>
                      <div className="text-xs text-slate-500 font-medium">Đặt ngày: {new Date(res.created_at).toLocaleDateString('vi-VN')}</div>
                    </td>
                    <td className="px-6 py-4 flex justify-center">
                       {getStatusBadge(res.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                       {res.status === 'pending' ? (
                           <button 
                             onClick={() => handleConfirm(res.id)}
                             disabled={processingId === res.id}
                             className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-md shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2 ml-auto"
                           >
                             {processingId === res.id ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <CheckCircle size={14}/>}
                             Xác nhận xuất kho
                           </button>
                       ) : (
                          <span className="text-slate-400 text-xs font-bold">—</span>
                       )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Reservation Detail Modal */}
      <DetailModal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedReservation(null);
        }}
        data={selectedReservation}
        type="reservation"
      />

    </div>
  );
};

export default ManageReservations;
