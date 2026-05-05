import React, { useState, useMemo } from 'react';
import { Star, Check, Image as ImageIcon, Flame, Award, GripVertical, Search, X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

/**
 * BookDisplayManager - Component quản lý sách Hot, Nổi bật và Carousel
 * Props:
 * - books: array - Danh sách tất cả sách
 * - ebooks: array - Danh sách tất cả ebooks (optional)
 * - onUpdateBook: function(id, settings) - Callback cập nhật sách
 * - onUpdateEbook: function(id, settings) - Callback cập nhật ebook (optional)
 * - isLoading: boolean
 * - type: 'book' | 'ebook' | 'both' - Loại sách hiển thị
 */
const BookDisplayManager = ({ 
  books = [], 
  ebooks = [], 
  onUpdateBook, 
  onUpdateEbook,
  isLoading = false,
  type = 'both'
}) => {
  const [activeTab, setActiveTab] = useState('hot'); // hot | featured | carousel
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [localChanges, setLocalChanges] = useState({});

  // Combine books and ebooks if needed
  const allItems = useMemo(() => {
    let items = [];
    if (type === 'book' || type === 'both') {
      items = [...items, ...books.map(b => ({ ...b, itemType: 'book' }))];
    }
    if (type === 'ebook' || type === 'both') {
      items = [...items, ...ebooks.map(e => ({ ...e, itemType: 'ebook' }))];
    }
    return items;
  }, [books, ebooks, type]);

  // Filter items based on active tab
  const filteredItems = useMemo(() => {
    let filtered = allItems;
    
    if (activeTab === 'hot') {
      filtered = allItems.filter(i => i.is_hot);
    } else if (activeTab === 'featured') {
      filtered = allItems.filter(i => i.is_featured);
    } else if (activeTab === 'carousel') {
      filtered = allItems.filter(i => i.in_carousel).sort((a, b) => (a.carousel_order || 0) - (b.carousel_order || 0));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(i => 
        i.title?.toLowerCase().includes(term) ||
        i.author_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [allItems, activeTab, searchTerm]);

  // Available items to add (not in current filter)
  const availableItems = useMemo(() => {
    if (!searchTerm) return [];
    const term = searchTerm.toLowerCase();
    return allItems.filter(i => {
      const matchesSearch = i.title?.toLowerCase().includes(term) ||
                           i.author_name?.toLowerCase().includes(term);
      if (!matchesSearch) return false;
      
      if (activeTab === 'hot') return !i.is_hot;
      if (activeTab === 'featured') return !i.is_featured;
      if (activeTab === 'carousel') return !i.in_carousel;
      return false;
    }).slice(0, 5);
  }, [allItems, activeTab, searchTerm]);

  const handleToggleSetting = (item, setting) => {
    const newValue = !item[setting];
    const updateFn = item.itemType === 'book' ? onUpdateBook : onUpdateEbook;
    
    if (updateFn) {
      updateFn(item.id, { [setting]: newValue });
    }
  };

  const handleUpdateCarouselOrder = (item, newOrder) => {
    const updateFn = item.itemType === 'book' ? onUpdateBook : onUpdateEbook;
    if (updateFn) {
      updateFn(item.id, { in_carousel: true, carousel_order: parseInt(newOrder) || 1 });
    }
  };

  const tabs = [
    { id: 'hot', label: 'Sách Hot', icon: Flame, color: 'text-amber-500', bg: 'bg-amber-50', count: allItems.filter(i => i.is_hot).length },
    { id: 'featured', label: 'Nổi bật', icon: Award, color: 'text-indigo-500', bg: 'bg-indigo-50', count: allItems.filter(i => i.is_featured).length },
    { id: 'carousel', label: 'Carousel', icon: ImageIcon, color: 'text-blue-500', bg: 'bg-blue-50', count: allItems.filter(i => i.in_carousel).length },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header Tabs */}
      <div className="flex border-b border-slate-100">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchTerm('');
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
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder={`Tìm sách để ${activeTab === 'hot' ? 'thêm vào Hot' : activeTab === 'featured' ? 'thêm vào Nổi bật' : 'thêm vào Carousel'}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Available Items (Search Results) */}
        {availableItems.length > 0 && (
          <div className="mb-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Có thể thêm ({availableItems.length})
            </h4>
            <div className="space-y-2">
              {availableItems.map(item => (
                <motion.div
                  key={`available-${item.id}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 p-3 border border-dashed border-slate-200 rounded-xl hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
                  onClick={() => handleToggleSetting(item, activeTab === 'hot' ? 'is_hot' : activeTab === 'featured' ? 'is_featured' : 'in_carousel')}
                >
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                    {item.cover_image ? (
                      <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs text-slate-400">📚</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-700 truncate">{item.title}</p>
                    <p className="text-xs text-slate-400">{item.author_name || item.author?.name} • {item.itemType === 'book' ? 'Sách vật lý' : 'Ebook'}</p>
                  </div>
                  <button className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors">
                    + Thêm
                  </button>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Current Items List */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            {activeTab === 'hot' ? 'Sách Hot hiện tại' : activeTab === 'featured' ? 'Sách Nổi bật hiện tại' : 'Sách trong Carousel'} 
            ({filteredItems.length})
          </h4>
          
          {filteredItems.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-3">
                {activeTab === 'hot' ? <Flame size={24} /> : activeTab === 'featured' ? <Award size={24} /> : <ImageIcon size={24} />}
              </div>
              <p className="text-sm">Chưa có sách nào</p>
              <p className="text-xs mt-1">Tìm kiếm để thêm sách vào danh sách này</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              <AnimatePresence>
                {filteredItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl hover:shadow-sm transition-all bg-white group"
                  >
                    {/* Order Number (for carousel) */}
                    {activeTab === 'carousel' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center font-bold text-sm">
                          {item.carousel_order || index + 1}
                        </div>
                        <GripVertical size={16} className="text-slate-300 cursor-grab" />
                      </div>
                    )}
                    
                    {/* Cover Image */}
                    <div className="w-12 h-16 rounded-lg bg-slate-100 flex items-center justify-center overflow-hidden shrink-0">
                      {item.cover_image ? (
                        <img src={item.cover_image} alt={item.title} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg">📚</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm text-slate-800 truncate">{item.title}</p>
                      <p className="text-xs text-slate-500">{item.author_name || item.author?.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${item.itemType === 'book' ? 'bg-emerald-100 text-emerald-600' : 'bg-purple-100 text-purple-600'}`}>
                          {item.itemType === 'book' ? 'Sách' : 'Ebook'}
                        </span>
                        {item.is_hot && <span className="text-[10px] text-amber-500 font-bold">🔥 Hot</span>}
                        {item.is_featured && <span className="text-[10px] text-indigo-500 font-bold">⭐ Nổi bật</span>}
                      </div>
                    </div>

                    {/* Carousel Order Input */}
                    {activeTab === 'carousel' && (
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-slate-400">Thứ tự:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.carousel_order || 1}
                          onChange={(e) => handleUpdateCarouselOrder(item, e.target.value)}
                          className="w-14 px-2 py-1 text-sm border border-slate-200 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    )}

                    {/* Remove Button */}
                    <button
                      onClick={() => handleToggleSetting(item, activeTab === 'hot' ? 'is_hot' : activeTab === 'featured' ? 'is_featured' : 'in_carousel')}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Xóa khỏi danh sách"
                    >
                      <X size={16} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookDisplayManager;
