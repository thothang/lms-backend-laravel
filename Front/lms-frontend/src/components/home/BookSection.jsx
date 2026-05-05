import { Link } from 'react-router-dom';
import BookCard from './BookCard';
import SkeletonCard from './SkeletonCard';
import { ArrowRight } from 'lucide-react';

const BookSection = ({ title, books = [], isLoading = true, highlighted = false }) => {
  return (
    <section className={`py-16 ${highlighted ? 'bg-indigo-50/50' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600">
              {title}
            </h2>
            <div className="h-1 w-20 bg-indigo-600 rounded-full mt-3"></div>
          </div>
          
          <Link to="/catalog" className="hidden sm:flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium text-sm transition-colors group">
            Xem tất cả
            <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Content Grid - items-stretch ensures all grid cells are same height */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 items-stretch">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div 
                key={i} 
                className={i === 4 ? "hidden xl:block" : ""}
              >
                <SkeletonCard />
              </div>
            ))
          ) : books.length > 0 ? (
            books.slice(0, 5).map((book, i) => (
              <div 
                key={`${book._type || 'book'}-${book.id || i}`}
                className={i === 4 ? "hidden xl:block" : ""}
              >
                <BookCard book={book} />
              </div>
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white/50 rounded-2xl border border-slate-100 border-dashed">
              <p className="text-slate-500">Dữ liệu đang được cập nhật...</p>
            </div>
          )}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-8 text-center sm:hidden">
          <Link to="/catalog" className="inline-flex items-center gap-2 text-indigo-600 font-semibold text-sm bg-indigo-50 px-6 py-2.5 rounded-full">
            Xem tất cả <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default BookSection;
