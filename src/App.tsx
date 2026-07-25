import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState, type ReactElement } from 'react';
import Dashboard from './components/dashboard/dashboard';
import Homepage from './components/home/home';
import Header from './components/header/header';
import Footer from './components/footer/footer';
import ResetPasswordPage from './components/reset-password/reset-password';
import FundTransactionsPage from './components/fundtransactions/fund-transactions';
import MyFundsPage from './components/fundmaster/my-funds-page';
import MyJourneyPage from './components/myjourney/my-journey-page';
import AdminPage from './components/admin/admin-page';
import { searchUsers } from './services/admin-service';
function ProtectedRoute({ children }: { children: ReactElement }) {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  const hasSession = Boolean(sessionStorage.getItem('wealth-plus-session-id') || isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !hasSession) {
      sessionStorage.removeItem('wealth-plus-session-id');
      localStorage.removeItem('wealth-plus-auth');
      localStorage.removeItem('wealth-plus-username');
      localStorage.removeItem('wealth-plus-email');
      localStorage.removeItem('wealth-plus-full-name');
      localStorage.removeItem('wealth-plus-last-login');
      localStorage.removeItem('wealth-plus-password');
      navigate('/home', { replace: true });
    }
  }, [hasSession, isAuthenticated, navigate]);

  if (!isAuthenticated || !hasSession) {
    return null;
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  const hasSession = Boolean(sessionStorage.getItem('wealth-plus-session-id') || isAuthenticated);

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isAuthenticated || !hasSession) {
        sessionStorage.removeItem('wealth-plus-session-id');
        localStorage.removeItem('wealth-plus-auth');
        localStorage.removeItem('wealth-plus-username');
        localStorage.removeItem('wealth-plus-email');
        localStorage.removeItem('wealth-plus-full-name');
        localStorage.removeItem('wealth-plus-last-login');
        localStorage.removeItem('wealth-plus-password');
        navigate('/home', { replace: true });
        return;
      }

      const userEmail = localStorage.getItem('wealth-plus-email')?.trim();
      if (!userEmail) {
        navigate('/dashboard', { replace: true });
        return;
      }

      try {
        const response = await searchUsers(userEmail);
        const isAdminFlag:Boolean=response?.data[0]?.admin;
        const role = response?.data[0]?.role;
        const hasAdminAccess:any = isAdminFlag || role === 'admin';

        setIsAdmin(hasAdminAccess);
        if (!hasAdminAccess) {
          navigate('/dashboard', { replace: true });
        }
      } catch (error) {
        console.error('Admin access check failed:', error);
        setIsAdmin(false);
        navigate('/dashboard', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    void verifyAdminAccess();
  }, [hasSession, isAuthenticated, navigate]);

  if (!isAuthenticated || !hasSession || loading) {
    return null;
  }

  return isAdmin ? children : null;
}

function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <>
      {isDashboard}

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Navigate to="/home" replace />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route
          path="/home"
          element={
            <>
          
              <Homepage />
            
            </>
          }
        />
      
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <Dashboard />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/fund-transactions"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <FundTransactionsPage />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-funds"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <MyFundsPage />
                <Footer />
              </>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-journey"
          element={
            <ProtectedRoute>
              <>
                <Header />
                <MyJourneyPage />
                <Footer />
              </>
            </ProtectedRoute>
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Header />
                <AdminPage />
                <Footer />
              </>
            </AdminRoute>

          }
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;