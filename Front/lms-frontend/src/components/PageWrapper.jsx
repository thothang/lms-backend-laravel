import ErrorBoundary from './ErrorBoundary';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';

export const PageWrapper = ({ children }) => {
  const { user } = useAuth();
  
  return (
    <ErrorBoundary>
      {user?.status === 'unverified' && (
        <div className="bg-amber-50 border-b border-amber-200 p-3 pt-4 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-amber-800 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>
               Tài khoản của bạn chưa được xác thực email. Một số tính năng như mượn sách, nạp tiền bị giới hạn. 
               Vui lòng kiểm tra hộp thư email của bạn!
            </p>
          </div>
        </div>
      )}
      {children}
    </ErrorBoundary>
  );
};

export default PageWrapper;
