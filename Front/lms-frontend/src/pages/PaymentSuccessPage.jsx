import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { tokenManager } from '../services/tokenManager';
import { useQueryClient } from '@tanstack/react-query';
import { useConfirmTopup } from '../hooks/queries';

const PaymentSuccessPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('processing'); // 'processing', 'success', 'error'
  const [amount, setAmount] = useState(0);
  
  // Ref to track timers for cleanup
  const timersRef = useRef([]);
  
  // Ref to prevent duplicate API calls (React StrictMode causes double invocation)
  const hasCalledRef = useRef(false);

  useEffect(() => {
    // Cleanup all timers on unmount
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer));
    };
  }, []);

  const { mutate: confirmTopup } = useConfirmTopup();

  useEffect(() => {
    // Prevent duplicate calls from React StrictMode
    if (hasCalledRef.current) return;
    hasCalledRef.current = true;

    const confirmAndRedirect = () => {
      // Try sessionStorage first, fall back to localStorage for mobile private browsing
      const pendingAmount = sessionStorage.getItem('pending_topup_amount')
        || localStorage.getItem('pending_topup_amount');
      const processedRequestId = sessionStorage.getItem('processed_topup_request_id')
        || localStorage.getItem('processed_topup_request_id');

      if (!pendingAmount) {
        // If no pending amount found, redirect to profile after delay
        const timer = setTimeout(() => {
          navigate('/profile');
        }, 2000);
        timersRef.current.push(timer);
        return;
      }

      // Check if this request was already processed
      if (processedRequestId) {
        sessionStorage.removeItem('pending_topup_amount');
        sessionStorage.removeItem('processed_topup_request_id');
        localStorage.removeItem('pending_topup_amount');
        localStorage.removeItem('processed_topup_request_id');
        setStatus('success');
        const redirectTimer = setTimeout(() => {
          navigate('/profile');
        }, 1500);
        timersRef.current.push(redirectTimer);
        return;
      }

      setAmount(Number(pendingAmount));

      // Generate unique request ID for idempotency
      const requestId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Store request ID before API call
      sessionStorage.setItem('processed_topup_request_id', requestId);
      localStorage.setItem('processed_topup_request_id', requestId);

      confirmTopup({ amount: Number(pendingAmount), requestId }, {
        onSuccess: (data) => {
          // Remove from storage after success
          sessionStorage.removeItem('pending_topup_amount');
          sessionStorage.removeItem('processed_topup_request_id');
          localStorage.removeItem('pending_topup_amount');
          localStorage.removeItem('processed_topup_request_id');
          setStatus('success');

          toast.success('Nạp tiền thành công!', {
            description: `Đã cộng ${Number(pendingAmount).toLocaleString('vi-VN')} ₫ vào tài khoản.`,
            duration: 6000,
          });

          // Use the new_balance from API response if available
          if (data?.new_balance !== undefined) {
            tokenManager.setBalance(data.new_balance);
          }

          // Automatic redirect to profile
          const redirectTimer = setTimeout(() => {
            navigate('/profile');
          }, 1500);
          timersRef.current.push(redirectTimer);
        },
        onError: () => {
          setStatus('error');
          toast.error('Giao dịch thành công nhưng cập nhật số dư thất bại.', {
            description: 'Vui lòng liên hệ bộ phận hỗ trợ.',
          });
          
          const errorRedirectTimer = setTimeout(() => {
            navigate('/profile');
          }, 3000);
          timersRef.current.push(errorRedirectTimer);
        }
      });
    };

    confirmAndRedirect();
  }, [navigate, confirmTopup]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
      >
        <div className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center transition-colors duration-500 ${
          status === 'error' ? 'bg-rose-100' : 'bg-green-100'
        }`}>
          {status === 'error' ? (
            <CheckCircle className="w-14 h-14 text-rose-600 rotate-45" />
          ) : (
            <CheckCircle className="w-14 h-14 text-green-600" />
          )}
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-3">
          {status === 'processing' ? 'Đang xác nhận...' : 
           status === 'error' ? 'Có lỗi xảy ra' : 'Thanh toán thành công!'}
        </h1>
        
        <p className="text-slate-500 mb-8">
          {status === 'processing' ? 'Vui lòng chờ trong giây lát trong khi chúng tôi cập nhật số dư của bạn.' : 
           status === 'error' ? 'Giao dịch đã hoàn tất nhưng chúng tôi gặp sự cố khi cập nhật số dư.' : 
           'Cảm ơn bạn đã sử dụng dịch vụ. Số dư ví của bạn đã được cập nhật thành công.'}
        </p>

        {amount > 0 && (
          <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Số tiền đã nạp</p>
            <p className="text-2xl font-black text-indigo-600">
              +{amount.toLocaleString('vi-VN')} ₫
            </p>
          </div>
        )}

        <div className="bg-indigo-50 rounded-2xl p-4 mb-8">
          <p className="text-sm text-indigo-600 font-medium">
            {status === 'processing' ? 'Hệ thống đang xử lý...' : 'Đang chuyển về trang cá nhân...'}
          </p>
          <div className="w-full bg-indigo-100 rounded-full h-2 mt-3 overflow-hidden">
            <div 
              className={`bg-indigo-600 h-2 rounded-full transition-all duration-700 ${status === 'processing' ? 'animate-pulse' : ''}`} 
              style={{ width: status === 'processing' ? '40%' : '100%' }}
            ></div>
          </div>
        </div>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-600/20"
        >
          <ArrowLeft size={20} />
          Quay về trang cá nhân
        </button>
      </motion.div>
    </motion.div>
  );
};

export default PaymentSuccessPage;
