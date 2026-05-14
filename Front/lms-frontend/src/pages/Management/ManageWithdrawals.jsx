import React, { useState, useMemo } from 'react';
import {
  Wallet, Clock, CheckCircle, XCircle,
  Search, RefreshCw, User,
  AlertCircle, MessageSquare
} from 'lucide-react';
import { useWithdrawalRequests, useProcessWithdrawal } from '../../hooks/queries';
import { handleApiError } from '../../utils/toastHelper';
import { motion } from 'framer-motion';
import WithdrawalDetailsModal from './WithdrawalDetailsModal';

const STATUS_CONFIG = {
  pending: { label: 'Chờ duyệt', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100' },
  approved: { label: 'Đã duyệt', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-100' },
  completed: { label: 'Hoàn tất', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100' },
  rejected: { label: 'Từ chối', color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100' },
};

const ManageWithdrawals = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [noteId, setNoteId] = useState(null);
  const [noteText, setNoteText] = useState('');

  // React Query
  const { data: withdrawalData, isLoading, refetch } = useWithdrawalRequests({ status: filterStatus === 'all' ? undefined : filterStatus });
  const processMutation = useProcessWithdrawal();

  // Extract data
  const withdrawals = Array.isArray(withdrawalData) 
    ? withdrawalData 
    : (withdrawalData?.data || withdrawalData || []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const handleProcess = async (id, action) => {
    if (action === 'reject' && !noteText.trim()) {
      handleApiError(null, 'Vui lòng nhập ghi chú khi từ chối.');
      return;
    }
    const confirmMsg = action === 'approve'
      ? 'Bạn có chắc muốn duyệt yêu cầu rút tiền này?'
      : 'Bạn có chắc muốn từ chối yêu cầu rút tiền này?';
    if (!window.confirm(confirmMsg)) return;

    try {
      await processMutation.mutateAsync({
        id,
        action,
        notes: noteText || undefined
      });
      setNoteId(null);
      setNoteText('');
    } catch (err) {
      handleApiError(err, 'Không thể xử lý yêu cầu.');
    }
  };

  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      if (!debouncedSearchTerm) return true;
      const term = debouncedSearchTerm.toLowerCase();
      return (
        w.author?.name?.toLowerCase().includes(term) ||
        w.author?.email?.toLowerCase().includes(term) ||
        w.id?.toString().includes(term)
      );
    });
  }, [withdrawals, debouncedSearchTerm]);

  const pendingCount = withdrawals.filter(w => w.status === 'pending').length;
  const isProcessing = processMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý rút tiền</h1>
          <p className="text-slate-500 font-medium mt-1">Xử lý yêu cầu rút tiền từ tác giả ebook.</p>
        </div>
        <div className="flex gap-3">
          {filterStatus === 'all' && pendingCount > 0 && (
            <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
              <Clock size={20} className="text-amber-600" />
              <span className="font-black text-amber-700">{pendingCount} <span className="text-amber-500 font-bold ml-1 text-xs uppercase">chờ xử lý</span></span>
            </div>
          )}
          <button
            onClick={() => refetch()}
            disabled={isLoading || isProcessing}
            className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {/* Control Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tên tác giả, email hoặc ID yêu cầu..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full lg:w-auto overflow-x-auto no-scrollbar">
          {['all', 'pending', 'approved', 'completed', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => { setFilterStatus(status); }}
              className={`px-5 py-3 rounded-2xl text-[10px] uppercase font-black tracking-widest whitespace-nowrap transition-all border ${
                filterStatus === status
                  ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                  : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'
              }`}
            >
              {status === 'all' ? 'Tất cả' : STATUS_CONFIG[status]?.label || status}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredWithdrawals.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center">
          <Wallet size={48} className="text-slate-200 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Không có yêu cầu rút tiền nào.</p>
          <p className="text-slate-400 text-sm mt-1">Chưa có tác giả nào gửi yêu cầu rút tiền{filterStatus !== 'all' ? ` với trạng thái "${STATUS_CONFIG[filterStatus]?.label}"` : ''}.</p>
        </div>
      ) : (
        <>
          {/* Withdrawal Table */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tác giả</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngân hàng</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Trạng thái</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredWithdrawals.map((item, idx) => {
                    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                    const isItemProcessing = isProcessing && processMutation.variables?.id === item.id;
                    return (
                      <React.Fragment key={item.id}>
                        <motion.tr
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.03 }}
                          className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                          onClick={() => setSelectedRequest(item)}
                        >
                          <td className="px-6 py-5">
                            <span className="font-black text-slate-800 text-sm">#{item.id}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 bg-gradient-to-tr from-slate-100 to-slate-200 rounded-xl flex items-center justify-center font-black text-slate-500 text-xs shadow-sm border border-white">
                                {(item?.author?.name && typeof item.author.name === 'string') ? item.author.name.charAt(0).toUpperCase() : '?'}
                              </div>
                              <div>
                                <div className="font-bold text-slate-800 text-sm">{item.author?.name || 'N/A'}</div>
                                <div className="text-[11px] text-slate-400 font-medium">{item.author?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="font-black text-slate-800">{Number(item.amount || 0).toLocaleString('vi-VN')} ₫</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm text-slate-700 font-medium">{item.bank_account_info?.bank_name || item.bank_name || '—'}</div>
                            <div className="text-[11px] text-slate-400">{item.bank_account_info?.account_number || item.bank_account || ''}</div>
                            {item.bank_account_info?.account_holder && (
                              <div className="text-[10px] text-slate-400 mt-0.5">{item.bank_account_info.account_holder}</div>
                            )}
                          </td>
                          <td className="px-6 py-5">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${statusCfg.bg} ${statusCfg.color} ${statusCfg.border} border`}>
                              {statusCfg.label}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-xs font-bold text-slate-500">{item.created_at ? new Date(item.created_at).toLocaleDateString('vi-VN') : '—'}</span>
                          </td>
                          <td className="px-6 py-5">
                            <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                              {item.status === 'pending' && (
                                <>
                                  <button
                                    onClick={() => handleProcess(item.id, 'approve')}
                                    disabled={isProcessing}
                                    className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                    title="Duyệt"
                                  >
                                    {isItemProcessing ? <RefreshCw size={18} className="animate-spin" /> : <CheckCircle size={18} />}
                                  </button>
                                  <button
                                    onClick={() => setNoteId(noteId === item.id ? null : item.id)}
                                    disabled={isProcessing}
                                    className="p-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                    title="Từ chối"
                                  >
                                    <XCircle size={18} />
                                  </button>
                                </>
                              )}
                              {item.status !== 'pending' && (
                                <span className="text-[11px] text-slate-400 font-medium italic">Đã xử lý</span>
                              )}
                            </div>
                          </td>
                        </motion.tr>

                        {/* Reject Note Row */}
                        {noteId === item.id && item.status === 'pending' && (
                          <tr>
                            <td colSpan={7} className="px-6 py-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="bg-rose-50/30 border border-rose-100 rounded-2xl p-4 my-3 space-y-3"
                              >
                                <div className="flex items-center gap-2">
                                  <AlertCircle size={14} className="text-rose-500" />
                                  <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest">Ghi chú từ chối</span>
                                </div>
                                <textarea
                                  value={noteText}
                                  onChange={(e) => setNoteText(e.target.value)}
                                  placeholder="Nhập ghi chú / lý do từ chối (tối đa 500 ký tự)..."
                                  maxLength={500}
                                  rows={2}
                                  className="w-full p-3 bg-white border border-rose-100 rounded-xl text-sm focus:ring-2 focus:ring-rose-500/20 transition-all font-medium resize-none"
                                />
                                <div className="flex items-center justify-between">
                                  <span className="text-[11px] text-slate-400 font-medium">{noteText.length}/500</span>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => { setNoteId(null); setNoteText(''); }}
                                      className="py-2 px-5 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                                    >
                                      Hủy
                                    </button>
                                    <button
                                      onClick={() => handleProcess(item.id, 'reject')}
                                      disabled={!noteText.trim() || isProcessing}
                                      className="py-2 px-5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                                    >
                                      {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}

                        {/* Notes display if already processed */}
                        {item.notes && item.status !== 'pending' && (
                          <tr>
                            <td colSpan={7} className="px-6 py-0">
                              <div className="bg-slate-50 rounded-xl p-3 my-2 flex items-start gap-2">
                                <MessageSquare size={14} className="text-slate-400 mt-0.5 shrink-0" />
                                <p className="text-xs text-slate-500">{item.notes}</p>
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
          </div>
        </>
      )}

      {/* Detail Modal */}
      <WithdrawalDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        data={selectedRequest}
        onProcess={(data, action) => {
          setSelectedRequest(null);
          if (action === 'approve') {
            handleProcess(data.id, 'approve');
          } else if (action === 'reject') {
            setNoteId(data.id);
          }
        }}
      />
    </div>
  );
};

export default ManageWithdrawals;
