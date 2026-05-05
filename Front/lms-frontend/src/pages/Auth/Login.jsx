import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../context/AuthContext';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    if (location.state?.registered) {
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.', {
        duration: 8000,
      });
      // Clear state so it doesn't show again on refresh
      window.history.replaceState({}, document.title)
    }
  }, [location]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await login(formData.email, formData.password);
      
      if (result.success) {
        // Check user status
        if (result.user?.status === 'unverified') {
          toast.warning('Tài khoản của bạn chưa được xác minh. Vui lòng kiểm tra email để kích hoạt tài khoản.');
        } else {
          showSuccess('Đăng nhập thành công!');
          navigate('/');
        }
      } else {
        handleApiError({ response: { data: { message: result.error } } }, 'Đăng nhập thất bại.');
      }
    } catch (err) {
      handleApiError(err, 'Đã xảy ra lỗi khi đăng nhập.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column: Form */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-20 xl:px-24 bg-white relative lg:max-w-2xl w-full">
        <Link to="/" className="absolute top-8 left-6 sm:left-10 lg:left-20 flex items-center gap-2 group hover:opacity-90 transition-opacity">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-1.5 rounded-lg shadow-md font-bold group-hover:rotate-6 transition-transform">
             <BookOpen size={20} />
          </div>
          <span className="font-bold text-lg text-slate-800">LMS<span className="text-indigo-600">Library</span></span>
        </Link>

        {/* Decorative blobs for form side */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50 blur-3xl opacity-50 pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full max-w-sm lg:w-96 relative z-10"
        >
          <div className="text-center md:text-left mb-8">
            <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
              Đăng nhập hệ thống
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Chưa có tài khoản?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Đăng ký ngay
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <AnimatePresence>
              {/* Messages now handled by global toast */}
            </AnimatePresence>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                  Địa chỉ Email
                </label>
                <Input
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  icon={Mail}
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium leading-6 text-slate-900">
                    Mật khẩu
                  </label>
                  <a href="#" className="font-medium text-sm text-indigo-600 hover:text-indigo-500">
                    Quên mật khẩu?
                  </a>
                </div>
                <Input
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  icon={Lock}
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-slate-700">
                  Ghi nhớ đăng nhập
                </label>
              </div>

              <Button
                type="submit"
                className="w-full h-12 text-base font-medium"
                isLoading={isLoading}
              >
                {!isLoading && (
                  <>
                    Đăng nhập <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Right Column: Image Cover */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-indigo-900/30 mix-blend-multiply z-10" />
        <img 
          src="https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=2000&q=80" 
          alt="Library" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
          <blockquote className="space-y-2">
            <p className="text-3xl font-bold text-white mb-4 leading-normal">
              "Sách là ngọn đèn sáng bất diệt của trí tuệ con người."
            </p>
            <footer className="text-slate-300 text-lg">Hệ thống thư viện điện tử thông minh.</footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default Login;
