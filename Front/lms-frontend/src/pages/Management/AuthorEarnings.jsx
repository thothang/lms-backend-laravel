import React, { useState } from 'react';
import {
  Wallet, TrendingUp, AlertCircle, CheckCircle,
  Landmark, CreditCard, UserCircle, Loader2, ArrowRight, FileText
} from 'lucide-react';
import { handleApiError, showError } from '../../utils/toastHelper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { motion } from 'framer-motion';
import { useAuthorEarnings, useAuthorWithdrawHistory, useAuthorWithdraw } from '../../hooks/queries';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: 'text-amber-600', bg: 'bg-amber-50' },
  approved: { label: 'Đã duyệt', color: 'text-blue-600', bg: 'bg-blue-50' },
  completed: { label: 'Hoàn tất', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  rejected: { label: 'Từ chối', color: 'text-rose-600', bg: 'bg-rose-50' },
};

const AuthorEarnings = () => {
  // Sử dụng React Query hooks - tự động cache và refetch
  const { data: earningsData, isLoading: earningsLoading } = useAuthorEarnings();
  const { data: history = [], isLoading: historyLoading } = useAuthorWithdrawHistory();
  const withdrawMutation = useAuthorWithdraw();

  const [formData, setFormData] = useState({
    amount: '',
    bank_account: '',
    bank_name: '',
    account_holder: ''
  });

  const isLoading = earningsLoading || historyLoading;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitWithdraw = (e) => {
    e.preventDefault();
    if (!earningsData?.can_withdraw) {
      showError('Bạn chưa đủ điều kiện để rút tiền.');
      return;
    }

    if (Number(formData.amount) < earningsData.min_withdrawal) {
      showError(`Số tiền rút tối thiểu là ${earningsData.min_withdrawal.toLocaleString('vi-VN')} ₫`);
      return;
    }

    if (Number(formData.amount) > earningsData.balance) {
      showError('Số tiền rút không được vượt quá số dư hiện tại.');
      return;
    }

    const payload = {
      ...formData,
      amount: Number(formData.amount)
    };

    // Sử dụng mutation - tự invalidate queries và update UI
    withdrawMutation.mutate(payload, {
      onSuccess: () => {
        // Reset form sau khi thành công
        setFormData({ amount: '', bank_account: '', bank_name: '', account_holder: '' });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Thu Nhập & Rút Tiền</h1>
        <p className="text-slate-500 font-medium mt-1">Quản lý doanh thu từ việc bán Ebook và thực hiện rút tiền về tài khoản.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Information */}
        <div className="lg:col-span-1 space-y-6">
          {/* Main Balance Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 relative overflow-hidden"
          >
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="flex items-center gap-3 mb-6 relative">
                <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-md">
                   <Wallet size={20} className="text-white" />
                </div>
                <span className="font-bold uppercase text-xs tracking-widest text-indigo-100">Số Dư Khả Dụng</span>
             </div>
             
             <div className="text-4xl font-black tracking-tight mb-2 relative">
               {earningsData?.balance?.toLocaleString('vi-VN')} <span className="text-2xl text-indigo-200">₫</span>
             </div>
             
             <div className="flex items-center gap-2 text-indigo-100 text-sm mt-6 pt-6 border-t border-indigo-500/30 relative">
                <TrendingUp size={16} className="text-emerald-300" />
                <span>Tổng thu nhập từ trước đến nay: <strong className="text-white font-black">{earningsData?.total_earned?.toLocaleString('vi-VN')} ₫</strong></span>
             </div>
          </motion.div>

          {/* Conditions */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 mb-4 flex items-center gap-2">
               <AlertCircle size={16} className="text-indigo-600" /> Điều kiện rút tiền
             </h3>
             <ul className="space-y-4">
                <li className="flex gap-3 items-start">
                   <div className={`mt-0.5 rounded-full p-1 shrink-0 ${earningsData?.balance >= earningsData?.min_withdrawal ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                     <CheckCircle size={14} />
                   </div>
                   <div>
                     <p className="text-sm font-bold text-slate-700">Số dư tối thiểu</p>
                     <p className="text-xs text-slate-500 mt-1">Phải đạt ít nhất {earningsData?.min_withdrawal?.toLocaleString('vi-VN')} ₫</p>
                   </div>
                </li>
             </ul>
             
             {!earningsData?.can_withdraw && (
               <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                 <p className="text-xs text-amber-700 leading-relaxed font-medium">
                   Số dư của bạn hiện chưa đủ điều kiện để thực hiện yêu cầu rút tiền. Vui lòng quay lại sau khi đạt mức tối thiểu.
                 </p>
               </div>
             )}
          </div>
        </div>

        {/* Right Column: Withdrawal Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
             <h2 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3">
               Tạo Yêu Cầu Rút Tiền <ArrowRight size={18} className="text-slate-400" />
             </h2>
             
             <form onSubmit={handleSubmitWithdraw} className="space-y-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Số tiền muốn rút (VNĐ)</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                         <span className="text-slate-400 font-bold">₫</span>
                      </div>
                      <input
                         type="number"
                         name="amount"
                         value={formData.amount}
                         onChange={handleChange}
                         disabled={!earningsData?.can_withdraw || withdrawMutation.isPending}
                         min={earningsData?.min_withdrawal}
                         max={earningsData?.balance}
                         placeholder={`Nhập số tiền tối thiểu ${earningsData?.min_withdrawal?.toLocaleString('vi-VN')}`}
                         required
                         className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                      />
                   </div>
                   <p className="text-xs text-slate-400 mt-2 text-right">
                     Gợi ý rút toàn bộ: <button type="button" onClick={() => setFormData({...formData, amount: earningsData?.balance})} className="text-indigo-600 font-bold hover:underline">{earningsData?.balance?.toLocaleString('vi-VN')} ₫</button>
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Tên ngân hàng</label>
                      <div className="relative">
                         <Landmark className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input
                           type="text"
                           name="bank_name"
                           value={formData.bank_name}
                           onChange={handleChange}
                           disabled={!earningsData?.can_withdraw || withdrawMutation.isPending}
                           placeholder="Ví dụ: Vietcombank"
                           required
                           className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                         />
                      </div>
                   </div>
                   <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Số tài khoản</label>
                      <div className="relative">
                         <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                         <input
                           type="text"
                           name="bank_account"
                           value={formData.bank_account}
                           onChange={handleChange}
                           disabled={!earningsData?.can_withdraw || withdrawMutation.isPending}
                           placeholder="Nhập số tài khoản"
                           required
                           className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50"
                         />
                      </div>
                   </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">Tên chủ tài khoản</label>
                   <div className="relative">
                      <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input
                        type="text"
                        name="account_holder"
                        value={formData.account_holder}
                        onChange={handleChange}
                        disabled={!earningsData?.can_withdraw || withdrawMutation.isPending}
                        placeholder="NGUYEN VAN A"
                        required
                        className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium disabled:opacity-50 uppercase"
                      />
                   </div>
                   <p className="text-xs text-rose-500 mt-2 font-medium">
                     * Lưu ý: Tên chủ tài khoản phải viết hoa, không dấu và khớp với tên trên thẻ ngân hàng.
                   </p>
                </div>

                <div className="pt-4 border-t border-slate-50">
                  <Button
                    type="submit"
                    isLoading={withdrawMutation.isPending}
                    disabled={!earningsData?.can_withdraw || withdrawMutation.isPending}
                    className="w-full sm:w-auto py-4 px-8 rounded-2xl text-base font-black shadow-lg shadow-indigo-100 disabled:shadow-none"
                  >
                    {withdrawMutation.isPending ? 'Đang xử lý...' : 'Gửi Yêu Cầu Rút Tiền'}
                  </Button>
                </div>
             </form>
          </div>
        </div>

        {/* History Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-50">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Lịch Sử Rút Tiền</h3>
            </div>
            {history.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã Phiếu</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tài khoản nhận</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {history.map((item) => {
                      const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                      return (
                        <React.Fragment key={item.id}>
                          <tr className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 font-bold text-slate-800 text-sm">#{item.id}</td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-500">
                              {new Date(item.created_at).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="px-6 py-4 font-black text-slate-800">
                              {Number(item.amount).toLocaleString('vi-VN')} ₫
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <div className="font-bold text-slate-700">{item.bank_name || item.bank_account_info?.bank_name}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.bank_account || item.bank_account_info?.account_number}</div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${statusCfg.bg} ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                            </td>
                          </tr>
                          {item.status === 'rejected' && item.admin_notes && (
                            <tr>
                              <td colSpan={5} className="px-6 py-0 pb-3 border-none">
                                <div className="bg-rose-50 rounded-xl p-3 flex gap-2 border border-rose-100">
                                  <AlertCircle size={14} className="text-rose-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] font-black text-rose-700 uppercase block mb-1">Lý do từ chối</span>
                                    <p className="text-xs font-medium text-rose-600">{item.admin_notes}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                          {item.status !== 'rejected' && item.admin_notes && (
                            <tr>
                              <td colSpan={5} className="px-6 py-0 pb-3 border-none">
                                <div className="bg-slate-50 rounded-xl p-3 flex gap-2 border border-slate-100">
                                  <AlertCircle size={14} className="text-slate-400 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Ghi chú</span>
                                    <p className="text-xs font-medium text-slate-600">{item.admin_notes}</p>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center">
                <FileText size={48} className="text-slate-200 mx-auto mb-4" />
                <p className="text-slate-500 font-bold">Chưa có lịch sử rút tiền</p>
                <p className="text-slate-400 text-sm mt-1">Các phiếu yêu cầu rút tiền của bạn sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthorEarnings;
