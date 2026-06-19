import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { CartProvider } from './contexts/CartContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import MophCompleteProfilePage from './pages/auth/MophCompleteProfilePage';
import { MophCallbackWatcher } from './components/auth/MophCallbackWatcher';
import DashboardPage from './pages/DashboardPage';
import CourseListPage from './pages/courses/CourseListPage';
import CourseDetailPage from './pages/courses/CourseDetailPage';
import CertificatesPage from './pages/CertificatesPage';
import AdminPage from './pages/admin/AdminPage';
import HelpPage from './pages/HelpPage';
import VerifyPage from './pages/VerifyPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import TrainingRecordPage from './pages/TrainingRecordPage';

function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <AppLayout>{children}</AppLayout>
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <CartProvider>
              <MophCallbackWatcher />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/auth/moph/complete" element={<MophCompleteProfilePage />} />
                <Route
                  path="/dashboard"
                  element={
                    <AuthenticatedLayout>
                      <DashboardPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/courses"
                  element={
                    <AuthenticatedLayout>
                      <CourseListPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/courses/:id"
                  element={
                    <AuthenticatedLayout>
                      <CourseDetailPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/certificates"
                  element={
                    <AuthenticatedLayout>
                      <CertificatesPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/cart"
                  element={
                    <AuthenticatedLayout>
                      <CartPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/help"
                  element={
                    <AuthenticatedLayout>
                      <HelpPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <AuthenticatedLayout>
                      <AdminPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <AuthenticatedLayout>
                      <ProfilePage />
                    </AuthenticatedLayout>
                  }
                />
                <Route
                  path="/training-records"
                  element={
                    <AuthenticatedLayout>
                      <TrainingRecordPage />
                    </AuthenticatedLayout>
                  }
                />
                <Route path="/verify/:token" element={<VerifyPage />} />
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </CartProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HashRouter>
  );
}
