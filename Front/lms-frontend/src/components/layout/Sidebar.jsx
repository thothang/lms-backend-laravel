import { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, BookOpen, Users, FileText, 
  Settings, LogOut, ChevronRight, BookMarked, 
  Wallet, MessageSquare, ShieldCheck, MailCheck,
  Menu, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { motion } from 'framer-motion';

import ConfirmModal from '../ui/ConfirmModal';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobileOpen]);

  const executeLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    setIsLogoutModalOpen(false);
    setIsMobileOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const getLibrarianMenu = () => {
    const rawPerms = user?.permissions;
    const hasPerm = (p) => {
      if (!rawPerms) return false;
      if (Array.isArray(rawPerms)) {
        return rawPerms.some(perm => perm === p || perm?.name === p);
      }
      return !!rawPerms[p];
    };

    const menu = [
      { name: 'Dashboard', path: '/librarian/dashboard', icon: LayoutDashboard }
    ];
    if (hasPerm('can_approve_ebook')) menu.push({ name: 'Duyệt Ebook', path: '/librarian/ebooks', icon: FileText });
    if (hasPerm('can_manage_books')) menu.push({ name: 'Quản lý Kho sách', path: '/librarian/books', icon: BookOpen });
    if (hasPerm('can_manage_borrow_offline')) {
      menu.push({ name: 'Mượn/Trả Offline', path: '/librarian/offline', icon: Users });
      menu.push({ name: 'Giao / Nhận sách', path: '/librarian/borrows', icon: BookMarked });
    }
    if (hasPerm('can_manage_reservations')) menu.push({ name: 'Quản lý Đặt trước', path: '/librarian/reservations', icon: MessageSquare });
    if (hasPerm('can_mark_lost_books')) menu.push({ name: 'Báo mất/hỏng', path: '/librarian/lost-books', icon: AlertCircle });
    if (hasPerm('can_manage_finance')) menu.push({ name: 'Quản lý Tài chính', path: '/librarian/finance', icon: Wallet });
    if (hasPerm('can_manage_users')) menu.push({ name: 'Quản lý Người dùng', path: '/librarian/users', icon: Users });
    if (hasPerm('can_view_reports')) menu.push({ name: 'Xem Báo cáo', path: '/librarian/reports', icon: FileText });
    if (hasPerm('can_manage_messages')) menu.push({ name: 'Quản lý Tin nhắn', path: '/librarian/messages', icon: MailCheck });
    return menu;
  };

  const menuItems = {
    author: [
      { name: 'Dashboard', path: '/author/dashboard', icon: LayoutDashboard },
      { name: 'Sách của tôi', path: '/author/my-ebooks', icon: FileText },
      { name: 'Đăng tải Ebook', path: '/author/upload', icon: BookOpen },
      { name: 'Doanh thu', path: '/author/earnings', icon: Wallet },
    ],
    librarian: getLibrarianMenu(),
    admin: [
      { name: 'Admin Overview', path: '/admin/dashboard', icon: ShieldCheck },
      { name: 'Quản lý người dùng', path: '/admin/users', icon: Users },
      { name: 'Phân quyền', path: '/admin/permissions', icon: MailCheck },
      { name: 'Quản lý Ebook', path: '/admin/ebooks', icon: FileText },
      { name: 'Quản lý kho sách', path: '/admin/books', icon: BookMarked },
      { name: 'Quản lý rút tiền', path: '/admin/withdrawals', icon: Wallet },
      { name: 'Cấu hình hệ thống', path: '/admin/settings', icon: Settings },
    ]
  };

  const currentMenu = menuItems[user?.role] || [];

  // Sidebar content - shared between desktop and mobile
  const SidebarContent = ({ isMobile = false }) => (
    <div className={`${
      isMobile 
        ? 'w-full h-full' 
        : `${isCollapsed ? 'w-20' : 'w-72'} h-screen sticky top-0`
    } bg-white border-r border-slate-100 flex flex-col overflow-y-auto overflow-x-hidden z-40 transition-all duration-300`}>
      {/* Sidebar Header */}
      <div className={`p-4 sm:p-6 border-b border-slate-50 flex items-center ${(isCollapsed && !isMobile) ? 'justify-center' : 'justify-between'}`}>
        {(!isCollapsed || isMobile) && (
          <Link to="/" className="flex items-center gap-3 group shrink-0">
            <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-2 rounded-xl shadow-lg shadow-indigo-200 font-bold group-hover:rotate-6 transition-transform">
              <BookOpen size={24} />
            </div>
            <div className="flex flex-col">
              <span className="font-black text-xl text-slate-800 tracking-tight leading-none">LMS<span className="text-indigo-600">Admin</span></span>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Management Portal</span>
            </div>
          </Link>
        )}
        {isMobile ? (
          <button 
            onClick={() => setIsMobileOpen(false)} 
            className="p-2 text-slate-400 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors"
          >
            <X size={22} />
          </button>
        ) : (
          <button 
            onClick={() => setIsCollapsed(!isCollapsed)} 
            className="p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-colors hidden md:block"
          >
            {isCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        )}
      </div>

      {/* User Info */}
      <div className={`p-4 sm:p-6 mb-2 ${(isCollapsed && !isMobile) ? 'hidden' : 'block'}`}>
        <div className="bg-slate-50 rounded-2xl p-3 sm:p-4 flex items-center gap-3 border border-slate-100/50">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm border-2 border-white shadow-sm shrink-0">
            {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-slate-800 text-sm truncate">{user?.name}</span>
            <span className="text-[10px] text-indigo-500 font-black uppercase tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded-md self-start mt-0.5">
              {user?.role}
            </span>
          </div>
        </div>
      </div>

      {/* Menu Sections */}
      <nav className={`flex-1 space-y-1 ${(isCollapsed && !isMobile) ? 'p-3 flex flex-col items-center' : 'px-3 sm:px-4'}`}>
        {currentMenu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={(isCollapsed && !isMobile) ? item.name : ""}
            onClick={() => isMobile && setIsMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center gap-3 py-3 sm:py-3.5 rounded-2xl text-sm font-bold transition-all group overflow-hidden
              ${(isCollapsed && !isMobile) ? 'px-3 justify-center' : 'px-3 sm:px-4'}
              ${isActive 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 active:bg-slate-100 hover:text-indigo-600'}
            `}
          >
            {({ isActive }) => (
              <>
                <item.icon 
                  size={20} 
                  className={`shrink-0 ${isActive ? 'text-white' : 'group-hover:scale-110 transition-transform'}`} 
                />
                {(!isCollapsed || isMobile) && (
                  <>
                    <span className="flex-1 whitespace-nowrap">{item.name}</span>
                    <ChevronRight size={14} className="opacity-0 group-hover:opacity-40 transition-opacity shrink-0" />
                  </>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className={`border-t border-slate-50 mt-auto ${(isCollapsed && !isMobile) ? 'p-3 flex justify-center' : 'p-3 sm:p-4'}`}>
        <button
          onClick={handleLogout}
          title={(isCollapsed && !isMobile) ? "Đăng xuất" : ""}
          className={`flex items-center gap-3 py-3 sm:py-4 text-sm font-bold text-rose-500 hover:bg-rose-50 active:bg-rose-100 rounded-2xl transition-all group
            ${(isCollapsed && !isMobile) ? 'px-3 justify-center w-auto' : 'px-3 sm:px-4 w-full'}
          `}
        >
          <LogOut size={20} className="group-hover:-translate-x-1 transition-transform shrink-0" />
          {(!isCollapsed || isMobile) && <span>Đăng xuất</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Toggle Button - Fixed top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <button 
          onClick={() => setIsMobileOpen(true)}
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 active:bg-slate-100 rounded-lg transition-colors"
          aria-label="Mở menu"
        >
          <Menu size={22} />
        </button>
        <Link to="/" className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-indigo-600 to-violet-500 text-white p-1.5 rounded-lg shadow-md font-bold">
            <BookOpen size={18} />
          </div>
          <span className="font-black text-lg text-slate-800 tracking-tight">LMS<span className="text-indigo-600">Admin</span></span>
        </Link>
        <div className="w-10"></div> {/* Spacer for centering */}
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <SidebarContent isMobile={false} />
      </div>

      {/* Mobile Sidebar Overlay */}
      {isMobileOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setIsMobileOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm shadow-2xl animate-slideInLeft">
            <SidebarContent isMobile={true} />
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi trang quản trị?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
        isLoading={isLoggingOut}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes slideInLeft {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slideInLeft { animation: slideInLeft 0.3s ease-out; }
      `}</style>
    </>
  );
};

export default Sidebar;
