import React from 'react';
import { 
  X, CheckCircle, XCircle, FileText, User, 
  Landmark, CreditCard, Clock, Calendar, AlertCircle
} from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  approved: { label: 'Đã duyệt', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  completed: { label: 'Hoàn tất', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  rejected: { label: 'Từ chối', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
};

const WithdrawalDetailsModal = ({ isOpen, onClose, data, onProcess }) => {
  if (!isOpen || !data) return null;

  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.pending;
  const bankName = data.bank_account_info?.bank_name || data.bank_name || '—';
  const bankAccount = data.bank_account_info?.account_number || data.bank_account || '—';
  const accountHolder = data.bank_account_info?.account_holder || data.account_holder || '—';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết Phiếu Yêu Cầu Rút Tiền">
      <div className="space-y-6">
        {/* Header Status */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-slate-800">#{data.id}</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-tighter ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border`}>
              {statusCfg.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
            <Calendar size={14} />
            {new Date(data.created_at).toLocaleString('vi-VN')}
          </div>
        </div>

        {/* Content Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Author Block */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
              <User size={16} /> Thông tin Tác giả
            </h4>
            <div className="space-y-3">
              <div className="flex gap-3 items-center">
                 <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-slate-500 shadow-sm">
                   {(data?.author?.name && typeof data.author.name === 'string') ? data.author.name.charAt(0).toUpperCase() : '?'}
                 </div>
                 <div>
                   <div className="font-bold text-slate-800">{data.author?.name || 'N/A'}</div>
                   <div className="text-xs text-slate-500 font-medium">{data.author?.email || 'N/A'}</div>
                 </div>
              </div>
            </div>
          </div>

          {/* Amount Block */}
          <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100 flex flex-col justify-center">
             <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Số tiền yêu cầu rút</h4>
             <div className="text-3xl font-black text-indigo-700 tracking-tight">
               {Number(data.amount || 0).toLocaleString('vi-VN')} ₫
             </div>
          </div>
          
          {/* Bank Info Block */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h4 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 pb-3">
              <Landmark size={16} /> Chi tiết thẻ/tài khoản ngân hàng
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ngân hàng thụ hưởng</span>
                  <div className="font-bold text-slate-800 text-base mt-1">{bankName}</div>
               </div>
               <div>
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Số tài khoản</span>
                  <div className="font-bold text-slate-800 text-base mt-1">{bankAccount}</div>
               </div>
               <div className="sm:col-span-2">
                  <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tên chủ tài khoản</span>
                  <div className="font-black text-slate-800 text-lg uppercase tracking-tight mt-1">{accountHolder}</div>
               </div>
            </div>
          </div>
          
          {/* Notes */}
          {data.notes && (
             <div className="md:col-span-2 bg-slate-50 rounded-xl p-4 flex gap-3 text-slate-600 border border-slate-100">
               <FileText size={18} className="text-slate-400 mt-0.5 shrink-0" />
               <div>
                 <span className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Ghi chú từ hệ thống/Admin</span>
                 <p className="text-sm font-medium leading-relaxed">{data.notes}</p>
               </div>
             </div>
          )}
        </div>

        {/* Action Buttons for Pending */}
        {data.status === 'pending' && (
          <div className="pt-4 border-t border-slate-100 flex gap-3 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onProcess(data, 'reject')}
              className="!border-rose-200 !text-rose-600 hover:!bg-rose-50"
            >
              <XCircle size={18} className="mr-2" /> Từ chối
            </Button>
            <Button
              type="button"
              onClick={() => onProcess(data, 'approve')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200"
            >
              <CheckCircle size={18} className="mr-2" /> Duyệt Yêu Cầu
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default WithdrawalDetailsModal;
