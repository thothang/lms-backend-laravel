import React, { useState } from 'react';
import {
  Users, BookOpen, Clock, AlertCircle,
  ArrowRight, CheckCircle, Search, Calendar,
  ArrowUpRight, ArrowDownRight, UserPlus, BookMarked,
  FileText, MailCheck
} from 'lucide-react';
import { librarianService } from '../../services/librarianService';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { useAuth } from '../../context/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useBooks, useLibrarianReservations, useEbooks, useBorrows, useConfirmReservation, useContactMessageStats } from '../../hooks/queries';
import VirtualTable from '../../components/ui/VirtualTable';
import DetailModal from '../../components/ui/DetailModal';

const LibrarianDashboard = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isProcessingRes, setIsProcessingRes] = useState(null);
  const navigate = useNavigate();
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [selectedBorrow, setSelectedBorrow] = useState(null);

  const [showReservationModal, setShowReservationModal] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const rawPerms = user?.permissions;
  const hasPerm = (p) => {
    if (!rawPerms) return false;
    if (Array.isArray(rawPerms)) {
      return rawPerms.some(perm => perm === p || perm?.name === p);
    }
    return !!rawPerms[p];
  };

  // Use React Query hooks for data fetching
  const booksQuery = useBooks({ limit: 200 });
  const reservationsQuery = useLibrarianReservations({ status: 'pending', limit: 10 });
  const ebooksQuery = useEbooks({ status: 'pending', limit: 100 });
  const borrowsQuery = useBorrows({ limit: 10 });
  const activeBorrowsQuery = useBorrows({ status: 'active', limit: 200 });

  const contactsQuery = useContactMessageStats();

  const confirmReservationMutation = useConfirmReservation();

  const isLoading = booksQuery.isLoading || reservationsQuery.isLoading || ebooksQuery.isLoading;

  // Ensure data is always an array, handling both direct array and {data: array} response formats
  const allBooks = Array.isArray(booksQuery.data) ? booksQuery.data : (booksQuery.data?.data || []);
  const resList = Array.isArray(reservationsQuery.data) ? reservationsQuery.data : (reservationsQuery.data?.data || []);
  const ebookList = Array.isArray(ebooksQuery.data) ? ebooksQuery.data : (ebooksQuery.data?.data || []);
  const borList = Array.isArray(borrowsQuery.data) ? borrowsQuery.data : (borrowsQuery.data?.data || []);
  const activeBorList = Array.isArray(activeBorrowsQuery.data) ? activeBorrowsQuery.data : (activeBorrowsQuery.data?.data || []);
  const contactStats = contactsQuery.data || { pending_count: 0 };

  const overdues = activeBorList.filter(b => {
    // Check both 'overdue' status AND overdue by due_date
    const isOverdueByStatus = b.status === 'overdue';
    const isOverdueByDate = ['active', 'borrowed'].includes(b.status) && b.due_date && new Date(b.due_date) < new Date();
    return isOverdueByStatus || isOverdueByDate;
  });

  const stats = {
    activeBorrows: allBooks.reduce((acc, b) => acc + ((b.total_copies || 0) - (b.available_copies || 0)), 0),
    totalBooks: allBooks.length,
    pendingEbooks: ebookList.length,
    queueCount: resList.length,
    pendingContacts: contactStats.pending_count || 0,
    recentReservations: resList.slice(0, 5),
    recentBorrows: borList.slice(0, 10),
    overdueBorrows: overdues,
  };

  const handleConfirmReservation = async (id) => {
    setIsProcessingRes(id);
    confirmReservationMutation.mutate(id, {
      onSettled: () => {
        setIsProcessingRes(null);
      },
    });
  };

  const statCards = [
    { name: 'Đang mượn', value: stats.activeBorrows, icon: BookOpen, color: 'text-indigo-600', bg: 'bg-indigo-50', trend: 'Cuốn vật lý', up: true },
    { name: 'Sách trong kho', value: stats.totalBooks, icon: BookMarked, color: 'text-amber-600', bg: 'bg-amber-50', trend: 'Đầu sách', up: false },
    { name: 'Yêu cầu chờ mượn', value: stats.queueCount, icon: AlertCircle, color: 'text-rose-600', bg: 'bg-rose-50', trend: 'Đặt trước Online', up: true },
    { name: 'Ebook chờ duyệt', value: stats.pendingEbooks, icon: Clock, color: 'text-emerald-600', bg: 'bg-emerald-50', trend: 'Chờ xuất bản', up: true },
    { name: 'Thư liên hệ', value: stats.pendingContacts, icon: MailCheck, color: 'text-blue-600', bg: 'bg-blue-50', trend: 'Chưa trả lời', up: false, link: '/messages' },
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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Librarian Panel</h1>
          <p className="text-slate-500 font-medium mt-1">Không gian làm việc và quản lý vận hành dành cho thủ thư.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={card.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => card.link && navigate(card.link)}
            className={`bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow group ${card.link ? 'cursor-pointer' : ''}`}
          >
            <div className={`${card.bg} ${card.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
              <card.icon size={22} />
            </div>
            <div className="text-slate-400 text-xs font-black uppercase tracking-widest leading-none">{card.name}</div>
            <div className="text-3xl font-black text-slate-800 mt-2">{card.value}</div>
            <div className={`flex items-center gap-1 text-[10px] font-bold mt-2 ${card.up ? 'text-emerald-600' : 'text-slate-400'}`}>
              {card.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              <span>{card.trend}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Access Menu based on Permissions */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {hasPerm('can_approve_ebook') && (
          <button onClick={() => navigate('/librarian/ebooks')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><BookOpen size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Duyệt Ebook</span>
          </button>
        )}
        {hasPerm('can_manage_finance') && (
          <button onClick={() => navigate('/librarian/finance')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all group">
             <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><AlertCircle size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Tài chính</span>
          </button>
        )}
        {hasPerm('can_manage_users') && (
          <button onClick={() => navigate('/librarian/users')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
             <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><UserPlus size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Người dùng</span>
          </button>
        )}
        {hasPerm('can_manage_books') && (
          <button onClick={() => navigate('/librarian/books')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group">
             <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><BookMarked size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Kho sách</span>
          </button>
        )}
        {hasPerm('can_manage_borrow_offline') && (
          <button onClick={() => navigate('/librarian/offline')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all group">
             <div className="w-12 h-12 bg-violet-50 text-violet-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><Users size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Mượn/Trả quầy</span>
          </button>
        )}
        {hasPerm('can_manage_reservations') && (
          <button onClick={() => navigate('/librarian/reservations')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all group">
             <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><Clock size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Đặt trước</span>
          </button>
        )}
        {hasPerm('can_mark_lost_books') && (
          <button onClick={() => navigate('/librarian/lost-books')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-rose-200 hover:bg-rose-50/30 transition-all group">
             <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><AlertCircle size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Báo mất/hỏng</span>
          </button>
        )}
        {hasPerm('can_view_reports') && (
          <button onClick={() => navigate('/librarian/reports')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-teal-200 hover:bg-teal-50/30 transition-all group">
             <div className="w-12 h-12 bg-teal-50 text-teal-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><FileText size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Xem Báo cáo</span>
          </button>
        )}
        {hasPerm('can_manage_messages') && (
          <button onClick={() => navigate('/librarian/messages')} className="flex flex-col items-center justify-center gap-2 p-4 bg-white rounded-3xl border border-slate-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all group">
             <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex flex-col items-center justify-center group-hover:scale-110 transition-transform"><MailCheck size={20}/></div>
             <span className="text-xs font-bold text-slate-700">Tin nhắn</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Pending Queue */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
              <Clock size={16} className="text-rose-500" /> Hàng chờ sách hot (Đặt trước)
            </h3>
            <button onClick={() => navigate('/librarian/reservations')} className="text-indigo-600 font-bold text-xs hover:underline">Tất cả</button>
          </div>
          <div className="p-4">
            <VirtualTable
              data={stats.recentReservations}
              height={350}
              rowHeight={70}
              onRowClick={(res) => {
                setSelectedReservation(res);
                setShowReservationModal(true);
              }}
              columns={[
                {
                  header: 'Người đặt',
                  key: 'user',
                  flex: 2,
                  minWidth: 120,
                  render: (res) => (
                    <div>
                      <div className="font-bold text-slate-700 text-sm">{res.user?.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{res.user?.email}</div>
                    </div>
                  )
                },
                {
                  header: 'Sách yêu cầu',
                  key: 'book',
                  flex: 2,
                  minWidth: 150,
                  render: (res) => (
                    <div>
                      <div className="font-black text-indigo-600 text-xs tracking-tight line-clamp-1">{res.book?.title}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Ngày đặt: {new Date(res.created_at).toLocaleDateString('vi-VN')}</div>
                    </div>
                  )
                },
                {
                  header: 'Độ ưu tiên',
                  key: 'queue_position',
                  flex: 1,
                  minWidth: 80,
                  render: (res) => (
                    <div className="text-center">
                      <span className="bg-rose-50 text-rose-600 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">#{res.queue_position || '?'}</span>
                    </div>
                  )
                },
                {
                  header: 'Xác nhận',
                  key: 'action',
                  flex: 0.5,
                  minWidth: 60,
                  render: (res) => (
                    <div className="text-right">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleConfirmReservation(res.id); }}
                        disabled={isProcessingRes === res.id}
                        title="Xác nhận"
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white p-2 rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-90"
                      >
                        {isProcessingRes === res.id ? <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> : <CheckCircle size={16} />}
                      </button>
                    </div>
                  )
                },
              ]}
            />
          </div>
        </div>

        {/* Action Board */}
        <div className="space-y-6">
           <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-center flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border-4 border-emerald-50/50 shadow-inner">
                 <CheckCircle size={40} />
              </div>
              <h4 className="text-xl font-black text-slate-800 tracking-tight mb-2">Hôm nay ổn định</h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-6">Mọi hoạt động mượn trả diễn ra bình thường. Không có báo cáo sách mất/hỏng quá mức.</p>
              <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden mb-8">
                 <div className="w-3/4 h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"></div>
              </div>
              <button className="w-full py-4 bg-white border border-slate-100 text-slate-700 font-black rounded-2xl hover:bg-slate-50 transition-all text-xs uppercase tracking-widest">
                 Xem Nhật Ký Lỗi
              </button>
           </div>

           <div className={`rounded-3xl p-8 text-white shadow-xl relative overflow-hidden group ${stats.overdueBorrows.length > 0 ? 'bg-amber-500 shadow-amber-100' : 'bg-emerald-500 shadow-emerald-100'}`}>
              <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              <div className="bg-white/20 p-4 rounded-2xl mb-4 w-fit backdrop-blur-md">
                 <Clock size={24} className="text-white" />
              </div>
              <h4 className="text-lg font-black mb-1">
                {stats.overdueBorrows.length > 0 ? 'Cảnh báo Trả sách' : 'Không có nợ quá hạn'}
              </h4>
              <p className="text-white/90 text-xs mb-6">
                 {stats.overdueBorrows.length > 0 
                    ? `Có ${stats.overdueBorrows.length} phiếu mượn đã quá hạn trả. Cần liên lạc nhắc nhở người mượn.`
                    : 'Tất cả lượt mượn đều trong hạn hợp lệ.'}
              </p>
              
              {stats.overdueBorrows.length > 0 && (
                <div className="space-y-2 mb-6">
                  {stats.overdueBorrows.slice(0, 3).map(b => (
                    <div key={b.id} className="bg-white/20 px-3 py-2 rounded-xl text-[10px] font-bold line-clamp-1 backdrop-blur-sm border border-white/10 shadow-sm flex items-center justify-between">
                      <span className="truncate pr-2">{b.user?.name || b.guest_name || 'Khách'}</span>
                      <span className="shrink-0 text-white/80 bg-black/10 px-1.5 py-0.5 rounded text-[8px] uppercase">{new Date(b.due_date).toLocaleDateString('vi-VN')}</span>
                    </div>
                  ))}
                  {stats.overdueBorrows.length > 3 && (
                    <div className="text-[10px] text-center opacity-80 italic font-black mt-2">+ {stats.overdueBorrows.length - 3} phiếu mượn khác</div>
                  )}
                </div>
              )}

              <button 
                onClick={() => navigate('/librarian/offline')}
                className={`w-full py-3 bg-white font-black rounded-2xl hover:shadow-lg transition-all text-[10px] tracking-widest uppercase ${stats.overdueBorrows.length > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                 {stats.overdueBorrows.length > 0 ? 'Quản lý mượn trả' : 'Xem danh sách mượn'}
              </button>
           </div>
        </div>
      </div>

      {/* Borrowings Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col mt-8">
        <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
            <BookOpen size={16} className="text-indigo-600" /> Tất cả phiếu mượn sách gần đây
          </h3>
          <button onClick={() => navigate('/librarian/offline')} className="text-indigo-600 font-bold text-xs hover:underline">Quản lý mượn trả</button>
        </div>
        <div className="p-4">
          <VirtualTable
            data={stats.recentBorrows}
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
                    <div className="font-bold text-indigo-600 text-sm">{borrow.user?.name || borrow.guest_name || 'Vãng lai'}</div>
                    <div className="text-[10px] text-slate-400 truncate">{borrow.user?.email || borrow.guest_email || borrow.guest_phone || 'Người đăng ký OFFLINE'}</div>
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
                  // Determine actual status
                  const isOverdue = borrow.status === 'overdue' || 
                    (['active', 'borrowed'].includes(borrow.status) && borrow.due_date && new Date(borrow.due_date) < new Date());
                  
                  if (borrow.status === 'returned') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">Đã trả</span>;
                  } else if (borrow.status === 'cancelled') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">Đã hủy</span>;
                  } else if (borrow.status === 'lost') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">Mất sách</span>;
                  } else if (borrow.status === 'pending_pickup') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Chờ nhận</span>;
                  } else if (borrow.status === 'pending_return') {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-orange-600 bg-orange-50 px-2 py-1 rounded border border-orange-100">Chờ thanh toán</span>;
                  } else if (isOverdue) {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 bg-rose-50 px-2 py-1 rounded border border-rose-100">Quá hạn</span>;
                  } else if (['active', 'borrowed'].includes(borrow.status)) {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">Đang mượn</span>;
                  } else {
                    return <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">{borrow.status}</span>;
                  }
                }
              },
            ]}
          />
        </div>
      </div>

      {/* Detail Modals */}
      <DetailModal
        isOpen={showReservationModal}
        onClose={() => {
          setShowReservationModal(false);
          setSelectedReservation(null);
        }}
        data={selectedReservation}
        type="reservation"
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
    </div>
  );
};

export default LibrarianDashboard;
