import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import DOMPurify from 'dompurify';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import BookCard from '../components/home/BookCard';
import { useAuth } from '../context/AuthContext';
import { useBookDetails, useEbookDetails, useBorrowBook, useReserveBook, usePurchaseEbook, useSubmitReview, useHotBooks, useSearch } from '../hooks/queries';
import {
  Star, BookOpen, ShoppingCart, Loader2, BookmarkPlus, Tag, User,
  Clock, AlertCircle, ArrowLeft, Heart, Package, FireExtinguisher, Wallet as WalletIcon
} from 'lucide-react';
import { toast } from 'sonner';
import ConfirmModal from '../components/ui/ConfirmModal';
import BorrowModal from '../components/catalog/BorrowModal';
import ReserveModal from '../components/catalog/ReserveModal';
import { motion, AnimatePresence } from 'framer-motion';

const BookDetailsPage = () => {
  const { type, id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // React Query hooks
  const bookQuery = useBookDetails(type === 'book' ? id : null);
  const ebookQuery = useEbookDetails(type === 'ebook' ? id : null);
  const borrowMutation = useBorrowBook();
  const reserveMutation = useReserveBook();
  const purchaseMutation = usePurchaseEbook();
  const reviewMutation = useSubmitReview();
  const { data: hotBooksData = [] } = useHotBooks();

  const query = type === 'book' ? bookQuery : ebookQuery;
  const { data, isLoading, error, refetch } = query;

  // Review & Tab states
  const [activeTab, setActiveTab] = useState('description');
  const [ratingInput, setRatingInput] = useState(0);
  const [commentInput, setCommentInput] = useState('');

  // Carousels
  const [relatedPhysical, setRelatedPhysical] = useState([]);
  const [relatedEbooks, setRelatedEbooks] = useState([]);

  // Modal states
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);
  const [isReserveModalOpen, setIsReserveModalOpen] = useState(false);

  useEffect(() => {
    // Reset tab to description when book changes
    setActiveTab('description');
    window.scrollTo(0, 0);
  }, [type, id]);

  // Process hot books from React Query
  const hotBooks = hotBooksData ? (() => {
    let list = hotBooksData?.data || hotBooksData || [];
    return list.map(b => ({...b, _type: 'book'})).filter(b => b.id !== parseInt(id)).slice(0, 5);
  })() : [];

  // Fetch related books using React Query
  const categoryId = data?.category_id || data?.category?.id;
  const { data: searchData } = useSearch(categoryId ? { category_id: categoryId, limit: 15 } : {});

  useEffect(() => {
    if (searchData && data) {
      let pBooks = searchData?.books?.data || [];
      let eBooks = searchData?.ebooks?.data || [];

      pBooks = pBooks.map(b => ({...b, _type: 'book'})).filter(b => !(type === 'book' && b.id === parseInt(id))).slice(0, 5);
      eBooks = eBooks.map(e => ({...e, _type: 'ebook'})).filter(e => !(type === 'ebook' && e.id === parseInt(id))).slice(0, 5);

      setRelatedPhysical(pBooks);
      setRelatedEbooks(eBooks);
    }
  }, [searchData, data, type, id]);

  const handleBorrow = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập!'); navigate('/login'); return; }

    if (data.available_copies <= 0) {
      toast.error('Hiện không còn bản sao nào sẵn sàng. Vui lòng đặt trước!');
      return;
    }

    setIsBorrowModalOpen(true);
  };

  const executeBorrow = async (days) => {
    setIsBorrowModalOpen(false);
    borrowMutation.mutate({ bookId: data.id, days });
  };

  const handleReserve = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập!'); navigate('/login'); return; }
    setIsReserveModalOpen(true);
  };

  const executeReserve = async (days) => {
    setIsReserveModalOpen(false);
    reserveMutation.mutate({ bookId: id, days });
  };

  const handlePurchase = async () => {
    if (!user) { toast.error('Vui lòng đăng nhập!'); navigate('/login'); return; }
    if (!data.is_free) {
       setIsPurchaseModalOpen(true);
       return;
    }
    purchaseMutation.mutate(id);
  };

  const executePurchase = async () => {
    setIsPurchaseModalOpen(false);
    purchaseMutation.mutate(id, {
      onSuccess: () => {
        // Force refetch ebook data to update is_purchased status
        refetch();
      }
    });
  };

  const handleRead = () => {
    if (!user) { toast.error('Vui lòng đăng nhập!'); navigate('/login'); return; }
    navigate(`/ebook/${id}/read`);
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!user) { toast.error('Vui lòng đăng nhập!'); navigate('/login'); return; }
    if (ratingInput < 1 || ratingInput > 5) {
      toast.error('Vui lòng chọn số sao từ 1 đến 5'); return;
    }

    const wordCount = commentInput.trim().split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < 60) {
      toast.error(`Đánh giá cần ít nhất 60 từ (hiện tại: ${wordCount} từ). Đánh giá chất lượng giúp bạn nhận điểm thưởng!`);
      return;
    }

    reviewMutation.mutate(
      { type, id, data: { rating: ratingInput, comment: commentInput } },
      {
        onSuccess: () => {
          setCommentInput('');
          setRatingInput(0);
        }
      }
    );
  };

  if (isLoading) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1 py-10 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8">
         <div className="mb-6"><div className="h-10 w-40 bg-slate-200 animate-pulse rounded-lg"></div></div>
         <div className="grid md:grid-cols-3 gap-8">
            <div className="aspect-[3/4] bg-slate-200 animate-pulse rounded-2xl w-full"></div>
            <div className="md:col-span-2 space-y-4">
               <div className="h-10 bg-slate-200 animate-pulse rounded-full w-3/4"></div>
               <div className="h-6 bg-slate-200 animate-pulse rounded-full w-1/2"></div>
               <div className="h-4 bg-slate-200 animate-pulse rounded-full w-1/4"></div>
               <div className="h-32 bg-slate-200 animate-pulse rounded-2xl w-full mt-6"></div>
               <div className="h-12 bg-slate-200 animate-pulse rounded-full w-40 mt-4"></div>
            </div>
         </div>
      </main>
      <Footer />
    </div>
  );

  if (error || !data) return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex flex-col justify-center items-center py-20">
        <p className="text-slate-500 text-lg mb-4">{error?.message || 'Không tìm thấy sách'}</p>
        <Link to="/catalog" className="text-indigo-600 font-medium hover:underline">Quay lại danh mục</Link>
      </div>
      <Footer />
    </div>
  );

  const isPhysical = type === 'book';
  const hasAvailableCopies = isPhysical && data.available_copies > 0;
  const isQueueFull = isPhysical && (data.reservations_count || 0) >= (data.total_copies || 0);
  const isFreeEbook = !isPhysical && data.is_free;
  const hasBoughtEbook = !isPhysical && (data.is_purchased || data.is_author || isFreeEbook);
  const categoryName = typeof data.category === 'object' ? data.category?.name : data.category;
  const authorName = data.author_name || data.author?.name || 'Đang cập nhật';
  const reviews = data.reviews || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 py-8"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Link to="/catalog" className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-indigo-600 mb-6 transition-colors" aria-label="Quay lại danh mục sách">
              <ArrowLeft className="mr-2 h-4 w-4" /> Quay lại danh mục
            </Link>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 items-start mb-12">

            {/* Book Cover */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="md:col-span-1"
            >
              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-slate-200 shadow-xl ring-1 ring-slate-900/5">
                <img 
                  src={data.cover_image || 'https://placehold.co/400x600?text=Cover'} 
                  alt={data.title} 
                  className="w-full h-full object-cover" 
                />
                <div className="absolute top-4 left-4 flex flex-col gap-2">
                   {isPhysical ? (
                     <span className="px-3 py-1 bg-amber-500/90 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-sm inline-block self-start">Sách Vật Lý</span>
                   ) : (
                     <span className="px-3 py-1 bg-indigo-600/90 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-sm inline-block self-start">E-Book</span>
                   )}
                   {isFreeEbook && (
                     <span className="px-3 py-1 bg-emerald-500/90 text-white backdrop-blur-md rounded-full text-xs font-bold shadow-sm inline-block self-start">Miễn phí</span>
                   )}
                </div>
              </div>
            </motion.div>

            {/* Book Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm"
            >
              <div className="flex flex-wrap gap-2 mb-4">
                {isPhysical && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${!hasAvailableCopies ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {hasAvailableCopies ? 'Còn sách' : 'Hết sách'}
                  </span>
                )}
                {!isPhysical && (
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-md ${isFreeEbook ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                    {isFreeEbook ? 'Miễn phí' : 'Bản quyền'}
                  </span>
                )}
                <span className="px-2.5 py-1 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                  {categoryName || 'Tất cả'}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                {data.title}
              </h1>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-slate-500">
                  <User className="h-5 w-5" />
                  <span>Tác giả: <span className="text-slate-800 font-medium">{authorName || 'Đang cập nhật'}</span></span>
                </div>
                <div className="flex items-center gap-2 text-slate-500">
                  <Tag className="h-5 w-5" />
                  <span>Thể loại: <span className="text-slate-800 font-medium">{categoryName || 'Đang cập nhật'}</span></span>
                </div>
                {isPhysical && (
                  <>
                    <div className="flex items-center gap-2 text-slate-500">
                      <Package className="h-5 w-5" />
                      <span>Số lượng còn: <span className="text-slate-800 font-medium">{data.available_copies}/{data.total_copies}</span></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <WalletIcon className="h-5 w-5" />
                      <span>Giá bìa: <span className="text-indigo-600 font-bold">{Number(data.price || 0).toLocaleString('vi-VN')} ₫</span></span>
                    </div>
                  </>
                )}
                {!isPhysical && (
                  <div className="flex items-center gap-2 text-slate-500">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Đã bán: <span className="text-slate-800 font-medium">{data.purchase_count || 0}</span></span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-500">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                  <span>Đánh giá: <span className="text-slate-800 font-medium">{Number(data.average_rating || 0).toFixed(1)} / 5 ({data.total_reviews || 0} lượt)</span></span>
                </div>
              </div>

              {/* TABS */}
              <div className="border-b border-slate-200 mb-6" role="tablist" aria-label="Nội dung sách">
                <nav className="flex gap-6">
                   <button
                     role="tab"
                     aria-selected={activeTab === 'description'}
                     aria-controls="tab-description"
                     id="tab-description-btn"
                     onClick={() => setActiveTab('description')}
                     className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'description' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                   >
                     Mô tả
                   </button>
                   <button
                     role="tab"
                     aria-selected={activeTab === 'reviews'}
                     aria-controls="tab-reviews"
                     id="tab-reviews-btn"
                     onClick={() => setActiveTab('reviews')}
                     className={`pb-3 font-semibold text-sm transition-colors border-b-2 ${activeTab === 'reviews' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
                   >
                     Danh sách review
                   </button>
                </nav>
              </div>

               <div className="min-h-[140px] mb-8">
                  {/* TAB CONTENT: Description */}
                  {activeTab === 'description' && (
                    <div
                      id="tab-description"
                      role="tabpanel"
                      aria-labelledby="tab-description-btn"
                      className="prose prose-slate prose-sm max-w-none text-slate-600 leading-relaxed" 
                      dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(data.description || 'Chưa có mô tả cho cuốn sách này.') 
                      }} 
                    />
                  )}

                  {/* TAB CONTENT: Reviews */}
                  {activeTab === 'reviews' && (
                    <div id="tab-reviews" role="tabpanel" aria-labelledby="tab-reviews-btn" className="space-y-6">
                      {reviews.length > 0 ? (
                        <div className="space-y-4">
                           {reviews.map((rv, idx) => (
                             <div key={idx} className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                                <div className="mb-2 flex items-center justify-between gap-2">
                                  <p className="text-sm font-bold text-slate-800">{rv.user?.name || 'Độc giả'}</p>
                                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
                                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                    {Number(rv.rating || 0).toFixed(1)}
                                  </span>
                                </div>
                                <p className="text-sm text-slate-600 leading-relaxed">{rv.comment || 'Không có nhận xét'}</p>
                             </div>
                           ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 text-center py-6 bg-slate-50 rounded-xl">Chưa có đánh giá nào. Hãy là người đầu tiên!</p>
                      )}

                      {/* Review form */}
                      {user ? (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                          <h4 className="font-bold text-slate-800 mb-4 text-sm">Gửi đánh giá của bạn</h4>
                          <form onSubmit={submitReview} className="space-y-4">
                            <div className="flex items-center gap-2" role="radiogroup" aria-label="Chọn số sao đánh giá">
                              {[1, 2, 3, 4, 5].map(starValue => (
                                <button
                                  key={starValue}
                                  type="button"
                                  role="radio"
                                  aria-checked={starValue <= ratingInput}
                                  aria-label={`${starValue} sao`}
                                  onClick={() => setRatingInput(starValue)}
                                  className="transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded"
                                >
                                  <Star className={`h-6 w-6 ${starValue <= ratingInput ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} aria-hidden="true" />
                                </button>
                              ))}
                            </div>
                            <label htmlFor="review-comment" className="block text-sm font-medium text-slate-700 mb-1.5">Nhận xét của bạn</label>
                            <textarea
                              id="review-comment"
                              rows="3"
                              className="w-full text-sm border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors bg-white font-sans text-slate-700"
                              placeholder="Chia sẻ cảm nhận của bạn về cuốn sách này (tối thiểu 60 từ để nhận 5 điểm thưởng)..."
                              value={commentInput}
                              onChange={e => setCommentInput(e.target.value)}
                            ></textarea>
                            <button
                              type="submit"
                              disabled={reviewMutation.isPending || ratingInput === 0}
                              className="bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors inline-flex items-center gap-2"
                            >
                              {reviewMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                              Gửi đánh giá & Nhận thưởng
                            </button>
                          </form>
                        </div>
                      ) : (
                        <div className="mt-8 pt-6 border-t border-slate-200">
                           <p className="text-sm text-slate-500">Vui lòng <Link to="/login" className="text-indigo-600 hover:underline font-medium">đăng nhập</Link> để viết đánh giá.</p>
                        </div>
                      )}
                    </div>
                  )}
               </div>

               {/* Pricing card & Action Buttons */}
               <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-3 sm:gap-4 pt-6 border-t border-slate-200">
                   {isPhysical ? (
                      <div className="bg-indigo-50 border border-indigo-100 px-4 py-2.5 rounded-xl sm:mr-auto flex flex-col">
                        <span className="text-[10px] text-indigo-500 font-bold uppercase tracking-wider block mb-0.5">Tiền cọc (50%)</span>
                        <span className="text-xl font-black text-indigo-700">
                          {Math.min(Number(data.price || 0) * 0.5, 300000).toLocaleString('vi-VN')} ₫
                        </span>
                        <span className="text-[10px] text-slate-400 mt-1">* Phí mượn {Number(data.daily_fee || 0).toLocaleString('vi-VN')} ₫/ngày</span>
                      </div>
                   ) : (
                    !hasBoughtEbook && (
                      <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl sm:mr-auto flex flex-col">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-0.5">Giá E-Book</span>
                          {data.discount_info ? (
                             <div className="flex items-baseline gap-2">
                               <span className="text-xl font-black text-rose-600">
                                  {Number(data.discount_info.discounted_price || 0).toLocaleString('vi-VN')} ₫
                               </span>
                               <span className="text-sm text-slate-400 line-through font-semibold">
                                  {Number(data.price || 0).toLocaleString('vi-VN')} ₫
                               </span>
                               <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold uppercase ml-1 shadow-sm">
                                  -{data.discount_info.discount_percent}%
                               </span>
                             </div>
                          ) : (
                             <span className="text-xl font-black text-slate-800">
                                {isFreeEbook ? 'Miễn phí' : `${Number(data.price || 0).toLocaleString('vi-VN')} ₫`}
                             </span>
                          )}
                      </div>
                    )
                  )}

                  {!user ? (
                     <Link to="/login" className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium px-5 sm:px-6 py-3 rounded-full transition-all text-sm shadow-md">
                       <User size={18} /> Đăng nhập để truy cập
                     </Link>
                  ) : isPhysical ? (
                     hasAvailableCopies ? (
                       <button onClick={handleBorrow} disabled={borrowMutation.isPending} className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium px-5 sm:px-8 py-3 rounded-full transition-all text-sm shadow-md shadow-indigo-600/20 disabled:opacity-70 active:scale-95 whitespace-nowrap">
                         {borrowMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />} Mượn sách
                       </button>
                     ) : !isQueueFull ? (
                       <button onClick={handleReserve} disabled={reserveMutation.isPending} className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-medium px-5 sm:px-8 py-3 rounded-full transition-all text-sm shadow-md shadow-amber-500/20 disabled:opacity-70 active:scale-95 whitespace-nowrap">
                         {reserveMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Clock size={18} />} Đặt trước ({data.reservations_count || 0}/{data.total_copies || 0})
                       </button>
                     ) : (
                       <button disabled className="flex items-center justify-center gap-2 bg-slate-300 text-slate-500 font-medium px-5 sm:px-8 py-3 rounded-full transition-all text-sm cursor-not-allowed whitespace-nowrap">
                         <AlertCircle size={18} /> Hàng chờ đã đầy
                       </button>
                     )
                  ) : (
                     hasBoughtEbook ? (
                       <button onClick={handleRead} disabled={purchaseMutation.isPending} className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium px-5 sm:px-8 py-3 rounded-full transition-all text-sm shadow-md shadow-emerald-600/20 disabled:opacity-70 active:scale-95">
                         {purchaseMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />} Đọc sách
                       </button>
                     ) : (
                       <button onClick={handlePurchase} disabled={purchaseMutation.isPending} className="flex items-center justify-center gap-2 bg-violet-600 hover:bg-violet-700 active:bg-violet-800 text-white font-medium px-5 sm:px-8 py-3 rounded-full transition-all text-sm shadow-md shadow-violet-600/20 disabled:opacity-70 active:scale-95">
                         {purchaseMutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <ShoppingCart size={18} />} Lấy sách ngay
                       </button>
                     )
                  )}

                  {/* Always show wishlist/like button as secondary action (mockup) */}
                  <button className="flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 active:bg-slate-100 text-slate-600 font-medium px-5 sm:px-6 py-3 rounded-full transition-all text-sm">
                     <Heart size={18} /> Yêu thích
                  </button>
               </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4, ease: [0.4, 0, 0.2, 1] }}
            className="space-y-16"
          >
            {/* Hot Books Carousel */}
            {!isLoading && hotBooks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Sách Nổi Bật <Star className="text-amber-500 fill-amber-500" size={24} /></h2>
                  <Link to="/catalog?sort=hot" className="text-sm font-medium text-indigo-600 hover:underline">
                    Xem tất cả
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {hotBooks.map(rBook => (
                     <BookCard key={`hot-${rBook.id}`} book={rBook} />
                   ))}
                </div>
              </div>
            )}

            {/* Related Physical Books */}
            {!isLoading && relatedPhysical.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">Sách giấy cùng thể loại</h2>
                  <Link to={`/catalog?category_id=${data.category_id || data.category?.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    Xem tất cả
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {relatedPhysical.map(rBook => (
                     <BookCard key={`phys-${rBook.id}`} book={rBook} />
                   ))}
                </div>
              </div>
            )}

            {/* Related Ebooks */}
            {!isLoading && relatedEbooks.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-slate-800">E-Book cùng thể loại</h2>
                  <Link to={`/catalog?category_id=${data.category_id || data.category?.id}`} className="text-sm font-medium text-indigo-600 hover:underline">
                    Xem tất cả
                  </Link>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                   {relatedEbooks.map(rBook => (
                     <BookCard key={`ebook-${rBook.id}`} book={rBook} />
                   ))}
                </div>
              </div>
            )}
          </motion.div>

        </div>
      </motion.main>

      <ConfirmModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onConfirm={executePurchase}
        title="Xác nhận mua E-Book"
        message={`Bạn muốn dùng số dư trên ví để mua Ebook "${data.title}" với giá ${Number(data.price || 0).toLocaleString('vi-VN')} ₫?`}
        confirmText="Xác nhận mua"
        cancelText="Để sau"
        type="question"
        isLoading={purchaseMutation.isPending}
      />

      <BorrowModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        book={data}
        onConfirm={executeBorrow}
        isLoading={borrowMutation.isPending}
      />

      <ReserveModal
        isOpen={isReserveModalOpen}
        onClose={() => setIsReserveModalOpen(false)}
        book={data}
        onConfirm={executeReserve}
        isLoading={reserveMutation.isPending}
      />

      <Footer />
    </div>
  );
};

export default BookDetailsPage;
