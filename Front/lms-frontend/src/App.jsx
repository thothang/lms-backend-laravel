import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PageWrapper from './components/PageWrapper';
import HomePage from './pages/HomePage';
import AuthPage from './pages/Auth/AuthPage';
import VerifyEmail from './pages/Auth/VerifyEmail';
import CatalogPage from './pages/CatalogPage';
import UserProfilePage from './pages/UserProfilePage';
import BookDetailsPage from './pages/BookDetailsPage';
import AboutPage from './pages/AboutPage';
import BorrowingRulesPage from './pages/BorrowingRulesPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentErrorPage from './pages/PaymentErrorPage';
import ReadEbookPage from './pages/ReadEbookPage';
import ContactPage from './pages/ContactPage';
import NotificationPanel from './pages/NotificationPanel';

// Layouts & Protected Routes
import ManagementLayout from './components/layout/ManagementLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Management Pages
import AuthorDashboard from './pages/Management/AuthorDashboard';
import MyEbooks from './pages/Management/MyEbooks';
import UploadEbook from './pages/Management/UploadEbook';
import AuthorEarnings from './pages/Management/AuthorEarnings';
import LibrarianDashboard from './pages/Management/LibrarianDashboard';
import LibrarianUploadEbook from './pages/Management/LibrarianUploadEbook';
import ManageReservations from './pages/Management/ManageReservations';
import ManageLostBooks from './pages/Management/ManageLostBooks';
import ManageBooks from './pages/Management/ManageBooks';
import OfflineBorrow from './pages/Management/OfflineBorrow';
import ManageBorrows from './pages/Management/ManageBorrows';
import AdminDashboard from './pages/Management/AdminDashboard';
import AdminUploadEbook from './pages/Management/AdminUploadEbook';
import ManageAdminEbooks from './pages/Management/ManageAdminEbooks';
import ManageUsers from './pages/Management/ManageUsers';
import ManagePermissions from './pages/Management/ManagePermissions';
import PendingEbooks from './pages/Management/PendingEbooks';
import SystemSettings from './pages/Management/SystemSettings';
import ManageWithdrawals from './pages/Management/ManageWithdrawals';
import LibrarianFinance from './pages/Management/LibrarianFinance';
import LibrarianUsers from './pages/Management/LibrarianUsers';
import LibrarianReports from './pages/Management/LibrarianReports';
import LibrarianMessages from './pages/Management/LibrarianMessages';
import AdminHotFeaturedManager from './pages/Management/AdminHotFeaturedManager';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" richColors />
          <PWAUpdatePrompt />
          <Routes>
        {/* Public Routes */}
        <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
        <Route path="/catalog" element={<PageWrapper><CatalogPage /></PageWrapper>} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/about" element={<PageWrapper><AboutPage /></PageWrapper>} />
        <Route path="/contact" element={<PageWrapper><ContactPage /></PageWrapper>} />
        <Route path="/notifications" element={<PageWrapper><NotificationPanel /></PageWrapper>} />
        <Route path="/borrowing-rules" element={<PageWrapper><BorrowingRulesPage /></PageWrapper>} />
        <Route path="/payment/success" element={<PageWrapper><PaymentSuccessPage /></PageWrapper>} />
        <Route path="/payment/error" element={<PageWrapper><PaymentErrorPage /></PageWrapper>} />
        <Route path="/payment/cancel" element={<PageWrapper><PaymentErrorPage /></PageWrapper>} />

        {/* User Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <PageWrapper><UserProfilePage /></PageWrapper>
          </ProtectedRoute>
        } />
        <Route path="/book/:type/:id" element={<PageWrapper><BookDetailsPage /></PageWrapper>} />
        <Route path="/ebook/:id/read" element={
          <ProtectedRoute>
            <PageWrapper><ReadEbookPage /></PageWrapper>
          </ProtectedRoute>
        } />

        {/* Management Routes */}
        <Route path="/author" element={
          <ProtectedRoute allowedRoles={['author', 'admin']}>
            <ManagementLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AuthorDashboard />} />
          <Route path="my-ebooks" element={<MyEbooks />} />
          <Route path="earnings" element={<AuthorEarnings />} />
          <Route path="upload" element={<UploadEbook />} />
        </Route>

        <Route path="/librarian" element={
          <ProtectedRoute allowedRoles={['librarian', 'admin']}>
            <ManagementLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<LibrarianDashboard />} />
          <Route path="books" element={<ManageBooks />} />
          <Route path="ebooks" element={<ManageAdminEbooks />} />
          <Route path="ebooks/upload" element={<LibrarianUploadEbook />} />
          <Route path="borrows" element={<ManageBorrows />} />
          <Route path="offline" element={<OfflineBorrow />} />
          <Route path="reservations" element={<ManageReservations />} />
          <Route path="lost-books" element={<ManageLostBooks />} />
          <Route path="finance" element={<LibrarianFinance />} />
          <Route path="users" element={<LibrarianUsers />} />
          <Route path="reports" element={<LibrarianReports />} />
          <Route path="messages" element={<LibrarianMessages />} />
        </Route>

        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ManagementLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="permissions" element={<ManagePermissions />} />
          <Route path="ebooks/pending" element={<Navigate to="/admin/ebooks" replace />} />
          <Route path="ebooks" element={<ManageAdminEbooks />} />
          <Route path="books" element={<ManageBooks />} />
          <Route path="withdrawals" element={<ManageWithdrawals />} />
          <Route path="hot-featured" element={<AdminHotFeaturedManager />} />
          <Route path="settings" element={<SystemSettings />} />
        </Route>
      </Routes>
      </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
