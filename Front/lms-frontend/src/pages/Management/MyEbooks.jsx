import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Eye, Trash2, Search, Filter,
  MoreVertical, CheckCircle, Clock, AlertCircle,
  FileText, Download, ExternalLink
} from 'lucide-react';
import { authorService } from '../../services/authorService';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { getImageUrl } from '../../utils/imageHelper';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import EditEbookModal from './EditEbookModal';
import DetailModal from '../../components/ui/DetailModal';

const MyEbooks = () => {
  const [ebooks, setEbooks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [selectedEbookDetail, setSelectedEbookDetail] = useState(null);
  const [showEbookDetailModal, setShowEbookDetailModal] = useState(false);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchEbooks();
  }, []);

  const fetchEbooks = async () => {
    setIsLoading(true);
    try {
      const res = await authorService.getEbooks();
      setEbooks(res.data || res || []);
    } catch (err) {
      handleApiError(err, 'Không thể tải danh sách Ebook.');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEbooks = useMemo(() => {
    return ebooks.filter(item => {
      const matchesSearch = item.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [ebooks, debouncedSearchTerm, filterStatus]);

  const handleDeleteEbook = async (id) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa Ebook này không? Tác vụ này không thể hoàn tác.")) return;
    try {
      await authorService.deleteEbook(id);
      showSuccess("Đã xóa Ebook thành công.");
      fetchEbooks();
    } catch (err) {
      handleApiError(err, "Không thể xóa Ebook.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-tighter shadow-sm"><CheckCircle size={12}/> Đã Duyệt</span>;
      case 'pending':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-tighter shadow-sm"><Clock size={12}/> Chờ Duyệt</span>;
      case 'rejected':
        return <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-tighter shadow-sm"><AlertCircle size={12}/> Bị Từ Chối</span>;
      default:
        return <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-600 text-[10px] font-black uppercase tracking-tighter shadow-sm">{status}</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Sách của tôi</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý và theo dõi hiệu quả các nội dung số của bạn.</p>
        </div>
        <Link 
          to="/author/upload"
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-xl shadow-indigo-100 transition-all active:scale-95"
        >
          <Plus size={20} /> Đăng Ebook mới
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Tìm kiếm theo tiêu đề..."
            className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['all', 'approved', 'pending', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === status 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' 
                  : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-100'
              }`}
            >
              {status === 'all' ? 'Tất cả' : status === 'approved' ? 'Đã duyệt' : status === 'pending' ? 'Đang chờ' : 'Từ chối'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-4">
               <div className="aspect-[3/4] bg-slate-100 rounded-2xl w-full" />
               <div className="h-4 bg-slate-100 rounded-full w-2/3" />
               <div className="h-4 bg-slate-100 rounded-full w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredEbooks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence>
            {filteredEbooks.map((ebook, idx) => (
              <motion.div
                key={ebook.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white group rounded-3xl p-4 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col relative cursor-pointer"
                onClick={(e) => {
                  if (e.target.closest('button') || e.target.closest('a')) return;
                  setSelectedEbookDetail(ebook);
                  setShowEbookDetailModal(true);
                }}
              >
                {/* Status Float */}
                <div className="absolute top-6 left-6 z-10 pointer-events-none">
                  {getStatusBadge(ebook.status)}
                </div>

                {/* Cover Image */}
                <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-100 mb-4 shadow-inner relative">
                  <img 
                    src={ebook.cover_image ? getImageUrl(ebook.cover_image) : 'https://placehold.co/300x400/indigo/white?text=Ebook'} 
                    alt={ebook.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => { e.target.src = 'https://placehold.co/300x400/indigo/white?text=Ebook' }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                     <button 
                       onClick={() => { setSelectedEbook(ebook); setIsEditModalOpen(true); }}
                       className="bg-white text-indigo-600 p-3 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all"
                       title="Chỉnh sửa"
                     >
                       <Edit size={20}/>
                     </button>
                     <Link 
                       to={`/ebook/${ebook.id}/read`}
                       className="bg-white text-indigo-600 p-3 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-all flex"
                       title="Đọc thử / Xem nội dung"
                     >
                        <Eye size={20}/>
                     </Link>
                  </div>
                </div>

                {/* Info */}
                <div className="space-y-1 mb-4 flex-1">
                  <h3 className="font-bold text-slate-800 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase text-sm tracking-tight">{ebook.title}</h3>
                  <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                     <span>{ebook.category?.name || 'Chưa phân loại'}</span>
                     <span className="text-slate-500 italic">Tác giả: {ebook.author?.name || ebook.author_name || 'Tôi'}</span>
                  </div>
                  <div className="flex items-center justify-end text-[11px] font-bold text-indigo-500 mt-1">
                     <span>{ebook.purchase_count || 0} lượt tải</span>
                  </div>
                </div>

                {/* Footer */}
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center mt-auto">
                   <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">Giá bán</span>
                      <span className="font-black text-slate-800 text-md">
                        {ebook.is_free ? 'MIỄN PHÍ' : `${Number(ebook.price).toLocaleString('vi-VN')} ₫`}
                      </span>
                   </div>
                   <div className="flex gap-1">
                      <button 
                        onClick={() => handleDeleteEbook(ebook.id)}
                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                        title="Xóa Ebook"
                      >
                         <Trash2 size={18}/>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"><MoreVertical size={18}/></button>
                   </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-20 border border-slate-100 border-dashed text-center space-y-6">
           <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <FileText size={40} />
           </div>
           <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800">Chưa có tập tin Ebook nào</h3>
              <p className="text-slate-500 max-w-sm mx-auto">Hãy bắt đầu chia sẻ kiến thức của bạn bằng cách đăng tải Ebook đầu tiên lên hệ thống.</p>
           </div>
           <Link to="/author/upload" className="inline-flex items-center gap-2 text-indigo-600 font-black hover:underline group">
              Tải lên ngay <Plus size={18} className="group-hover:translate-x-1 transition-transform" />
           </Link>
        </div>
      )}

      {selectedEbook && (
        <EditEbookModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedEbook(null);
          }}
          ebook={selectedEbook}
          onUpdateSuccess={fetchEbooks}
        />
      )}

      {/* Ebook Detail Modal */}
      <DetailModal
        isOpen={showEbookDetailModal}
        onClose={() => {
          setShowEbookDetailModal(false);
          setSelectedEbookDetail(null);
        }}
        data={selectedEbookDetail}
        type="ebook"
      />

    </div>
  );
};

export default MyEbooks;
