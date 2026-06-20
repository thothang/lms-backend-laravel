import React, { useState, useEffect } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { BookOpen, Calendar, Info, ArrowRight, Wallet as WalletIcon } from 'lucide-react';
import { Input } from '../ui/Input';
import { useAuth } from '../../context/AuthContext';

const BorrowModal = ({ isOpen, onClose, onConfirm, book, isLoading }) => {
  const { user } = useAuth();
  const [days, setDays] = useState(7);
  const dailyFee = Number(book?.daily_fee || 0);
  const bookPrice = Number(book?.price || 0);

  const tier = user?.membership_tier || 'bronze';
  let depositDiscount = 0;
  let feeDiscount = 0;
  
  if (tier === 'silver') feeDiscount = 10;
  else if (tier === 'gold') { depositDiscount = 30; feeDiscount = 20; }
  else if (tier === 'platinum') { depositDiscount = 50; feeDiscount = 30; }
  
  const baseDepositFee = Math.min(bookPrice * 0.5, 300000);
  const baseEstimatedTotalFee = dailyFee * days;
  
  const depositFee = baseDepositFee * (1 - depositDiscount / 100);
  const estimatedTotalFee = baseEstimatedTotalFee * (1 - feeDiscount / 100);
  const totalAmount = depositFee + estimatedTotalFee;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (days < 1) return;
    onConfirm(days);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận mượn sách">
      <div className="flex flex-col gap-6">
        {/* Book Info Summary */}
        <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="w-16 h-20 rounded-lg overflow-hidden shrink-0 shadow-sm">
            <img src={book?.cover_image} alt={book?.title} className="w-full h-full object-cover" />
          </div>
          <div>
            <h4 className="font-bold text-slate-800 line-clamp-1">{book?.title}</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">Tác giả: {typeof book?.author === 'object' ? book?.author?.name : book?.author}</p>
            <div className="flex items-center gap-1.5 mt-2">
              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-md uppercase">Sách vật lý</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Days Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
              <Calendar size={16} className="text-indigo-500" /> Số ngày mượn dự kiến
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
              <span className="text-slate-500 font-medium shrink-0">Ngày</span>
            </div>
          </div>

          {/* Fee Breakdown */}
          <div className="bg-indigo-50/50 rounded-2xl p-5 border border-indigo-100/50 space-y-4">
            <h5 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Info size={14} /> Chi tiết chi phí
            </h5>

            {(depositDiscount > 0 || feeDiscount > 0) && (
              <div className="bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-2 rounded-lg mb-2">
                Hạng <strong>{tier.toUpperCase()}</strong>: 
                {depositDiscount > 0 && ` Giảm ${depositDiscount}% cọc `}
                {feeDiscount > 0 && ` Giảm ${feeDiscount}% phí mượn`}
              </div>
            )}
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center text-slate-500">
                <span>Giá bìa sách:</span>
                <span className="line-through">{bookPrice.toLocaleString('vi-VN')} ₫</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-indigo-100/50">
                <span className="text-slate-600 font-medium">Phí mượn ({days} ngày):</span>
                <div className="text-right">
                  {feeDiscount > 0 && <span className="text-xs line-through text-slate-400 mr-2">{baseEstimatedTotalFee.toLocaleString('vi-VN')} ₫</span>}
                  <span className="font-bold text-slate-800">{estimatedTotalFee.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-600 font-medium">Tiền cọc (Tối đa 300k):</span>
                <div className="text-right">
                  {depositDiscount > 0 && <span className="text-xs line-through text-slate-400 mr-2">{baseDepositFee.toLocaleString('vi-VN')} ₫</span>}
                  <span className="font-bold text-slate-800">{depositFee.toLocaleString('vi-VN')} ₫</span>
                </div>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-indigo-100/50 mt-2">
                <span className="font-bold text-slate-800 uppercase text-[11px] tracking-wider">Tổng cộng tạm giữ:</span>
                <span className="text-xl font-black text-indigo-600">{totalAmount.toLocaleString('vi-VN')} ₫</span>
              </div>
              
              <div className="mt-4 pt-3 flex flex-col gap-1">
                <p className="text-[10px] text-slate-400 leading-tight">
                  * Nếu trả sớm hơn {days} ngày, hệ thống sẽ tự động hoàn lại phí mượn của những ngày dư vào ví của bạn.
                </p>
              </div>
            </div>
          </div>

          {/* Wallet Note */}
          <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100 flex gap-3">
            <WalletIcon className="text-indigo-500 shrink-0" size={20} />
            <p className="text-xs text-indigo-700 leading-relaxed">
              Hệ thống sẽ tạm giữ <strong>{totalAmount.toLocaleString('vi-VN')} ₫</strong> (Cọc + Phí mượn dự kiến). Tiền thừa sẽ được hoàn lại ngay khi bạn trả sách.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 py-3.5 font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-all active:scale-95 disabled:opacity-50"
            >
              Hủy bỏ
            </button>
            <Button type="submit" isLoading={isLoading} className="flex-[2] py-3.5 text-base rounded-2xl shadow-xl shadow-indigo-600/20 active:scale-95">
              Xác nhận mượn <ArrowRight size={20} className="ml-2" />
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default BorrowModal;
