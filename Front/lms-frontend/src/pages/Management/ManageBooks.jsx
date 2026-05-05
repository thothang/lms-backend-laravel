import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, Filter,
  BookOpen, Layers, PlusCircle, AlertTriangle,
  Star, Image as ImageIcon, Check, FileType, Save, Loader2, X
} from 'lucide-react';
import { handleApiError } from '../../utils/toastHelper';
import { motion } from 'framer-motion';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import DetailModal from '../../components/ui/DetailModal';
import { catalogService } from '../../services/catalogService';
import {
  useBooks,
  useCategories,
  useCreateBook,
  useUpdateBook,
  useDeleteBook,
  useAddCopy,
  useDeleteCopy,
  useUpdateBookSettings,
} from '../../hooks/queries';

const ManageBooks = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [listFilter, setListFilter] = useState('all');

  // React Query hooks
  const { data: categoriesData } = useCategories();
  const categories = categoriesData || [];

  const { data: booksData, isLoading } = useBooks({ limit: 1000 });
  const books = booksData?.data || booksData || [];

  // Mutations
  const createBookMutation = useCreateBook();
  const updateBookMutation = useUpdateBook();
  const deleteBookMutation = useDeleteBook();
  const addCopyMutation = useAddCopy();
  const deleteCopyMutation = useDeleteCopy();
  const updateBookSettingsMutation = useUpdateBookSettings();

  // Combined loading state for mutations
  const isSubmitting = createBookMutation.isPending || updateBookMutation.isPending || 
    addCopyMutation.isPending || deleteCopyMutation.isPending || updateBookSettingsMutation.isPending;

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [settingsBook, setSettingsBook] = useState(null);

  const [isCopiesModalOpen, setIsCopiesModalOpen] = useState(false);
  const [copiesBook, setCopiesBook] = useState(null);
  const [copiesData, setCopiesData] = useState([]);
  const [newCopiesAmount, setNewCopiesAmount] = useState(1);

  const [selectedBook, setSelectedBook] = useState(null);
  const [showBookDetailModal, setShowBookDetailModal] = useState(false);

  // Form Data
  const defaultForm = {
    title: '', author_name: '', publisher: '', category_id: '',
    description: '', price: '', daily_fee: '', copies: 1, cover_image: null
  };
  const [formData, setFormData] = useState(defaultForm);
  const [coverPreview, setCoverPreview] = useState(null);

  const defaultSettings = { is_hot: false, is_featured: false, in_carousel: false, carousel_order: 1 };
  const [settingsData, setSettingsData] = useState(defaultSettings);

  const filteredBooks = useMemo(() => {
    return books.filter(book =>
      book.title?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
      book.author_name?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    );
  }, [books, debouncedSearchTerm]);

  // --- CRUD BOOK ---
  const handleOpenForm = (book = null) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title || '',
        author_name: book.author_name || '',
        publisher: book.publisher || '',
        category_id: book.category?.id || book.category_id || '',
        description: book.description || '',
        price: book.price || '',
        daily_fee: book.daily_fee || '',
        copies: 1, // Only used for create
        cover_image: null
      });
      setCoverPreview(book.cover_image);
    } else {
      setEditingBook(null);
      setFormData(defaultForm);
      setCoverPreview(null);
    }
    setIsFormModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, cover_image: file }));
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const submitForm = async (e) => {
    e.preventDefault();
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'copies' && editingBook) return;
        if (formData[key] !== null && formData[key] !== '') {
          data.append(key, formData[key]);
        }
      });

      if (editingBook) {
        await updateBookMutation.mutateAsync({ id: editingBook.id, formData: data });
      } else {
        await createBookMutation.mutateAsync(data);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteBook = async (id) => {
    if (!window.confirm('Bạn có chắc muốn xóa đầu sách này? (Lưu ý: Không thể xóa khi sách đang được mượn)')) return;
    try {
      await deleteBookMutation.mutateAsync(id);
    } catch (err) {
      handleApiError(err, 'Lỗi xóa sách.');
    }
  };

  // --- SETTINGS (HOT/CAROUSEL) ---
  const handleOpenSettings = async (book) => {
    setSettingsBook(book);
    setIsSettingsModalOpen(true);
    // Tự động tính carousel_order = max hiện tại + 1 nếu sách chưa có trong carousel
    const maxOrder = books
      .filter(b => b.in_carousel)
      .reduce((max, b) => Math.max(max, b.carousel_order || 0), 0);
    setSettingsData({
      is_hot: book.is_hot || false,
      is_featured: book.is_featured || false,
      in_carousel: book.in_carousel || false,
      carousel_order: book.in_carousel ? (book.carousel_order || 1) : (maxOrder + 1)
    });
  };

  const submitSettings = async (e) => {
    e.preventDefault();
    try {
      await updateBookSettingsMutation.mutateAsync({
        book_id: settingsBook.id,
        ...settingsData
      });
      setIsSettingsModalOpen(false);
    } catch (err) {
      handleApiError(err);
    }
  };

  // --- COPIES MANAGEMENT ---
  const handleOpenCopies = async (book) => {
    setCopiesBook(book);
    setIsCopiesModalOpen(true);
    setNewCopiesAmount(1);
    fetchCopies(book.id);
  };

  const fetchCopies = async (id) => {
    try {
      const res = await catalogService.getBookDetails(id);
      setCopiesData(res.data?.copies || []);
    } catch (err) {
      handleApiError(err, 'Không thể tải bản sao');
    }
  };

  const handleAddCopies = async () => {
    if (newCopiesAmount < 1) return;
    try {
      await addCopyMutation.mutateAsync({ bookId: copiesBook.id, quantity: newCopiesAmount });
      fetchCopies(copiesBook.id);
      setNewCopiesAmount(1);
    } catch (err) {
      handleApiError(err);
    }
  };

  const handleDeleteCopy = async (copyId) => {
    if (!window.confirm('Giảm 1 bản sao này? (Chỉ xóa được nếu đang có sẵn)')) return;
    try {
      await deleteCopyMutation.mutateAsync(copyId);
      fetchCopies(copiesBook.id);
    } catch (err) {
      handleApiError(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Quản lý kho sách</h1>
          <p className="text-slate-500 font-medium mt-1">Kiểm kê, cập nhật và quản lý bản sao sách vật lý.</p>
        </div>
        <Button 
          className="rounded-2xl px-6 h-14 font-black shadow-xl shadow-indigo-100"
          onClick={() => handleOpenForm()}
        >
          <Plus size={20} className="mr-2" /> Thêm đầu sách mới
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tổng đầu sách</div>
            <div className="text-2xl font-black text-slate-800">{books.length}</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Layers size={24} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tổng bản sao</div>
            <div className="text-2xl font-black text-slate-800">
              {books.reduce((acc, b) => acc + (b.total_copies || 0), 0)}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 text-amber-600">
          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center shrink-0">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Đang mượn</div>
            <div className="text-2xl font-black text-slate-800">
              {books.reduce((acc, b) => acc + ((b.total_copies - (b.available_copies || 0)) || 0), 0)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b border-slate-50 flex flex-col xl:flex-row justify-between items-center gap-4">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text"
              placeholder="Tìm theo tên sách hoặc tác giả..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar">
             {[
               { key: 'all', label: 'Tất cả' },
               { key: 'hot', label: 'Sách Hot', icon: Star, color: 'text-amber-500' },
               { key: 'featured', label: 'Nổi bật', icon: Check, color: 'text-indigo-500' },
               { key: 'carousel', label: 'Ghim Carousel', icon: ImageIcon, color: 'text-blue-500' }
             ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setListFilter(filter.key)}
                  className={`px-4 py-2.5 rounded-xl text-[11px] uppercase font-black tracking-widest whitespace-nowrap transition-all border flex items-center gap-2 ${
                    listFilter === filter.key
                      ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                      : 'bg-white text-slate-500 hover:bg-slate-50 border-slate-100'
                  }`}
                >
                  {filter.icon && <filter.icon size={14} className={listFilter === filter.key ? 'text-white' : filter.color} />}
                  {filter.label}
                </button>
             ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sách</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Bản sao</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Sẵn có</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Phí mượn</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-12 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-12 mx-auto"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-100 rounded-full w-24 ml-auto"></div></td>
                  </tr>
                ))
              ) : filteredBooks.map((book) => (
                <tr 
                  key={book.id} 
                  className="hover:bg-slate-50 transition-colors group cursor-pointer"
                  onClick={(e) => {
                    // Prevent click if clicking on action buttons
                    if (e.target.closest('button')) return;
                    setSelectedBook(book);
                    setShowBookDetailModal(true);
                  }}
                >
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                       {book.cover_image ? (
                         <img src={book.cover_image} alt={book.title} className="w-12 h-16 object-cover rounded-lg shadow-sm" />
                       ) : (
                         <div className="w-12 h-16 bg-slate-100 rounded-lg shadow-sm flex items-center justify-center text-slate-400">
                           <BookOpen size={24} />
                         </div>
                       )}
                       <div className="flex flex-col">
                          <span className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors uppercase text-xs tracking-tight">{book.title}</span>
                          <span className="text-[10px] text-slate-400 font-medium italic mt-0.5">{book.author_name || 'Đang cập nhật'}</span>
                          <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded self-start mt-1 font-bold">{book.category?.name || 'Chưa phân loại'}</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="inline-flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 font-black text-slate-700 text-sm">
                       {book.total_copies || 0}
                       <button onClick={() => handleOpenCopies(book)} className="text-indigo-600 hover:scale-110 transition-transform p-1">
                         <PlusCircle size={16} />
                       </button>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <span className={`font-black text-sm ${book.available_copies > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {book.available_copies || 0}
                    </span>
                  </td>

                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                       <span className="font-black text-slate-700 text-sm">{Number(book.daily_fee || 0).toLocaleString('vi-VN')} ₫</span>
                       <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">/ ngày</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 transition-all">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => handleOpenSettings(book)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-amber-500 hover:bg-amber-50 shadow-sm transition-all" title="Cài đặt Hiển thị"><Star size={16}/></button>
                       <button onClick={() => handleOpenForm(book)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-indigo-600 hover:bg-indigo-50 shadow-sm transition-all" title="Sửa"><Edit size={16}/></button>
                       <button onClick={() => handleDeleteBook(book.id)} className="p-2.5 bg-white border border-slate-100 rounded-xl text-rose-500 hover:bg-rose-50 shadow-sm transition-all" title="Xóa"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!isLoading && filteredBooks.length === 0 && (
            <div className="p-20 text-center flex flex-col items-center gap-4">
               <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300">
                  <BookOpen size={32} />
               </div>
               <p className="text-slate-500 font-medium">Không tìm thấy kho sách nào.</p>
            </div>
          )}
        </div>
      </div>

      {/* BẢNG SÁCH ĐANG ĐƯỢC MƯỢN (RIÊNG) */}
      {!isLoading && (() => {
        const borrowedBooks = books.filter(b => (b.total_copies || 0) > (b.available_copies || 0));
        if (borrowedBooks.length === 0) return null;
        const totalBorrowed = borrowedBooks.reduce((sum, b) => sum + ((b.total_copies || 0) - (b.available_copies || 0)), 0);
        return (
          <div className="bg-white rounded-3xl border border-amber-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-amber-50 flex justify-between items-center">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2">
                <AlertTriangle size={16} className="text-amber-500" /> Sách đang được mượn
              </h3>
              <div className="text-[10px] font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                {totalBorrowed} bản sao đang được mượn
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-amber-50/30">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sách</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tổng bản sao</th>
                    <th className="px-6 py-4 text-[10px] font-black text-emerald-600 uppercase tracking-widest text-center">Sẵn có</th>
                    <th className="px-6 py-4 text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Đang mượn</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Phí mượn / ngày</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {borrowedBooks.map(book => {
                    const borrowed = (book.total_copies || 0) - (book.available_copies || 0);
                    return (
                      <tr 
                        key={book.id} 
                        className="hover:bg-amber-50/20 transition-colors cursor-pointer"
                        onClick={(e) => {
                          setSelectedBook(book);
                          setShowBookDetailModal(true);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {book.cover_image ? (
                              <img src={book.cover_image} alt={book.title} className="w-8 h-10 object-cover rounded shadow-sm" />
                            ) : (
                              <div className="w-8 h-10 bg-slate-100 rounded flex items-center justify-center text-slate-300">
                                <BookOpen size={14} />
                              </div>
                            )}
                            <div>
                              <div className="font-bold text-slate-700 text-xs uppercase tracking-tight">{book.title}</div>
                              <div className="text-[10px] text-slate-400 mt-0.5">{book.author_name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold text-slate-600 text-sm">{book.total_copies}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`font-black text-sm ${book.available_copies > 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {book.available_copies || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-black text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">
                            {borrowed}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="text-xs font-bold text-slate-700">{Number(book.daily_fee || 0).toLocaleString('vi-VN')} ₫</div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-widest">/ ngày</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* CREATE/EDIT BOOK MODAL */}
      <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={editingBook ? 'Cập nhật Sách' : 'Thêm Sách Thư Viện Mới'} maxWidth="max-w-2xl">
        <form onSubmit={submitForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên sách</label>
              <Input name="title" value={formData.title} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tên tác giả</label>
              <Input name="author_name" value={formData.author_name} onChange={handleFormChange} required />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Danh mục</label>
              <select 
                name="category_id" value={formData.category_id} onChange={handleFormChange} required
                className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 font-medium appearance-none"
              >
                <option value="">Chọn danh mục...</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nhà xuất bản</label>
              <Input name="publisher" value={formData.publisher} onChange={handleFormChange} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Giá bìa (VNĐ)</label>
              <Input type="number" name="price" value={formData.price} onChange={handleFormChange} required />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phí mượn / ngày</label>
              <Input type="number" name="daily_fee" value={formData.daily_fee} onChange={handleFormChange} />
            </div>
            {!editingBook && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng bản sao</label>
                <Input type="number" min="1" name="copies" value={formData.copies} onChange={handleFormChange} required />
              </div>
            )}
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả nội dung</label>
             <textarea name="description" rows="3" value={formData.description} onChange={handleFormChange} className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 resize-none" />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-700 mb-2">Ảnh bìa</label>
             <div className="flex gap-4 items-center">
                {coverPreview ? (
                  <img src={coverPreview} alt="Preview" className="w-16 h-20 object-cover rounded-xl shadow-sm" />
                ) : (
                  <div className="w-16 h-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300">
                     <ImageIcon size={20} />
                  </div>
                )}
                <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs cursor-pointer transition-colors">
                   Chọn tệp ảnh bìa
                   <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                </label>
             </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
            <Button variant="outline" onClick={() => setIsFormModalOpen(false)} type="button">Hủy</Button>
            <Button type="submit" isLoading={isSubmitting}>Lưu thông tin</Button>
          </div>
        </form>
      </Modal>

      {/* COPIES MODAL */}
      <Modal isOpen={isCopiesModalOpen} onClose={() => setIsCopiesModalOpen(false)} title={`Quản lý Bản Sao: ${copiesBook?.title}`} maxWidth="max-w-md">
         <div className="space-y-6">
            {/* Add New */}
            <div className="bg-indigo-50 p-4 rounded-2xl flex items-end gap-3">
               <div className="flex-1">
                 <label className="block text-xs font-black text-indigo-700 uppercase tracking-widest mb-1">Nhập thêm</label>
                 <Input type="number" min="1" value={newCopiesAmount} onChange={e => setNewCopiesAmount(Number(e.target.value))} className="bg-white" />
               </div>
               <Button onClick={handleAddCopies} isLoading={isSubmitting} className="h-11">
                 <Plus size={16} /> Nhập sách
               </Button>
            </div>

            {/* List existing */}
            <div>
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Danh sách mã vạch hiện có</h4>
               <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                 {copiesData.length === 0 ? (
                    <p className="text-slate-500 text-sm italic">Đang tải biểu mẫu hoặc chưa có bản sao...</p>
                 ) : copiesData.map(copy => (
                    <div key={copy.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl hover:bg-slate-50">
                       <div className="flex items-center gap-3">
                          <FileType size={16} className="text-slate-400" />
                          <span className="font-bold text-sm text-slate-700">{copy.barcode}</span>
                       </div>
                       <div className="flex gap-3 items-center">
                          {copy.status === 'available' ? (
                             <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold uppercase px-2 py-1 rounded">Sẵn sàng</span>
                          ) : (
                             <span className="text-[10px] bg-amber-50 text-amber-600 font-bold uppercase px-2 py-1 rounded">Đang mượn</span>
                          )}
                          {copy.status === 'available' && (
                             <button onClick={() => handleDeleteCopy(copy.id)} className="text-rose-400 hover:text-rose-600">
                               <Trash2 size={14} />
                             </button>
                          )}
                       </div>
                    </div>
                 ))}
               </div>
            </div>
         </div>
      </Modal>

      {/* SETTINGS MODAL */}
      <Modal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} title={`Cài đặt Hiển thị: ${settingsBook?.title}`}>
         <form onSubmit={submitSettings} className="space-y-6">
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settingsData.is_hot ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                     <Star size={16} className={settingsData.is_hot ? 'fill-current' : ''} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Đánh dấu "Sách Hot"</div>
                    <div className="text-[10px] text-slate-500">Hiển thị trong danh sách Sách Hot</div>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  checked={settingsData.is_hot} onChange={e => setSettingsData(p => ({...p, is_hot: e.target.checked}))} 
                />
              </label>

              <label className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settingsData.is_featured ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                     <Check size={16} />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-slate-800">Sách Nổi Bật</div>
                    <div className="text-[10px] text-slate-500">Khu vực đề xuất trung tâm</div>
                  </div>
                </div>
                <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                  checked={settingsData.is_featured} onChange={e => setSettingsData(p => ({...p, is_featured: e.target.checked}))} 
                />
              </label>

              <div className="p-4 border border-slate-100 rounded-2xl space-y-4 bg-slate-50/50">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${settingsData.in_carousel ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                       <BookOpen size={16} />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-800">Đưa lên Bảng chuyền (Carousel)</div>
                      <div className="text-[10px] text-slate-500">Banner lớn ở trang chủ — Thứ tự được gán tự động</div>
                    </div>
                  </div>
                  <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    checked={settingsData.in_carousel} onChange={e => setSettingsData(p => ({...p, in_carousel: e.target.checked}))} 
                  />
                </label>
                {settingsData.in_carousel && (
                  <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-medium">Vị trí hiển thị:</span>
                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded">#{settingsData.carousel_order}</span>
                    <span className="text-[10px] text-slate-400">(tự động)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-50">
              <Button variant="outline" onClick={() => setIsSettingsModalOpen(false)} type="button">Đóng</Button>
              <Button type="submit" isLoading={isSubmitting}>Lưu cấu hình</Button>
            </div>
         </form>
      </Modal>

      {/* Book Detail Modal */}
      <DetailModal
        isOpen={showBookDetailModal}
        onClose={() => {
          setShowBookDetailModal(false);
          setSelectedBook(null);
        }}
        data={selectedBook}
        type="ebook"
      />

    </div>
  );
};

export default ManageBooks;
