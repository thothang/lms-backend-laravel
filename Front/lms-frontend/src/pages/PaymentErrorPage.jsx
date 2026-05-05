import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const PaymentErrorPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    toast.error('Thanh toán thất bại!', {
      description: 'Đã có lỗi xảy ra trong quá trình thanh toán.',
      duration: 5000,
    });

    const timer = setTimeout(() => {
      navigate('/profile');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-orange-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
        className="bg-white rounded-3xl shadow-2xl p-10 max-w-md w-full text-center"
      >
        <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-rose-100 flex items-center justify-center">
          <XCircle className="w-14 h-14 text-rose-600" />
        </div>
        
        <h1 className="text-3xl font-black text-slate-800 mb-3">
          Thanh toán thất bại!
        </h1>
        
        <p className="text-slate-500 mb-8">
          Đã có lỗi xảy ra trong quá trình thanh toán. Vui lòng thử lại.
        </p>

        <button
          onClick={() => navigate('/profile')}
          className="flex items-center justify-center gap-2 w-full py-3 px-6 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-rose-600/20"
        >
          <ArrowLeft size={20} />
          Quay về trang cá nhân
        </button>
      </motion.div>
    </motion.div>
  );
};

export default PaymentErrorPage;