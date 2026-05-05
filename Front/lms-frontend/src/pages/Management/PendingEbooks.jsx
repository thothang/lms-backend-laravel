import React, { useState, useMemo } from 'react';
import {
  BookOpen, CheckCircle, XCircle, Clock,
  Search, RefreshCw, AlertCircle,
  User, Calendar, DollarSign
} from 'lucide-react';
import { usePendingEbooks, useApproveEbook, useRejectEbook } from '../../hooks/queries';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { motion, AnimatePresence } from 'framer-motion';
import DetailModal from '../../components/ui/DetailModal';

const PendingEbooks = ({ isEmbedded = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [showEbookModal, setShowEbookModal] = useState(false);

  // React Query - use proper hooks
  const { data: ebooks = [], isLoading, refetch } = usePendingEbooks();
  const approveMutation = useApproveEbook();
  const rejectMutation = useRejectEbook();

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Manual refresh function
  const handleRefresh = () => {
    refetch();
  };

  const handleApprove = async (id) => {
    if (!window.confirm('Bạn có chắc muốn duyệt ebook này?')) return;

    try {
      await approveMutation.mutateAsync(id);
      // Mutation will automatically invalidate queries and trigger refetch
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) {
      handleApiError(null, 'Vui lòng nhập lý do từ chối.');
      return;
    }

    try {
      await rejectMutation.mutateAsync({ id, reason: rejectReason });
      showSuccess('Đã từ chối ebook.');
      setRejectingId(null);
      setRejectReason('');
      // Mutation will automatically invalidate queries and trigger refetch
    } catch (err) {
      handleApiError(err);
    }
  };

  const filteredEbooks = useMemo(() => {
    return ebooks.filter(e =>
      e.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      e.author?.name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [ebooks, debouncedSearchTerm]);

  const isProcessing = approveMutation.isPending || rejectMutation.isPending;

  return (
    <div className="space-y-8">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Duyệt Ebook</h1>
            <p className="text-slate-500 font-medium mt-1">Kiểm duyệt nội dung ebook từ tác giả trước khi xuất bản.</p>
          </div>
          <div className="flex gap-3">
            <div className="bg-amber-50 px-6 py-3 rounded-2xl border border-amber-100 shadow-sm flex items-center gap-3">
              <Clock size={20} className="text-amber-600" />
              <span className="font-black text-amber-700">{filteredEbooks.length} <span className="text-amber-500 font-bold ml-1 text-xs uppercase">chờ duyệt</span></span>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isLoading || isProcessing}
              className="bg-white border border-slate-100 hover:bg-slate-50 text-slate-700 font-bold py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} /> Làm mới
            </button>
          </div>
        </div>
      )}

      {isEmbedded && (
        <div className="flex justify-between items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mt-0 -mb-4">
          <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2">
            <Clock size={16} className="text-amber-600" />
            <span className="font-black text-amber-700 text-sm">{filteredEbooks.length} <span className="text-amber-500">phê duyệt</span></span>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isLoading || isProcessing}
            className="text-slate-500 hover:text-indigo-600 font-bold text-sm transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Làm mới
          </button>
        </div>
      )}

      {/* Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề ebook hoặc tên tác giả..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredEbooks.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-20 text-center">
          <CheckCircle size={48} className="text-emerald-200 mx-auto mb-4" />
          <p className="text-slate-500 font-bold">Không có ebook nào đang chờ duyệt.</p>
          <p className="text-slate-400 text-sm mt-1">Tất cả nội dung đã được kiểm duyệt.</p>
        </div>
      ) : (
        /* Ebook Cards */
        <div className="space-y-6">
          {filteredEbooks.map((ebook, idx) => (
            <motion.div
              key={ebook.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={(e) => {
                if (e.target.closest('button')) return;
                setSelectedEbook(ebook);
                setShowEbookModal(true);
              }}
            >
              <div className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Ebook Info */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className="w-14 h-14 bg-gradient-to-tr from-indigo-100 to-violet-100 rounded-2xl flex items-center justify-center shrink-0 shadow-sm border border-white">
                      <BookOpen size={24} className="text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-black text-slate-800 tracking-tight text-lg truncate">{ebook.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <User size={14} className="text-indigo-400" />
                          {ebook.author?.name || ebook.author_name || 'Tác giả không xác định'}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <Calendar size={14} className="text-slate-400" />
                          {new Date(ebook.created_at).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold">
                          <DollarSign size={14} className="text-emerald-400" />
                          {ebook.is_free ? (
                            <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Miễn phí</span>
                          ) : (
                            <span className="text-slate-700">{Number(ebook.price).toLocaleString('vi-VN')} ₫</span>
                          )}
                        </span>
                      </div>
                      {ebook.author?.email && (
                        <div className="text-[11px] text-slate-400 mt-1 font-medium">{ebook.author.email}</div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleApprove(ebook.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing && approveMutation.variables === ebook.id ? (
                        <RefreshCw size={18} className="animate-spin" />
                      ) : (
                        <CheckCircle size={18} />
                      )}
                      Duyệt
                    </button>
                    <button
                      onClick={() => setRejectingId(rejectingId === ebook.id ? null : ebook.id)}
                      disabled={isProcessing}
                      className="flex items-center gap-2 py-3 px-6 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold rounded-2xl transition-all active:scale-95 disabled:opacity-50"
                    >
                      <XCircle size={18} /> Từ chối
                    </button>
                  </div>
                </div>
              </div>

              {/* Reject Reason Panel */}
              <AnimatePresence>
                {rejectingId === ebook.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-50 bg-rose-50/30"
                  >
                    <div className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={16} className="text-rose-500" />
                        <span className="text-sm font-black text-rose-700 uppercase tracking-widest text-[10px]">Lý do từ chối</span>
                      </div>
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Nhập lý do từ chối (bắt buộc, tối đa 500 ký tự)..."
                        maxLength={500}
                        rows={3}
                        className="w-full p-4 bg-white border border-rose-100 rounded-2xl text-sm focus:ring-2 focus:ring-rose-500/20 transition-all font-medium resize-none"
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-slate-400 font-medium">{rejectReason.length}/500 ký tự</span>
                        <div className="flex gap-3">
                          <button
                            onClick={() => { setRejectingId(null); setRejectReason(''); }}
                            className="py-2.5 px-6 text-sm font-bold text-slate-500 hover:bg-white rounded-xl transition-all"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={() => handleReject(ebook.id)}
                            disabled={!rejectReason.trim() || isProcessing}
                            className="py-2.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-rose-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isProcessing ? 'Đang xử lý...' : 'Xác nhận từ chối'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ebook Detail Modal */}
      <DetailModal
        isOpen={showEbookModal}
        onClose={() => {
          setShowEbookModal(false);
          setSelectedEbook(null);
        }}
        data={selectedEbook}
        type="ebook"
      />
    </div>
  );
};

export default PendingEbooks;
