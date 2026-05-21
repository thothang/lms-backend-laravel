import { Book, Check, X, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { catalogService } from '../../services/catalogService';

const BookCard = ({ book }) => {
  const queryClient = useQueryClient();
  const isEbook = book._type === 'ebook' || book.hasOwnProperty('is_free') || book.hasOwnProperty('pdf_url');
  const bookType = book._type || (isEbook ? 'ebook' : 'book');

  const prefetchDetails = () => {
    const queryKey = [bookType, book.id];
    queryClient.prefetchQuery({
      queryKey,
      queryFn: () => bookType === 'ebook' 
        ? catalogService.getEbookDetails(book.id) 
        : catalogService.getBookDetails(book.id),
      staleTime: 5 * 60 * 1000,
    });
  };
  
  const isAvailable = bookType === 'ebook' ? true : (book.available_copies > 0);

  return (
    <div 
      onMouseEnter={prefetchDetails}
      className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full group hover:-translate-y-2 transition-transform duration-300"
    >
      {/* Image Container - fixed 2:3 ratio via padding-bottom */}
      <div className="relative w-full overflow-hidden bg-slate-100" style={{ paddingBottom: '150%' }}>
        <img 
          src={book.cover_image || 'https://placehold.co/400x600/1e293b/94a3b8?text=Book+Cover'} 
          alt={book.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://placehold.co/400x600/1e293b/94a3b8?text=Image+Error';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
          <Link to={`/book/${bookType}/${book.id}`} className="bg-white text-slate-900 px-5 py-2 rounded-full font-bold text-sm flex items-center gap-2 hover:scale-105 transition-transform shadow-xl">
            Xem ngay <ArrowRight size={16} />
          </Link>
        </div>

        {/* Badges Container */}
        <div className="absolute top-0 left-0 w-full p-3 flex justify-between items-start z-10 gap-2">
          {/* Type Badge */}
          <div className="flex flex-col gap-1.5 items-start">
            {bookType === 'ebook' ? (
              <span className="px-2 py-1 bg-indigo-600/90 text-white rounded-md text-[10px] font-semibold backdrop-blur-md flex items-center gap-1 shadow-sm">
                <Book size={10} /> E-Book
              </span>
            ) : (
              <span className="px-2 py-1 bg-amber-500/90 text-white rounded-md text-[10px] font-semibold backdrop-blur-md flex items-center gap-1 shadow-sm">
                <Book size={10} /> Sách giấy
              </span>
            )}
            
            {bookType === 'ebook' && book.is_free && (
              <span className="px-2 py-1 bg-emerald-500/90 text-white rounded-md text-[10px] font-bold backdrop-blur-md shadow-sm uppercase tracking-tighter">
                Miễn phí
              </span>
            )}
          </div>

          {/* Status Badge */}
          <span className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 backdrop-blur-md shadow-sm ${
            isAvailable 
            ? 'bg-emerald-500/90 text-white' 
            : 'bg-rose-500/90 text-white'
          }`}>
            {isAvailable ? <Check size={10} /> : <X size={10} />}
            {isAvailable ? 'Còn sách' : 'Hết sách'}
          </span>
        </div>
      </div>
      
      {/* Info Section - flex-1 ensures equal bottom alignment */}
      <div className="p-4 flex flex-col flex-1 w-full bg-white">
        <h3 className="font-semibold text-slate-800 line-clamp-2 leading-snug min-h-[2.75rem] group-hover:text-indigo-600 transition-colors text-sm">
          {book.title}
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
          <Book size={12} className="shrink-0" />
          <span className="truncate">
            {book.uploaded_by_admin ? (book.author_name || 'Đang cập nhật') : (book.author?.name || book.author_name || book.author || 'Đang cập nhật')}
          </span>
        </p>
        
        <div className="mt-auto pt-3 flex justify-between items-center w-full border-t border-slate-50">
          <span className="text-indigo-600 font-bold text-xs bg-indigo-50 px-2 py-1 rounded-lg truncate max-w-[55%]">
            {(typeof book.category === 'object' ? book.category?.name : book.category) || 'Thể loại'}
          </span>
          <Link to={`/book/${bookType}/${book.id}`} className="text-slate-500 hover:text-indigo-600 font-medium text-xs transition-colors py-1 shrink-0">
            Chi tiết →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
