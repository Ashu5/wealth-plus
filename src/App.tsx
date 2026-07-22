import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useEffect, type ReactElement } from 'react';
import Dashboard from './components/dashboard/dashboard';
import Homepage from './components/home/home';
import Header from './components/header/header';
import Footer from './components/footer/footer';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  const hasSession = Boolean(sessionStorage.getItem('wealth-plus-session-id'));

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

function AppShell() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard';

  return (
    <>
      {isDashboard}

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Navigate to="/home" replace />} />
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