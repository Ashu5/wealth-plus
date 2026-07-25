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
import Breadcrumb from './components/breadcrumb/breadcrumb';
import { searchUsers } from './services/admin-service';

const INTERNAL_ROUTE_ACCESS_KEY = 'wealth-plus-allowed-path';

type InternalRouteState = {
  fromApp?: boolean;
};

type AccessErrorPageProps = {
  title: string;
  message: string;
};

function AccessErrorPage({ title, message }: AccessErrorPageProps) {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 180px)', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)', padding: '20px 24px 28px' }}>
        <section style={{ maxWidth: '560px', width: '100%', background: '#ffffff', border: '1px solid #fecaca', borderRadius: '16px', padding: '24px', boxShadow: '0 12px 32px rgba(127, 29, 29, 0.12)' }}>
          <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', borderRadius: '12px', padding: '14px 16px', marginBottom: '16px' }}>
            <p style={{ margin: 0, fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#991b1b', fontWeight: 700 }}>Access Error</p>
            <h1 style={{ margin: '8px 0 8px', fontSize: '22px', color: '#7f1d1d' }}>{title}</h1>
            <p style={{ margin: 0, color: '#7f1d1d', lineHeight: 1.6 }}>{message}</p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/dashboard', { state: { fromApp: true } })}
            style={{ border: 'none', borderRadius: '999px', padding: '10px 16px', fontWeight: 700, cursor: 'pointer', background: 'linear-gradient(135deg, #b91c1c 0%, #dc2626 100%)', color: '#ffffff' }}
          >
            Back to Dashboard
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}

function ProtectedRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  const hasSession = Boolean(sessionStorage.getItem('wealth-plus-session-id') || isAuthenticated);
  const routeState = (location.state ?? {}) as InternalRouteState;
  const hasInternalAccessState = Boolean(routeState.fromApp);
  const previouslyAllowedPath = sessionStorage.getItem(INTERNAL_ROUTE_ACCESS_KEY);
  const canAccessByPath = previouslyAllowedPath === location.pathname;
  const hasRouteAccess = hasInternalAccessState || canAccessByPath;

  useEffect(() => {
    if (!isAuthenticated || !hasSession) {
      sessionStorage.removeItem('wealth-plus-session-id');
      sessionStorage.removeItem(INTERNAL_ROUTE_ACCESS_KEY);
      localStorage.removeItem('wealth-plus-auth');
      localStorage.removeItem('wealth-plus-username');
      localStorage.removeItem('wealth-plus-email');
      localStorage.removeItem('wealth-plus-full-name');
      localStorage.removeItem('wealth-plus-last-login');
      localStorage.removeItem('wealth-plus-password');
      return;
    }

    if (hasInternalAccessState) {
      sessionStorage.setItem(INTERNAL_ROUTE_ACCESS_KEY, location.pathname);
    }
  }, [hasInternalAccessState, hasSession, isAuthenticated, location.pathname]);

  if (!isAuthenticated || !hasSession) {
    return (
      <AccessErrorPage
        title="Unauthorized Access"
        message="You cannot open this page directly. Please log in from the home page first."
      />
    );
  }

  if (!hasRouteAccess) {
    return (
      <AccessErrorPage
        title="Direct URL Access Blocked"
        message="This page can only be opened through in-app navigation. Please go to Dashboard and use the menu links."
      />
    );
  }

  return children;
}

function AdminRoute({ children }: { children: ReactElement }) {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  const hasSession = Boolean(sessionStorage.getItem('wealth-plus-session-id') || isAuthenticated);
  const routeState = (location.state ?? {}) as InternalRouteState;
  const hasInternalAccessState = Boolean(routeState.fromApp);
  const previouslyAllowedPath = sessionStorage.getItem(INTERNAL_ROUTE_ACCESS_KEY);
  const canAccessByPath = previouslyAllowedPath === location.pathname;
  const hasRouteAccess = hasInternalAccessState || canAccessByPath;

  useEffect(() => {
    const verifyAdminAccess = async () => {
      if (!isAuthenticated || !hasSession) {
        sessionStorage.removeItem('wealth-plus-session-id');
        sessionStorage.removeItem(INTERNAL_ROUTE_ACCESS_KEY);
        localStorage.removeItem('wealth-plus-auth');
        localStorage.removeItem('wealth-plus-username');
        localStorage.removeItem('wealth-plus-email');
        localStorage.removeItem('wealth-plus-full-name');
        localStorage.removeItem('wealth-plus-last-login');
        localStorage.removeItem('wealth-plus-password');
        setLoading(false);
        return;
      }

      if (!hasRouteAccess) {
        setLoading(false);
        return;
      }

      if (hasInternalAccessState) {
        sessionStorage.setItem(INTERNAL_ROUTE_ACCESS_KEY, location.pathname);
      }

      const userEmail = localStorage.getItem('wealth-plus-email')?.trim();
      if (!userEmail) {
        setLoading(false);
        return;
      }

      try {
        const response = await searchUsers(userEmail);
        const isAdminFlag:Boolean=response?.data[0]?.admin;
        const role = response?.data[0]?.role;
        const hasAdminAccess:any = isAdminFlag || role === 'admin';

        setIsAdmin(hasAdminAccess);
      } catch (error) {
        console.error('Admin access check failed:', error);
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    void verifyAdminAccess();
  }, [hasInternalAccessState, hasRouteAccess, hasSession, isAuthenticated, location.pathname]);

  if (!isAuthenticated || !hasSession || loading) {
    if (loading) {
      return null;
    }

    return (
      <AccessErrorPage
        title="Unauthorized Access"
        message="You cannot open this page directly. Please log in from the home page first."
      />
    );
  }

  if (!isAdmin) {
    return (
      <AccessErrorPage
        title="Access Denied"
        message="You do not have permission to view this page."
      />
    );
  }

  if (!hasRouteAccess) {
    return (
      <AccessErrorPage
        title="Direct URL Access Blocked"
        message="This page can only be opened through in-app navigation. Please go to Dashboard and use the menu links."
      />
    );
  }

  return children;
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
                <Breadcrumb />
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
                <Breadcrumb />
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
                <Breadcrumb />
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
                <Breadcrumb />
                <MyJourneyPage />
                <Footer />
              </>
            </ProtectedRoute>
          }
          />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <>
                <Header />
                <Breadcrumb />
                <AdminPage />
                <Footer />
              </>
            </AdminRoute>

          }
        />
        <Route
          path="*"
          element={
            <AccessErrorPage
              title="Page Not Found"
              message="This page does not exist or cannot be opened directly."
            />
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