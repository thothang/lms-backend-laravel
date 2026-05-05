import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Lock, Phone, MapPin, Calendar, ArrowRight, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { tokenManager } from '../../services/tokenManager';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    address: '',
    dob: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = 'Họ tên là bắt buộc';
    else if (formData.name.length > 255) newErrors.name = 'Họ tên tối đa 255 ký tự';

    if (!formData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    } else if (formData.email.length > 255) newErrors.email = 'Email tối đa 255 ký tự';

    if (!formData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    else if (formData.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';

    if (!formData.password_confirmation) newErrors.password_confirmation = 'Xác nhận mật khẩu là bắt buộc';
    else if (formData.password !== formData.password_confirmation) {
      newErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
    }

    if (formData.phone && formData.phone.length > 20) newErrors.phone = 'Số điện thoại tối đa 20 ký tự';
    if (formData.address && formData.address.length > 500) newErrors.address = 'Địa chỉ tối đa 500 ký tự';
    
    if (formData.dob) {
      const selectedDate = new Date(formData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of today
      if (selectedDate >= today) {
        newErrors.dob = 'Ngày sinh phải trước ngày hiện tại';
      }
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
      const response = await authService.register(formData);
      
      // Handle auto-login if token is returned
      if (response.access_token) {
        tokenManager.updateAuth(response.access_token, response.user, response.user?.balance);
        showSuccess('Đăng ký thành công! Đang tự động đăng nhập...');
        setIsSuccess(true);
        
        setTimeout(() => {
          navigate('/');
          window.location.reload(); 
        }, 2000);
      } else {
        showSuccess(response.message || 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.');
        setIsSuccess(true);
        setTimeout(() => {
          navigate('/login', { state: { registered: true }});
        }, 4000);
      }
      
    } catch (err) {
      handleApiError(err, 'Đã xảy ra lỗi trong quá trình đăng ký.');
      
      // Still populate field errors if 422
      if (err.response && err.response.status === 422) {
        const backendErrors = err.response.data.errors;
        const newFormErrors = {};
        for (const key in backendErrors) {
          if (backendErrors.hasOwnProperty(key)) {
            newFormErrors[key] = backendErrors[key][0];
          }
        }
        setErrors(newFormErrors);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Right Column: Image Cover (Swapped side for variety) */}
      <div className="hidden lg:block relative flex-1">
        <div className="absolute inset-0 bg-pink-900/10 mix-blend-multiply z-10" />
        <img 
          src="https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
          alt="Bookshelf" 
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent">
          <blockquote className="space-y-2">
            <p className="text-3xl font-bold text-white mb-4 leading-normal">
              "Đọc cuốn sách hay cũng như được trò chuyện với những người bạn tuyệt vời."
            </p>
            <footer className="text-slate-200 text-lg">Chia sẻ tri thức, kết nối cộng đồng.</footer>
          </blockquote>
        </div>
      </div>

      {/* Left Column: Form (Now on the right visually) */}
      <div className="flex-[1.2] flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white relative w-full lg:max-w-3xl">
        <Link to="/" className="absolute top-8 right-6 sm:right-10 lg:right-16 flex items-center gap-2 group hover:opacity-90 transition-opacity">
          <span className="font-bold text-lg text-slate-800">LMS<span className="text-indigo-600">Library</span></span>
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-1.5 rounded-lg shadow-md font-bold group-hover:-rotate-6 transition-transform">
             <BookOpen size={20} />
          </div>
        </Link>

        {/* Decorative blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-50 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50 blur-3xl opacity-50 pointer-events-none" />

        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto w-full relative z-10"
        >
          <div className="text-center lg:text-left mb-8 mt-10 lg:mt-4">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Tạo tài khoản mới
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Đã có tài khoản?{' '}
              <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                Đăng nhập tại đây
              </Link>
            </p>
          </div>

          <div className="mt-8">
            <AnimatePresence>
               {/* Messages now handled by global toast */}
            </AnimatePresence>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    icon={User}
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Địa chỉ Email <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={formData.email}
                    onChange={handleChange}
                    error={errors.email}
                    autoComplete="off"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={formData.password}
                    onChange={handleChange}
                    error={errors.password}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <Input
                    name="password_confirmation"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={formData.password_confirmation}
                    onChange={handleChange}
                    error={errors.password_confirmation}
                    autoComplete="new-password"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Số điện thoại
                  </label>
                  <Input
                    name="phone"
                    type="tel"
                    placeholder="0912345678"
                    icon={Phone}
                    value={formData.phone}
                    onChange={handleChange}
                    error={errors.phone}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                    Ngày sinh
                  </label>
                  <Input
                    name="dob"
                    type="date"
                    icon={Calendar}
                    value={formData.dob}
                    onChange={handleChange}
                    error={errors.dob}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium leading-6 text-slate-900 mb-2">
                  Địa chỉ
                </label>
                <Input
                  name="address"
                  type="text"
                  placeholder="Số nhà, Tên đường, Phường/Xã..."
                  icon={MapPin}
                  value={formData.address}
                  onChange={handleChange}
                  error={errors.address}
                  autoComplete="off"
                />
              </div>

              <Button
                type="submit"
                className="w-full sm:w-auto px-8 h-12 text-base font-medium mt-4 lg:float-right"
                isLoading={isLoading}
                disabled={isSuccess}
              >
                {!isLoading && (
                  <>
                    Tạo tài khoản <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
