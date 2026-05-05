import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Calendar, ArrowRight, WalletIcon, Info } from 'lucide-react';
import { Input } from '../ui/Input';

const RenewModal = ({ isOpen, onClose, onConfirm, borrow, isLoading }) => {
  const [days, setDays] = useState(9);
  const dailyFee = Number(borrow?.daily_fee_applied || borrow?.book?.daily_fee || 0);
  const totalCost = dailyFee * days;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (days < 1) return;
    onConfirm(days);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gia hạn mượn sách">
      <div className="flex flex-col gap-6">
        <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex items-center gap-4">
          <div className="bg-white p-2 rounded-xl shadow-sm">
            <Calendar className="text-indigo-600" size={24} />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 line-clamp-1">{borrow?.book?.title}</h4>
            <p className="text-xs text-slate-500">Ghi chú: Gia hạn sẽ cộng thêm ngày vào hạn trả hiện tại.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700">Số ngày muốn gia hạn thêm</label>
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
              <span className="text-slate-500 font-medium">Ngày</span>
            </div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
            <div className="flex justify-between items-center mb-4 text-xs font-black text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Info size={14} /> Chi phí gia hạn</span>
            </div>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between items-center text-slate-600">
                <span>Đơn giá gia hạn:</span>
                <span className="font-semibold">{dailyFee.toLocaleString('vi-VN')} ₫ / ngày</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                <span className="font-bold text-slate-800">Tổng phí trừ vào ví:</span>
                <span className="text-xl font-black text-indigo-600">{totalCost.toLocaleString('vi-VN')} ₫</span>
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
            <Button type="submit" isLoading={isLoading} className="flex-[2] py-3.5 text-base rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95">
              Xác nhận gia hạn <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default RenewModal;
