import React, { useState } from 'react';
import { 
  Plus, Edit2, Trash2, Tag, Calendar, 
  Percent, DollarSign, CheckCircle2, XCircle
} from 'lucide-react';
import { 
  usePromotions, 
  useCreatePromotion, 
  useUpdatePromotion, 
  useDeletePromotion,
  useEbooks,
  useCategories 
} from '../../hooks/queries';
import ConfirmModal from '../../components/ui/ConfirmModal';
import Modal from '../../components/ui/Modal';
import { toast } from 'sonner';

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('vi-VN');
};

const ManagePromotions = () => {
  const { data: promotions = [], isLoading } = usePromotions();
  const { data: ebooksData } = useEbooks({ limit: 1000 });
  const { data: categories = [] } = useCategories();
  
  const ebooks = ebooksData?.data || ebooksData || [];

  const createMutation = useCreatePromotion();
  const updateMutation = useUpdatePromotion();
  const deleteMutation = useDeletePromotion();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    discount_type: 'percent',
    discount_value: '',
    target_type: 'all_ebooks',
    target_ids: [],
    start_date: '',
    end_date: '',
    is_active: true
  });

  const handleOpenModal = (promo = null) => {
    if (promo) {
      setSelectedPromo(promo);
      setFormData({
        name: promo.name,
        discount_type: promo.discount_type,
        discount_value: promo.discount_value,
        target_type: promo.target_type,
        target_ids: promo.target_ids || [],
        start_date: promo.start_date.split(' ')[0], // simplify for date input
        end_date: promo.end_date.split(' ')[0],
        is_active: promo.is_active
      });
    } else {
      setSelectedPromo(null);
      setFormData({
        name: '',
        discount_type: 'percent',
        discount_value: '',
        target_type: 'all_ebooks',
        target_ids: [],
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedPromo) {
      updateMutation.mutate({ id: selectedPromo.id, data: formData }, {
        onSuccess: () => setIsModalOpen(false)
      });
    } else {
      createMutation.mutate(formData, {
        onSuccess: () => setIsModalOpen(false)
      });
    }
  };

  const handleDelete = () => {
    if (selectedPromo) {
      deleteMutation.mutate(selectedPromo.id, {
        onSuccess: () => setIsDeleteModalOpen(false)
      });
    }
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Quản lý Khuyến mãi Ebook</h1>
          <p className="text-slate-500 mt-1">Thiết lập các chương trình giảm giá tự động</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          <span>Tạo mới</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Tên chương trình</th>
                <th className="p-4 font-semibold">Mức giảm</th>
                <th className="p-4 font-semibold">Phạm vi áp dụng</th>
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-500">Chưa có chương trình khuyến mãi nào</td>
                </tr>
              ) : (
                promotions.map(promo => (
                  <tr key={promo.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800">{promo.name}</div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1 font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg w-max">
                        {promo.discount_type === 'percent' ? <Percent size={14}/> : <DollarSign size={14}/>}
                        {promo.discount_type === 'percent' ? `${promo.discount_value}%` : formatCurrency(promo.discount_value)}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      {promo.target_type === 'all_ebooks' && 'Tất cả Ebook'}
                      {promo.target_type === 'category' && 'Theo Thể loại'}
                      {promo.target_type === 'specific_ebooks' && 'Ebook cụ thể'}
                    </td>
                    <td className="p-4 text-sm text-slate-600">
                      <div>{formatDate(promo.start_date)}</div>
                      <div className="text-slate-400">đến {formatDate(promo.end_date)}</div>
                    </td>
                    <td className="p-4">
                      {promo.is_active ? (
                        <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold bg-emerald-50 px-2 py-1 rounded-lg w-max">
                          <CheckCircle2 size={14} /> Hoạt động
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-slate-500 text-sm font-semibold bg-slate-100 px-2 py-1 rounded-lg w-max">
                          <XCircle size={14} /> Tạm dừng
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleOpenModal(promo)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={() => { setSelectedPromo(promo); setIsDeleteModalOpen(true); }} 
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-2"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={selectedPromo ? 'Cập nhật Khuyến mãi' : 'Tạo Khuyến mãi mới'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên chương trình</label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
              placeholder="VD: Flash Sale Cuối Tuần"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Loại giảm giá</label>
              <select 
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.discount_type}
                onChange={e => setFormData({...formData, discount_type: e.target.value})}
              >
                <option value="percent">Phần trăm (%)</option>
                <option value="fixed">Số tiền cố định (VNĐ)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Mức giảm</label>
              <input 
                type="number" 
                required
                min="0"
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.discount_value}
                onChange={e => setFormData({...formData, discount_value: e.target.value})}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Phạm vi áp dụng</label>
            <select 
              className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={formData.target_type}
              onChange={e => setFormData({...formData, target_type: e.target.value, target_ids: []})}
            >
              <option value="all_ebooks">Tất cả Ebook</option>
              <option value="category">Theo Thể loại</option>
              <option value="specific_ebooks">Từng Ebook cụ thể</option>
            </select>
          </div>

          {formData.target_type === 'category' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Thể loại</label>
              <select 
                multiple
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[100px]"
                value={formData.target_ids}
                onChange={e => setFormData({
                  ...formData, 
                  target_ids: Array.from(e.target.selectedOptions, option => parseInt(option.value))
                })}
              >
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều</p>
            </div>
          )}

          {formData.target_type === 'specific_ebooks' && (
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Ebook</label>
              <select 
                multiple
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none min-h-[150px]"
                value={formData.target_ids}
                onChange={e => setFormData({
                  ...formData, 
                  target_ids: Array.from(e.target.selectedOptions, option => parseInt(option.value))
                })}
              >
                {ebooks.map(e => (
                  <option key={e.id} value={e.id}>{e.title}</option>
                ))}
              </select>
              <p className="text-xs text-slate-500 mt-1">Giữ Ctrl (Windows) hoặc Cmd (Mac) để chọn nhiều</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày bắt đầu</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.start_date}
                onChange={e => setFormData({...formData, start_date: e.target.value})}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày kết thúc</label>
              <input 
                type="date" 
                required
                className="w-full px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={formData.end_date}
                onChange={e => setFormData({...formData, end_date: e.target.value})}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="is_active"
              className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              checked={formData.is_active}
              onChange={e => setFormData({...formData, is_active: e.target.checked})}
            />
            <label htmlFor="is_active" className="font-semibold text-slate-700">Đang kích hoạt</label>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-50 rounded-xl transition-colors font-semibold"
            >
              Hủy
            </button>
            <button 
              type="submit" 
              disabled={isSaving}
              className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Xóa khuyến mãi"
        message={`Bạn có chắc chắn muốn xóa chương trình "${selectedPromo?.name}"?`}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};

export default ManagePromotions;
