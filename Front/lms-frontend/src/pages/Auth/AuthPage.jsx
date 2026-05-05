import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Phone, MapPin, Calendar, ArrowRight, BookOpen } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { authService } from '../../services/authService';
import { tokenManager } from '../../services/tokenManager';
import { handleApiError, showSuccess } from '../../utils/toastHelper';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(location.pathname !== '/register');

  // Login form state
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginErrors, setLoginErrors] = useState({});
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  // Register form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
    phone: '',
    address: '',
    dob: ''
  });
  const [registerErrors, setRegisterErrors] = useState({});
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);
  const [isRegisterSuccess, setIsRegisterSuccess] = useState(false);

  useEffect(() => {
    if (location.state?.registered) {
      setIsLogin(true);
      toast.success('Đăng ký thành công! Vui lòng kiểm tra email để kích hoạt tài khoản trước khi đăng nhập.', {
        duration: 8000,
      });
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Login handlers
  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (loginErrors[name]) {
      setLoginErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email) {
      newErrors.email = 'Email là bắt buộc';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(loginData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!loginData.password) {
      newErrors.password = 'Mật khẩu là bắt buộc';
    }
    setLoginErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoginLoading(true);
    try {
      const result = await login(loginData.email, loginData.password);
      
      if (result.success) {
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
      setIsLoginLoading(false);
    }
  };

  // Register handlers
  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterData((prev) => ({ ...prev, [name]: value }));
    if (registerErrors[name]) {
      setRegisterErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateRegister = () => {
    const newErrors = {};
    if (!registerData.name) newErrors.name = 'Họ tên là bắt buộc';
    else if (registerData.name.length > 255) newErrors.name = 'Họ tên tối đa 255 ký tự';

    if (!registerData.email) newErrors.email = 'Email là bắt buộc';
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(registerData.email)) {
      newErrors.email = 'Email không hợp lệ';
    } else if (registerData.email.length > 255) newErrors.email = 'Email tối đa 255 ký tự';

    if (!registerData.password) newErrors.password = 'Mật khẩu là bắt buộc';
    else if (registerData.password.length < 8) newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';

    if (!registerData.password_confirmation) newErrors.password_confirmation = 'Xác nhận mật khẩu là bắt buộc';
    else if (registerData.password !== registerData.password_confirmation) {
      newErrors.password_confirmation = 'Mật khẩu xác nhận không khớp';
    }

    if (registerData.phone && registerData.phone.length > 20) newErrors.phone = 'Số điện thoại tối đa 20 ký tự';
    if (registerData.address && registerData.address.length > 500) newErrors.address = 'Địa chỉ tối đa 500 ký tự';
    
    if (registerData.dob) {
      const selectedDate = new Date(registerData.dob);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (selectedDate >= today) {
        newErrors.dob = 'Ngày sinh phải trước ngày hiện tại';
      }
    }

    setRegisterErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!validateRegister()) return;

    setIsRegisterLoading(true);

    try {
      const response = await authService.register(registerData);
      
      if (response.access_token) {
        tokenManager.updateAuth(response.access_token, response.user, response.user?.balance);
        showSuccess('Đăng ký thành công! Đang tự động đăng nhập...');
        setIsRegisterSuccess(true);
        
        setTimeout(() => {
          navigate('/');
          window.location.reload(); 
        }, 2000);
      } else {
        showSuccess(response.message || 'Đăng ký thành công. Vui lòng kiểm tra email để kích hoạt tài khoản.');
        setIsRegisterSuccess(true);
        setTimeout(() => {
          setIsLogin(true);
          setIsRegisterSuccess(false);
        }, 3000);
      }
      
    } catch (err) {
      handleApiError(err, 'Đã xảy ra lỗi trong quá trình đăng ký.');
      
      if (err.response && err.response.status === 422) {
        const backendErrors = err.response.data.errors;
        const newFormErrors = {};
        for (const key in backendErrors) {
          if (backendErrors.hasOwnProperty(key)) {
            newFormErrors[key] = backendErrors[key][0];
          }
        }
        setRegisterErrors(newFormErrors);
      }
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction) => ({
      x: direction > 0 ? -100 : 100,
      opacity: 0,
      scale: 0.95,
    }),
  };

  const imageVariants = {
    login: {
      opacity: 1,
      scale: 1,
    },
    register: {
      opacity: 1,
      scale: 1,
    },
  };

  const loginImage = "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";
  const registerImage = "https://images.unsplash.com/photo-1507842217343-583bb7270b66?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80";

  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* Left Column: Image */}
      <div className="hidden lg:block relative flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLogin ? 'login' : 'register'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-indigo-900/20 mix-blend-multiply z-10" />
            <img 
              src={isLogin ? loginImage : registerImage} 
              alt={isLogin ? "Bookshelf" : "Library"}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col justify-end p-12 bg-gradient-to-t from-slate-900/90 via-slate-900/30 to-transparent">
              <blockquote className="space-y-2">
                <p className="text-3xl font-bold text-white mb-4 leading-normal">
                  {isLogin 
                    ? '"Đọc cuốn sách hay cũng như được trò chuyện với những người bạn tuyệt vời."' 
                    : '"Học tập là ngọn lửa, không phải sự lấp đầy của một thùng."'}
                </p>
                <footer className="text-slate-200 text-lg">
                  {isLogin ? 'Chia sẻ tri thức, kết nối cộng đồng.' : 'Khởi đầu hành trình tri thức của bạn.'}
                </footer>
              </blockquote>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Right Column: Forms with Flip Animation */}
      <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-16 xl:px-24 bg-white relative">
        <Link to="/" className="absolute top-8 right-6 sm:right-10 lg:right-16 flex items-center gap-2 group hover:opacity-90 transition-opacity">
          <span className="font-bold text-lg text-slate-800">LMS<span className="text-indigo-600">Library</span></span>
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-1.5 rounded-lg shadow-md font-bold group-hover:-rotate-6 transition-transform">
             <BookOpen size={20} />
          </div>
        </Link>

        {/* Decorative blobs */}
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-pink-50 blur-3xl opacity-50 pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-50 blur-3xl opacity-50 pointer-events-none" />

        <div className="mx-auto w-full max-w-md relative z-10">
          <AnimatePresence mode="wait">
            {isLogin ? (
              <motion.div
                key="login"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={1}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <div className="text-center mb-4">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Đăng nhập hệ thống
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Chưa có tài khoản?{' '}
                    <button
                      onClick={() => setIsLogin(false)}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      Đăng ký ngay
                    </button>
                  </p>
                </div>

                <form className="space-y-3" onSubmit={handleLoginSubmit}>
                  <Input
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    icon={Mail}
                    value={loginData.email}
                    onChange={handleLoginChange}
                    error={loginErrors.email}
                    autoComplete="off"
                  />

                  <Input
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    icon={Lock}
                    value={loginData.password}
                    onChange={handleLoginChange}
                    error={loginErrors.password}
                    autoComplete="current-password"
                  />

                  <Button
                    type="submit"
                    className="w-full px-8 h-12 text-base font-medium mt-4"
                    isLoading={isLoginLoading}
                  >
                    {!isLoginLoading && (
                      <>
                        Đăng nhập <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="register"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                custom={-1}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                className="w-full"
              >
                <div className="text-center mb-4 mt-2">
                  <h2 className="text-3xl font-bold tracking-tight text-slate-900">
                    Tạo tài khoản mới
                  </h2>
                  <p className="mt-2 text-sm text-slate-600">
                    Đã có tài khoản?{' '}
                    <button
                      onClick={() => setIsLogin(true)}
                      className="font-medium text-indigo-600 hover:text-indigo-500 transition-colors"
                    >
                      Đăng nhập tại đây
                    </button>
                  </p>
                </div>

                <form className="space-y-3" onSubmit={handleRegisterSubmit}>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
                    <Input
                      name="name"
                      type="text"
                      placeholder="Nguyễn Văn A"
                      icon={User}
                      value={registerData.name}
                      onChange={handleRegisterChange}
                      error={registerErrors.name}
                      autoComplete="off"
                    />

                    <Input
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      icon={Mail}
                      value={registerData.email}
                      onChange={handleRegisterChange}
                      error={registerErrors.email}
                      autoComplete="off"
                    />

                    <Input
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      icon={Lock}
                      value={registerData.password}
                      onChange={handleRegisterChange}
                      error={registerErrors.password}
                      autoComplete="new-password"
                    />

                    <Input
                      name="password_confirmation"
                      type="password"
                      placeholder="••••••••"
                      icon={Lock}
                      value={registerData.password_confirmation}
                      onChange={handleRegisterChange}
                      error={registerErrors.password_confirmation}
                      autoComplete="new-password"
                    />

                    <Input
                      name="phone"
                      type="tel"
                      placeholder="0912345678"
                      icon={Phone}
                      value={registerData.phone}
                      onChange={handleRegisterChange}
                      error={registerErrors.phone}
                      autoComplete="off"
                    />

                    <Input
                      name="dob"
                      type="date"
                      icon={Calendar}
                      value={registerData.dob}
                      onChange={handleRegisterChange}
                      error={registerErrors.dob}
                      autoComplete="off"
                    />
                  </div>

                  <Input
                    name="address"
                    type="text"
                    placeholder="Số nhà, Tên đường, Phường/Xã..."
                    icon={MapPin}
                    value={registerData.address}
                    onChange={handleRegisterChange}
                    error={registerErrors.address}
                    autoComplete="off"
                  />

                  <Button
                    type="submit"
                    className="w-full sm:w-auto px-8 h-12 text-base font-medium mt-2 lg:float-right"
                    isLoading={isRegisterLoading}
                    disabled={isRegisterSuccess}
                  >
                    {!isRegisterLoading && (
                      <>
                        Tạo tài khoản <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
