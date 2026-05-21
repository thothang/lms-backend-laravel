import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Document, Page, pdfjs } from 'react-pdf';
import { catalogService } from '../services/catalogService';
import { ArrowLeft, Loader2, Eye, CheckCircle2, ShieldAlert, Maximize, Minimize, ZoomIn, ZoomOut, BookOpen } from 'lucide-react';
import { handleApiError } from '../utils/toastHelper';
import { useEbookDetails, useCheckEbookAccess, useReadEbook, useEbookPreview } from '../hooks/queries';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const ReadEbookPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const pageRefs = useRef({});
  
  const [currentPage, setCurrentPage] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loadedPages, setLoadedPages] = useState(new Set());
  const [pdfData, setPdfData] = useState(null);
  const [containerWidth, setContainerWidth] = useState(null);

  // React Query hooks
  const { data: ebookInfo, isLoading: isDetailsLoading } = useEbookDetails(id);
  const { data: accessInfo, isLoading: isAccessLoading } = useCheckEbookAccess(id);
  
  const canRead = accessInfo?.can_read;
  const hasPreview = accessInfo?.preview_pages && accessInfo?.preview_pages > 0;

  const readQuery = useReadEbook(canRead ? id : null);
  const previewQuery = useEbookPreview(!canRead && hasPreview ? id : null);

  const pdfQuery = canRead ? readQuery : previewQuery;
  const rawPdfData = pdfQuery.data;
  const isPdfLoading = pdfQuery.isLoading;
  const pdfError = pdfQuery.error;

  const isLoading = isDetailsLoading || isAccessLoading || isPdfLoading;
  const error = pdfError ? (pdfError.response?.data?.error || pdfError.message) : (accessInfo?.can_read === false && !hasPreview ? (accessInfo.reason || 'Bạn không có quyền đọc Ebook này.') : '');

  // Dynamic container width observer for responsive mobile view
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        setContainerWidth(entry.contentRect.width);
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (rawPdfData) {
      const blob = new Blob([rawPdfData], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      setPdfData(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [rawPdfData]);

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

  useEffect(() => {
    if (!numPages) return;

    const observerOptions = {
      root: null,
      rootMargin: '-40% 0px -40% 0px',
      threshold: 0
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const pageNum = parseInt(entry.target.dataset.page, 10);
          if (pageNum && pageNum !== currentPage) {
            setCurrentPage(pageNum);
          }
        }
      });
    }, observerOptions);

    Object.values(pageRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages, currentPage]);

  const scrollToPage = (pageNum) => {
    const pageRef = pageRefs.current[pageNum];
    if (pageRef) {
      pageRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
    setCurrentPage(1);
  };

  const onPageLoad = (pageNum) => {
    setLoadedPages(prev => new Set([...prev, pageNum]));
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.5));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      ref={containerRef} 
      className="h-screen w-full flex flex-col bg-slate-900 font-sans overflow-hidden"
    >
      {/* Top Navbar */}
      <div className="h-14 sm:h-16 shrink-0 bg-slate-800 border-b border-slate-700 px-2 sm:px-4 flex items-center justify-between text-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
          <button 
            onClick={() => navigate(-1)}
            className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-full transition-colors flex items-center gap-2 shrink-0"
            title="Quay lại trang trước"
          >
            <ArrowLeft size={18} className="sm:size-5" />
            <span className="hidden sm:inline font-medium text-sm">Quay lại</span>
          </button>
          
          <div className="h-5 sm:h-6 w-px bg-slate-700 hidden sm:block shrink-0"></div>
          
          <div className="flex flex-col min-w-0">
            <h1 className="font-bold text-xs sm:text-sm md:text-base text-white truncate max-w-[150px] sm:max-w-[200px] md:max-w-md xl:max-w-xl">
              {ebookInfo ? ebookInfo.title : 'Đang tải sách...'}
            </h1>
            {ebookInfo && (
              <span className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate hidden sm:block">
                {typeof ebookInfo.author === 'object' ? ebookInfo.author?.name : ebookInfo.author}
              </span>
            )}
          </div>
        </div>

        {/* Right Tools & Status Badge */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-4 shrink-0">
          {accessInfo && (
            <div className={`px-1.5 sm:px-2.5 md:px-3 py-1 rounded-full text-[9px] sm:text-[10px] md:text-xs font-bold flex items-center gap-1 ${
              accessInfo.can_read 
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {accessInfo.can_read ? (
                <><CheckCircle2 size={12} className="sm:size-[14px]" /> <span className="hidden sm:inline">Bản Quyền</span></>
              ) : (
                <><Eye size={12} className="sm:size-[14px]" /> <span className="hidden sm:inline">Đọc thử</span></>
              )}
            </div>
          )}

          <button 
            onClick={toggleFullscreen}
            className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-xl transition-colors text-slate-400"
            title={isFullscreen ? "Thu nhỏ" : "Toàn màn hình"}
          >
            {isFullscreen ? <Minimize size={16} className="sm:size-[18px]" /> : <Maximize size={16} className="sm:size-[18px]" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-[#525659] relative flex flex-col overflow-hidden">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
            <Loader2 className="animate-spin mb-4 text-indigo-400" size={40} />
            <p className="font-medium animate-pulse text-sm tracking-wide">Đang giải mã và tải nội dung sách...</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="bg-slate-900 border border-red-500/30 p-8 rounded-2xl max-w-lg text-center shadow-xl mx-4">
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
          </div>
        ) : pdfData ? (
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Scrollable PDF Content */}
            <div className="flex-1 overflow-y-auto scroll-smooth">
              <Document
                file={pdfData}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-20">
                    <Loader2 className="animate-spin mb-4 text-indigo-400" size={40} />
                    <p className="font-medium animate-pulse text-sm tracking-wide">Đang phân tích tài liệu...</p>
                  </div>
                }
              >
                <div className="flex flex-col items-center gap-2 sm:gap-4 py-4 sm:py-6 px-2 sm:px-4">
                  {Array.from(new Array(numPages), (el, index) => {
                    const pageNum = index + 1;
                    const calculatedWidth = containerWidth ? Math.max(280, Math.min(containerWidth - 32, 800)) : 600;
                    return (
                      <div
                        key={`page-${pageNum}`}
                        ref={(el) => (pageRefs.current[pageNum] = el)}
                        data-page={pageNum}
                        className="page-container"
                      >
                        <Page 
                          pageNumber={pageNum}
                          scale={scale}
                          width={calculatedWidth}
                          className="shadow-2xl bg-white"
                          renderTextLayer={true}
                          renderAnnotationLayer={true}
                          onLoadSuccess={() => onPageLoad(pageNum)}
                          loading={
                            <div className="flex items-center justify-center bg-slate-700 rounded" style={{ 
                              minHeight: '400px', 
                              width: calculatedWidth * scale,
                              height: calculatedWidth * 1.4 * scale
                            }}>
                              <Loader2 className="animate-spin text-indigo-400" size={32} />
                            </div>
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </Document>
            </div>

            {/* Bottom Navigation Bar - Scroll based */}
            <div className="shrink-0 bg-slate-800 border-t border-slate-700 px-2 py-2 flex items-center justify-between gap-2">
              {/* Page indicator */}
              <div className="flex items-center gap-1.5 text-sm">
                <BookOpen size={16} className="text-indigo-400" />
                <span className="text-slate-400 font-medium">
                  {currentPage} / {numPages || '-'}
                </span>
              </div>

              {/* Zoom controls */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={zoomOut}
                  disabled={scale <= 0.5}
                  className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Thu nhỏ"
                >
                  <ZoomOut size={18} />
                </button>
                
                <span className="text-slate-400 text-xs font-medium w-12 text-center">
                  {Math.round(scale * 100)}%
                </span>
                
                <button 
                  onClick={zoomIn}
                  disabled={scale >= 3}
                  className="p-1.5 sm:p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Phóng to"
                >
                  <ZoomIn size={18} />
                </button>
              </div>

              {/* Quick jump */}
              <button 
                onClick={() => scrollToPage(Math.max(1, currentPage - 1))}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white text-xs font-medium transition-colors"
              >
                Lên
              </button>
            </div>

            {/* Page thumbnails sidebar - mobile friendly */}
            <div className="sm:hidden fixed right-2 bottom-16 z-20">
              <div className="bg-slate-800/95 backdrop-blur-sm rounded-xl p-2 shadow-xl border border-slate-700">
                <div className="text-center text-[10px] text-slate-400 mb-1 font-medium">
                  {currentPage}/{numPages}
                </div>
                <button 
                  onClick={() => scrollToPage(Math.min(numPages, currentPage + 1))}
                  className="w-10 h-10 bg-indigo-600 hover:bg-indigo-700 rounded-lg text-white font-bold text-sm transition-colors flex items-center justify-center"
                >
                  ↓
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  );
};

export default ReadEbookPage;
