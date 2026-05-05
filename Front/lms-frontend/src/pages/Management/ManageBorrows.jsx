import React, { useState, useMemo } from 'react';
import { 
  Package, CheckCircle, XCircle, RotateCcw, Search,
  Clock, BookOpen, AlertTriangle, Inbox, Loader2, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBorrows, useConfirmPickup, useConfirmReturn, useCancelPickup } from '../../hooks/queries';
import DetailModal from '../../components/ui/DetailModal';

const STATUS_CONFIG = {
  pending_pickup: { label: 'Chờ nhận sách', color: 'amber', icon: Clock },
  active:         { label: 'Đang mượn',     color: 'blue',  icon: BookOpen },
  overdue:        { label: 'Quá hạn',       color: 'rose',  icon: AlertTriangle },
  pending_return: { label: 'Chờ thanh toán', color: 'orange', icon: AlertTriangle },
  returned:       { label: 'Đã trả',        color: 'emerald', icon: CheckCircle },
  cancelled:      { label: 'Đã hủy',        color: 'slate',  icon: XCircle },
  lost:           { label: 'Mất sách',       color: 'rose',   icon: AlertTriangle },
};

const ManageBorrows = () => {
  const [activeTab, setActiveTab] = useState('pending_pickup');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);

  // Determine query params based on active tab
  const getQueryParams = () => {
    if (activeTab === 'pending_pickup') {
      return { status: 'pending_pickup', limit: 500 };
    } else if (activeTab === 'overdue') {
      return { status: 'active', limit: 500 };
    }
    return { status: activeTab, limit: 100 };
  };

  const params = getQueryParams();
  const { data: borrowsData, isLoading, refetch } = useBorrows(params);

  const confirmPickup = useConfirmPickup();
  const confirmReturn = useConfirmReturn();
  const cancelPickup = useCancelPickup();

  const handleConfirmReturn = async (id) => {
    try {
      await confirmReturn.mutateAsync(id);
    } catch (err) {
      throw err;
    }
  };

  // Process borrows based on tab
  const borrows = React.useMemo(() => {
    let data = borrowsData?.data || borrowsData || [];
    if (!Array.isArray(data)) data = [];

    if (activeTab === 'overdue') {
      const now = new Date();
      data = data.filter(b => {
        if (b.status === 'overdue') return true;
        if (['active', 'borrowed'].includes(b.status) && new Date(b.due_date) < now) return true;
        return false;
      });
    }

    return data;
  }, [borrowsData, activeTab]);

  const filtered = useMemo(() => {
    return borrows.filter(b => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        (b.id || '').toString().includes(q) ||
        (b.user?.name || '').toLowerCase().includes(q) ||
        (b.user?.email || '').toLowerCase().includes(q) ||
        (b.book?.title || b.copy?.book?.title || '').toLowerCase().includes(q) ||
        (b.copy_id || '').toString().includes(q)
      );
    });
  }, [borrows, searchQuery]);

  const tabs = [
    { key: 'pending_pickup', label: 'Chờ nhận sách', icon: Inbox },
    { key: 'active', label: 'Đang mượn', icon: BookOpen },
    { key: 'overdue', label: 'Quá hạn', icon: AlertTriangle },
    { key: 'returned', label: 'Đã trả', icon: CheckCircle },
    { key: 'cancelled', label: 'Đã hủy', icon: XCircle },
  ];

  const getDisplayStatus = (borrow) => {
    if (borrow.status === 'overdue') return 'overdue';
    if (['active', 'borrowed'].includes(borrow.status) && borrow.due_date && new Date(borrow.due_date) < new Date()) {
      return 'overdue';
    }
    return borrow.status;
  };

  const StatusBadge = ({ status, borrow }) => {
    const displayStatus = borrow ? getDisplayStatus(borrow) : status;
    const cfg = STATUS_CONFIG[displayStatus] || { label: displayStatus, color: 'slate', icon: Clock };
    const Icon = cfg.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-${cfg.color}-50 text-${cfg.color}-600`}>
        <Icon size={12} /> {cfg.label}
      </span>
    );
  };

  const isProcessing = confirmPickup.isPending || confirmReturn.isPending || cancelPickup.isPending;

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              <Package className="text-indigo-600" size={32} />
              Giao / Nhận sách
            </h1>
            <p className="text-slate-500 font-medium mt-2">Xác nhận giao sách cho người mượn online và xử lý trả sách tại quầy.</p>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold text-xs rounded-xl transition-all border border-slate-100 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>

        {/* TABS */}
        <div className="flex flex-wrap gap-2 border-b border-slate-100 pb-4 mb-6">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setSearchQuery(''); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeTab === tab.key
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100'
                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100'
                }`}
              >
                <Icon size={14} /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* SEARCH */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Tìm theo ID, tên người dùng, email hoặc tên sách..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-medium text-slate-700 outline-none focus:border-indigo-300 focus:bg-white transition-all"
          />
        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs font-bold text-slate-400">Đang tải dữ liệu...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-50">
              <Inbox size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Không tìm thấy phiếu mượn nào!</p>
              <p className="text-xs text-slate-400 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người mượn</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Đầu sách</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Copy ID</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                  <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                <AnimatePresence>
                  {filtered.map((borrow, i) => (
                    <motion.tr
                      key={borrow.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        setSelectedBorrow(borrow);
                        setShowBorrowModal(true);
                      }}
                    >
                      <td className="px-5 py-4">
                        <span className="font-black text-indigo-600 text-sm">#{borrow.id}</span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-800 text-sm">{borrow.user?.name || borrow.guest_name || 'Khách'}</div>
                        <div className="text-xs text-slate-400">{borrow.user?.email || borrow.guest_email || borrow.guest_phone || ''}</div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-700 text-sm line-clamp-1 max-w-[200px]">
                          {borrow.book?.title || borrow.copy?.book?.title || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs font-mono font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-md">
                          {borrow.copy_id || borrow.book_copy_id || '—'}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <StatusBadge status={borrow.status} borrow={borrow} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-xs text-slate-500 font-medium">
                          {borrow.created_at ? new Date(borrow.created_at).toLocaleDateString('vi-VN') : '—'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {borrow.created_at ? new Date(borrow.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-2">
                          {/* PENDING PICKUP actions */}
                          {borrow.status === 'pending_pickup' && (
                            <>
                              <button
                                onClick={() => confirmPickup.mutate(borrow.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-3 py-2 text-[11px] font-bold rounded-xl shadow-md shadow-emerald-100 transition-all active:scale-95"
                              >
                                {confirmPickup.isPending ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                                Đã giao
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm('Bạn có chắc muốn hủy yêu cầu mượn này? Tiền sẽ được hoàn lại cho người dùng.')) {
                                    cancelPickup.mutate(borrow.id);
                                  }
                                }}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 bg-white hover:bg-rose-50 border border-rose-200 disabled:opacity-50 text-rose-500 px-3 py-2 text-[11px] font-bold rounded-xl transition-all active:scale-95"
                              >
                                <XCircle size={13} /> Hủy
                              </button>
                            </>
                          )}

                          {/* ACTIVE actions */}
                          {borrow.status === 'active' && (
                            <button
                              onClick={() => handleConfirmReturn(borrow.id)}
                              disabled={isProcessing}
                              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 text-[11px] font-bold rounded-xl shadow-md shadow-blue-100 transition-all active:scale-95"
                            >
                              {confirmReturn.isPending ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                              Xác nhận trả
                            </button>
                          )}

                          {/* No actions for returned/cancelled */}
                          {['returned', 'cancelled', 'lost'].includes(borrow.status) && (
                            <span className="text-slate-300 text-xs font-bold">—</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Borrow Detail Modal */}
      <DetailModal
        isOpen={showBorrowModal}
        onClose={() => {
          setShowBorrowModal(false);
          setSelectedBorrow(null);
        }}
        data={selectedBorrow}
        type="borrow"
      />

    </div>
  );
};

export default ManageBorrows;
