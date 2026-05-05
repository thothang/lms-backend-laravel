import React, { useState, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, RefreshCw,
  BookOpen, Clock, CheckCircle, XCircle, X,
  Settings, Archive, RotateCcw, AlertTriangle,
  Save, Info
} from 'lucide-react';
import {
  useEbooks,
  useDeleteEbook,
  useRestoreEbook,
  useForceDeleteEbook,
  useUpdateEbookSettings
} from '../../hooks/queries';
import api from '../../services/api';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { motion } from 'framer-motion';
import DetailModal from '../../components/ui/DetailModal';
import AdminUploadEbook from './AdminUploadEbook';
import PendingEbooks from './PendingEbooks';
import EditEbookModal from './EditEbookModal';
import { Button } from '../../components/ui/Button';

const FILTER_CONFIG = {
  active: 'Hoạt động',
  all: 'Tất cả',
  pending: 'Chờ duyệt',
  rejected: 'Từ chối',
  trashed: 'Thùng rác'
};

const ManageAdminEbooks = () => {
  const [activeTab, setActiveTab] = useState('list');
  const [filterStatus, setFilterStatus] = useState('active');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEbook, setEditingEbook] = useState(null);

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [selectedEbook, setSelectedEbook] = useState(null);
  const [displayConfig, setDisplayConfig] = useState({
    is_hot: false,
    is_featured: false,
    in_carousel: false,
    carousel_order: 0
  });

  const [selectedEbookDetail, setSelectedEbookDetail] = useState(null);
  const [showEbookDetailModal, setShowEbookDetailModal] = useState(false);

  // React Query hooks
  const { data: ebooksData, isLoading, refetch } = useEbooks();
  const deleteMutation = useDeleteEbook();
  const restoreMutation = useRestoreEbook();
  const forceDeleteMutation = useForceDeleteEbook();
  const settingsMutation = useUpdateEbookSettings();

  // Flatten ebooks data
  const ebooks = Array.isArray(ebooksData) ? ebooksData : (ebooksData?.data || []);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const openSettings = (ebook) => {
    setSelectedEbook(ebook);
    const maxOrder = ebooks
      .filter(e => e.in_carousel)
      .reduce((max, e) => Math.max(max, e.carousel_order || 0), 0);
    setDisplayConfig({
      is_hot: ebook.is_hot || false,
      is_featured: ebook.is_featured || false,
      in_carousel: ebook.in_carousel || false,
      carousel_order: ebook.in_carousel ? (ebook.carousel_order || 1) : (maxOrder + 1)
    });
    setShowSettingsModal(true);
  };

  const saveSettings = async () => {
    try {
      await settingsMutation.mutateAsync({
        ebook_id: selectedEbook.id,
        ...displayConfig
      });
      showSuccess('Đã cập nhật cài đặt hiển thị Ebook!');
      setShowSettingsModal(false);
    } catch (err) {
      handleApiError(err, 'Lỗi cập nhật hiển thị.');
    }
  };

  const handleDeleteEbook = async (id) => {
    if (!window.confirm('Bạn có chắc muốn chuyển Ebook này vào thùng rác?')) return;
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      handleApiError(err, 'Không thể xóa Ebook.');
    }
  };

  const handleRestoreEbook = async (id) => {
    try {
      await restoreMutation.mutateAsync(id);
    } catch (err) {
      handleApiError(err, 'Không thể khôi phục Ebook.');
    }
  };

  const handleForceDeleteEbook = async (id) => {
    if (!window.confirm('CẢNH BÁO: Hành động này sẽ xóa vĩnh viễn Ebook và không thể khôi phục. Tiếp tục?')) return;
    try {
      await forceDeleteMutation.mutateAsync(id);
    } catch (err) {
      handleApiError(err, 'Không thể xóa vĩnh viễn Ebook.');
    }
  };

  // Filter ebooks based on status
  const filteredEbooks = useMemo(() => {
    let filtered = ebooks;

    // Filter by status
    if (filterStatus === 'active') {
      filtered = filtered.filter(e => !e.deleted_at && (e.status === 'approved' || !e.status));
    } else if (filterStatus === 'pending') {
      filtered = filtered.filter(e => e.status === 'pending');
    } else if (filterStatus === 'rejected') {
      filtered = filtered.filter(e => e.status === 'rejected');
    } else if (filterStatus === 'trashed') {
      filtered = filtered.filter(e => e.deleted_at);
    }
    // 'all' shows everything

    // Filter by search term
    if (debouncedSearchTerm) {
      filtered = filtered.filter(book =>
        book.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (book.uploaded_by_admin ? book.author_name : (book.author?.name || book.author_name))?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [ebooks, filterStatus, debouncedSearchTerm]);

  const isProcessing = deleteMutation.isPending || restoreMutation.isPending || forceDeleteMutation.isPending;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý Ebook</h1>
          <p className="text-slate-500 font-medium mt-1">Quản lý toàn diện Ebook, theo dõi trạng thái và thùng rác.</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'list'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Kho Ebook
          </button>
          <button
            onClick={() => setActiveTab('pending_workflow')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
              activeTab === 'pending_workflow'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Duyệt Ebook
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Plus size={16} /> Đăng Ebook Mới
          </button>
        </div>
      </div>

      {activeTab === 'upload' ? (
        <div className="-mt-4">
           <AdminUploadEbook isEmbedded={true} onSuccess={() => setActiveTab('list')} />
        </div>
      ) : activeTab === 'pending_workflow' ? (
        <div className="-mt-4">
           <PendingEbooks isEmbedded={true} />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          {/* Main Controls */}
          <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Tìm theo tên ebook hoặc tác giả..."
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar pb-1 xl:pb-0">
               {Object.entries(FILTER_CONFIG).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => { setFilterStatus(key); }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] uppercase font-black tracking-widest whitespace-nowrap transition-all border ${
                      filterStatus === key
                        ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                        : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'
                    }`}
                  >
                    {label}
                  </button>
               ))}
               <button onClick={() => refetch()} disabled={isLoading || isProcessing} className="p-2.5 bg-slate-50 text-slate-500 rounded-xl hover:bg-slate-100 border border-slate-100 ml-2 disabled:opacity-50" title="Tải lại">
                 <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
               </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tiêu đề Ebook</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tác giả</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Giá bán</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {isLoading ? (
                  [1,2,3,4].map(i => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-48"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-24"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-16 mx-auto"></div></td>
                      <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-10 ml-auto"></div></td>
                    </tr>
                  ))
                ) : filteredEbooks.map((book) => (
                  <tr
                    key={book.id}
                    className={`transition-colors group cursor-pointer ${filterStatus === 'trashed' ? 'bg-rose-50/20 hover:bg-rose-50/40' : 'hover:bg-slate-50'}`}
                    onClick={(e) => {
                      if (e.target.closest('button')) return;
                      setSelectedEbookDetail(book);
                      setShowEbookDetailModal(true);
                    }}
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-4">
                         {book.cover_image ? (
                           <img src={book.cover_image} alt={book.title} className={`w-12 h-16 object-cover rounded-lg shadow-sm ${filterStatus === 'trashed' ? 'grayscale opacity-70' : ''}`} />
                         ) : (
                           <div className="w-12 h-16 bg-slate-100 rounded-lg shadow-sm flex items-center justify-center text-slate-300">
                              <BookOpen size={20} />
                           </div>
                         )}
                         <div className="flex flex-col">
                            <span className={`font-bold uppercase text-xs tracking-tight ${filterStatus === 'trashed' ? 'text-slate-500 line-through' : 'text-slate-800 group-hover:text-indigo-600 transition-colors'}`}>{book.title}</span>
                            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded self-start mt-1 font-bold">{book.category?.name || 'Chưa phân loại'}</span>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-sm text-slate-600 font-medium">
                        {book.uploaded_by_admin ? (book.author_name || 'Đang cập nhật') : (book.author?.name || book.author_name || 'Đang cập nhật')}
                      </span>
                    </td>
                    <td className="px-6 py-6 text-center">
                       {book.is_free ? (
                         <span className="font-black text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs">Miễn phí</span>
                       ) : (
                         <span className="font-black text-slate-700 text-sm">{Number(book.price || 0).toLocaleString('vi-VN')} ₫</span>
                       )}
                    </td>
                    <td className="px-6 py-6 text-center">
                      <div className="flex justify-center">
                        {filterStatus === 'trashed' || book.deleted_at ? (
                          <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                            <Trash2 size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Đã xóa</span>
                          </div>
                        ) : book.status === 'approved' || !book.status ? (
                          <div className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                            <CheckCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Đã xuất bản</span>
                          </div>
                        ) : book.status === 'pending' ? (
                          <div className="flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                            <Clock size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Chờ duyệt</span>
                          </div>
                        ) : book.status === 'rejected' ? (
                          <div className="flex items-center gap-1.5 text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                            <XCircle size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">Từ chối</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5 text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                            <Info size={14} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{book.status}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-6 transition-all">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         {filterStatus === 'trashed' || book.deleted_at ? (
                            <>
                               <button onClick={() => handleRestoreEbook(book.id)} disabled={isProcessing} className="p-2.5 bg-white border border-indigo-100 rounded-xl text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm transition-all disabled:opacity-50" title="Khôi phục">
                                  <RotateCcw size={16}/>
                               </button>
                               <button onClick={() => handleForceDeleteEbook(book.id)} disabled={isProcessing} className="p-2.5 bg-white border border-rose-100 rounded-xl text-rose-600 hover:bg-rose-600 hover:text-white shadow-sm transition-all disabled:opacity-50" title="Xóa vĩnh viễn">
                                  <AlertTriangle size={16}/>
                               </button>
                            </>
                         ) : (
                            <>
                               <button onClick={() => openSettings(book)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 hover:text-amber-500 hover:border-amber-100 shadow-sm transition-all" title="Cài đặt hiển thị">
                                  <Settings size={16}/>
                               </button>
                               <button onClick={() => { setEditingEbook(book); setIsEditModalOpen(true); }} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 hover:text-indigo-600 hover:border-indigo-100 shadow-sm transition-all" title="Sửa">
                                  <Edit size={16}/>
                               </button>
                               <button onClick={() => handleDeleteEbook(book.id)} disabled={isProcessing} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-600 hover:text-rose-500 hover:border-rose-100 shadow-sm transition-all disabled:opacity-50" title="Cho vào thùng rác">
                                  <Trash2 size={16}/>
                               </button>
                            </>
                         )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!isLoading && filteredEbooks.length === 0 && (
              <div className="p-20 text-center flex flex-col items-center gap-4">
                 <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                    <BookOpen size={32} />
                 </div>
                 <p className="text-slate-500 font-medium">Không tìm thấy Ebook nào trong mục này.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL CÀI ĐẶT HIỂN THỊ EBOOK */}
      {showSettingsModal && selectedEbook && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
           <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden relative border border-slate-100">
             <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <div>
                   <h3 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2 mb-1">
                     <Settings size={20} className="text-indigo-600" /> Cài đặt Hiển thị
                   </h3>
                   <span className="text-xs font-bold text-slate-500 line-clamp-1">Ebook: {selectedEbook.title}</span>
                </div>
                <button onClick={() => setShowSettingsModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
             </div>

             <div className="p-6 space-y-4">
                <label className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={displayConfig.is_hot} onChange={(e) => setDisplayConfig({...displayConfig, is_hot: e.target.checked})} className="w-5 h-5 accent-rose-500" />
                  <div>
                     <div className="font-bold text-slate-700">Đánh dấu Hot</div>
                     <div className="text-[10px] text-slate-400 font-medium">Xuất hiện với badge Lửa Đỏ và thuộc top xu hướng.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                  <input type="checkbox" checked={displayConfig.is_featured} onChange={(e) => setDisplayConfig({...displayConfig, is_featured: e.target.checked})} className="w-5 h-5 accent-amber-500" />
                  <div>
                     <div className="font-bold text-slate-700">Đánh dấu Nổi Bật</div>
                     <div className="text-[10px] text-slate-400 font-medium">Đẩy sách lên khu vực Gợi ý Nổi Bật.</div>
                  </div>
                </label>

                <div className="p-4 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                   <label className="flex items-center gap-3 cursor-pointer mb-3">
                     <input type="checkbox" checked={displayConfig.in_carousel} onChange={(e) => setDisplayConfig({...displayConfig, in_carousel: e.target.checked})} className="w-5 h-5 accent-indigo-500" />
                     <div>
                        <div className="font-bold text-slate-700">Ghim vào Carousel</div>
                        <div className="text-[10px] text-slate-400 font-medium">Hiển thị slider ảnh bìa to nhất trang chủ — Thứ tự được gán tự động.</div>
                     </div>
                   </label>
                   {displayConfig.in_carousel && (
                     <div className="ml-8 mt-2 flex items-center gap-2">
                       <span className="text-[10px] text-slate-500 font-medium">Vị trí hiển thị:</span>
                       <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">#{displayConfig.carousel_order}</span>
                       <span className="text-[10px] text-slate-400">(tự động)</span>
                     </div>
                   )}
                </div>
             </div>

             <div className="p-4 border-t border-slate-50 flex justify-end gap-3 bg-slate-50/50">
                <button onClick={() => setShowSettingsModal(false)} className="px-6 py-2.5 font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">Hủy</button>
                <Button onClick={saveSettings} isLoading={settingsMutation.isPending} className="flex items-center gap-2 px-6">
                  <Save size={16}/> Lưu cài đặt
                </Button>
             </div>
           </div>
         </div>
      )}

      {/* MODAL SỬA EBOOK */}
      {editingEbook && (
        <EditEbookModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingEbook(null);
          }}
          ebook={editingEbook}
          onSuccess={() => refetch()}
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
    </motion.div>
  );
};

export default ManageAdminEbooks;
