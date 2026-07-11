import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import type { ReactElement } from 'react';
import LoginComponent from './components/login/login';
import Dashboard from './components/dashboard/dashboard';
import Homepage from './components/home/home';
import Header from './components/header/header';
import Footer from './components/footer/footer';

function ProtectedRoute({ children }: { children: ReactElement }) {
  const isAuthenticated = localStorage.getItem('wealth-plus-auth') === 'true';
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/dashboard';

  const handleLogout = () => {
    localStorage.removeItem('wealth-plus-auth');
    navigate('/login');
  };

  return (
    <>
      {isDashboard}

      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route
          path="/home"
          element={
            <>
          
              <Homepage />
            
            </>
          }
        />
        <Route path="/login" element={<LoginComponent />} />
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