import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Navbar from '../components/home/Navbar';
import Footer from '../components/home/Footer';
import { useAuth } from '../context/AuthContext';
import { User, BookMarked, BookHeart, BookmarkPlus, LogOut, Wallet, Plus } from 'lucide-react';

// React Query hooks
import { useUserBalance, useLogout as useLogoutMutation } from '../hooks/queries';

// Components
import ProfileInfo from '../components/profile/ProfileInfo';
import BorrowHistory from '../components/profile/BorrowHistory';
import ReservationList from '../components/profile/ReservationList';
import PurchasedEbooks from '../components/profile/PurchasedEbooks';
import DepositModal from '../components/profile/DepositModal';
import ConfirmModal from '../components/ui/ConfirmModal';

const UserProfilePage = () => {
  const { user, logout } = useAuth();
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();

  // Sử dụng React Query để load balance - tự động cache và refetch khi cần
  const { data: balanceData, isLoading: balanceLoading } = useUserBalance();
  const balance = balanceData?.balance || '0';

  // Mutation cho logout
  const logoutMutation = useLogoutMutation();

  if (!user) {
    navigate('/login');
    return null;
  }

  const executeLogout = () => {
    logout();
    setIsLogoutModalOpen(false);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const handleDeposit = () => {
    setIsDepositModalOpen(true);
  };

  const [activeTab, setActiveTab] = useState('info');

  const renderContent = () => {
    switch (activeTab) {
      case 'info':
         return user ? <ProfileInfo currentUser={user} onUpdate={() => {}} /> : null;
      case 'borrows':
         return <BorrowHistory />;
      case 'reservations':
         return <ReservationList />;
      case 'ebooks':
         return <PurchasedEbooks />;
      default:
         return user ? <ProfileInfo currentUser={user} onUpdate={() => {}} /> : null;
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="flex-1 py-10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Header & Balance */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-xl sm:text-2xl shadow-lg shrink-0">
                {(user?.name && typeof user.name === 'string') ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden">
                <h1 className="text-lg sm:text-2xl font-bold text-slate-800 truncate">Xin chào, {user?.name || 'Người dùng'}</h1>
                <p className="text-sm text-slate-500 truncate">{user?.email || ''}</p>
              </div>
            </div>

            <div className="bg-indigo-50/80 border border-indigo-100 px-4 sm:px-6 py-3 sm:py-4 rounded-xl flex items-center gap-4 sm:gap-6 w-full md:w-auto md:min-w-[280px]">
              <div className="flex items-center gap-3">
                <div className="p-2 sm:p-2.5 bg-white rounded-lg shadow-sm text-indigo-600">
                  <Wallet size={22} />
                </div>
                <div>
                  <p className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider">Số dư ví</p>
                  {balanceLoading ? (
                    <p className="text-base sm:text-lg font-bold text-indigo-600">Loading...</p>
                  ) : (
                    <p className="text-base sm:text-lg font-bold text-indigo-600">{Number(balance).toLocaleString('vi-VN')} ₫</p>
                  )}
                </div>
              </div>
              <button 
                onClick={handleDeposit}
                className="ml-auto flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium px-3 sm:px-4 py-2 rounded-lg transition-colors shadow-md shadow-indigo-600/20 shrink-0"
              >
                <Plus size={16} /> Nạp
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Sidebar / Mobile Tab Bar */}
            <aside className="w-full lg:w-72 shrink-0">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-2 sm:p-4 sticky top-20 sm:top-24">
                {/* Mobile: horizontal scrollable tabs */}
                <nav className="flex lg:flex-col gap-1 sm:gap-1.5 overflow-x-auto lg:overflow-x-visible pb-1 lg:pb-0 -mx-1 px-1 lg:mx-0 lg:px-0 no-scrollbar">
                  <button 
                    onClick={() => setActiveTab('info')}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-sm shrink-0 lg:w-full active:scale-95 ${activeTab === 'info' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
                  >
                    <User size={18} /> <span className="hidden sm:inline lg:inline">Thông tin</span><span className="sm:hidden lg:hidden">Cá nhân</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('borrows')}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-sm shrink-0 lg:w-full active:scale-95 ${activeTab === 'borrows' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
                  >
                    <BookMarked size={18} /> <span className="hidden sm:inline lg:inline">Sách đang mượn</span><span className="sm:hidden lg:hidden">Mượn</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('reservations')}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-sm shrink-0 lg:w-full active:scale-95 ${activeTab === 'reservations' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
                  >
                    <BookmarkPlus size={18} /> <span className="hidden sm:inline lg:inline">Đặt trước sách</span><span className="sm:hidden lg:hidden">Đặt trước</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('ebooks')}
                    className={`flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-sm shrink-0 lg:w-full active:scale-95 ${activeTab === 'ebooks' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50 active:bg-slate-100'}`}
                  >
                    <BookHeart size={18} /> <span className="hidden sm:inline lg:inline">Ebook đã mua</span><span className="sm:hidden lg:hidden">Ebook</span>
                  </button>
                  
                  <div className="hidden lg:block h-px bg-slate-100 my-2 mx-2"></div>
                  
                  <button 
                    onClick={handleLogout}
                    className="hidden lg:flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-rose-600 hover:bg-rose-50 active:bg-rose-100 transition-colors w-full"
                  >
                    <LogOut size={18} /> Đăng xuất
                  </button>
                </nav>
              </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 min-w-0">
               {renderContent()}
            </div>
          </div>

        </div>
      </motion.main>

      <DepositModal
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
      />

      <ConfirmModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={executeLogout}
        title="Xác nhận đăng xuất"
        message="Bạn có chắc chắn muốn đăng xuất khỏi hệ thống?"
        confirmText="Đăng xuất"
        cancelText="Hủy"
        type="warning"
      />

      <Footer />
    </div>
  );
};

export default UserProfilePage;
