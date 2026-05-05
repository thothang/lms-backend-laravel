import React, { useState, useEffect } from 'react';
import {
  Users, BookOpen, Wallet, ShieldCheck, ShieldAlert,
  Activity, ArrowUpRight, ArrowDownRight,
  Clock, AlertCircle, BarChart3,
  Layers, Package, MessageSquare, BookMarked,
  FileText, DollarSign, Receipt, Flame
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { usePendingEbooks, useWithdrawalRequests, useAuditLogs, useRevenue, useTransactions, useBooks, useEbooks, useUsers, useBorrows } from '../../hooks/queries';
import api from '../../services/api';
import { motion } from 'framer-motion';
import VirtualTable from '../../components/ui/VirtualTable';
import DetailModal from '../../components/ui/DetailModal';

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.4, 0, 0.2, 1]
    }
  }
};

const getTimeAgo = (dateStr) => {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Vừa xong';
  if (diffMin < 60) return `${diffMin} phút trước`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} giờ trước`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} ngày trước`;
  return date.toLocaleDateString('vi-VN');
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);

  // React Query hooks - only fetch essential data for dashboard
  const pendingEbooksQuery = usePendingEbooks();
  const pendingWithdrawsQuery = useWithdrawalRequests({ status: 'pending' });
  const logsQuery = useAuditLogs();
  const revenueQuery = useRevenue();
  const transactionsQuery = useTransactions({ limit: 10 });
  const borrowsQuery = useBorrows({ limit: 10 });
  // Only fetch these when needed for specific tables/views - increased for adequate display
  const booksQuery = useBooks({ limit: 200 }); // Adequate for dashboard tables
  const ebooksQuery = useEbooks({ limit: 100 }); // Adequate for dashboard tables
  const usersQuery = useUsers({ limit: 100 }); // Adequate for dashboard tables

  const isLoading = pendingEbooksQuery.isLoading || logsQuery.isLoading;

  // Extract data from queries
  const pendingEbooksList = Array.isArray(pendingEbooksQuery.data) ? pendingEbooksQuery.data : (pendingEbooksQuery.data?.data || []);
  const pendingWithdrawsData = pendingWithdrawsQuery.data || {};
  const recentLogs = Array.isArray(logsQuery.data)
    ? logsQuery.data
    : (logsQuery.data?.data || logsQuery.data?.logs || []);
  const revenueData = revenueQuery.data || {};
  const transactions = Array.isArray(transactionsQuery.data)
    ? transactionsQuery.data
    : (transactionsQuery.data?.data || transactionsQuery.data?.transactions || []);
  const physicalBooks = booksQuery.data?.data || booksQuery.data || [];
  const ebooksList = ebooksQuery.data?.data || ebooksQuery.data || [];
  const usersList = usersQuery.data?.data || usersQuery.data || [];
  const recentBorrows = Array.isArray(borrowsQuery.data)
    ? borrowsQuery.data
    : (borrowsQuery.data?.data || borrowsQuery.data?.borrows || []);

  // Compute derived values
  const tUsers = usersList.length || 0;
  const tBooks = booksQuery.data?.total || physicalBooks.length || 0;
  const tEbooks = ebooksQuery.data?.total || ebooksList.length || 0;
  const tActiveBorrows = physicalBooks.reduce((sum, b) => sum + ((b.total_copies || 0) - (b.available_copies || 0)), 0);

  const tRevenue = revenueData.total_earned || 0;
  const tMonthlyRevenue = revenueData.breakdown?.total_income || 0;

  const overview = {
    total_users: tUsers,
    total_books: tBooks,
    total_ebooks: tEbooks,
    active_borrows: tActiveBorrows,
    pending_reservations: 0,
    total_revenue: tRevenue,
    monthly_revenue: tMonthlyRevenue || tRevenue
  };

  const pendingEbooks = Array.isArray(pendingEbooksList) ? pendingEbooksList.length : 0;
  const pendingWithdraws = pendingWithdrawsData.total || pendingWithdrawsData.data?.length || 0;
  const activeBorrowedBooks = physicalBooks.filter(b => (b.total_copies || 0) > (b.available_copies || 0));

  const statCards = [
    { title: 'Người dùng', value: overview.total_users, icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Tổng tài khoản', up: true },
    { title: 'Sách thư viện', value: overview.total_books, icon: BookMarked, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Sách vật lý', up: true },
    { title: 'Ebook', value: overview.total_ebooks, icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', trend: 'Ebook trên hệ thống', up: true },
    { title: 'Đang mượn', value: overview.active_borrows, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Phiếu mượn đang hoạt động', up: true },
    { title: 'Doanh thu tổng', value: `${Number(overview.total_revenue).toLocaleString('vi-VN')} ₫`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: `Tháng này: ${Number(overview.monthly_revenue).toLocaleString('vi-VN')} ₫`, up: true },
    { 
      title: 'Chờ xử lý', 
      value: pendingEbooks + pendingWithdraws + overview.pending_reservations, 
      icon: AlertCircle, 
      color: 'text-amber-600', 
      bg: 'bg-amber-50', 
      trend: `${pendingEbooks} ebook · ${pendingWithdraws} rút tiền · ${overview.pending_reservations} đặt trước`,
      highlight: (pendingEbooks + pendingWithdraws) > 0,
      up: false 
    },
  ];

  // Action map for audit logs
  const ACTION_MAP = {
    'UPDATE_USER_STATUS': {
      icon: Users, color: 'text-amber-600', bg: 'bg-amber-50',
      badge: 'Người dùng', badgeColor: 'bg-amber-50 text-amber-600 border-amber-100',
      buildText: (l) => {
        const oldS = l.old_values?.status;
        const newS = l.new_values?.status;
        if (oldS && newS) return `Thay đổi trạng thái tài khoản #${l.record_id} từ "${oldS === 'active' ? 'Hoạt động' : 'Bị khóa'}" sang "${newS === 'active' ? 'Hoạt động' : 'Bị khóa'}"`;
        return `Cập nhật trạng thái người dùng #${l.record_id}`;
      }
    },
    'MAKE_AUTHOR': {
      icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-50',
      badge: 'Nâng cấp', badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      buildText: (l) => `Nâng cấp tài khoản #${l.record_id} lên vai trò Tác giả`
    },
    'UPDATE_PERMISSIONS': {
      icon: ShieldCheck, color: 'text-violet-600', bg: 'bg-violet-50',
      badge: 'Phân quyền', badgeColor: 'bg-violet-50 text-violet-600 border-violet-100',
      buildText: (l) => `Cập nhật quyền hạn cho thủ thư #${l.record_id}`
    },
    'APPROVE_EBOOK': {
      icon: BookOpen, color: 'text-emerald-600', bg: 'bg-emerald-50',
      badge: 'Duyệt ebook', badgeColor: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      buildText: (l) => `Phê duyệt xuất bản ebook #${l.record_id} — Nội dung đã công khai`
    },
    'REJECT_EBOOK': {
      icon: BookOpen, color: 'text-rose-600', bg: 'bg-rose-50',
      badge: 'Từ chối ebook', badgeColor: 'bg-rose-50 text-rose-600 border-rose-100',
      buildText: (l) => {
        const reason = l.new_values?.reason;
        return `Từ chối ebook #${l.record_id}${reason ? ` — "${reason}"` : ''}`;
      }
    },
    'ADMIN_UPLOAD_EBOOK': {
      icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50',
      badge: 'Admin Upload', badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      buildText: (l) => {
        const title = l.new_values?.title;
        return `Admin đăng tải ebook${title ? ` "${title}"` : ` #${l.record_id}`} — Tự động xuất bản, doanh thu thuộc thư viện`;
      }
    },
    'PROCESS_WITHDRAWAL': {
      icon: Wallet, color: 'text-blue-600', bg: 'bg-blue-50',
      badge: 'Tài chính', badgeColor: 'bg-blue-50 text-blue-600 border-blue-100',
      buildText: (l) => {
        const action = l.new_values?.action || l.new_values?.status;
        if (action === 'approve' || action === 'approved') return `Duyệt yêu cầu rút tiền #${l.record_id} — Đã chuyển khoản cho tác giả`;
        if (action === 'reject' || action === 'rejected') return `Từ chối yêu cầu rút tiền #${l.record_id}${l.new_values?.notes ? ` — "${l.new_values.notes}"` : ''}`;
        return `Xử lý yêu cầu rút tiền #${l.record_id}`;
      }
    },
    'UPDATE_SETTINGS': {
      icon: Activity, color: 'text-indigo-600', bg: 'bg-indigo-50',
      badge: 'Cấu hình', badgeColor: 'bg-indigo-50 text-indigo-600 border-indigo-100',
      buildText: (l) => {
        const changed = l.new_values ? Object.keys(l.new_values) : [];
        if (changed.length > 0) return `Cập nhật ${changed.length} tham số cấu hình (${changed.slice(0, 3).join(', ')}${changed.length > 3 ? '...' : ''})`;
        return 'Cập nhật cấu hình hệ thống';
      }
    },
  };

  const getLogConfig = (log) => {
    return ACTION_MAP[log.action] || {
      icon: Activity, color: 'text-slate-500', bg: 'bg-slate-50',
      badge: log.table_name || 'Hệ thống',
      badgeColor: 'bg-slate-50 text-slate-500 border-slate-100',
      buildText: (l) => `${l.action} — ${l.table_name} #${l.record_id}`
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
           <h1 className="text-3xl font-black text-slate-800 tracking-tight">Cổng Quản Trị Hệ Thống</h1>
           <p className="text-slate-500 font-medium mt-1">Giám sát hoạt động, bảo mật và phân quyền toàn hệ thống.</p>
        </div>
        <div className="hidden md:flex gap-3">
           <button 
             onClick={() => navigate('/admin/settings')}
             className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2"
           >
              <BarChart3 size={18} /> Cấu hình
           </button>
        </div>
      </div>

      {/* Stats Grid — 3 cols on large, 2 on md */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className={`bg-white p-6 rounded-3xl border ${card.highlight ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-100'} shadow-sm hover:shadow-md transition-shadow group`}
          >
            <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
              <card.icon size={22} />
            </div>
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">{card.title}</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{card.value}</div>
            <div className={`flex items-center gap-1 text-[10px] font-bold mt-2 ${card.up ? 'text-emerald-600' : 'text-amber-600'}`}>
              {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{card.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column Container */}
        <div className="lg:col-span-2 space-y-8">

          {/* ===== BẢNG DOANH THU ADMIN (MỚI) ===== */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                  <Wallet size={16} className="text-emerald-600" /> Doanh thu tài khoản Admin
                </h3>
                <div className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Cập nhật realtime
                </div>
             </div>
             
             <div className="p-6">
               {/* Summary Cards Row */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                 <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                   <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Tổng thu</div>
                   <div className="text-xl font-black text-emerald-700 mt-1">{Number(revenueData?.total_earned || overview.total_revenue || 0).toLocaleString('vi-VN')} ₫</div>
                 </div>
                 <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                   <div className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Số dư hiện tại</div>
                   <div className="text-xl font-black text-indigo-700 mt-1">{Number(revenueData?.earnings_balance || 0).toLocaleString('vi-VN')} ₫</div>
                 </div>
                 <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
                   <div className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Đã chi / rút</div>
                   <div className="text-xl font-black text-amber-700 mt-1">{Number(revenueData?.withdrawn || 0).toLocaleString('vi-VN')} ₫</div>
                 </div>
                 <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100">
                   <div className="text-[9px] font-black text-violet-500 uppercase tracking-widest">Có thể rút</div>
                   <div className="text-xl font-black text-violet-700 mt-1">{Number(revenueData?.available_to_withdraw || 0).toLocaleString('vi-VN')} ₫</div>
                 </div>
               </div>

               {/* Revenue Breakdown Table */}
               <table className="w-full text-left">
                  <thead className="bg-slate-50/50">
                     <tr>
                        <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Nguồn thu</th>
                        <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                        <th className="px-5 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tỷ trọng</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {(() => {
                        const breakdown = revenueData?.breakdown || {};
                        const totalIncome = breakdown.total_income || overview.total_revenue || 1;
                        const sources = [
                           { name: 'Bán Ebook (Admin)', icon: BookOpen, color: 'text-violet-600', bg: 'bg-violet-50', amount: breakdown.ebook_income || 0 },
                           { name: 'Hoa hồng Ebook Author', icon: FileText, color: 'text-teal-600', bg: 'bg-teal-50', amount: breakdown.author_ebook_commission || 0 },
                           { name: 'Phí mượn sách', icon: BookMarked, color: 'text-emerald-600', bg: 'bg-emerald-50', amount: breakdown.borrow_fee_income || 0 },
                           { name: 'Phí phạt quá hạn', icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', amount: breakdown.penalty_income || 0 },
                           { name: 'Phí đặt trước', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50', amount: breakdown.reservation_income || 0 },
                           { name: 'Tiền cọc tịch thu', icon: ShieldAlert, color: 'text-amber-600', bg: 'bg-amber-50', amount: breakdown.deposit_income || 0 },
                        ];
                        return sources.map(s => {
                           const pct = totalIncome > 0 ? ((s.amount / totalIncome) * 100).toFixed(1) : '0.0';
                           return (
                             <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                               <td className="px-5 py-4">
                                 <div className="flex items-center gap-3">
                                    <div className={`${s.bg} ${s.color} w-9 h-9 rounded-xl flex items-center justify-center shrink-0`}>
                                       <s.icon size={16} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-700">{s.name}</span>
                                 </div>
                               </td>
                               <td className="px-5 py-4 text-right font-black text-slate-800 text-sm">{Number(s.amount).toLocaleString('vi-VN')} ₫</td>
                               <td className="px-5 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                      <div className={`h-full rounded-full`} style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: s.color === 'text-violet-600' ? '#8b5cf6' : s.color === 'text-teal-600' ? '#0d9488' : s.color === 'text-emerald-600' ? '#059669' : s.color === 'text-rose-600' ? '#e11d48' : s.color === 'text-blue-600' ? '#2563eb' : '#d97706' }}></div>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500 w-12 text-right">{pct}%</span>
                                  </div>
                               </td>
                             </tr>
                           );
                        });
                     })()}
                     <tr className="bg-slate-50/80">
                       <td className="px-5 py-4 font-black text-slate-800 text-sm">Tổng cộng</td>
                       <td className="px-5 py-4 text-right font-black text-emerald-700 text-base">{Number(revenueData?.breakdown?.total_income || overview.total_revenue || 0).toLocaleString('vi-VN')} ₫</td>
                       <td className="px-5 py-4 text-right font-black text-slate-500 text-xs">100%</td>
                     </tr>
                  </tbody>
               </table>
             </div>
          </div>

        </div>

        {/* Quick Access + Summary */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4">
                <Layers size={14} className="text-indigo-500" /> Truy cập nhanh
              </h4>
              <div className="grid grid-cols-2 gap-3">
                 {[
                   { name: 'Phân quyền', icon: ShieldAlert, color: 'text-amber-500', path: '/admin/permissions' },
                   { name: 'Rút tiền', icon: DollarSign, color: 'text-indigo-500', path: '/admin/withdrawals' },
                   { name: 'Quản lý Ebook', icon: BookOpen, color: 'text-emerald-500', path: '/admin/ebooks' },
                   { name: 'Kho sách', icon: Package, color: 'text-blue-500', path: '/admin/books' },
                   { name: 'Hot & Featured', icon: Flame, color: 'text-rose-500', path: '/admin/hot-featured' },
                 ].map(action => (
                   <button 
                     key={action.name} 
                     onClick={() => navigate(action.path)}
                     className="flex flex-col items-center gap-3 p-5 bg-slate-50 hover:bg-white border-2 border-transparent hover:border-indigo-100 rounded-2xl hover:shadow-lg transition-all group active:scale-95"
                   >
                      <action.icon size={22} className={`${action.color} group-hover:scale-110 transition-transform`} />
                      <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500 group-hover:text-slate-800">{action.name}</span>
                   </button>
                 ))}
              </div>
           </div>

           {/* Monthly Revenue Card */}
           <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl group-hover:bg-white/20 transition-all duration-700" />
              <div className="bg-white/20 w-12 h-12 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-md border border-white/10">
                <DollarSign size={22} />
              </div>
              <div className="text-white/60 text-[10px] font-black uppercase tracking-widest">Doanh thu tháng</div>
              <div className="text-2xl font-black mt-1 tracking-tight">{Number(overview.monthly_revenue).toLocaleString('vi-VN')} ₫</div>
              <div className="mt-4 pt-4 border-t border-white/20 text-xs text-indigo-100 leading-relaxed">
                Tổng tích lũy: <strong>{Number(overview.total_revenue).toLocaleString('vi-VN')} ₫</strong>
              </div>
           </div>

           {/* Pending Actions Summary */}
           {(pendingEbooks > 0 || pendingWithdraws > 0) && (
             <div className="bg-white rounded-3xl border border-amber-100 p-6 shadow-sm">
               <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4">
                 <AlertCircle size={14} className="text-amber-500" /> Cần xử lý
               </h4>
               <ul className="space-y-3">
                 {pendingEbooks > 0 && (
                   <li className="flex items-center gap-3 cursor-pointer hover:bg-amber-50 -mx-2 px-2 py-2 rounded-xl transition-colors" onClick={() => navigate('/admin/ebooks')}>
                     <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                     <p className="text-xs text-slate-600 font-medium flex-1">Có <strong className="text-amber-700">{pendingEbooks}</strong> ebook đang chờ kiểm duyệt nội dung.</p>
                     <ArrowUpRight size={14} className="text-slate-400" />
                   </li>
                 )}
                 {pendingWithdraws > 0 && (
                   <li className="flex items-center gap-3 cursor-pointer hover:bg-amber-50 -mx-2 px-2 py-2 rounded-xl transition-colors" onClick={() => navigate('/admin/withdrawals')}>
                     <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                     <p className="text-xs text-slate-600 font-medium flex-1">Có <strong className="text-blue-700">{pendingWithdraws}</strong> yêu cầu rút tiền cần duyệt.</p>
                     <ArrowUpRight size={14} className="text-slate-400" />
                   </li>
                 )}
                 {overview.pending_reservations > 0 && (
                   <li className="flex items-center gap-3">
                     <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                     <p className="text-xs text-slate-600 font-medium"><strong className="text-indigo-700">{overview.pending_reservations}</strong> đặt trước sách đang chờ.</p>
                   </li>
                 )}
               </ul>
             </div>
           )}
        </div>
      </div>

      {/* ===== BẢNG LỊCH SỬ HÓA ĐƠN ===== */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
            <Receipt size={16} className="text-emerald-600" /> Lịch sử hóa đơn
          </h3>
          <button className="text-indigo-600 font-bold text-xs hover:underline">Xem tất cả</button>
        </div>
        <div className="p-4">
          <VirtualTable
            data={transactions}
            height={400}
            rowHeight={80}
            onRowClick={(trans) => {
              setSelectedTransaction(trans);
              setShowTransactionModal(true);
            }}
            columns={[
              {
                header: 'Mã',
                key: 'id',
                flex: 0.5,
                minWidth: 80,
                render: (trans) => <div className="font-bold text-slate-700">#{trans.id}</div>
              },
              {
                header: 'Người dùng',
                key: 'user',
                flex: 2,
                minWidth: 150,
                render: (trans) => (
                  <div>
                    <div className="font-bold text-indigo-600 text-sm">{trans.user?.name || '—'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{trans.user?.email || '—'}</div>
                  </div>
                )
              },
              {
                header: 'Loại',
                key: 'type',
                flex: 1.5,
                minWidth: 120,
                render: (trans) => {
                  const typeLabels = {
                    ebook_purchase: 'Mua Ebook',
                    topup: 'Nạp tiền',
                    borrow_fee: 'Phí mượn',
                    penalty: 'Phạt quá hạn',
                    reservation: 'Đặt trước',
                    deposit: 'Tiền cọc',
                    deposit_refund: 'Hoàn cọc',
                  };
                  const typeColors = {
                    ebook_purchase: 'text-violet-600 bg-violet-50 border-violet-100',
                    topup: 'text-emerald-600 bg-emerald-50 border-emerald-100',
                    borrow_fee: 'text-blue-600 bg-blue-50 border-blue-100',
                    penalty: 'text-rose-600 bg-rose-50 border-rose-100',
                    reservation: 'text-amber-600 bg-amber-50 border-amber-100',
                    deposit: 'text-indigo-600 bg-indigo-50 border-indigo-100',
                    deposit_refund: 'text-teal-600 bg-teal-50 border-teal-100',
                  };
                  return (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${typeColors[trans.type] || 'text-slate-600 bg-slate-50 border-slate-100'}`}>
                      {typeLabels[trans.type] || trans.type}
                    </span>
                  );
                }
              },
              {
                header: 'Số tiền',
                key: 'amount',
                flex: 1,
                minWidth: 100,
                render: (trans) => <div className="font-black text-slate-800 text-sm">{Number(trans.amount || 0).toLocaleString('vi-VN')} ₫</div>
              },
              {
                header: 'Trạng thái',
                key: 'status',
                flex: 1,
                minWidth: 100,
                render: (trans) => {
                  const statusColors = {
                    success: 'bg-emerald-50 text-emerald-600 border-emerald-100',
                    pending: 'bg-amber-50 text-amber-600 border-amber-100',
                    failed: 'bg-rose-50 text-rose-600 border-rose-100',
                  };
                  const statusLabels = {
                    success: 'Thành công',
                    pending: 'Đang xử lý',
                    failed: 'Thất bại',
                  };
                  return (
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${statusColors[trans.status] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
                      {statusLabels[trans.status] || trans.status}
                    </span>
                  );
                }
              },
              {
                header: 'Thời gian',
                key: 'created_at',
                flex: 1.5,
                minWidth: 120,
                render: (trans) => (
                  <div>
                    <div className="font-bold text-slate-700 text-xs">{new Date(trans.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="text-[10px] text-slate-400">{getTimeAgo(trans.created_at)}</div>
                  </div>
                )
              },
            ]}
          />
        </div>
      </div>

      {/* ===== BẢNG GIAO DỊCH MƯỢN SÁCH GẦN ĐÂY ===== */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-600" /> Tất cả phiếu mượn sách gần đây
          </h3>
          <button onClick={() => navigate('/librarian/offline')} className="text-indigo-600 font-bold text-xs hover:underline">Quản lý mượn trả</button>
        </div>
        <div className="p-4">
          <VirtualTable
            data={recentBorrows}
            height={400}
            rowHeight={70}
            onRowClick={(borrow) => {
              setSelectedBorrow(borrow);
              setShowBorrowModal(true);
            }}
            columns={[
              {
                header: 'Thời gian',
                key: 'borrow_date',
                flex: 1.5,
                minWidth: 120,
                render: (borrow) => (
                  <div>
                    <div className="font-bold text-slate-700 text-xs">{new Date(borrow.borrow_date || borrow.created_at).toLocaleDateString('vi-VN')}</div>
                    <div className="text-[10px] text-slate-400">Hạn: {new Date(borrow.due_date).toLocaleDateString('vi-VN')}</div>
                  </div>
                )
              },
              {
                header: 'Người dùng',
                key: 'user',
                flex: 2,
                minWidth: 150,
                render: (borrow) => (
                  <div>
                    <div className="font-bold text-indigo-600 text-sm">{borrow.user?.name || 'Vãng lai'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{borrow.user?.email || 'Người đăng ký OFFLINE'}</div>
                  </div>
                )
              },
              {
                header: 'Sách mượn',
                key: 'book',
                flex: 2,
                minWidth: 200,
                render: (borrow) => (
                  <div className="text-sm font-bold text-slate-700 truncate">
                    {borrow.book?.title || borrow.copy?.book?.title || '—'}
                  </div>
                )
              },
              {
                header: 'Tình trạng',
                key: 'status',
                flex: 1,
                minWidth: 100,
                render: (borrow) => {
                  const isOverdue = borrow.status === 'overdue' || (new Date(borrow.due_date) < new Date() && borrow.status === 'borrowed');
                  if (borrow.status === 'returned') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Đã trả</span>;
                  } else if (isOverdue) {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">Quá hạn</span>;
                  } else {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Đang mượn</span>;
                  }
                }
              },
            ]}
          />
        </div>
      </div>

      {/* ===== BẢNG LOGS ĐẨY XUỐNG CUỐI CÙNG ===== */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
         <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
              <Activity size={16} className="text-indigo-600" /> Bản tin hệ thống & Logs
            </h3>
            <button className="text-indigo-600 font-bold text-xs hover:underline">Xem tất cả</button>
         </div>

         <div className="p-4">
           <VirtualTable
             data={recentLogs.slice(0, 50)}
             height={400}
             rowHeight={100}
             onRowClick={(log) => {
               setSelectedLog(log);
               setShowLogModal(true);
             }}
             columns={[
               {
                 header: 'Thời gian',
                 key: 'created_at',
                 flex: 1,
                 minWidth: 100,
                 render: (log) => (
                   <div>
                     <div className="text-[10px] text-slate-400">{getTimeAgo(log.created_at)}</div>
                     <div className="text-xs text-slate-500">{new Date(log.created_at).toLocaleString('vi-VN')}</div>
                   </div>
                 )
               },
               {
                 header: 'Hoạt động',
                 key: 'action',
                 flex: 3,
                 minWidth: 250,
                 render: (log) => {
                   const config = getLogConfig(log);
                   const LogIcon = config.icon;
                   const logText = config.buildText(log);
                   return (
                     <div className="flex gap-3 items-start">
                       <div className={`${config.bg} ${config.color} w-8 h-8 rounded-lg flex items-center justify-center shrink-0`}>
                         <LogIcon size={14} />
                       </div>
                       <div className="flex-1 min-w-0">
                         <div className="flex items-center gap-2 mb-1">
                           <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${config.badgeColor}`}>{config.badge}</span>
                         </div>
                         <p className="text-xs text-slate-700 leading-relaxed line-clamp-2">{logText}</p>
                       </div>
                     </div>
                   );
                 }
               },
               {
                 header: 'Người dùng',
                 key: 'user',
                 flex: 1.5,
                 minWidth: 100,
                 render: (log) => (
                   <div className="text-xs text-slate-600 flex items-center gap-1">
                     <Users size={12} /> {log.user?.name || 'Hệ thống'}
                   </div>
                 )
               },
             ]}
           />
         </div>
      </div>

      {recentLogs.length === 0 && (
        <div className="text-center py-12">
          <Activity size={32} className="text-slate-200 mx-auto mb-3" />
          <p className="text-slate-400 font-medium text-sm">Chưa có nhật ký hoạt động.</p>
          <p className="text-slate-300 text-xs mt-1">Các thao tác quản trị sẽ được ghi nhận tại đây.</p>
        </div>
      )}
      {/* Detail Modals */}
      <DetailModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        data={selectedTransaction}
        type="transaction"
      />
      <DetailModal
        isOpen={showBorrowModal}
        onClose={() => {
          setShowBorrowModal(false);
          setSelectedBorrow(null);
        }}
        data={selectedBorrow}
        type="borrow"
      />
      <DetailModal
        isOpen={showLogModal}
        onClose={() => {
          setShowLogModal(false);
          setSelectedLog(null);
        }}
        data={selectedLog}
        type="user"
      />
    </motion.div>
  );
};

export default AdminDashboard;
