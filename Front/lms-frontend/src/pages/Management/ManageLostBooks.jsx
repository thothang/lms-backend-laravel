import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, BookX, Search, ShieldAlert, CheckCircle, User, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { handleApiError } from '../../utils/toastHelper';
import DetailModal from '../../components/ui/DetailModal';
import { useMarkLost, useSearchBorrows, invalidateRelatedCaches } from '../../hooks/queries';

const ManageLostBooks = () => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBorrow, setSelectedBorrow] = useState(null);
  const [selectedBorrowDetail, setSelectedBorrowDetail] = useState(null);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  
  const [formData, setFormData] = useState({
    copy_id: '',
    borrow_id: '',
    damage_type: 'lost'
  });
  
  const [result, setResult] = useState(null);

  const { mutate: markLost, isPending: isMarkingLost } = useMarkLost();
  const { data: searchResults = [], isLoading: isSearching } = useSearchBorrows(searchQuery);

  const handleSelectBorrow = (borrow) => {
    setSelectedBorrow(borrow);
    setResult(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const copyId = selectedBorrow ? (selectedBorrow.book_copy_id || selectedBorrow.copy_id || selectedBorrow.copy?.id) : formData.copy_id;
    const borrowId = selectedBorrow ? selectedBorrow.id : formData.borrow_id;

    if (!copyId || !borrowId) {
       handleApiError(new Error("Vui lòng điền đủ Copy ID và Borrow ID."));
       return;
    }

    markLost(
      {
        copyId,
        data: {
          borrow_id: borrowId,
          damage_type: formData.damage_type
        }
      },
      {
        onSuccess: (res) => {
          setResult({
            amount: res?.data?.compensation_amount || res?.compensation_amount || 0,
            message: res?.data?.message || res?.message || 'Đã lập biên bản bồi thường.'
          });
          
          // Invalidate search to remove the processed borrow from results
          invalidateRelatedCaches(queryClient, [['librarian', 'borrows', 'search']]);
          setSelectedBorrow(null);
          setFormData({ copy_id: '', borrow_id: '', damage_type: 'lost' });
        },
        onError: (error) => {
          handleApiError(error, 'Không thể ghi nhận sự cố.');
        }
      }
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-4 rotate-3 border-2 border-white shadow-xl shadow-rose-100">
           <ShieldAlert size={40} />
        </div>
        <h1 className="text-3xl font-black text-slate-800 tracking-tight">Báo mất / hỏng sách</h1>
        <p className="text-slate-500 font-medium mt-2">Tra cứu người dùng & phiếu mượn hiện tại để rà soát sự cố hư hỏng bản sao lý.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* LEFT CỘT: TÌM KIẾM */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col min-h-[400px]">
           <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-10 -translate-x-1/2 -translate-y-1/2 opacity-50"></div>
           
           <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
             <Search className="text-indigo-600" size={20} />
             1. Bảng Tra cứu
           </h2>

           <div className="mb-6 relative flex gap-2">
              <input
                 type="text"
                 value={searchQuery}
                 onChange={(e) => setSearchQuery(e.target.value)}
                 placeholder="Tìm tên KH, SĐT, Barcode..."
                 className="flex-1 px-4 py-3 bg-slate-50 border-0 rounded-2xl font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
              />
              {isSearching && (
                <div className="px-6 py-3 bg-indigo-600 text-white font-black rounded-2xl flex items-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {searchResults.length === 0 && !isSearching && (
                 <div className="h-full flex flex-col items-center justify-center opacity-50 mt-10">
                   <User size={48} className="text-slate-300 mb-2" />
                   <p className="text-slate-500 font-bold text-sm">Chưa có thông tin phiếu mượn liên quan.</p>
                 </div>
              )}
              {searchResults.filter(b => 
                  !searchQuery || 
                  b.id.toString().includes(searchQuery) || 
                  (b.user?.name || b.guest_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                  (b.book?.title || b.copy?.book?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                  (b.copy_id || b.book_copy_id || b.copy?.id || '').toString().includes(searchQuery)
              ).map(borrow => (
                 <button 
                   key={borrow.id}
                   type="button"
                   onClick={(e) => {
                     // If clicking the detail button, show modal, otherwise select for marking lost
                     if (e.target.closest('.detail-btn')) {
                       setSelectedBorrowDetail(borrow);
                       setShowBorrowModal(true);
                     } else {
                       handleSelectBorrow(borrow);
                     }
                   }}
                   className={`w-full text-left p-4 rounded-2xl border-2 transition-all group ${selectedBorrow?.id === borrow.id ? 'border-indigo-600 bg-indigo-50 shadow-md shadow-indigo-100 relative' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50'}`}
                 >
                   <div className="flex justify-between items-start mb-2">
                     <span className={`font-black uppercase text-xs tracking-widest ${selectedBorrow?.id === borrow.id ? 'text-indigo-600' : 'text-slate-400'}`}>PHIẾU MƯỢN #{borrow.id}</span>
                     <div className="flex gap-1">
                        <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-slate-200">
                          Sách ID: {borrow.book_id || borrow.book?.id || 'N/A'}
                        </span>
                        <span className="bg-white text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border border-slate-200">
                          Copy ID: {borrow.copy_id || borrow.book_copy_id || borrow.copy?.id || 'N/A'}
                        </span>
                     </div>
                   </div>
                   <div className="font-bold text-slate-800 line-clamp-1 mb-1 group-hover:text-indigo-700">
                     Sách: {borrow.book?.title || borrow.copy?.book?.title || borrow.book_title || 'Tên sách đang tải...'}
                   </div>
                   <div className="text-xs text-slate-600 flex items-center gap-1 font-medium bg-slate-50 p-2 rounded-lg mt-2">
                     <User size={14} className="text-slate-400" />
                     Khách đang mượn: <span className="font-bold text-indigo-700">{borrow.user?.name || borrow.guest_name || 'Khách Vãng Lai'}</span>
                   </div>
                   <div
                     className="detail-btn mt-2 text-[10px] font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer"
                     onClick={(e) => {
                       e.stopPropagation();
                       setSelectedBorrowDetail(borrow);
                       setShowBorrowModal(true);
                     }}
                   >
                     Xem chi tiết
                   </div>
                 </button>
              ))}
           </div>
        </div>

        {/* RIGHT CỘT: XỬ LÝ BIÊN BẢN */}
        <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden flex flex-col min-h-[400px]">
           <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2 opacity-50"></div>
           
           <h2 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
             <AlertTriangle className="text-rose-600" size={20} />
             2. Lập Biên Bản
           </h2>

           <form onSubmit={handleSubmit} className="flex-1 flex flex-col space-y-6 relative z-10 w-full mt-4">
              {/* CHẾ ĐỘ NHẬP TỰ ĐỘNG KHI CÓ KẾT QUẢ TRA CỨU */}
              {selectedBorrow ? (
                <div className="bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                   <div className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2 flex justify-between items-center">
                     <span>ĐỐI TƯỢNG XỬ PHẠT TỪ TRA CỨU</span>
                     <button type="button" onClick={() => setSelectedBorrow(null)} className="text-rose-500 hover:text-rose-700 underline text-xs">Hủy chọn</button>
                   </div>
                   <div className="font-bold text-slate-800 flex items-center gap-2 mb-1">
                     <User size={14} className="text-slate-400"/> 
                     {selectedBorrow.user?.name || selectedBorrow.guest_name || 'Khách vãng lai'}
                   </div>
                   <div className="font-bold text-slate-800 flex items-center gap-2">
                     <BookOpen size={14} className="text-slate-400"/>
                     <span className="line-clamp-1">{selectedBorrow.book?.title || selectedBorrow.copy?.book?.title || selectedBorrow.book_title || 'Chưa định dạng tên sách'} <span className="text-xs text-rose-500">(Mã: {selectedBorrow.copy_id || selectedBorrow.book_copy_id || selectedBorrow.copy?.id})</span></span>
                   </div>
                </div>
              ) : (
                /* CHẾ ĐỘ NHẬP THỦ CÔNG KHI TRA CỨU LỖI */
                <div className="p-5 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 space-y-4 relative">
                   <div className="absolute -top-3 left-4 bg-white px-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     Nhập Phạt Thủ Công
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Mã bản sao (Copy ID)</label>
                     <input
                       type="number"
                       value={formData.copy_id}
                       onChange={(e) => setFormData({...formData, copy_id: e.target.value})}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 transition-colors"
                       placeholder="VD: Nhập Barcode..."
                       required={!selectedBorrow}
                     />
                   </div>
                   <div>
                     <label className="block text-xs font-bold text-slate-500 mb-1">Mã phiếu mượn (Borrow ID)</label>
                     <input
                       type="number"
                       value={formData.borrow_id}
                       onChange={(e) => setFormData({...formData, borrow_id: e.target.value})}
                       className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 outline-none focus:border-rose-500 transition-colors"
                       placeholder="VD: Nhập ID phiếu mượn..."
                       required={!selectedBorrow}
                     />
                   </div>
                </div>
              )}

              <div>
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                    Mức độ sự cố
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button 
                      type="button" 
                      onClick={() => setFormData({ damage_type: 'lost'})}
                      className={`p-4 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        formData.damage_type === 'lost' 
                        ? 'border-rose-500 bg-rose-50 text-rose-600 shadow-md shadow-rose-100' 
                        : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                       <AlertTriangle size={24} className="mb-2" />
                       <span className="font-bold text-sm tracking-tight text-slate-800">Mất luôn sách</span>
                       <span className="text-[10px] font-medium tracking-widest uppercase mt-1">Phạt 150%</span>
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setFormData({ damage_type: 'damaged'})}
                      className={`p-4 border-2 rounded-2xl flex flex-col items-center justify-center transition-all ${
                        formData.damage_type === 'damaged' 
                        ? 'border-amber-500 bg-amber-50 text-amber-600 shadow-md shadow-amber-100' 
                        : 'border-slate-100 bg-white text-slate-400 hover:bg-slate-50'
                      }`}
                    >
                       <BookX size={24} className="mb-2" />
                       <span className="font-bold text-sm tracking-tight text-slate-800">Rách / Hư hỏng</span>
                       <span className="text-[10px] font-medium tracking-widest uppercase mt-1">Phạt 50%</span>
                    </button>
                  </div>
                </div>

                <div className="mt-auto pt-4">
                  <button
                     type="submit"
                     disabled={isMarkingLost || (!selectedBorrow && (!formData.copy_id || !formData.borrow_id))}
                     className="w-full bg-slate-800 hover:bg-black text-white font-black py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                  >
                     {isMarkingLost ? (
                        <div className="w-5 h-5 border-2 border-slate-500 border-t-white rounded-full animate-spin"></div>
                     ) : 'Hoàn tất Lập Biên Bản'}
                  </button>
                </div>
              </form>
        </div>
      </div>

      {/* RESULT MODAL SCREEN Tách rời */}
      {result && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <motion.div 
               initial={{ opacity: 0, y: 10, scale: 0.95 }}
               animate={{ opacity: 1, y: 0, scale: 1 }}
               className="bg-white border-2 border-emerald-100 p-8 rounded-3xl flex flex-col items-center text-center max-w-sm w-full shadow-2xl relative overflow-hidden"
            >
               <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500"></div>
               <div className="w-16 h-16 bg-emerald-50 rounded-full flex justify-center items-center text-emerald-500 shadow-inner mb-4">
                  <CheckCircle size={32} />
               </div>
               <h3 className="font-black text-slate-800 text-xl">{result.message}</h3>
               <p className="text-slate-500 text-sm font-medium mt-2 leading-relaxed">Sự cố đã được ghi nhận vào hồ sơ mượn trả.</p>
               
               <div className="mt-6 bg-slate-50 px-6 py-4 rounded-2xl w-full border border-slate-100">
                  <div className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Cần thu của Khách:</div>
                  <div className="text-4xl font-black text-slate-800">
                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(result.amount)}
                  </div>
               </div>

               <button 
                  onClick={() => setResult(null)} 
                  className="w-full mt-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
               >
                  Đóng (Đã thu tiền)
               </button>
            </motion.div>
         </div>
      )}

      {/* Borrow Detail Modal */}
      <DetailModal
        isOpen={showBorrowModal}
        onClose={() => {
          setShowBorrowModal(false);
          setSelectedBorrowDetail(null);
        }}
        data={selectedBorrowDetail}
        type="borrow"
      />

    </div>
  );
};

export default ManageLostBooks;
