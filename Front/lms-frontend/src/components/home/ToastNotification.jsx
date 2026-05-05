import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ToastNotification = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ type: '', message: '' });

  useEffect(() => {
    const verified = searchParams.get('verified');
    
    if (verified === '1') {
      setToastData({
        type: 'success',
        message: 'Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.',
      });
      setShowToast(true);
      // Clean up URL
      searchParams.delete('verified');
      setSearchParams(searchParams);
    } else if (verified === '0') {
      setToastData({
        type: 'error',
        message: 'Xác thực thất bại hoặc link đã hết hạn.',
      });
      setShowToast(true);
      // Clean up URL
      searchParams.delete('verified');
      setSearchParams(searchParams);
    }

    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [searchParams, setSearchParams, showToast]);

  return (
    <AnimatePresence>
      {showToast && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-4"
        >
          <div className={`p-4 rounded-xl shadow-2xl flex items-start gap-3 backdrop-blur-md border ${
            toastData.type === 'success' 
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' 
              : 'bg-red-50/90 border-red-200 text-red-800'
          }`}>
            <div className={`shrink-0 ${toastData.type === 'success' ? 'text-emerald-500' : 'text-red-500'}`}>
              {toastData.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
            </div>
            <div className="flex-1 pt-0.5">
              <h3 className="font-semibold text-sm">
                {toastData.type === 'success' ? 'Thành công' : 'Lỗi'}
              </h3>
              <p className="text-sm mt-1 opacity-90">{toastData.message}</p>
            </div>
            <button 
              onClick={() => setShowToast(false)}
              className="shrink-0 opacity-50 hover:opacity-100 transition-opacity p-1"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ToastNotification;
