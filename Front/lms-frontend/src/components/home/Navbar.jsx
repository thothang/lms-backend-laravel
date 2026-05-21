import { Search, Menu, BookOpen, Bell, Settings, LogOut, Loader2, LayoutDashboard as DashboardIcon, X, Home, BookText, Info, FileText, Mail, Clock, Check } from 'lucide-react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications, useMarkNotificationRead } from '../../hooks/queries';
import { publicService } from '../../services/publicService';
import { motion, AnimatePresence } from 'framer-motion';

import ConfirmModal from '../ui/ConfirmModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showAllNotifications, setShowAllNotifications] = useState(false);

  // React Query hooks
  const isActive = user?.status === 'active';
  const notificationsQuery = useNotifications(!!user && isActive);
  const markNotificationReadMutation = useMarkNotificationRead();

  // Mobile menu state
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Dropdown states (click-based for touch support)
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Search states
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Refs
  const searchAbortRef = useRef(null);
  const searchDebounceRef = useRef(null);
  const profileDropdownRef = useRef(null);
  const notificationDropdownRef = useRef(null);
  const searchDropdownRef = useRef(null);

  // Extract data from query
  const notificationsData = notificationsQuery.data;
  const notifications = Array.isArray(notificationsData)
    ? notificationsData
    : (notificationsData?.data || notificationsData?.notifications || []);
  const unreadCount = Array.isArray(notifications)
    ? notifications.filter(n => !n.is_read && !n.read_at).length
    : 0;
  const isLoadingNotifications = notificationsQuery.isLoading;

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsMobileSearchOpen(false);
    setIsProfileDropdownOpen(false);
    setShowNotifications(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileMenuOpen]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationDropdownRef.current && !notificationDropdownRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target)) {
        setShowSearchDropdown(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
        setIsProfileDropdownOpen(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const markAsRead = (id) => {
    markNotificationReadMutation.mutate(id);
  };

  const handleMouseEnterNotification = (notif) => {
    if (!notif.is_read && !notif.read_at) {
      markAsRead(notif.id);
    }
  };

  const executeLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLogoutModalOpen(false);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
    setIsMobileMenuOpen(false);
  };

  // Search handler with debounce and abort previous request
  const handleSearch = useCallback((keyword) => {
    setSearchKeyword(keyword);
    
    // Clear previous debounce timer
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }
    
    // Clear previous request
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    if (!keyword.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    // Create new AbortController for this request
    const abortController = new AbortController();
    searchAbortRef.current = abortController;

    // Debounce search request
    searchDebounceRef.current = setTimeout(() => {
      setIsSearching(true);
      setShowSearchDropdown(true);

      publicService.search({ keyword, limit: 5 })
        .then(res => {
          const booksData = res?.books?.data || [];
          const ebooksData = res?.ebooks?.data || [];

          const formattedBooks = booksData.map(b => ({ ...b, _type: 'book' }));
          const formattedEbooks = ebooksData.map(e => ({ ...e, _type: 'ebook' }));

          let combined = [...formattedBooks, ...formattedEbooks];
          combined.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

          setSearchResults(combined.slice(0, 5));
        })
        .catch(() => {})
        .finally(() => {
          setIsSearching(false);
        });
    }, 400);

    // Cleanup function
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (!abortController.signal.aborted) {
        abortController.abort();
      }
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
      if (searchAbortRef.current) {
        searchAbortRef.current.abort();
      }
    };
  }, []);

  const navLinkClass = ({ isActive }) => 
    isActive 
      ? "text-sm font-semibold text-indigo-600 border-b-2 border-indigo-600 pb-1" 
      : "text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors pb-1";

  const mobileNavLinkClass = ({ isActive }) =>
    `flex items-center gap-3 px-4 py-3.5 rounded-xl text-base font-medium transition-all ${
      isActive 
        ? 'bg-indigo-50 text-indigo-600 font-semibold' 
        : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'
    }`;

  return (
    <>
      <nav className="sticky top-0 z-50 glass transition-all duration-300 w-full border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 md:h-20">

            {/* Logo and Brand */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
              <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2 text-xl rounded-xl shadow-lg shadow-indigo-500/30 font-bold hover:rotate-6 transition-transform">
                <BookOpen size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800 hidden sm:block">
                LMS<span className="text-indigo-600">Library</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex space-x-8 items-center bg-white/50 rounded-full px-6 py-2 border border-slate-200/50 backdrop-blur-md shadow-sm">
              <NavLink to="/" className={navLinkClass}>Trang chủ</NavLink>
              <NavLink to="/catalog" className={navLinkClass}>Danh Mục</NavLink>
              <NavLink to="/about" className={navLinkClass}>Về chúng tôi</NavLink>
              <NavLink to="/contact" className={navLinkClass}>Liên hệ</NavLink>
              <NavLink to="/borrowing-rules" className={navLinkClass}>Quy định</NavLink>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-2 sm:gap-3">

              {/* Search Bar - Desktop */}
              <div className="hidden lg:flex items-center relative group" ref={searchDropdownRef}>
                <input
                  type="text"
                  placeholder="Tìm sách, tác giả..."
                  value={searchKeyword}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => { if (searchKeyword.trim()) setShowSearchDropdown(true) }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && searchKeyword.trim()) {
                      setShowSearchDropdown(false);
                      navigate(`/catalog?keyword=${encodeURIComponent(searchKeyword)}`);
                    }
                  }}
                  className="bg-white/80 border border-slate-300 text-slate-700 text-sm rounded-full pl-10 pr-4 py-2 w-48 lg:w-64 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all duration-300 shadow-inner relative z-20"
                />
                <Search size={18} className="absolute left-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-20" />

                {/* Search Dropdown */}
                <AnimatePresence>
                  {showSearchDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                      className="absolute top-12 left-0 w-full min-w-[320px] bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50"
                    >
                    {isSearching ? (
                      <div className="flex items-center justify-center py-6 text-indigo-600">
                        <Loader2 size={24} className="animate-spin" />
                      </div>
                    ) : searchResults.length > 0 ? (
                      <div className="flex flex-col">
                        {searchResults.map(book => (
                          <div
                            key={`${book._type}-${book.id}`}
                            className="flex items-center gap-3 p-3 hover:bg-slate-50 border-b border-slate-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setShowSearchDropdown(false);
                              navigate(`/catalog?keyword=${encodeURIComponent(book.title)}`);
                            }}
                          >
                            <img src={book.cover_image || 'https://placehold.co/100x150/1e293b/94a3b8?text=Book'} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm shrink-0" />
                            <div className="flex-1 overflow-hidden">
                              <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{book.title}</h4>
                              <p className="text-xs text-slate-500 truncate">{book.uploaded_by_admin ? (book.author_name || 'Đang cập nhật') : (book.author?.name || book.author_name || book.author || 'Đang cập nhật')}</p>
                              <span className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5 inline-block">{book._type === 'ebook' ? 'E-Book' : 'Sách giấy'}</span>
                            </div>
                          </div>
                        ))}
                        <Link
                          to={`/catalog?keyword=${encodeURIComponent(searchKeyword)}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="p-3 text-center text-sm font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 transition-colors"
                        >
                          Xem tất cả kết quả
                        </Link>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-sm text-slate-500">
                        Không tìm thấy cuốn sách nào phù hợp.
                      </div>
                    )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Search Button */}
              <button 
                className="lg:hidden text-slate-500 hover:text-indigo-600 transition-colors p-2 rounded-lg active:bg-slate-100"
                onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
                aria-label="Tìm kiếm"
              >
                <Search size={20} />
              </button>

              {user ? (
                <div className="flex items-center gap-1 sm:gap-2">
                  {/* Bell Icon with Notifications */}
                  <div className="relative" ref={notificationDropdownRef}>
                    <button 
                      className="text-slate-500 hover:text-indigo-600 transition-colors relative p-2 rounded-lg active:bg-slate-100"
                      onClick={() => {
                        setShowNotifications(!showNotifications);
                        setIsProfileDropdownOpen(false);
                      }}
                      aria-label="Thông báo"
                    >
                      <Bell size={20} />
                      {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white text-[10px] font-bold text-white flex items-center justify-center">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </button>
                    
                    {/* Notifications Dropdown */}
                    {showNotifications && (
                      <div className="fixed sm:absolute inset-x-4 sm:inset-x-auto sm:right-0 sm:left-auto top-16 sm:top-full w-auto sm:w-80 max-w-[calc(100vw-2rem)] sm:max-w-none bg-white rounded-xl shadow-2xl border border-slate-100 z-50 mt-2 mx-auto sm:mx-0">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                          <h3 className="font-semibold text-slate-800">Thông báo</h3>
                          <button
                            onClick={() => notificationsQuery.refetch()}
                            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Làm mới
                          </button>
                        </div>
                        <div className="max-h-80 overflow-y-auto">
                          {isLoadingNotifications ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 size={24} className="animate-spin text-indigo-600" />
                            </div>
                          ) : notifications.length === 0 ? (
                            <div className="p-4 text-sm text-slate-500 text-center">
                              Chưa có thông báo mới
                            </div>
                          ) : (
                            <div className="divide-y divide-slate-50">
                              {notifications.slice(0, 10).map((notif) => (
                                <div
                                  key={notif.id}
                                  onClick={() => {
                                    if (!notif.is_read) markAsRead(notif.id);
                                    setSelectedNotification(notif);
                                    setShowNotifications(false);
                                  }}
                                  onMouseEnter={() => handleMouseEnterNotification(notif)}
                                  className={`p-4 cursor-pointer hover:bg-slate-50 active:bg-slate-100 transition-colors ${!notif.is_read ? 'bg-indigo-50/50' : ''}`}
                                >
                                  <div className="flex items-start gap-3">
                                    {!notif.is_read && (
                                      <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 shrink-0"></div>
                                    )}
                                    <div className="flex-1">
                                      <p className="text-sm font-semibold text-slate-800">{notif.title}</p>
                                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{notif.content}</p>
                                      {notif.created_at && (
                                        <p className="text-[10px] text-slate-400 mt-2">
                                          {new Date(notif.created_at).toLocaleString('vi-VN')}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="p-3 border-t border-slate-100">
                          <button
                            onClick={() => { setShowNotifications(false); setShowAllNotifications(true); }}
                            className="w-full text-center text-sm font-medium text-indigo-600 hover:text-indigo-700 py-2 rounded-lg active:bg-indigo-50"
                          >
                            Xem tất cả thông báo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Profile & Username */}
                  <div className="relative" ref={profileDropdownRef}>
                    <button 
                      className="flex items-center gap-2 cursor-pointer p-1 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
                      onClick={() => {
                        setIsProfileDropdownOpen(!isProfileDropdownOpen);
                        setShowNotifications(false);
                      }}
                    >
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-sm sm:text-lg shadow-md">
                        {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <span className="text-sm font-semibold text-slate-700 hidden sm:block truncate max-w-[120px]" title={user?.name}>
                        {user?.name || 'Người dùng'}
                      </span>
                    </button>

                    {/* Dropdown Menu - Click toggle */}
                    {isProfileDropdownOpen && (
                      <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 z-50 flex flex-col p-2">
                        <Link 
                          to="/profile" 
                          className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-50 active:bg-slate-100 hover:text-indigo-600 rounded-lg transition-colors"
                          onClick={() => setIsProfileDropdownOpen(false)}
                        >
                          <Settings size={16} /> Trang cá nhân
                        </Link>
                        {user && ['author', 'librarian', 'admin'].includes(user.role) && (
                          <Link 
                            to={`/${user.role}/dashboard`} 
                            className="flex items-center gap-2 px-3 py-2.5 text-sm font-bold text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100 rounded-lg transition-colors"
                            onClick={() => setIsProfileDropdownOpen(false)}
                          >
                            <DashboardIcon size={16} /> Trang quản trị
                          </Link>
                        )}
                        <div className="h-px bg-slate-100 my-1"></div>
                        <button 
                          onClick={() => { setIsProfileDropdownOpen(false); handleLogout(); }} 
                          className="flex items-center gap-2 px-3 py-2.5 text-sm text-rose-600 hover:bg-rose-50 active:bg-rose-100 rounded-lg transition-colors w-full text-left font-medium"
                        >
                          <LogOut size={16} /> Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Login/Register - Desktop */
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-4 py-2 rounded-full transition-colors flex items-center gap-2">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-violet-600 px-5 py-2.5 rounded-full shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 transform inline-block">
                    Đăng ký
                  </Link>
                </div>
              )}

              {/* Mobile Menu Button */}
              <button 
                className="md:hidden text-slate-500 hover:text-indigo-600 p-2 rounded-lg active:bg-slate-100 transition-colors"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Menu"
              >
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>

            </div>
          </div>
        </div>

        {/* Mobile Search Bar - Expandable */}
        {isMobileSearchOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white/95 backdrop-blur-md px-4 py-3 animate-slideDown">
            <div className="relative" ref={searchDropdownRef}>
              <input
                type="text"
                placeholder="Tìm sách, tác giả..."
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => { if (searchKeyword.trim()) setShowSearchDropdown(true) }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchKeyword.trim()) {
                    setShowSearchDropdown(false);
                    setIsMobileSearchOpen(false);
                    setSearchKeyword('');
                    navigate(`/catalog?keyword=${encodeURIComponent(searchKeyword)}`);
                  }
                }}
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-xl pl-10 pr-10 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
              />
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <button
                onClick={() => { setIsMobileSearchOpen(false); setSearchKeyword(''); setShowSearchDropdown(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={16} />
              </button>

              {/* Mobile Search Results */}
              <AnimatePresence>
                {showSearchDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50 max-h-[60vh] overflow-y-auto"
                  >
                  {isSearching ? (
                    <div className="flex items-center justify-center py-6 text-indigo-600">
                      <Loader2 size={24} className="animate-spin" />
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="flex flex-col">
                      {searchResults.map(book => (
                        <div
                          key={`m-${book._type}-${book.id}`}
                          className="flex items-center gap-3 p-3 hover:bg-slate-50 active:bg-slate-100 border-b border-slate-50 cursor-pointer transition-colors"
                          onClick={() => {
                            setShowSearchDropdown(false);
                            setIsMobileSearchOpen(false);
                            setSearchKeyword('');
                            navigate(`/catalog?keyword=${encodeURIComponent(book.title)}`);
                          }}
                        >
                          <img src={book.cover_image || 'https://placehold.co/100x150/1e293b/94a3b8?text=Book'} alt={book.title} className="w-10 h-14 object-cover rounded shadow-sm shrink-0" />
                          <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-semibold text-slate-800 line-clamp-1">{book.title}</h4>
                            <p className="text-xs text-slate-500 truncate">{book.uploaded_by_admin ? (book.author_name || 'Đang cập nhật') : (book.author?.name || book.author_name || book.author || 'Đang cập nhật')}</p>
                            <span className="text-[10px] font-bold text-indigo-600 uppercase mt-0.5 inline-block">{book._type === 'ebook' ? 'E-Book' : 'Sách giấy'}</span>
                          </div>
                        </div>
                      ))}
                      <Link
                        to={`/catalog?keyword=${encodeURIComponent(searchKeyword)}`}
                        onClick={() => { setShowSearchDropdown(false); setIsMobileSearchOpen(false); setSearchKeyword(''); }}
                        className="p-3 text-center text-sm font-medium text-indigo-600 bg-indigo-50/50 hover:bg-indigo-50 active:bg-indigo-100 transition-colors"
                      >
                        Xem tất cả kết quả
                      </Link>
                    </div>
                  ) : searchKeyword.trim() ? (
                    <div className="py-6 text-center text-sm text-slate-500">
                      Không tìm thấy cuốn sách nào phù hợp.
                    </div>
                  ) : null}
                  </motion.div>
                )}
                </AnimatePresence>
            </div>
          </div>
        )}
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 z-[60]"
          >
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
          />

          {/* Menu Panel - Slide from right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <Link 
                to="/" 
                className="flex items-center gap-2"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2 rounded-xl shadow-lg shadow-indigo-500/30 font-bold">
                  <BookOpen size={20} />
                </div>
                <span className="font-bold text-lg tracking-tight text-slate-800">
                  LMS<span className="text-indigo-600">Library</span>
                </span>
              </Link>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 active:bg-slate-100 transition-colors"
                aria-label="Đóng menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* User Info (if logged in) */}
            {user && (
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-lg shadow-md">
                    {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="font-bold text-slate-800 truncate">{user?.name || 'Người dùng'}</p>
                    <span className="text-xs text-indigo-600 font-bold uppercase bg-indigo-50 px-2 py-0.5 rounded-md">
                      {user?.role}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Links */}
            <nav className="flex-1 p-4 space-y-1">
              <NavLink to="/" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Home size={20} /> Trang chủ
              </NavLink>
              <NavLink to="/catalog" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <BookText size={20} /> Danh Mục
              </NavLink>
              <NavLink to="/about" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Info size={20} /> Về chúng tôi
              </NavLink>
              <NavLink to="/contact" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <Mail size={20} /> Liên hệ
              </NavLink>
              <NavLink to="/borrowing-rules" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                <FileText size={20} /> Quy định
              </NavLink>

              {user && (
                <>
                  <div className="h-px bg-slate-200 my-3"></div>
                  <button
                    onClick={() => { setIsMobileMenuOpen(false); setShowAllNotifications(true); }}
                    className={mobileNavLinkClass}
                  >
                    <Bell size={20} /> Thông báo
                  </button>
                  <NavLink to="/profile" className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                    <Settings size={20} /> Trang cá nhân
                  </NavLink>
                  {['author', 'librarian', 'admin'].includes(user.role) && (
                    <NavLink to={`/${user.role}/dashboard`} className={mobileNavLinkClass} onClick={() => setIsMobileMenuOpen(false)}>
                      <DashboardIcon size={20} /> Trang quản trị
                    </NavLink>
                  )}
                </>
              )}
            </nav>

            {/* Mobile Footer Actions */}
            <div className="p-4 border-t border-slate-100 space-y-2">
              {user ? (
                <button 
                  onClick={handleLogout}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 active:bg-rose-200 rounded-xl transition-colors"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              ) : (
                <>
                  <Link 
                    to="/login" 
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 active:bg-indigo-200 rounded-xl transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link 
                    to="/register" 
                    className="flex items-center justify-center gap-2 w-full py-3 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.98] transition-all"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Đăng ký miễn phí
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
        )}
        </AnimatePresence>

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
        isLoading={isLoggingOut}
      />

      {/* Notification Detail Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setSelectedNotification(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden relative border border-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-indigo-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">{selectedNotification.title}</h3>
                    <p className="text-slate-500 text-sm">Thông báo</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedNotification(null)}
                  className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400"
                  aria-label="Đóng thông báo"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-slate-50 p-4 rounded-xl mb-4">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{selectedNotification.content}</p>
                </div>

                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <Clock size={14} />
                    <span>{new Date(selectedNotification.created_at).toLocaleString('vi-VN')}</span>
                  </div>
                  {selectedNotification.is_read && (
                    <div className="flex items-center gap-2 text-emerald-600">
                      <Check size={14} />
                      <span>Đã đọc</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notification Drawer */}
      <AnimatePresence>
        {showAllNotifications && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowAllNotifications(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                    <Bell size={20} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-800">Thông báo</h3>
                    <p className="text-slate-500 text-sm">
                      {notifications.filter(n => !n.is_read).length} chưa đọc
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllNotifications(false)}
                  className="p-2 hover:bg-white rounded-full transition-colors text-slate-400"
                  aria-label="Đóng danh sách thông báo"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50">
                {isLoadingNotifications ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-12 text-center text-slate-500">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Bell size={24} className="text-slate-300" />
                    </div>
                    <p className="font-medium">Chưa có thông báo nào</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        if (!notif.is_read) markAsRead(notif.id);
                        setSelectedNotification(notif);
                      }}
                      onMouseEnter={() => handleMouseEnterNotification(notif)}
                      className={`bg-white p-4 rounded-xl cursor-pointer transition-all hover:shadow-md border ${
                        !notif.is_read
                          ? 'border-l-4 border-l-indigo-500 border-slate-100'
                          : 'border-slate-200 opacity-75'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          !notif.is_read ? 'bg-indigo-100' : 'bg-slate-100'
                        }`}>
                          <Bell size={16} className={!notif.is_read ? 'text-indigo-600' : 'text-slate-400'} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-bold text-slate-800 ${!notif.is_read ? 'text-sm' : 'text-xs'}`}>
                            {notif.title}
                          </h4>
                          <p className="text-slate-600 text-sm line-clamp-2">{notif.content}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(notif.created_at).toLocaleString('vi-VN')}
                          </p>
                        </div>
                        {!notif.is_read && (
                          <div className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CSS Animations */}
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-slideDown { animation: slideDown 0.2s ease-out; }
        .animate-slideInRight { animation: slideInRight 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default Navbar;
