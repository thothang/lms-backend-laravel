import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useCategories, useSearch } from '../hooks/queries';
import { motion } from 'framer-motion';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import BookCard from '../components/home/BookCard';
import SidebarFilter from '../components/catalog/SidebarFilter';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

const CatalogPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialType = queryParams.get('type') || 'all';
  const initialCategoryId = queryParams.get('category_id') || '';
  const initialKeyword = queryParams.get('keyword') || '';

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [filters, setFilters] = useState({
    keyword: initialKeyword,
    category_id: initialCategoryId,
    type: initialType
  });

  // Sync filters from URL when navigating to catalog with query params
  useEffect(() => {
    const qp = new URLSearchParams(location.search);
    setFilters({
      keyword: qp.get('keyword') || '',
      category_id: qp.get('category_id') || '',
      type: qp.get('type') || 'all'
    });
  }, [location.search]);

  // Fetch Categories using React Query
  const { data: categories = [], isLoading: loadingCategories } = useCategories();

  // Fetch Search Data using React Query
  const { data: searchData, isLoading: isLoading } = useSearch({ ...filters, limit: 1000 });

  // Process search data
  const books = searchData ? (() => {
    const booksData = searchData?.books?.data || [];
    const ebooksData = searchData?.ebooks?.data || [];

    // Map appropriate _type
    const formattedBooks = booksData.map(b => ({ ...b, _type: 'book' }));
    const formattedEbooks = ebooksData.map(e => ({ ...e, _type: 'ebook' }));

    // Combine and sort
    let combined = [];
    if (filters.type === 'book') {
      combined = [...formattedBooks];
    } else if (filters.type === 'ebook') {
      combined = [...formattedEbooks];
    } else {
      combined = [...formattedBooks, ...formattedEbooks];
    }

    // Sort by newest added (created_at descending)
    combined.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });

    return combined;
  })() : [];

  // Reset page on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <aside className="w-full md:w-64 lg:w-72 shrink-0">
              <SidebarFilter 
                filters={filters} 
                setFilters={setFilters} 
                categories={categories}
                isLoading={loadingCategories}
              />
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
                  <h1 className="text-2xl font-bold text-slate-800">Tất Cả Sách</h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Hiển thị <span className="text-indigo-600 font-bold">{books.length}</span> kết quả
                  </p>
                </div>

                {isLoading ? (
                  <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                  </div>
                ) : books.length > 0 ? (
                  <>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                      {books.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((book) => (
                        <BookCard key={`${book._type}-${book.id}`} book={book} />
                      ))}
                    </div>
                    {books.length > itemsPerPage && (
                      <div className="mt-10 flex flex-wrap justify-center items-center gap-2">
                        <button 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft size={20} />
                        </button>
                        
                        {Array.from({ length: Math.ceil(books.length / itemsPerPage) }).map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentPage(idx + 1)}
                            className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                              currentPage === idx + 1 
                              ? 'bg-indigo-600 text-white shadow shadow-indigo-200' 
                              : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}

                        <button 
                          onClick={() => setCurrentPage(p => Math.min(Math.ceil(books.length / itemsPerPage), p + 1))}
                          disabled={currentPage === Math.ceil(books.length / itemsPerPage)}
                          className="p-2 border border-slate-200 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight size={20} />
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                      <span className="text-4xl">📚</span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">Không tìm thấy kết quả</h3>
                    <p className="text-sm text-slate-500 mt-2 max-w-md">
                      Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để khám phá thêm nhiều cuốn sách thú vị.
                    </p>
                    <button 
                      onClick={() => setFilters({ keyword: '', category_id: '', type: 'all' })}
                      className="mt-6 px-6 py-2 bg-indigo-50 text-indigo-600 font-medium rounded-full hover:bg-indigo-100 transition-colors"
                    >
                      Xóa bộ lọc
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      </motion.main>

      <Footer />
    </div>
  );
};

export default CatalogPage;
