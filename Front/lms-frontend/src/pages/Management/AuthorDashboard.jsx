import React, { useState } from 'react';
import {
  BookOpen, FileText, Wallet, TrendingUp,
  ArrowUpRight, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import VirtualTable from '../../components/ui/VirtualTable';
import DetailModal from '../../components/ui/DetailModal';
import {
  useAuthorEarnings,
  useAuthorEbooks,
  useAuthorWithdrawHistory,
  useAuthorSalesHistory,
} from '../../hooks/queries';

const AuthorDashboard = () => {
  const navigate = useNavigate();
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [selectedSale, setSelectedSale] = useState(null);
  const [showEbookModal, setShowEbookModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);

  // Use React Query hooks for data fetching
  const { data: ebooksData, isLoading: ebooksLoading } = useAuthorEbooks();
  const { data: earningsData, isLoading: earningsLoading } = useAuthorEarnings();
  const { data: salesData, isLoading: salesLoading } = useAuthorSalesHistory();

  const ebookList = ebooksData?.data || ebooksData || [];
  const balance = earningsData?.balance || 0;

  const stats = {
    totalEbooks: ebookList.length,
    activeEbooks: ebookList.filter(e => e.status === 'approved').length,
    totalSales: ebookList.reduce((acc, curr) => acc + (curr.purchase_count || 0), 0),
    balance: balance,
    recentActivity: ebookList.slice(0, 5),
    salesHistory: salesData?.data || salesData || [],
  };

  const isLoading = ebooksLoading || earningsLoading || salesLoading;

  const statCards = [
    { name: 'Tổng số Ebook', value: stats.totalEbooks, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { name: 'Ebook đã duyệt', value: stats.activeEbooks, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { name: 'Tổng lượt bán', value: stats.totalSales, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
    { name: 'Số dư hiện tại', value: `${stats.balance?.toLocaleString('vi-VN')} ₫`, icon: Wallet, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Author Workspace</h1>
          <p className="text-slate-500 font-medium mt-1">Chào mừng bạn trở lại, hệ thống đã sẵn sàng cho nội dung mới.</p>
        </div>
        <div className="hidden md:block">
           <button 
             onClick={() => navigate('/author/upload')}
             className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-2xl shadow-xl shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
           >
             <FileText size={18} /> Đăng Ebook mới
           </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
              <card.icon size={24} />
            </div>
            <div className="text-slate-400 text-xs font-bold uppercase tracking-widest">{card.name}</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{card.value}</div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-600 font-bold mt-2">
              <ArrowUpRight size={12} />
              <span>+12% so với tháng trước</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Ebook Gần Đây</h3>
            <button className="text-indigo-600 font-bold text-xs hover:underline">Xem tất cả</button>
          </div>
          <div className="p-4">
            <VirtualTable
              data={stats.recentActivity}
              height={350}
              rowHeight={60}
              onRowClick={(ebook) => {
                setSelectedEbook(ebook);
                setShowEbookModal(true);
              }}
              columns={[
                {
                  header: 'Tên Ebook',
                  key: 'title',
                  flex: 2,
                  minWidth: 150,
                  render: (ebook) => (
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{ebook.title}</div>
                      <div className="text-[10px] text-slate-400 italic">{ebook.category?.name || 'Văn học'}</div>
                    </div>
                  )
                },
                {
                  header: 'Trạng thái',
                  key: 'status',
                  flex: 1,
                  minWidth: 80,
                  render: (ebook) => (
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                      ebook.status === 'approved'
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-amber-50 text-amber-600'
                    }`}>
                      {ebook.status === 'approved' ? 'Công khai' : 'Đang duyệt'}
                    </span>
                  )
                },
                {
                  header: 'Lượt bán',
                  key: 'purchase_count',
                  flex: 0.5,
                  minWidth: 60,
                  render: (ebook) => <div className="font-bold text-slate-600 text-sm">{ebook.purchase_count || 0}</div>
                },
                {
                  header: 'Giá',
                  key: 'price',
                  flex: 1,
                  minWidth: 80,
                  render: (ebook) => (
                    <div className="font-black text-slate-800 text-sm">
                      {ebook.is_free ? 'Free' : `${Number(ebook.price).toLocaleString('vi-VN')} ₫`}
                    </div>
                  )
                },
              ]}
            />
          </div>
        </div>

        {/* Quick Actions & Tips */}
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
             <div className="bg-white/20 p-4 rounded-2xl mb-6 backdrop-blur-md">
               <ArrowUpRight size={32} className="text-white" />
             </div>
             <h4 className="text-xl font-black mb-2 tracking-tight">Tăng doanh số bán?</h4>
             <p className="text-indigo-100 text-sm leading-relaxed mb-6">
               Hãy bổ sung đầy đủ mô tả và hình ảnh bìa chất lượng cao để ebook của bạn thu hút hơn.
             </p>
             <button className="bg-white text-indigo-600 font-black py-3 px-8 rounded-2xl shadow-lg hover:scale-105 transition-transform active:scale-95">
               Xem hướng dẫn
             </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-sm">
             <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4">
               <AlertCircle size={14} className="text-amber-500" /> Cần lưu ý
             </h4>
             <ul className="space-y-4">
               <li className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-normal">Bạn có 1 yêu cầu rút tiền đang chờ xử lý.</p>
               </li>
               <li className="flex gap-4 items-start">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                  <p className="text-xs text-slate-600 leading-normal">Ebook mới tải lên đang được thủ thư kiểm duyệt nội dung.</p>
               </li>
             </ul>
          </div>
        </div>
      </div>

      {/* Sales History Section */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col mt-8">
        <div className="p-6 border-b border-slate-50">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Lịch Sử Ebook Đã Bán</h3>
        </div>
        
        {stats.salesHistory && stats.salesHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tên Ebook</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Người mua</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Số tiền nhận được</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {stats.salesHistory.map((sale, idx) => (
                  <tr 
                    key={sale.id || idx} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => {
                      setSelectedSale(sale);
                      setShowSaleModal(true);
                    }}
                  >
                    <td className="px-6 py-4 text-xs font-bold text-slate-500">
                      {new Date(sale.purchase_date || sale.created_at || sale.purchased_at || Date.now()).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{sale.ebook_title || sale.ebook?.title || sale.title || `Giao dịch #${sale.id}`}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-sm text-slate-600">{sale.buyer_name || sale.user?.name || 'Người dùng ẩn danh'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-emerald-600 font-black tracking-tight flex items-center gap-1.5">
                        <TrendingUp size={14} /> +{(sale.author_earnings || sale.amount || sale.price || 0).toLocaleString('vi-VN')} ₫
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <TrendingUp size={48} className="text-slate-200 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Chưa có giao dịch bán Ebook nào</p>
            <p className="text-slate-400 text-sm mt-1">Các giao dịch mua ebook của bạn sẽ hiển thị đầy đủ tại đây.</p>
          </div>
        )}
      </div>

      {/* Detail Modals */}
      <DetailModal
        isOpen={showEbookModal}
        onClose={() => {
          setShowEbookModal(false);
          setSelectedEbook(null);
        }}
        data={selectedEbook}
        type="ebook"
      />
      <DetailModal
        isOpen={showSaleModal}
        onClose={() => {
          setShowSaleModal(false);
          setSelectedSale(null);
        }}
        data={selectedSale}
        type="transaction"
      />
    </div>
  );
};

export default AuthorDashboard;
