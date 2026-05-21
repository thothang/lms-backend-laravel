import React from 'react';
import { Flame, Award, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useDisplayItems } from '../../hooks/queries';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import BookDisplayManager from '../../components/management/BookDisplayManager';
import { useAuth } from '../../context/AuthContext';

/**
 * DisplayManager - Trang quản lý sách Hot, Nổi bật và Carousel cho Admin và Librarian
 */
const DisplayManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Fetch only active display items
  const { data: displayData, isLoading } = useDisplayItems();

  const books = Array.isArray(displayData?.books) ? displayData.books : [];
  const ebooks = Array.isArray(displayData?.ebooks) ? displayData.ebooks : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/${user?.role || 'admin'}`)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">
            Quản lý Hiển thị Sách & Ebook
          </h1>
          <p className="text-slate-500 text-sm">
            Quản lý sách Hot, Nổi bật và Carousel trên trang chủ
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
              <Flame size={20} className="text-amber-600" />
            </div>
            <span className="font-bold text-slate-700">Sách Hot</span>
          </div>
          <p className="text-3xl font-black text-amber-600">
            {books.filter(b => b.is_hot).length + ebooks.filter(e => e.is_hot).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {books.filter(b => b.is_hot).length} sách + {ebooks.filter(e => e.is_hot).length} ebook
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
              <Award size={20} className="text-indigo-600" />
            </div>
            <span className="font-bold text-slate-700">Nổi bật</span>
          </div>
          <p className="text-3xl font-black text-indigo-600">
            {books.filter(b => b.is_featured).length + ebooks.filter(e => e.is_featured).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {books.filter(b => b.is_featured).length} sách + {ebooks.filter(e => e.is_featured).length} ebook
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <ImageIcon size={20} className="text-blue-600" />
            </div>
            <span className="font-bold text-slate-700">Carousel</span>
          </div>
          <p className="text-3xl font-black text-blue-600">
            {books.filter(b => b.in_carousel).length + ebooks.filter(e => e.in_carousel).length}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            {books.filter(b => b.in_carousel).length} sách + {ebooks.filter(e => e.in_carousel).length} ebook
          </p>
        </motion.div>
      </div>

      {/* Book Display Manager */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <BookDisplayManager
          books={books}
          ebooks={ebooks}
        />
      )}
    </div>
  );
};

export default DisplayManager;
