import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';
import api from '../../services/api';
import { tokenManager } from '../../services/tokenManager';
import { toast } from 'sonner';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await api.get(`/verify-email/${token}`);
        
        if (response.data.access_token) {
          // Auto-login after verification using tokenManager
          tokenManager.updateAuth(
            response.data.access_token,
            response.data.user,
            response.data.user?.balance
          );
          
          toast.success('Xác thực email thành công! Bạn đã được đăng nhập tự động.');
          setStatus('success');
          setMessage('Xác thực email thành công! Tài khoản của bạn đã được kích hoạt.');
          
          // Force reload to ensure AuthContext picks up new user data
          setTimeout(() => {
            window.location.replace('/');
          }, 2000);
        } else {
          setStatus('success');
          setMessage(response.data.message || 'Xác thực email thành công! Vui lòng đăng nhập để tiếp tục.');
          
          setTimeout(() => {
            navigate('/login', { state: { verified: true } });
          }, 3000);
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Link xác thực không hợp lệ hoặc đã hết hạn.');
        toast.error(err.response?.data?.message || 'Link xác thực không hợp lệ hoặc đã hết hạn.');
      }
    };

    if (token) {
      verifyEmail();
    } else {
      setStatus('error');
      setMessage('Token xác thực không được cung cấp.');
    }
  }, [token, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center"
      >
        {status === 'loading' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-indigo-100 mb-4">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Đang xác thực email...
            </h2>
            <p className="text-slate-600">
              Vui lòng đợi trong giây lát. Chúng tôi đang xác thực địa chỉ email của bạn.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Xác thực thành công!
            </h2>
            <p className="text-slate-600 mb-6">
              {message}
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <Mail className="mr-2 h-5 w-5" />
              Đăng nhập ngay
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Xác thực thất bại
            </h2>
            <p className="text-slate-600 mb-6">
              {message}
            </p>
            <div className="space-y-3">
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Quay lại đăng nhập
              </Link>
              <Link
                to="/"
                className="inline-flex items-center justify-center w-full px-6 py-3 border border-slate-300 text-base font-medium rounded-lg text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Về trang chủ
              </Link>
            </div>
          </>
          )
        }
      </motion.div>
    </div>
  );
};

export default VerifyEmail;
