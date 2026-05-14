import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';

const HeroCarousel = ({ slides = [], isLoading = true }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="w-full h-[400px] md:h-[500px] rounded-3xl bg-slate-200 animate-pulse"></div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null; /* Hide if no data */
  }

  const currentSlide = slides[currentIndex];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative group">
      <div className="relative w-full h-[400px] md:h-[500px] rounded-3xl overflow-hidden bg-slate-900 shadow-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="absolute inset-0"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent z-10"></div>
            <img 
              src={currentSlide.cover_image || 'https://placehold.co/1200x600/1e293b/94a3b8?text=LMS'} 
              alt={currentSlide.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            
            {/* Content Content Info */}
            <div className="absolute z-20 inset-0 flex items-center">
              <div className="w-full md:w-2/3 lg:w-1/2 px-5 sm:px-8 md:px-16 text-white space-y-2 sm:space-y-6">
                <motion.span 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="inline-block px-3 py-1 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-500/30 text-sm font-semibold tracking-wider uppercase backdrop-blur-sm"
                >
                  Sách Nổi Bật
                </motion.span>
                
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl sm:text-4xl md:text-5xl font-bold leading-tight line-clamp-2"
                >
                  {currentSlide.title}
                </motion.h1>
                
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-slate-300 text-sm md:text-lg line-clamp-2 md:line-clamp-3 leading-relaxed"
                >
                  {currentSlide.description || 'Cuốn sách mang đến những tri thức và góc nhìn mới mẻ cho độc giả. Đừng bỏ lỡ cơ hội khám phá tác phẩm này tại thư viện của chúng tôi.'}
                </motion.p>
                
                <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: 0.5 }}
                   className="pt-4"
                 >
                   <Link 
                     to={`/book/${currentSlide._type || (currentSlide.pdf_url ? 'ebook' : 'book')}/${currentSlide.id}`}
                     className="bg-white text-indigo-600 hover:bg-slate-100 px-8 py-3.5 rounded-full font-bold shadow-lg shadow-white/10 hover:shadow-white/20 hover:-translate-y-1 transition-all duration-300 inline-flex items-center gap-2"
                   >
                     <BookOpen size={20} />
                     Mượn ngay
                   </Link>
                 </motion.div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Controls - Always visible on mobile, hover-reveal on desktop */}
        {slides.length > 1 && (
          <>
            <button 
              onClick={handlePrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 active:bg-black/60 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-sm opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300"
              aria-label="Slide trước"
            >
              <ChevronLeft size={22} />
            </button>
            <button 
              onClick={handleNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 bg-black/30 hover:bg-black/50 active:bg-black/60 text-white p-2.5 sm:p-3 rounded-full backdrop-blur-sm opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all duration-300"
              aria-label="Slide tiếp"
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}

        {/* Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 flex gap-2" role="tablist" aria-label="Điều khiển carousel">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-8 bg-indigo-500' : 'w-4 bg-white/40 hover:bg-white/60'
              }`}
              role="tab"
              aria-selected={idx === currentIndex}
              aria-label={`Chuyển đến slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default HeroCarousel;
