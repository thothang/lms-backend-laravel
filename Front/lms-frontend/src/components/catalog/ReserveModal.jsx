import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Bookmark, Clock, ArrowRight, WalletIcon, Info } from 'lucide-react';
import { Input } from '../ui/Input';

const ReserveModal = ({ isOpen, onClose, onConfirm, book, isLoading }) => {
  const [days, setDays] = useState(7);
  const dailyFee = Number(book?.daily_fee || 0);
  
  // Rule: Prepay 10% of total expected borrow fee
  const totalExpectedFee = dailyFee * days;
  const reservationFee = Math.max(1000, Math.round(totalExpectedFee * 0.1));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (days < 1) return;
    onConfirm(days);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Đặt trước sách">
      <div className="flex flex-col gap-6">
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 items-center">
          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 shadow-sm">
            <img src={book?.cover_image} alt={book?.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 line-clamp-1 truncate max-w-[200px]">{book?.title}</h4>
            <p className="text-xs text-slate-500">Đặt trước khi sách không có sẵn.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
              <Clock size={16} className="text-amber-500" /> Dự kiến mượn trong bao nhiêu ngày?
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                min="1"
                max="30"
                value={days}
                onChange={(e) => setDays(Math.max(1, parseInt(e.target.value) || 1))}
                className="text-lg font-bold w-full"
                required
              />
              <span className="text-slate-500 font-medium font-sans">Ngày</span>
            </div>
          </div>

          <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black text-amber-600 uppercase tracking-widest">
              <Info size={14} /> Cách tính phí đặt trước (10%)
            </div>
            
            <div className="space-y-3 text-sm text-slate-600 leading-relaxed">
              <div className="flex justify-between items-center">
                <span>Phí mượn mượn dự kiến ({days} ngày):</span>
                <span className="font-bold text-slate-700">{(days * dailyFee).toLocaleString('vi-VN')} ₫</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-amber-100">
                <div className="flex flex-col">
                   <span className="font-bold text-slate-800 uppercase text-[10px]">Phí giữ chỗ (10%):</span>
                   <span className="text-[10px] text-amber-600 italic">* Khấu trừ trực tiếp vào ví</span>
                </div>
                <span className="text-2xl font-black text-amber-600">{reservationFee.toLocaleString('vi-VN')} ₫</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all"
            >
              Hủy
            </button>
            <Button type="submit" isLoading={isLoading} className="flex-[2] py-3.5 text-base rounded-2xl shadow-xl shadow-amber-500/20 active:scale-95 bg-amber-500 hover:bg-amber-600">
              Đặt trước ngay <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default ReserveModal;
