import React, { useState, useEffect } from 'react';
import {
  UserPlus, Search, BookOpen, Clock,
  CheckCircle, ArrowRight, User, Phone,
  Loader2, AlertCircle, Mail, X
} from 'lucide-react';
import { publicService } from '../../services/publicService';
import { useBorrowOffline, useBookDetails, useSearch } from '../../hooks/queries';
import { showSuccess } from '../../utils/toastHelper';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const OfflineBorrow = () => {
  const [formData, setFormData] = useState({
    copy_unique_id: '', // Unique ID for physical copy (barcode)
    guest_name: '',
    guest_phone: '',
    guest_email: '',
    borrow_days: 7, // Default 7 days
  });

  const [searchBook, setSearchBook] = useState('');
  const [selectedBook, setSelectedBook] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { mutate: borrowOffline, isPending: isLoading } = useBorrowOffline();
  const { data: searchData, isLoading: searchLoading } = useSearch(searchBook.length >= 2 ? { keyword: searchBook, limit: 5 } : {});
  const { data: bookDetails } = useBookDetails(selectedBook?.id);

  // Process search results
  const books = searchData?.books?.data || [];

  // Search for books to pick a copy
  useEffect(() => {
    setIsSearching(searchLoading);
  }, [searchLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedBook) {
      alert('Vui lòng chọn đầu sách!');
      return;
    }

    // Find available copy and perform offline borrow
    const copies = bookDetails?.copies || [];
    const availableCopy = copies.find(c => c.status === 'available');

    if (!availableCopy) {
      alert('Đầu sách này không còn bản sao khả dụng.');
      return;
    }

    borrowOffline({
      copy_id: availableCopy.id,
      guest_name: formData.guest_name,
      guest_phone: formData.guest_phone,
      guest_email: formData.guest_email,
      borrow_days: formData.borrow_days
    }, {
      onSuccess: () => {
        showSuccess(`Đã ghi nhận cho mượn: ${selectedBook.title}`);
        setFormData({ copy_unique_id: '', guest_name: '', guest_phone: '', guest_email: '', borrow_days: 7 });
        setSelectedBook(null);
        setSearchBook('');
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-slate-800 tracking-tight">Cho mượn Offline</h1>
        <p className="text-slate-500 font-medium">Ghi nhận mượn sách cho khách vãng lai (không có tài khoản).</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Book Search & Selection */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
             <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
               <BookOpen size={16} className="text-indigo-600" /> Chọn đầu sách
             </h3>

             {!selectedBook ? (
               <div className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <Input 
                      className="pl-12"
                      placeholder="Tìm tên sách..."
                      value={searchBook}
                      onChange={(e) => setSearchBook(e.target.value)}
                    />
                 </div>

                 <div className="space-y-2">
                    {isSearching ? (
                      <div className="flex justify-center p-4"><Loader2 className="animate-spin text-indigo-600" /></div>
                    ) : books.length > 0 ? (
                      books.map(book => (
                        <button
                          key={book.id}
                          onClick={() => setSelectedBook(book)}
                          className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-indigo-50 transition-all border border-transparent hover:border-indigo-100 group text-left"
                        >
                           <img src={book.cover_image} alt="" className="w-10 h-14 object-cover rounded shadow-sm" />
                           <div className="flex-1">
                              <div className="font-bold text-slate-800 group-hover:text-indigo-600 text-sm line-clamp-1">{book.title}</div>
                              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sẵn có: {book.available_copies || 0} bản</div>
                           </div>
                        </button>
                      ))
                    ) : searchBook && (
                      <div className="text-center p-4 text-xs text-slate-400 italic">Không tìm thấy sách.</div>
                    )}
                 </div>
               </div>
             ) : (
               <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 relative group">
                  <button 
                    onClick={() => setSelectedBook(null)}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-rose-500 transition-colors"
                  >
                    <X size={18} />
                  </button>
                  <div className="flex gap-4">
                     <img src={selectedBook.cover_image} alt="" className="w-16 h-24 object-cover rounded-xl shadow-lg shadow-indigo-100" />
                     <div className="flex flex-col justify-center">
                        <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mb-1">Sách đã chọn</span>
                        <h4 className="font-black text-slate-800 uppercase tracking-tight text-lg leading-tight">{selectedBook.title}</h4>
                        <div className="mt-2 text-xs font-bold text-slate-500">{Number(selectedBook.daily_fee || 0).toLocaleString('vi-VN')} ₫ / ngày</div>
                     </div>
                  </div>
               </div>
             )}
          </div>

          <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 flex gap-4">
             <AlertCircle size={24} className="text-amber-500 shrink-0" />
             <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
               Mượn offline yêu cầu Thủ thư xác nhận CMND/CCCD của khách và thu tiền cọc (50% giá bìa) trực tiếp tại quầy.
             </p>
          </div>
        </div>

        {/* Right: Guest Information */}
        <div className="space-y-6">
           <form onSubmit={handleSubmit} className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-50 pb-4 flex items-center gap-2">
                <UserPlus size={16} className="text-indigo-600" /> Thông tin khách mượn
              </h3>

              <div className="space-y-4">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Họ và tên khách</label>
                    <Input 
                      placeholder="Nguyễn Văn A" 
                      icon={User}
                      value={formData.guest_name}
                      onChange={(e) => setFormData({...formData, guest_name: e.target.value})}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số điện thoại</label>
                    <Input 
                      placeholder="09xx xxx xxx" 
                      icon={Phone}
                      value={formData.guest_phone}
                      onChange={(e) => setFormData({...formData, guest_phone: e.target.value})}
                      required
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Email (tùy chọn)</label>
                    <Input 
                      placeholder="email@example.com"
                      type="email"
                      icon={Mail}
                      value={formData.guest_email}
                      onChange={(e) => setFormData({...formData, guest_email: e.target.value})}
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Số ngày mượn</label>
                    <Input 
                      type="number"
                      min="1"
                      max="30"
                      value={formData.borrow_days}
                      onChange={(e) => setFormData({...formData, borrow_days: parseInt(e.target.value) || 7})}
                      required
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Tối đa 30 ngày, mặc định 7 ngày</p>
                 </div>
                 <div className="pt-4">
                    <Button 
                      type="submit" 
                      className="w-full h-14 rounded-2xl font-black text-lg shadow-xl shadow-indigo-100"
                      disabled={!selectedBook || isLoading}
                      isLoading={isLoading}
                    >
                       Xác nhận cho mượn <ArrowRight size={20} className="ml-2" />
                    </Button>
                 </div>
              </div>
           </form>

           <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="font-black text-slate-800 uppercase text-[10px] tracking-widest flex items-center gap-2 mb-4">
                <Clock size={14} className="text-indigo-600" /> Ghi chú nghiệp vụ
              </h4>
              <ul className="space-y-3">
                 <li className="flex gap-3 text-[11px] text-slate-500 font-medium">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    Thu tiền cọc và in biên lai tạm thời.
                 </li>
                 <li className="flex gap-3 text-[11px] text-slate-500 font-medium">
                    <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                    Hướng dẫn khách trả sách đúng hạn để được hoàn cọc.
                 </li>
              </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default OfflineBorrow;
