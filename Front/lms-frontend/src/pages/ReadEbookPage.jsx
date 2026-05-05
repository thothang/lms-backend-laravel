import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { catalogService } from '../services/catalogService';
import { ArrowLeft, Loader2, AlertCircle, Eye, CheckCircle2, ShieldAlert, Maximize, Minimize, Settings2 } from 'lucide-react';
import { handleApiError } from '../utils/toastHelper';

const ReadEbookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  
  const [ebookInfo, setEbookInfo] = useState(null);
  const [accessInfo, setAccessInfo] = useState(null);
  const [pdfUrl, setPdfUrl] = useState('');
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Extra features state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showToolbar, setShowToolbar] = useState(false);
  
  useEffect(() => {
    let ignore = false;
    let createdUrl = '';

    const initReader = async () => {
      try {
        setIsLoading(true);
        setError('');

        // Load metadata and access in parallel
        const [details, access] = await Promise.all([
          catalogService.getEbookDetails(id),
          catalogService.checkEbookAccess(id)
        ]);

        if (ignore) return;
        setEbookInfo(details);
        setAccessInfo(access);

        // Fetch PDF Stream based on access right
        let pdfResponse;
        if (access.can_read) {
          pdfResponse = await catalogService.readEbook(id);
        } else {
          // It might be a fallback to preview if they cannot read full book
          if (access.preview_pages && access.preview_pages > 0) {
            pdfResponse = await catalogService.previewEbook(id);
          } else {
            throw new Error(access.reason || 'Bạn không có quyền đọc Ebook này và sách không có bản xem trước.');
          }
        }

        if (ignore) return;

        // Create Blob URL
        const file = new Blob([pdfResponse.data], { type: 'application/pdf' });
        const fileURL = URL.createObjectURL(file);
        createdUrl = fileURL;
        setPdfUrl(fileURL);
        
      } catch (err) {
        if (ignore) return;
        const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || 'Lỗi tải sách';
        setError(errMsg);
        handleApiError(err);
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    if (id) {
      initReader();
    }

    // Cleanup Blob URL on unmount to prevent memory leaks
    return () => {
      ignore = true;
      if (createdUrl) {
        URL.revokeObjectURL(createdUrl);
      }
    };
  }, [id]);

  // Fullscreen Handler
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      ref={containerRef} className="h-screen w-full flex flex-col bg-slate-900 font-sans overflow-hidden"
    >
      {/* Top Navbar */}
      <div className="h-16 shrink-0 bg-slate-800 border-b border-slate-700 px-4 flex items-center justify-between text-slate-200 shadow-sm z-10 transition-transform">
        <div className="flex items-center gap-4 flex-1">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-slate-700 rounded-full transition-colors flex items-center gap-2"
            title="Quay lại trang trước"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline font-medium text-sm">Quay lại</span>
          </button>
          
          <div className="h-6 w-px bg-slate-700 hidden sm:block"></div>
          
          <div className="flex flex-col">
            <h1 className="font-bold text-sm md:text-base text-white truncate max-w-[200px] sm:max-w-md xl:max-w-xl">
              {ebookInfo ? ebookInfo.title : 'Đang tải sách...'}
            </h1>
            {ebookInfo && <span className="text-[10px] text-slate-400 font-medium truncate">{typeof ebookInfo.author === 'object' ? ebookInfo.author?.name : ebookInfo.author}</span>}
          </div>
        </div>

        {/* Right Tools & Status Badge */}
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          
          {/* Action Buttons */}
          <div className="flex items-center gap-1 border-r border-slate-700 pr-2 md:pr-4">
             <button 
                onClick={() => setShowToolbar(!showToolbar)}
                className={`p-2 rounded-xl transition-colors flex items-center gap-2 text-sm font-medium ${showToolbar ? 'bg-indigo-600 text-white' : 'hover:bg-slate-700 text-slate-400'}`}
                title="Bật/Tắt thanh công cụ thu phóng PDF"
             >
                <Settings2 size={18} />
                <span className="hidden md:inline">Công cụ PDF</span>
             </button>

             <button 
                onClick={toggleFullscreen}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
                title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
             >
                {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
             </button>
          </div>

          {/* Access Badge */}
          {accessInfo && (
            <div className={`px-2.5 md:px-3 py-1.5 rounded-full text-[10px] md:text-xs font-bold flex items-center gap-1.5 ${
              accessInfo.can_read 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {accessInfo.can_read ? (
                <><CheckCircle2 size={14} /> <span className="hidden sm:inline">Bản Quyền</span></>
              ) : (
                <><Eye size={14} /> <span className="hidden sm:inline">Đọc thử ({accessInfo.preview_pages} trang)</span></>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-[#525659] relative flex flex-col justify-center items-center">
        {isLoading ? (
          <div className="flex flex-col items-center text-slate-300">
            <Loader2 className="animate-spin mb-4 text-indigo-400" size={40} />
            <p className="font-medium animate-pulse text-sm tracking-wide">Đang giải mã và tải nội dung sách...</p>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-lg text-center shadow-xl">
            <ShieldAlert size={48} className="mx-auto text-red-400 mb-4" />
            <h2 className="text-xl font-bold text-slate-200 mb-2">Không thể xem sách</h2>
            <p className="text-slate-400 leading-relaxed text-sm">{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="mt-6 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
            >
              Quay lại
            </button>
          </div>
        ) : pdfUrl ? (
          <iframe 
            src={`${pdfUrl}#toolbar=${showToolbar ? '1' : '0'}&navpanes=0&scrollbar=1`} 
            title="Ebook Reader"
            className="w-full h-full border-none bg-transparent"
          />
        ) : null}
      </div>
    </motion.div>
  );
};

export default ReadEbookPage;
