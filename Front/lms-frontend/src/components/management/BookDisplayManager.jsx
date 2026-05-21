import React, { useState, useMemo, useEffect } from 'react';
import { Flame, Award, Image as ImageIcon, GripVertical, Search, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { Input } from '../ui/Input';
import { useSearch, useToggleDisplayItem, useReorderDisplayItems } from '../../hooks/queries';

/**
 * BookDisplayManager - Component quản lý sách Hot, Nổi bật và Carousel
 * Props:
 * - books: array - Danh sách tất cả sách đang hiển thị
 * - ebooks: array - Danh sách tất cả ebooks đang hiển thị
 */
const BookDisplayManager = ({ books = [], ebooks = [] }) => {
  const [activeTab, setActiveTab] = useState('hot'); // hot | featured | carousel
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: searchResultsData, isFetching: searchLoading } = useSearch({ 
    keyword: debouncedSearch 
  });

  const toggleMutation = useToggleDisplayItem();
  const reorderMutation = useReorderDisplayItems();

  const [carouselOrder, setCarouselOrder] = useState([]);
  const [hasOrderChanged, setHasOrderChanged] = useState(false);

  // Combine books and ebooks
  const allActiveItems = useMemo(() => {
    return [
      ...books.map(b => ({ ...b, itemType: 'book' })),
      ...ebooks.map(e => ({ ...e, itemType: 'ebook' }))
    ];
  }, [books, ebooks]);

  // Filter active items based on tab
  const filteredActiveItems = useMemo(() => {
    if (activeTab === 'hot') return allActiveItems.filter(i => i.is_hot);
    if (activeTab === 'featured') return allActiveItems.filter(i => i.is_featured);
    if (activeTab === 'carousel') return allActiveItems.filter(i => i.in_carousel).sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0));
    return [];
  }, [allActiveItems, activeTab]);

  // Initialize carousel order state when items change (and we aren't dragging)
  useEffect(() => {
    if (activeTab === 'carousel' && !hasOrderChanged) {
      setCarouselOrder(filteredActiveItems);
    }
  }, [filteredActiveItems, activeTab, hasOrderChanged]);

  // Search Results available to add
  const availableItems = useMemo(() => {
    if (!debouncedSearch || !searchResultsData) return [];
    
    // searchResultsData contains { books: { data: [] }, ebooks: { data: [] } }
    const booksResults = searchResultsData.books?.data || [];
    const ebooksResults = searchResultsData.ebooks?.data || [];
    const results = [...booksResults, ...ebooksResults];
    
    return results.filter(i => {
      const type = i.search_type || (i.is_ebook ? 'ebook' : 'book');
      
      // If it's already active and we're looking at that tab, don't show it in search
      const existing = allActiveItems.find(active => active.id === i.id && active.itemType === type);
      
      if (!existing) return true; // not in any list yet
      
      if (activeTab === 'hot') return !existing.is_hot;
      if (activeTab === 'featured') return !existing.is_featured;
      if (activeTab === 'carousel') return !existing.in_carousel;
      return false;
    }).map(i => ({
      ...i,
      itemType: i.search_type || (i.is_ebook ? 'ebook' : 'book')
    })).slice(0, 10);
  }, [debouncedSearch, searchResultsData, allActiveItems, activeTab]);

  const handleToggleSetting = async (item, setting, forceValue = null) => {
    const newValue = forceValue !== null ? forceValue : !item[setting];
    await toggleMutation.mutateAsync({
      id: item.id,
      type: item.itemType,
      setting: setting,
      value: newValue
    });
    setSearchTerm('');
  };

  const handleSaveCarouselOrder = async () => {
    const payload = carouselOrder.map((item, index) => ({
      id: item.id,
      type: item.itemType,
      carousel_order: index + 1
    }));

    await reorderMutation.mutateAsync({ items: payload });
    setHasOrderChanged(false);
  };

  const tabs = [
    { id: 'hot', label: 'Sách Hot', icon: Flame, color: 'text-amber-500', bg: 'bg-amber-50', count: allActiveItems.filter(i => i.is_hot).length },
    { id: 'featured', label: 'Nổi bật', icon: Award, color: 'text-indigo-500', bg: 'bg-indigo-50', count: allActiveItems.filter(i => i.is_featured).length },
    { id: 'carousel', label: 'Carousel', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50', count: allActiveItems.filter(i => i.in_carousel).length },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100 relative">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm('');
              setHasOrderChanged(false);
            }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 font-bold text-sm transition-all ${
              activeTab === tab.id 
                ? `${tab.color} ${tab.bg} border-b-2 border-current` 
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            <tab.icon size={18} className={activeTab === tab.id ? 'fill-current' : ''} />
            <span>{tab.label}</span>
            <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${activeTab === tab.id ? 'bg-white/80' : 'bg-slate-100'}`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="relative flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              type="text"
              placeholder={`Gõ tên sách/ebook để tìm và thêm vào ${activeTab === 'hot' ? 'Hot' : activeTab === 'featured' ? 'Nổi bật' : 'Carousel'}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchLoading && (
              <Loader2 size={16} className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />
            )}
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {activeTab === 'carousel' && hasOrderChanged && (
            <button
              onClick={handleSaveCarouselOrder}
              disabled={reorderMutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold text-sm rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
            >
              {reorderMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Lưu thứ tự
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Left Column: Current Items List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex justify-between items-center">
            <span>
              {activeTab === 'hot' ? 'Sách Hot hiện tại' : activeTab === 'featured' ? 'Sách Nổi bật hiện tại' : 'Sách trong Carousel'} 
              ({filteredActiveItems.length})
            </span>
            {activeTab === 'carousel' && <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">Kéo thả để sắp xếp</span>}
          </h4>
          
          {filteredActiveItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400 border border-dashed border-slate-200 rounded-xl">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                {activeTab === 'hot' ? <Flame size={24} /> : activeTab === 'featured' ? <Award size={24} /> : <ImageIcon size={24} />}
              </div>
              <p className="text-sm">Chưa có sách nào</p>
              <p className="text-xs mt-1">Tìm kiếm bên phải để thêm sách</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {activeTab === 'carousel' ? (
                <Reorder.Group 
                  axis="y" 
                  values={carouselOrder} 
                  onReorder={(newOrder) => {
                    setCarouselOrder(newOrder);
                    setHasOrderChanged(true);
                  }}
                  className="space-y-2"
                >
                  {carouselOrder.map((item, index) => (
                    <Reorder.Item
                      key={`${item.itemType}-${item.id}`}
                      value={item}
                      className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl bg-white shadow-sm cursor-grab active:cursor-grabbing group"
                    >
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <GripVertical size={16} className="text-slate-400 group-hover:text-blue-500" />
                      </div>
                      
                      <div className="w-10 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-slate-400">📚</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.author_name || item.author?.name}</p>
                      </div>

                      <button
                        onClick={() => handleToggleSetting(item, 'in_carousel', false)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                        title="Xóa khỏi danh sách"
                      >
                        <X size={16} />
                      </button>
                    </Reorder.Item>
                  ))}
                </Reorder.Group>
              ) : (
                <AnimatePresence>
                  {filteredActiveItems.map((item) => (
                    <motion.div
                      key={`${item.itemType}-${item.id}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:shadow-sm transition-all bg-white group"
                    >
                      <div className="w-12 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                        {item.cover_image ? (
                          <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-lg">📚</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-800 truncate">{item.title}</p>
                        <p className="text-xs text-slate-500">{item.author_name || item.author?.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.itemType === 'book' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                            {item.itemType === 'book' ? 'Sách' : 'Ebook'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleToggleSetting(item, activeTab === 'hot' ? 'is_hot' : 'is_featured', false)}
                        className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Xóa khỏi danh sách"
                      >
                        <X size={16} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          )}
        </div>

        {/* Right Column: Search Results */}
        <div className="bg-slate-50 rounded-2xl p-4 min-h-[400px]">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Search size={14} />
            Kết quả tìm kiếm
          </h4>
          
          {!debouncedSearch ? (
            <div className="text-center py-10 text-slate-400">
              <Search size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Gõ từ khóa để tìm sách</p>
            </div>
          ) : searchLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-slate-400" />
            </div>
          ) : availableItems.length === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <p className="text-sm">Không tìm thấy sách nào phù hợp</p>
              <p className="text-xs mt-1">Hoặc sách đã có trong danh sách {activeTab}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {availableItems.map(item => (
                <motion.div
                  key={`available-${item.itemType}-${item.id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <div className="w-10 h-14 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">📚</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-700 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.author_name || item.author?.name}</p>
                    <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded ${item.itemType === 'book' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                      {item.itemType === 'book' ? 'Sách' : 'Ebook'}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleToggleSetting(item, activeTab === 'hot' ? 'is_hot' : activeTab === 'featured' ? 'is_featured' : 'in_carousel', true)}
                    disabled={toggleMutation.isPending}
                    className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-900 transition-colors disabled:opacity-50 shrink-0"
                  >
                    Thêm
                  </button>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDisplayManager;
