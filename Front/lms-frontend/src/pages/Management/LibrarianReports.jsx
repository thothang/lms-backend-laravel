import React, { useState } from 'react';
import {
  FileText, TrendingUp, AlertTriangle, BookMarked,
  RefreshCcw, Clock, ArrowUpRight, ArrowDownRight, Calendar,
  BarChart3, PieChart, Users, CheckCircle, Target, Star,
  Library, Filter, AlertCircle
} from 'lucide-react';
import { 
  useLibrarianBorrowStats, 
  useLibrarianTopBooks, 
  useLibrarianCategoryStats, 
  useLibrarianReturnStats 
} from '../../hooks/queries';
import { handleApiError } from '../../utils/toastHelper';
import { motion } from 'framer-motion';

const LibrarianReports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [period, setPeriod] = useState('month');

  // React Query hooks - handles loading, error, and caching automatically
  const borrowStatsQuery = useLibrarianBorrowStats();
  const topBooksQuery = useLibrarianTopBooks({ period, limit: 10 });
  const categoryStatsQuery = useLibrarianCategoryStats({ period });
  const returnStatsQuery = useLibrarianReturnStats({ period });

  const overview = borrowStatsQuery.data || {};
  const topBooks = topBooksQuery.data || [];
  const categoryStats = categoryStatsQuery.data || [];
  const returnStats = returnStatsQuery.data;

  const isLoading = borrowStatsQuery.isLoading || topBooksQuery.isLoading || categoryStatsQuery.isLoading || returnStatsQuery.isLoading;

  const fetchData = () => {
    borrowStatsQuery.refetch();
    topBooksQuery.refetch();
    categoryStatsQuery.refetch();
    returnStatsQuery.refetch();
  };

  const statCards = [
    { 
      title: 'Tổng sách đang mượn', 
      value: overview?.total_borrowed || 0, 
      icon: BookMarked, 
      color: 'indigo', 
      trend: 'Hiện tại', 
      isUp: true 
    },
    { 
      title: 'Quá hạn chưa trả', 
      value: overview?.overdue_count || 0, 
      icon: AlertTriangle, 
      color: 'rose', 
      trend: 'Cần xử lý', 
      isUp: false 
    },
    { 
      title: 'Lượt mượn trong kỳ', 
      value: overview?.monthly_borrows || 0, 
      icon: TrendingUp, 
      color: 'emerald', 
      trend: 'Xu hướng', 
      isUp: true 
    },
    { 
      title: 'Tỷ lệ hoàn trả', 
      value: returnStats?.overall_return_rate ? `${returnStats.overall_return_rate.toFixed(1)}%` : '0%', 
      icon: CheckCircle, 
      color: 'blue', 
      trend: 'Đúng hạn', 
      isUp: true 
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Báo cáo & Phân tích</h1>
          <p className="text-slate-500 font-medium mt-1">Dữ liệu thống kê để định hướng và lập kế hoạch vận hành thư viện.</p>
        </div>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="week">Tuần này</option>
            <option value="month">Tháng này</option>
            <option value="year">Năm nay</option>
            <option value="all">Tất cả</option>
          </select>
          <button
            onClick={fetchData}
            className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-2 px-4 rounded-xl shadow-sm transition-all flex items-center gap-2"
          >
            <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white border border-${stat.color}-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group`}
          >
            <div className={`absolute -right-4 -top-4 w-24 h-24 bg-${stat.color}-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500`} />
            <div className="relative">
              <div className={`w-12 h-12 bg-${stat.color}-50 text-${stat.color}-600 rounded-2xl flex items-center justify-center mb-4`}>
                <stat.icon size={24} />
              </div>
              <div className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">{stat.title}</div>
              <div className="text-4xl font-black text-slate-800 tracking-tight">{stat.value}</div>
              <div className={`flex items-center gap-1 mt-2 text-[10px] font-bold ${stat.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                {stat.isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                <span>{stat.trend}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'overview' 
                ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <BarChart3 size={16} className="inline mr-2" /> Tổng quan
          </button>
          <button
            onClick={() => setActiveTab('top-books')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'top-books' 
                ? 'bg-emerald-50 text-emerald-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Star size={16} className="inline mr-2" /> Sách phổ biến
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'categories' 
                ? 'bg-blue-50 text-blue-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Library size={16} className="inline mr-2" /> Thể loại
          </button>
          <button
            onClick={() => setActiveTab('returns')}
            className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'returns' 
                ? 'bg-amber-50 text-amber-600 shadow-sm' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <CheckCircle size={16} className="inline mr-2" /> Tỷ lệ hoàn trả
          </button>
        </div>

        {/* Content */}
        <div className="overflow-x-auto">
          {activeTab === 'overview' && (
            <div className="p-6 space-y-6">
              {/* Return Rate Analysis */}
              {returnStats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
                    <h4 className="font-black text-emerald-800 uppercase text-xs tracking-widest mb-4">Tỷ lệ hoàn trả tổng</h4>
                    <div className="text-4xl font-black text-emerald-600">{returnStats.overall_return_rate.toFixed(1)}%</div>
                    <p className="text-xs text-emerald-600 mt-2">{returnStats.returned_borrows} / {returnStats.total_borrows} phiếu đã hoàn trả</p>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-6 border border-blue-100">
                    <h4 className="font-black text-blue-800 uppercase text-xs tracking-widest mb-4">Đúng hạn</h4>
                    <div className="text-4xl font-black text-blue-600">{returnStats.on_time_rate.toFixed(1)}%</div>
                    <p className="text-xs text-blue-600 mt-2">{returnStats.on_time_returns} phiếu đúng hạn</p>
                  </div>
                  <div className="bg-rose-50 rounded-2xl p-6 border border-rose-100">
                    <h4 className="font-black text-rose-800 uppercase text-xs tracking-widest mb-4">Trả muộn</h4>
                    <div className="text-4xl font-black text-rose-600">{returnStats.overdue_rate.toFixed(1)}%</div>
                    <p className="text-xs text-rose-600 mt-2">{returnStats.overdue_returns} phiếu quá hạn</p>
                  </div>
                </div>
              )}

              {/* Recommendations */}
              <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                <h3 className="font-black text-indigo-800 uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                  <Target size={16} /> Đề xuất hành động
                </h3>
                <div className="space-y-3">
                  {(returnStats?.overdue_rate > 20) && (
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl">
                      <AlertCircle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Tăng nhắc nhở quá hạn</div>
                        <div className="text-xs text-slate-500 mt-1">Tỷ lệ trả muộn cao ({returnStats.overdue_rate.toFixed(1)}%), cần tăng cường nhắc nhở trước hạn.</div>
                      </div>
                    </div>
                  )}
                  {(returnStats?.overall_return_rate < 80) && (
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl">
                      <Clock size={20} className="text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Kiểm tra quy trình mượn</div>
                        <div className="text-xs text-slate-500 mt-1">Tỷ lệ hoàn trả thấp ({returnStats.overall_return_rate.toFixed(1)}%), cần xem xét lại quy trình mượn trả.</div>
                      </div>
                    </div>
                  )}
                  {(overview?.overdue_count > 10) && (
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl">
                      <AlertTriangle size={20} className="text-rose-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Xử lý quá hạn gấp</div>
                        <div className="text-xs text-slate-500 mt-1">{overview.overdue_count} phiếu đang quá hạn, cần liên hệ người mượn ngay.</div>
                      </div>
                    </div>
                  )}
                  {(!returnStats?.overdue_rate || returnStats.overdue_rate <= 20 && returnStats.overdue_rate >= 0) && overview?.overdue_count <= 10 && (
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl">
                      <CheckCircle size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-slate-800 text-sm">Vận hành tốt</div>
                        <div className="text-xs text-slate-500 mt-1">Các chỉ số đều trong mức chấp nhận, tiếp tục duy trì quy trình hiện tại.</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'top-books' && (
            <div className="p-6">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {topBooks.map((book, idx) => (
                    <motion.div
                      key={book.book_id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all"
                    >
                      <div className="flex gap-4">
                        <img src={book.cover_image} alt="" className="w-16 h-24 object-cover rounded-lg shadow-sm" />
                        <div className="flex-1">
                          <div className="text-xs font-black text-indigo-600 mb-1">#{idx + 1}</div>
                          <div className="font-bold text-slate-800 text-sm line-clamp-2">{book.title}</div>
                          <div className="text-[10px] text-slate-400 mt-1">{book.category}</div>
                          <div className="mt-2 text-lg font-black text-emerald-600">{book.borrow_count} lượt mượn</div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {topBooks.length === 0 && (
                    <div className="col-span-full text-center py-12 text-slate-400 italic text-sm">Chưa có dữ liệu.</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="p-6">
              {isLoading ? (
                <div className="p-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thể loại</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Lượt mượn</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">TB ngày mượn</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tỷ lệ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {categoryStats.map((cat, idx) => (
                      <tr key={cat.category_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{cat.category_name || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-indigo-600">{cat.borrow_count}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-bold text-slate-600">{cat.avg_borrow_days} ngày</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="w-full bg-slate-100 rounded-full h-2 max-w-[100px] ml-auto">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all" 
                              style={{ width: `${Math.min((cat.borrow_count / (categoryStats[0]?.borrow_count || 1)) * 100, 100)}%` }}
                            ></div>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {categoryStats.length === 0 && (
                      <tr>
                        <td colSpan="4" className="text-center py-12 text-slate-400 italic text-sm">Chưa có dữ liệu.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="p-6">
              {returnStats ? (
                <div className="space-y-6">
                  <div className="bg-indigo-50 rounded-2xl p-6 border border-indigo-100">
                    <h3 className="font-black text-indigo-800 uppercase text-xs tracking-widest mb-4">Phân tích tỷ lệ hoàn trả</h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold text-slate-700">Đúng hạn</span>
                          <span className="font-black text-emerald-600">{returnStats.on_time_rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-emerald-600 h-3 rounded-full transition-all" 
                            style={{ width: `${returnStats.on_time_rate}%` }}
                          ></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="font-bold text-slate-700">Trả muộn</span>
                          <span className="font-black text-rose-600">{returnStats.overdue_rate.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-3">
                          <div 
                            className="bg-rose-600 h-3 rounded-full transition-all" 
                            style={{ width: `${returnStats.overdue_rate}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-slate-100 rounded-2xl p-6">
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Chi tiết số liệu</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Tổng phiếu mượn</span>
                          <span className="text-sm font-bold text-slate-800">{returnStats.total_borrows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Đã hoàn trả</span>
                          <span className="text-sm font-bold text-emerald-600">{returnStats.returned_borrows}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Đúng hạn</span>
                          <span className="text-sm font-bold text-blue-600">{returnStats.on_time_returns}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-slate-500">Quá hạn</span>
                          <span className="text-sm font-bold text-rose-600">{returnStats.overdue_returns}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-slate-100 rounded-2xl p-6">
                      <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest mb-4">Đánh giá</h4>
                      <div className="space-y-3">
                        {returnStats.on_time_rate >= 90 && (
                          <div className="flex items-center gap-2 text-emerald-600 text-sm">
                            <CheckCircle size={16} />
                            <span className="font-bold">Xuất sắc - Tỷ lệ đúng hạn rất cao</span>
                          </div>
                        )}
                        {returnStats.on_time_rate >= 70 && returnStats.on_time_rate < 90 && (
                          <div className="flex items-center gap-2 text-blue-600 text-sm">
                            <CheckCircle size={16} />
                            <span className="font-bold">Tốt - Có thể cải thiện thêm</span>
                          </div>
                        )}
                        {returnStats.on_time_rate < 70 && (
                          <div className="flex items-center gap-2 text-rose-600 text-sm">
                            <AlertTriangle size={16} />
                            <span className="font-bold">Cần cải thiện - Tỷ lệ đúng hạn thấp</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 flex justify-center">
                  <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LibrarianReports;
