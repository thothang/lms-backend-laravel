import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { userService } from '../../services/userService';
import api from '../../services/api';
import { BookHeart, Loader2, PlayCircle, ExternalLink } from 'lucide-react';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';

const PurchasedEbooks = () => {
  const navigate = useNavigate();

  // Use React Query for data fetching with caching
  const { data: ebooks = [], isLoading } = useQuery({
    queryKey: ['user', 'ebooks'],
    queryFn: () => userService.getMyEbooks().then(res => res.data || res || []),
  });

  const handleReadEbook = (id) => {
    navigate(`/ebook/${id}/read`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <BookHeart className="text-indigo-600" /> Tủ sách E-Book
      </h2>

      {isLoading ? (
        <div className="flex justify-center py-10"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
      ) : ebooks.length === 0 ? (
        <div className="text-center py-10 text-slate-500">
          Bạn chưa sở hữu E-Book nào. Khám phá kho sách điện tử đa dạng của thư viện ngay!
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {ebooks.map(ebook => (
            <div key={ebook.id} className="group relative bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
              <div className="aspect-[3/4] relative overflow-hidden bg-slate-100">
                <img 
                  src={ebook.cover_image || 'https://placehold.co/400x600/1e293b/94a3b8?text=E+Book'} 
                  alt={ebook.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <button 
                    onClick={() => handleReadEbook(ebook.id)}
                    className="bg-white/90 backdrop-blur-md text-indigo-600 px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 hover:bg-white hover:scale-105 transition-all shadow-lg"
                  >
                    <PlayCircle size={18} /> Đọc ngay
                  </button>
                </div>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-semibold text-slate-800 line-clamp-2 leading-tight group-hover:text-indigo-600 transition-colors">
                  {ebook.title}
                </h3>
                <p className="text-sm text-slate-500 mt-1 truncate">{ebook.uploaded_by_admin ? (ebook.author_name || ebook.author || 'Đang cập nhật') : (ebook.author || 'Đang cập nhật')}</p>
                
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <span className="px-2 py-1 bg-violet-100 text-violet-700 text-xs font-semibold rounded">E-Book</span>
                  <button
                    onClick={() => handleReadEbook(ebook.id)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Mở tab mới"
                  >
                    <ExternalLink size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PurchasedEbooks;
