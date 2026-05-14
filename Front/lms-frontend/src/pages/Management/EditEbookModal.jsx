import React, { useState, useEffect } from 'react';
import { Upload, X, Save, Image as ImageIcon, Loader2, FileText, AlertTriangle, Eye } from 'lucide-react';
import Modal from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useCategories, useUpdateAuthorEbook, useLibrarianUpdateEbook } from '../../hooks/queries';
import { handleApiError, showSuccess } from '../../utils/toastHelper';

/**
 * EditEbookModal - Dùng cho cả Author và Admin/Librarian
 * 
 * Props:
 * - isOpen: boolean
 * - onClose: function
 * - ebook: object (ebook data)
 * - onUpdateSuccess: function (callback sau khi cập nhật thành công)
 * - isAdmin: boolean (true = dùng API librarian, false = dùng API author)
 */
const EditEbookModal = ({ isOpen, onClose, ebook, onSuccess, isAdmin = false }) => {
  const [formData, setFormData] = useState({
    title: '',
    author_name: '',
    category_id: '',
    description: '',
    price: '',
    is_free: false,
    free_preview_pages: 0,
    cover_image: null,
    file: null,
  });
  
  const [previewCover, setPreviewCover] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState(null);
  const { data: categories = [] } = useCategories();
  
  const authorUpdateMutation = useUpdateAuthorEbook();
  const librarianUpdateMutation = useLibrarianUpdateEbook();
  
  const isSubmitting = authorUpdateMutation.isPending || librarianUpdateMutation.isPending;

  // Populate form when ebook changes
  useEffect(() => {
    if (ebook && isOpen) {
      setFormData({
        title: ebook.title || '',
        author_name: ebook.author_name || ebook.author?.name || '',
        category_id: ebook.category?.id || ebook.category_id || '',
        description: ebook.description || '',
        price: ebook.price || '',
        is_free: ebook.is_free || false,
        free_preview_pages: ebook.free_preview_pages ?? 0,
        cover_image: null,
        file: null,
      });
      setPreviewCover(ebook.cover_image || null);
      setSelectedFileName(null);
    }
  }, [ebook, isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleCoverChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, cover_image: file }));
      setPreviewCover(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
      setSelectedFileName(file.name);
    }
  };

  const removeSelectedFile = () => {
    setFormData(prev => ({ ...prev, file: null }));
    setSelectedFileName(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ebook) return;

    const data = new FormData();
    
    // Title
    if (formData.title && formData.title !== ebook.title) {
      data.append('title', formData.title);
    }

    // Author name (admin/librarian only)
    if (isAdmin) {
      const oldAuthorName = ebook.author_name || ebook.author?.name || '';
      if (formData.author_name && formData.author_name !== oldAuthorName) {
        data.append('author_name', formData.author_name);
      }
    }

    // Category
    if (String(formData.category_id) !== String(ebook.category?.id || ebook.category_id)) {
      data.append('category_id', formData.category_id);
    }

    // Description
    if (formData.description !== (ebook.description || '')) {
      data.append('description', formData.description || '');
    }

    // Price & is_free
    const isFree = formData.is_free ? 1 : 0;
    data.append('is_free', isFree);
    data.append('price', formData.is_free ? 0 : formData.price);

    // Free preview pages
    if (Number(formData.free_preview_pages) !== Number(ebook.free_preview_pages ?? 0)) {
      data.append('free_preview_pages', formData.free_preview_pages);
    }
    
    // Cover image
    if (formData.cover_image) {
      data.append('cover_image', formData.cover_image);
    }

    // PDF file
    if (formData.file) {
      data.append('file', formData.file);
    }

    try {
      if (isAdmin) {
        await librarianUpdateMutation.mutateAsync({ id: ebook.id, formData: data });
      } else {
        await authorUpdateMutation.mutateAsync({ id: ebook.id, formData: data });
      }
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      // Error handled by mutation
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cập nhật Ebook" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
        
        {/* Tiêu đề */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề Ebook</label>
          <Input 
            name="title"
            placeholder="Nhập tiêu đề"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        {/* Tên tác giả - Admin only */}
        {isAdmin && (
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Tên tác giả (hiển thị)</label>
            <Input 
              name="author_name"
              placeholder="Nhập tên tác giả"
              value={formData.author_name}
              onChange={handleChange}
            />
            <p className="text-[10px] text-slate-400 font-medium mt-1 -mb-2">
              Tên tác giả hiển thị trên hệ thống. Không liên kết với tài khoản người dùng.
            </p>
          </div>
        )}

        {/* Thể loại + Giá */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Thể loại</label>
            <select 
              name="category_id"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium appearance-none"
              value={formData.category_id}
              onChange={handleChange}
              required
            >
              <option value="">Chọn thể loại...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Giá bán (VNĐ)</label>
            <Input 
              name="price"
              type="number"
              placeholder="Ví dụ: 99000"
              disabled={formData.is_free}
              value={formData.is_free ? 0 : formData.price}
              onChange={handleChange}
              required={!formData.is_free}
            />
            <div className="mt-2 flex items-center gap-2">
               <input 
                 type="checkbox" 
                 id="is_free_edit" 
                 name="is_free"
                 checked={formData.is_free}
                 onChange={handleChange}
                 className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
               />
               <label htmlFor="is_free_edit" className="text-xs font-bold text-slate-600 cursor-pointer">Đây là sách miễn phí</label>
            </div>
          </div>
        </div>

        {/* Mô tả */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả nội dung</label>
          <textarea 
            name="description"
            rows="3"
            placeholder="Nội dung tóm tắt..."
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all font-medium resize-none"
            value={formData.description}
            onChange={handleChange}
          />
        </div>

        {/* Ảnh bìa */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Đổi ảnh bìa (Tùy chọn)</label>
          <label className="flex flex-col items-center justify-center w-full min-h-[140px] border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 group overflow-hidden relative">
            {previewCover ? (
              <>
                <img src={previewCover} alt="Cover Preview" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-25 transition-opacity" />
                <div className="z-10 flex flex-col items-center bg-white/80 p-3 rounded-xl backdrop-blur-sm">
                   <ImageIcon size={20} className="text-indigo-600" />
                   <span className="text-xs font-bold text-slate-800 mt-1">Đổi ảnh khác</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center">
                <Upload size={28} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                <p className="mt-2 text-sm font-bold text-slate-700">Tải lên ảnh bìa mới</p>
                <p className="mt-1 text-[10px] text-slate-400 font-medium">Hỗ trợ: JPG, PNG, WEBP (Max 10MB)</p>
              </div>
            )}
            <input name="cover_image" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
          </label>
        </div>

        {/* File PDF */}
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">
            <FileText size={14} className="inline mr-1.5 text-indigo-500" />
            Thay file PDF (Tùy chọn)
          </label>
          
          {!isAdmin && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl mb-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 font-medium leading-relaxed">
                <strong>Lưu ý:</strong> Nếu bạn thay file PDF khi ebook đã được duyệt, trạng thái sẽ tự động chuyển về <strong>"Chờ duyệt"</strong> để admin kiểm tra lại.
              </p>
            </div>
          )}

          {selectedFileName ? (
            <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
              <FileText size={20} className="text-indigo-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-indigo-800 truncate">{selectedFileName}</p>
                <p className="text-[10px] text-indigo-500 font-medium">File PDF mới sẽ thay thế file cũ</p>
              </div>
              <button 
                type="button" 
                onClick={removeSelectedFile}
                className="p-1.5 text-indigo-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full min-h-[100px] border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/50 group">
              <Upload size={24} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
              <p className="mt-2 text-sm font-bold text-slate-600 group-hover:text-indigo-600">Chọn file PDF mới</p>
              <p className="mt-1 text-[10px] text-slate-400 font-medium">PDF, tối đa 50MB</p>
              <input name="file" type="file" accept="application/pdf" className="hidden" onChange={handleFileChange} />
            </label>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 sticky bottom-0 bg-white pb-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Hủy
          </Button>
          <Button type="submit" isLoading={isSubmitting} className="flex-1 sm:flex-none">
            {isSubmitting ? <Loader2 className="animate-spin w-5 h-5" /> : <><Save size={18} className="mr-2" /> Lưu Thay Đổi</>}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditEbookModal;
