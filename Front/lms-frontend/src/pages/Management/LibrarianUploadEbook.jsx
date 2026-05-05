import React, { useState } from 'react';
import {
  ArrowLeft, Upload, FileType, Image as ImageIcon,
  Save, Check, Loader2, Info, FileText as FileTextIcon,
  User, ShieldCheck
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { librarianService } from '../../services/librarianService';
import { useCategories } from '../../hooks/queries';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const LibrarianUploadEbook = () => {
  const [formData, setFormData] = useState({
    title: '',
    category_id: '',
    description: '',
    price: '',
    is_free: false,
    author_name: '',
    file: null,
    cover_image: null
  });
  
  const [previews, setPreviews] = useState({ file: null, cover: null });
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { data: categories = [] } = useCategories();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      const file = files[0];
      setFormData(prev => ({ ...prev, [name]: file }));
      setPreviews(prev => ({ 
        ...prev, 
        [name === 'file' ? 'file' : 'cover']: file.name 
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.file) {
      handleApiError(null, 'Vui lòng chọn file PDF của Ebook!');
      return;
    }

    if (!formData.author_name.trim()) {
      handleApiError(null, 'Vui lòng nhập tên tác giả!');
      return;
    }

    setIsLoading(true);
    const data = new FormData();
    data.append('title', formData.title);
    data.append('category_id', formData.category_id);
    data.append('description', formData.description || '');
    data.append('file', formData.file);
    if (formData.cover_image) {
      data.append('cover_image', formData.cover_image);
    }

    const isFree = formData.is_free ? 1 : 0;
    data.append('is_free', isFree);
    data.append('price', isFree ? 0 : formData.price);
    data.append('author_name', formData.author_name);
    // Thủ thư đăng: uploaded_by_admin = true
    data.append('uploaded_by_admin', 1);

    try {
      await librarianService.uploadEbook(data);
      showSuccess('Ebook đã được đăng tải và xuất bản thành công!');
      // Clear API cache cho ebooks để dashboard hiển thị ebook mới
      api.clearCacheByPattern('/ebooks');
      navigate('/librarian/books');
    } catch (err) {
      handleApiError(err, 'Lỗi khi tải lên Ebook.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/librarian/dashboard" className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-indigo-600">
          <ArrowLeft size={24} />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Đăng tải Ebook (Thủ thư)</h1>
          <p className="text-slate-500 font-medium mt-1">Đăng ebook với quyền thủ thư — tự động xuất bản, doanh thu thuộc về thư viện.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Author Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
               <User size={16} className="text-indigo-600" /> Thông tin tác giả
            </h3>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">Tên tác giả</label>
              <Input 
                name="author_name"
                placeholder="Nhập tên tác giả (VD: Nguyễn Nhật Ánh)"
                value={formData.author_name}
                onChange={handleChange}
                required
              />
              <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">Tên tác giả hiển thị trên ebook. Doanh thu bán ebook sẽ thuộc về thư viện (admin).</p>
            </div>
          </div>

          {/* Book Info */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
               <FileTextIcon size={16} className="text-indigo-600" /> Thông tin cơ bản
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tiêu đề Ebook</label>
                <Input 
                  name="title"
                  placeholder="Ví dụ: Bí quyết lập trình Laravel chuyên sâu"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Thể loại</label>
                  <select 
                    name="category_id"
                    className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none"
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
                    value={formData.price}
                    onChange={handleChange}
                    required={!formData.is_free}
                  />
                  <div className="mt-3 flex items-center gap-2">
                     <input 
                       type="checkbox" 
                       id="is_free_librarian" 
                       name="is_free"
                       checked={formData.is_free}
                       onChange={handleChange}
                       className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                     />
                     <label htmlFor="is_free_librarian" className="text-xs font-bold text-slate-600 cursor-pointer">Đây là sách miễn phí</label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Mô tả nội dung</label>
                <textarea 
                  name="description"
                  rows="6"
                  placeholder="Giới thiệu đôi chút về cuốn sách..."
                  className="w-full px-4 py-3 bg-slate-50 border-none rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium resize-none shadow-inner"
                  value={formData.description}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: File Uploads */}
        <div className="space-y-6">
          {/* PDF File Upload */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
               <FileType size={16} className="text-indigo-600" /> Tệp tin Ebook
            </h3>
            
            <label className="flex flex-col items-center justify-center w-full min-h-[160px] border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 group">
              <div className="flex flex-col items-center justify-center p-6 text-center">
                <Upload size={32} className="text-slate-300 group-hover:text-indigo-500 group-hover:-translate-y-1 transition-all" />
                <p className="mt-3 text-sm font-bold text-slate-700">
                  {previews.file ? previews.file : 'Nhấp để chọn PDF'}
                </p>
                <p className="mt-1 text-[10px] text-slate-400 font-medium">Định dạng hỗ trợ: .pdf (Max 50MB)</p>
              </div>
              <input name="file" type="file" accept=".pdf" className="hidden" onChange={handleFileChange} />
            </label>
            
            {previews.file && (
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-2xl">
                 <Check size={16} />
                 <span className="text-xs font-bold uppercase tracking-tighter">Đã chọn tệp tin</span>
              </div>
            )}
          </div>

          {/* Cover Image Upload */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
               <ImageIcon size={16} className="text-indigo-600" /> Ảnh bìa
            </h3>
            
            <label className="flex flex-col items-center justify-center w-full aspect-[3/4] border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-3xl cursor-pointer transition-all bg-slate-50/50 hover:bg-slate-50 group overflow-hidden">
               {formData.cover_image ? (
                 <img src={URL.createObjectURL(formData.cover_image)} alt="Cover Preview" className="w-full h-full object-cover" />
               ) : (
                 <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Upload size={32} className="text-slate-300 group-hover:text-indigo-500 transition-all" />
                    <p className="mt-3 text-sm font-bold text-slate-700">Tải lên ảnh bìa</p>
                    <p className="mt-1 text-[10px] text-slate-400 font-medium">Hỗ trợ: JPG, PNG (Max 5MB)</p>
                 </div>
               )}
               <input name="cover_image" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          <Button 
            type="submit" 
            isLoading={isLoading}
            className="w-full py-5 rounded-3xl text-lg shadow-xl shadow-indigo-100 font-black h-auto tracking-tight"
          >
            {isLoading ? <Loader2 className="animate-spin" /> : <><ShieldCheck className="mr-2" /> Xuất bản ngay</>}
          </Button>
          
          <div className="flex gap-4 p-4 bg-violet-50 rounded-2xl border border-violet-100">
             <ShieldCheck size={20} className="text-violet-500 shrink-0" />
             <p className="text-[11px] text-violet-700 leading-relaxed font-medium">
               Ebook được đăng từ quyền Thủ thư sẽ <strong>tự động xuất bản</strong>. Toàn bộ doanh thu sẽ được cộng vào <strong>tài khoản thư viện (admin)</strong>.
             </p>
          </div>
        </div>
      </form>
    </div>
  );
};

export default LibrarianUploadEbook;
