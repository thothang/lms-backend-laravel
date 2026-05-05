import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Layers, MonitorPlay, Leaf, HeartPulse, Palette, Globe, BookOpen, Coffee } from 'lucide-react';

const iconsMap = {
  'cntt': <MonitorPlay size={24} />,
  'khoa học': <Leaf size={24} />,
  'văn học': <BookOpen size={24} />,
  'nghệ thuật': <Palette size={24} />,
  'y học': <HeartPulse size={24} />,
  'ngoại ngữ': <Globe size={24} />,
  'đời sống': <Coffee size={24} />,
};

const getIcon = (name) => {
  const n = name.toLowerCase();
  for (const key in iconsMap) {
    if (n.includes(key)) return iconsMap[key];
  }
  return <Layers size={24} />;
};

const CategorySlider = ({ categories = [], isLoading = true }) => {
  return (
    <section className="py-12 bg-white relative w-full overflow-hidden border-y border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <h2 className="text-xl font-bold text-slate-800">Khám Phá Theo Thể Loại</h2>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-4 snap-x no-scrollbar scroll-smooth">
          {isLoading ? (
             Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="shrink-0 snap-start animate-pulse w-36 h-32 bg-slate-100 rounded-2xl border border-slate-200"></div>
             ))
          ) : categories.length > 0 ? (
            categories.map((cat, i) => (
              <Link key={cat.id || i} to={`/catalog?category_id=${cat.id}`}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  className="shrink-0 snap-start w-36 h-32 bg-gradient-to-br from-slate-50 to-indigo-50/30 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex flex-col items-center justify-center p-4 transition-all group"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-indigo-500 flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                    {getIcon(cat.name)}
                  </div>
                  <h3 className="font-medium text-slate-700 text-sm text-center group-hover:text-indigo-700">
                    {cat.name}
                  </h3>
                </motion.div>
              </Link>
            ))
          ) : (
            <div className="py-6 text-slate-500 w-full text-center">Đang cập nhật danh mục...</div>
          )}
        </div>
      </div>

    </section>
  );
};

export default CategorySlider;
