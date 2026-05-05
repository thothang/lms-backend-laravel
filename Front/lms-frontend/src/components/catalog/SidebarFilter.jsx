import { useState } from 'react';
import { Search, Book, Bookmark, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const SidebarFilter = ({ filters, setFilters, categories, isLoading }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const handleTypeChange = (type) => {
    setFilters((prev) => ({ ...prev, type }));
  };

  const handleCategoryChange = (categoryId) => {
    setFilters((prev) => ({ ...prev, category_id: prev.category_id === categoryId ? '' : categoryId }));
  };

  const handleKeywordChange = (e) => {
    setFilters((prev) => ({ ...prev, keyword: e.target.value }));
  };

  // Count active filters
  const activeFilterCount = [
    filters.keyword ? 1 : 0,
    filters.category_id ? 1 : 0,
    filters.type !== 'all' ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden sticky top-20 md:top-24">
      {/* Header - always visible, acts as toggle on mobile */}
      <div 
        className="w-full flex items-center justify-between p-4 sm:p-5 border-b border-slate-100 cursor-pointer md:cursor-default"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
          <Filter className="text-indigo-600" size={20} />
          Bộ lọc & Tìm kiếm
          {activeFilterCount > 0 && (
            <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded-full font-bold">
              {activeFilterCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); setFilters({ keyword: '', category_id: '', type: 'all' }); }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 active:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md transition-colors"
          >
            Đặt lại
          </button>
          <span className="md:hidden text-slate-400">
            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </span>
        </div>
      </div>

      {/* Filter Content - always visible on desktop, toggle on mobile */}
      <div className={`${isExpanded ? 'block' : 'hidden'} md:block p-4 sm:p-5 space-y-6`}>
        {/* Tìm kiếm */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Tìm kiếm</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Tên sách, tác giả..."
              value={filters.keyword}
              onChange={handleKeywordChange}
              className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-4 py-3 sm:py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
            />
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
        </div>

        {/* Loại sách */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Loại sách</h3>
          <div className="space-y-1">
            <label className="flex items-center gap-3 p-2.5 sm:p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors">
              <input
                type="radio"
                name="type"
                checked={filters.type === 'all'}
                onChange={() => handleTypeChange('all')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-sm text-slate-600 font-medium">Tất cả</span>
            </label>
            <label className="flex items-center gap-3 p-2.5 sm:p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors">
              <input
                type="radio"
                name="type"
                checked={filters.type === 'book'}
                onChange={() => handleTypeChange('book')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-sm text-slate-600 font-medium flex items-center gap-2">
                <Book size={14} className="text-amber-500" /> Sách giấy
              </span>
            </label>
            <label className="flex items-center gap-3 p-2.5 sm:p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors">
              <input
                type="radio"
                name="type"
                checked={filters.type === 'ebook'}
                onChange={() => handleTypeChange('ebook')}
                className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300"
              />
              <span className="text-sm text-slate-600 font-medium flex items-center gap-2">
                <Bookmark size={14} className="text-indigo-500" /> E-Book
              </span>
            </label>
          </div>
        </div>

        {/* Danh mục */}
        <div>
          <h3 className="text-sm font-semibold text-slate-700 mb-3 uppercase tracking-wider">Danh mục</h3>
          {isLoading ? (
            <div className="space-y-3 p-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-4 bg-slate-200 rounded animate-pulse w-3/4"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-1 max-h-[250px] sm:max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {categories.map((category) => (
                <label
                  key={category.id}
                  className="flex items-center gap-3 p-2.5 sm:p-2 rounded-lg hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors"
                >
                <input
                  type="checkbox"
                  checked={filters.category_id == category.id}
                  onChange={() => handleCategoryChange(category.id)}
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-slate-300 rounded"
                />
                <span className="text-sm text-slate-600 truncate" title={category.name}>
                  {category.name}
                </span>
              </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SidebarFilter;
