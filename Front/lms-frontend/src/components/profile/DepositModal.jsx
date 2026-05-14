import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { Button } from '../ui/Button';
import { Coins, ArrowRight, Wallet2 } from 'lucide-react';
import { Input } from '../ui/Input';
import api from '../../services/api';

import { useDeposit } from '../../hooks/queries';
import { useQueryClient } from '@tanstack/react-query';

const DepositModal = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState('100000');
  const [error, setError] = useState('');
  
  const depositMutation = useDeposit();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (depositMutation.isPending) return;
    
    if (!amount || isNaN(amount) || Number(amount) < 10000) {
      setError('Số tiền tối thiểu nạp là 10.000 ₫');
      return;
    }
    setError('');
    try {
      const response = await depositMutation.mutateAsync(Number(amount));
      const { checkout_url, form_fields } = response.data;

      if (!checkout_url || !form_fields) {
        throw new Error('Invalid response from server: missing checkout_url or form_fields');
      }

      // Store amount for confirmation
      // Store in both sessionStorage and localStorage for mobile compatibility
      sessionStorage.setItem('pending_topup_amount', amount);
      sessionStorage.setItem('pending_topup_order', form_fields.order_invoice_number);
      localStorage.setItem('pending_topup_amount', amount);
      localStorage.setItem('pending_topup_order', form_fields.order_invoice_number);

      // SePay requires POST form submission (GET returns 404)
      // Create and submit form programmatically for mobile compatibility
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = checkout_url;
      form.style.display = 'none';

      // Add all form fields as hidden inputs
      Object.entries(form_fields).forEach(([key, value]) => {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value !== null && value !== undefined ? String(value) : '';
        form.appendChild(input);
      });

      // Add form to document and submit
      document.body.appendChild(form);
      
      // Small delay to ensure form is in DOM before submitting (mobile fix)
      setTimeout(() => {
        form.submit();
      }, 50);
      
    } catch (err) {
      const errorMessage = err.response?.data?.message 
        || err.response?.data?.error 
        || err.message 
        || 'Có lỗi xảy ra. Vui lòng thử lại.';
      
      setError(errorMessage);
    }
  };
  const quickAmounts = [50000, 100000, 200000, 500000, 1000000];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nạp tiền vào ví">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 border border-indigo-100">
          <div className="p-3 bg-white rounded-xl shadow-sm text-indigo-600">
            <Wallet2 size={24} />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-500 uppercase tracking-wider">Số dư hiện tại</p>
            <p className="text-lg font-black text-slate-800">Ví SePay liên kết</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền muốn nạp (VNĐ)</label>
            <Input
              type="number"
              placeholder="Nhập số tiền..."
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              icon={Coins}
              error={error}
              required
              className="text-lg font-bold"
            />
          </div>

          <div className="grid grid-cols-3 gap-2">
            {quickAmounts.map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => setAmount(amt.toString())}
                className={`py-2 px-3 rounded-xl border text-sm font-bold transition-all ${
                  amount === amt.toString()
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-300 hover:bg-indigo-50'
                }`}
              >
                {amt.toLocaleString('vi-VN')}
              </button>
            ))}
          </div>

          <p className="text-xs text-slate-500 italic">
            * Sau khi nhấn nạp tiền, bạn sẽ được chuyển hướng sang trang thanh toán của SePay để thực hiện giao dịch an toàn.
          </p>

          <Button type="submit" isLoading={depositMutation.isPending} className="w-full py-4 text-base rounded-2xl shadow-xl shadow-indigo-600/20">
            Tiếp tục nạp tiền <ArrowRight size={20} className="ml-2" />
          </Button>
        </form>      </div>
    </Modal>
  );
};

export default DepositModal;
