import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const PageWrapper = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <ErrorBoundary>
      {/* Skip link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[9999] focus:bg-indigo-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-medium"
      >
        Chuyển đến nội dung chính
      </a>

      {user?.status === 'unverified' && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 pt-4 sticky top-0 z-50 shadow-sm" role="alert">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <p>
               Tài khoản của bạn chưa được xác thực email. Một số tính năng như mượn sách, nạp tiền bị giới hạn. 
               Vui lòng kiểm tra hộp thư email của bạn!
            </p>
          </div>
        </div>
      )}
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
    </ErrorBoundary>
  );
};

export default PageWrapper;
