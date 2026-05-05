import React, { useState, useEffect } from 'react';
import {
  Wallet, ArrowUpRight, ArrowDownRight, RefreshCcw,
  CreditCard, ShieldCheck, Calendar, Search, Filter,
  ChevronLeft, ChevronRight, AlertCircle, CheckCircle,
  TrendingUp, PieChart, BarChart3, DollarSign,
  BookOpen, Clock
} from 'lucide-react';
import { librarianService } from '../../services/librarianService';
import { motion } from 'framer-motion';
import DetailModal from '../../components/ui/DetailModal';

const LibrarianFinance = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [summary, setSummary] = useState(null);
  const [deposits, setDeposits] = useState([]);
  const [depositSummaryDetail, setDepositSummaryDetail] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Date filter states
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(1); // First day of current month
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1, 0); // Last day of current month
    return date.toISOString().split('T')[0];
  });

  // Topups states
  const [topups, setTopups] = useState([]);
  const [topupsSummary, setTopupsSummary] = useState(null);
  const [topupsPagination, setTopupsPagination] = useState(null);
  const [topupsPage, setTopupsPage] = useState(1);
  const [topupsSearchInput, setTopupsSearchInput] = useState('');
  const [topupsSearch, setTopupsSearch] = useState('');
  const [isTopupsLoading, setIsTopupsLoading] = useState(true);

  // Library fees states
  const [libraryFees, setLibraryFees] = useState([]);
  const [isLibraryFeesLoading, setIsLibraryFeesLoading] = useState(true);

  // Detail modal states
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Fetch Summary & Deposits
  const fetchBasicData = async () => {
    setIsLoading(true);
    try {
      const [sumRes, depRes, depSummaryRes] = await Promise.all([
        librarianService.getFinanceSummary({ start_date: startDate, end_date: endDate }).catch(() => ({ data: {} })),
        librarianService.getFinanceDeposits().catch(() => ({ data: [] })),
        librarianService.getDepositSummary().catch(() => null)
      ]);
      setSummary(sumRes.data || sumRes || {});
      setDeposits(depRes.data?.data || depRes.data || []);
      setDepositSummaryDetail(depSummaryRes);
    } catch {
      // Error already handled by service
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch Library Fees
  const fetchLibraryFees = async () => {
    setIsLibraryFeesLoading(true);
    try {
      const res = await librarianService.getLibraryFees({ start_date: startDate, end_date: endDate }).catch(() => []);
      setLibraryFees(res?.data || res || []);
    } catch {
      // Error already handled by service
    } finally {
      setIsLibraryFeesLoading(false);
    }
  };

  // Fetch Topups API
  const fetchTopups = async () => {
    setIsTopupsLoading(true);
    try {
      const res = await librarianService.getAllTopups({
        page: topupsPage,
        search: topupsSearch
      });
      setTopups(res.data || []);
      setTopupsPagination(res.pagination || null);
      if (res.summary) {
         setTopupsSummary(res.summary);
      }
    } catch {
      // Error already handled by service
    } finally {
      setIsTopupsLoading(false);
    }
  };

  useEffect(() => {
    fetchBasicData();
  }, [startDate, endDate]);

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchBasicData();
    } else if (activeTab === 'library-fees') {
      fetchLibraryFees();
    } else if (activeTab === 'topups') {
      fetchTopups();
    }
  }, [activeTab]);

  useEffect(() => {
    fetchTopups();
  }, [topupsPage, topupsSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setTopupsSearch(topupsSearchInput);
    setTopupsPage(1);
  };

  const totalTopup = summary?.summary?.topups || 0;
  const totalDeposit = summary?.summary?.deposits || 0;
  const totalLibraryFees = summary?.summary?.library_fees || 0;
  const totalIncome = summary?.summary?.total_income || 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Báo cáo Tài chính Chi tiết</h1>
          <p className="text-slate-500 font-medium mt-1">Phân tích toàn bộ dòng tiền nạp, cọc và phí dịch vụ của thư viện.</p>
        </div>
        <button
          onClick={() => {
            fetchBasicData();
            fetchTopups();
            fetchLibraryFees();
          }}
          className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2"
        >
          <RefreshCcw size={18} className={(isLoading || isTopupsLoading) ? 'animate-spin' : ''} /> Làm mới
        </button>
      </div>

      {/* Date Filter */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="flex items-center gap-2 text-slate-600 font-bold">
            <Calendar size={18} />
            <span className="text-sm">Khoảng thời gian:</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Từ ngày</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1 block">Đến ngày</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <DollarSign size={24} className="text-white" />
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-widest">
              Tổng Thu
            </span>
          </div>
          <div className="text-emerald-100 text-sm font-bold uppercase tracking-widest mb-1">Doanh thu tổng</div>
          <div className="text-3xl font-black tracking-tight">{Number(totalIncome).toLocaleString('vi-VN')} ₫</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-500 to-violet-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
              <Wallet size={24} className="text-white" />
            </div>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-md border border-white/10 uppercase tracking-widest">
              Nạp Tiền
            </span>
          </div>
          <div className="text-indigo-100 text-sm font-bold uppercase tracking-widest mb-1">Tổng tiền nạp</div>
          <div className="text-3xl font-black tracking-tight">{Number(totalTopup).toLocaleString('vi-VN')} ₫</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full blur-3xl" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-100 uppercase tracking-widest">
              Cọc Sách
            </span>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1 relative">Tiền cọc đang giữ</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight relative">
            {Number(depositSummaryDetail?.total_deposit_held || totalDeposit || 0).toLocaleString('vi-VN')} ₫
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm relative overflow-hidden"
        >
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-blue-50 rounded-full blur-3xl" />
          <div className="flex justify-between items-start mb-4 relative">
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-full text-xs font-bold border border-slate-100 uppercase tracking-widest">
              Phí DV
            </span>
          </div>
          <div className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-1 relative">Phí dịch vụ</div>
          <div className="text-3xl font-black text-slate-800 tracking-tight relative">
            {Number(totalLibraryFees).toLocaleString('vi-VN')} ₫
          </div>
        </motion.div>
      </div>

      {/* Deposit Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Phiếu mượn active</div>
              <div className="text-2xl font-black text-slate-800">{depositSummaryDetail?.active_borrow_records || 0}</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Chờ hoàn cọc</div>
              <div className="text-2xl font-black text-amber-600">{Number(depositSummaryDetail?.pending_refund || 0).toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Đã hoàn cọc</div>
              <div className="text-2xl font-black text-emerald-600">{Number(depositSummaryDetail?.already_refunded || 0).toLocaleString('vi-VN')} ₫</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4">
           <div className="flex gap-2 overflow-x-auto no-scrollbar w-full sm:w-auto">
             <button
               onClick={() => setActiveTab('overview')}
               className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                 activeTab === 'overview' 
                   ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                   : 'text-slate-500 hover:bg-slate-50'
               }`}
             >
               <PieChart size={16} className="inline mr-2" /> Tổng quan
             </button>
             <button
               onClick={() => setActiveTab('library-fees')}
               className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                 activeTab === 'library-fees' 
                   ? 'bg-blue-50 text-blue-600 shadow-sm' 
                   : 'text-slate-500 hover:bg-slate-50'
               }`}
             >
               <TrendingUp size={16} className="inline mr-2" /> Phí dịch vụ
             </button>
             <button
               onClick={() => setActiveTab('topups')}
               className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
                 activeTab === 'topups' 
                   ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                   : 'text-slate-500 hover:bg-slate-50'
               }`}
             >
               <CreditCard size={16} className="inline mr-2" /> Lịch sử nạp
             </button>
             <button
               onClick={() => setActiveTab('deposits')}
               className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                 activeTab === 'deposits' 
                   ? 'bg-amber-50 text-amber-600 shadow-sm' 
                   : 'text-slate-500 hover:bg-slate-50'
               }`}
             >
               <ShieldCheck size={16} className="inline mr-2" /> Cọc sách
             </button>
           </div>
           
           {activeTab === 'topups' && (
             <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Tìm tên, email..."
                  value={topupsSearchInput}
                  onChange={(e) => setTopupsSearchInput(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
             </form>
           )}
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {activeTab === 'overview' ? (
            isLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                  <h3 className="font-black text-indigo-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                    <BarChart3 size={16} /> Phân tích doanh thu theo nguồn
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">Nạp tiền người dùng</span>
                        <span className="font-black text-indigo-600">{Number(totalTopup).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="w-full bg-indigo-100 rounded-full h-3">
                        <div 
                          className="bg-indigo-600 h-3 rounded-full transition-all" 
                          style={{ width: totalIncome > 0 ? `${(totalTopup / totalIncome) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">Tiền cọc sách</span>
                        <span className="font-black text-amber-600">{Number(totalDeposit).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="w-full bg-amber-100 rounded-full h-3">
                        <div 
                          className="bg-amber-600 h-3 rounded-full transition-all" 
                          style={{ width: totalIncome > 0 ? `${(totalDeposit / totalIncome) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="font-bold text-slate-700">Phí dịch vụ</span>
                        <span className="font-black text-blue-600">{Number(totalLibraryFees).toLocaleString('vi-VN')} ₫</span>
                      </div>
                      <div className="w-full bg-blue-100 rounded-full h-3">
                        <div 
                          className="bg-blue-600 h-3 rounded-full transition-all" 
                          style={{ width: totalIncome > 0 ? `${(totalLibraryFees / totalIncome) * 100}%` : '0%' }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-2xl p-6 border border-slate-100">
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Thông tin kỳ báo cáo</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Từ ngày:</span>
                        <span className="text-sm font-bold text-slate-800">{new Date(startDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-500">Đến ngày:</span>
                        <span className="text-sm font-bold text-slate-800">{new Date(endDate).toLocaleDateString('vi-VN')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <h4 className="font-black text-emerald-800 uppercase text-xs tracking-widest mb-4">Tỷ lệ hoàn cọc</h4>
                    <div className="text-4xl font-black text-emerald-600">
                      {depositSummaryDetail?.already_refunded > 0 && depositSummaryDetail?.pending_refund > 0 
                        ? `${((depositSummaryDetail.already_refunded / (depositSummaryDetail.pending_refund + depositSummaryDetail.already_refunded)) * 100).toFixed(1)}%`
                        : '0%'
                      }
                    </div>
                    <p className="text-xs text-emerald-600 mt-2">Tỷ lệ cọc đã hoàn trả</p>
                  </div>
                </div>
              </div>
            )
          ) : activeTab === 'library-fees' ? (
            isLibraryFeesLoading ? (
              <div className="p-12 flex justify-center">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao dịch</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Loại phí</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Ngày tạo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {libraryFees.map((fee) => (
                    <tr 
                      key={fee.id} 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedTransaction(fee);
                        setShowTransactionModal(true);
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-700">{fee.transaction_id || `GD-${fee.id}`}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">{fee.type || 'Phí dịch vụ'}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-indigo-600">{fee.user?.name || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-blue-600">
                          {Number(fee.amount || 0).toLocaleString('vi-VN')} ₫
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-500">{new Date(fee.created_at).toLocaleDateString('vi-VN')}</div>
                      </td>
                    </tr>
                  ))}
                  {libraryFees.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center py-12 text-slate-400 italic text-sm">Chưa có phí dịch vụ nào trong khoảng thời gian này.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )
          ) : activeTab === 'topups' ? (
             isTopupsLoading ? (
               <div className="p-12 flex justify-center">
                 <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
             ) : (
               <>
                 <table className="w-full text-left">
                   <thead>
                     <tr className="bg-slate-50/50">
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giao dịch</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                       <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Trạng thái</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {topups.map((tx) => (
                       <tr 
                         key={tx.id} 
                         className="hover:bg-slate-50 transition-colors cursor-pointer"
                         onClick={() => {
                           setSelectedTransaction(tx);
                           setShowTransactionModal(true);
                         }}
                       >
                         <td className="px-6 py-4">
                           <div className="font-bold text-slate-700">{tx.transaction_id || `GD-${tx.id}`}</div>
                           <div className="text-[10px] text-slate-400 mt-0.5">{new Date(tx.created_at).toLocaleString('vi-VN')}</div>
                         </td>
                         <td className="px-6 py-4">
                           <div className="font-bold text-indigo-600">{tx.user?.name || 'Vô danh'}</div>
                           <div className="text-[10px] text-slate-400">{tx.user?.email || ''}</div>
                         </td>
                         <td className="px-6 py-4 text-right">
                           <span className="font-black text-emerald-600">
                             +{Number(tx.amount || 0).toLocaleString('vi-VN')} ₫
                           </span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                              {tx.transaction_status === 'APPROVED' ? 'Thành công' : tx.transaction_status}
                            </span>
                         </td>
                       </tr>
                     ))}
                     {topups.length === 0 && (
                       <tr>
                         <td colSpan="4" className="text-center py-12 text-slate-400 italic text-sm">Chưa có giao dịch nạp tiền nào.</td>
                       </tr>
                     )}
                   </tbody>
                 </table>

                 {/* Pagination for Topups */}
                 {topupsPagination && topupsPagination.last_page > 1 && (
                   <div className="p-4 border-t border-slate-50 flex items-center justify-between text-sm">
                     <span className="text-slate-500 font-medium">
                       Hiển thị trang <strong className="text-slate-800">{topupsPagination.current_page}</strong> / {topupsPagination.last_page}
                     </span>
                     <div className="flex gap-1">
                       <button 
                         disabled={topupsPagination.current_page === 1}
                         onClick={() => setTopupsPage(p => Math.max(1, p - 1))}
                         className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <ChevronLeft size={16} />
                       </button>
                       <button 
                         disabled={topupsPagination.current_page === topupsPagination.last_page}
                         onClick={() => setTopupsPage(p => p + 1)}
                         className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                         <ChevronRight size={16} />
                       </button>
                     </div>
                   </div>
                 )}
               </>
             )
          ) : (
            isLoading ? (
               <div className="p-12 flex justify-center">
                 <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
               </div>
            ) : (
               <table className="w-full text-left">
                 <thead>
                   <tr className="bg-slate-50/50">
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã cọc</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người dùng</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Liên kết sách</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tiền cọc</th>
                     <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Trạng thái</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                   {deposits.map((dep) => (
                     <tr 
                       key={dep.id} 
                       className="hover:bg-slate-50 transition-colors cursor-pointer"
                       onClick={() => {
                         setSelectedTransaction(dep);
                         setShowTransactionModal(true);
                       }}
                     >
                       <td className="px-6 py-4">
                         <div className="font-bold text-slate-700">Cọc #{dep.id}</div>
                         <div className="text-[10px] text-slate-400 mt-0.5">{new Date(dep.created_at).toLocaleDateString('vi-VN')}</div>
                       </td>
                       <td className="px-6 py-4">
                         <div className="font-bold text-indigo-600">{dep.user?.name || 'N/A'}</div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="text-xs font-bold text-slate-700 truncate max-w-[200px]">{dep.book?.title || 'Sách'}</div>
                       </td>
                       <td className="px-6 py-4 text-center">
                         <span className="font-black text-amber-600">
                           {Number(dep.amount || 0).toLocaleString('vi-VN')} ₫
                         </span>
                       </td>
                       <td className="px-6 py-4 text-right">
                          {dep.status === 'returned' || dep.status === 'refunded' ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-2 py-1 rounded inline-block">
                              Đã hoàn
                            </span>
                          ) : (
                            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 inline-block">
                              Đang giữ
                            </span>
                          )}
                       </td>
                     </tr>
                   ))}
                   {deposits.length === 0 && (
                     <tr>
                       <td colSpan="5" className="text-center py-12 text-slate-400 italic text-sm">Chưa có khoản tiền cọc nào.</td>
                     </tr>
                   )}
                 </tbody>
               </table>
            )
          )}
        </div>
      </div>

      {/* Transaction Detail Modal */}
      <DetailModal
        isOpen={showTransactionModal}
        onClose={() => {
          setShowTransactionModal(false);
          setSelectedTransaction(null);
        }}
        data={selectedTransaction}
        type="transaction"
      />

    </div>
  );
};

export default LibrarianFinance;

