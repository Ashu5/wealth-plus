import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile.css';
import { profileDetails, trackLogoutActivity } from '../../services/user-service';
import { clearAuthToken } from '../../services/auth-token';

function ProfileComponent() {
  const navigate = useNavigate();
  const [userName] = useState(() => localStorage.getItem('wealth-plus-username') || 'Guest');
  const [menuOpen, setMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadAdminAccess = async () => {
      const storedEmail = localStorage.getItem('wealth-plus-email')?.trim();
      if (!storedEmail) {
        return;
      }

      try {
        const response = await profileDetails(storedEmail);
        const profileData = response?.data ?? response;
        const normalizedRole = typeof profileData?.role === 'string' ? profileData.role : '';
        const adminFlag = Boolean(profileData?.isAdmin);
        const isAdminUser = adminFlag || normalizedRole === 'ADMIN' || normalizedRole === 'SUPER_ADMIN';
        setIsAdmin(isAdminUser);
      } catch (error) {
        console.error('Unable to resolve admin access:', error);
        setIsAdmin(false);
      }
    };

    void loadAdminAccess();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const getInitials = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'G';

    if (trimmed.includes('@')) {
      return trimmed.split('@')[0].slice(0, 2).toUpperCase();
    }

    const parts = trimmed.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  };

  const handleLogout = async () => {
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
    const sessionId = sessionStorage.getItem('wealth-plus-session-id')?.trim() || '';

    try {
      if (userEmail && sessionId) {
        await trackLogoutActivity(userEmail, sessionId);
      } else {
        console.warn('Skipping logout activity request due to missing email or session ID.', {
          hasEmail: Boolean(userEmail),
          hasSessionId: Boolean(sessionId),
        });
      }
    } catch (error) {
      const statusCode =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { status?: unknown } }).response?.status === 'number'
          ? (error as { response?: { status?: number } }).response?.status
          : undefined;

      if (statusCode === 401) {
        console.warn('Logout activity request returned 401. Clearing local session anyway.');
      } else {
        console.error('Error tracking logout activity:', error);
      }
    } finally {
      sessionStorage.removeItem('wealth-plus-session-id');

      localStorage.removeItem('wealth-plus-auth');
      localStorage.removeItem('wealth-plus-username');
      localStorage.removeItem('wealth-plus-email');
      localStorage.removeItem('wealth-plus-full-name');
      localStorage.removeItem('wealth-plus-last-login');
      localStorage.removeItem('wealth-plus-password');
      clearAuthToken();
      setMenuOpen(false);
      navigate('/home', { replace: true });
    }
  };

  return (
    <>
      <div className="profile-wrapper" ref={menuRef}>
        <button
          type="button"
          className="profile-button"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="profile-avatar">{getInitials(userName)}</span>
        </button>

        {menuOpen && (
          <div className="profile-menu" role="menu">
            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile', { state: { fromApp: true } });
              }}
            >
              My Profile
            </button>

            <button
              type="button"
              className="profile-menu-item"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false);
                navigate('/my-reports', { state: { fromApp: true } });
              }}
            >
              My Reports
            </button>

            {isAdmin && (
              <button
                type="button"
                className="profile-menu-item"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/admin', { state: { fromApp: true } });
                }}
              >
                Admin Panel
              </button>
            )}

            <button
              type="button"
              className="profile-menu-item logout"
              role="menuitem"
              onClick={handleLogout}
            >
              Log Out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default ProfileComponent;