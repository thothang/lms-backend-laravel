import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import PageWrapper from './components/PageWrapper';
import PWAUpdatePrompt from './components/PWAUpdatePrompt';
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
import ContactPage from './pages/ContactPage';
import NotificationPanel from './pages/NotificationPanel';

// Layouts & Protected Routes
import ManagementLayout from './components/layout/ManagementLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load Management Pages (heavy, rarely used)
const ReadEbookPage = lazy(() => import('./pages/ReadEbookPage'));
const AuthorDashboard = lazy(() => import('./pages/Management/AuthorDashboard'));
const MyEbooks = lazy(() => import('./pages/Management/MyEbooks'));
const UploadEbook = lazy(() => import('./pages/Management/UploadEbook'));
const AuthorEarnings = lazy(() => import('./pages/Management/AuthorEarnings'));
const LibrarianDashboard = lazy(() => import('./pages/Management/LibrarianDashboard'));
const LibrarianUploadEbook = lazy(() => import('./pages/Management/LibrarianUploadEbook'));
const ManageReservations = lazy(() => import('./pages/Management/ManageReservations'));
const ManageLostBooks = lazy(() => import('./pages/Management/ManageLostBooks'));
const ManageBooks = lazy(() => import('./pages/Management/ManageBooks'));
const OfflineBorrow = lazy(() => import('./pages/Management/OfflineBorrow'));
const ManageBorrows = lazy(() => import('./pages/Management/ManageBorrows'));
const AdminDashboard = lazy(() => import('./pages/Management/AdminDashboard'));
const AdminUploadEbook = lazy(() => import('./pages/Management/AdminUploadEbook'));
const ManageAdminEbooks = lazy(() => import('./pages/Management/ManageAdminEbooks'));
const ManageUsers = lazy(() => import('./pages/Management/ManageUsers'));
const ManagePermissions = lazy(() => import('./pages/Management/ManagePermissions'));
const PendingEbooks = lazy(() => import('./pages/Management/PendingEbooks'));
const SystemSettings = lazy(() => import('./pages/Management/SystemSettings'));
const ManageWithdrawals = lazy(() => import('./pages/Management/ManageWithdrawals'));
const LibrarianFinance = lazy(() => import('./pages/Management/LibrarianFinance'));
const LibrarianUsers = lazy(() => import('./pages/Management/LibrarianUsers'));
const LibrarianReports = lazy(() => import('./pages/Management/LibrarianReports'));
const LibrarianMessages = lazy(() => import('./pages/Management/LibrarianMessages'));
const AdminHotFeaturedManager = lazy(() => import('./pages/Management/AdminHotFeaturedManager'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <Toaster position="top-center" richColors />
          <PWAUpdatePrompt />
          <Suspense fallback={<PageLoader />}>
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

              {/* Management Routes - Lazy loaded */}
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
          </Suspense>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
