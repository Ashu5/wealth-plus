import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDetails from './profile-details';
import './profile.css';
import { profileDetails, trackLogoutActivity } from '../../services/user-service';

function ProfileComponent() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Guest');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('wealth-plus-username');
    if (storedUser) {
      setUserName(storedUser);
    }

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
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || localStorage.getItem('wealth-plus-username')?.trim() || 'unknown_user';
    const sessionId = sessionStorage.getItem('wealth-plus-session-id') || '';

    if (!sessionId) {
      console.warn('Missing session ID for logout activity. Sending logout event with empty session ID.');
    }

    await trackLogoutActivity(userEmail, sessionId);
    sessionStorage.removeItem('wealth-plus-session-id');

    localStorage.removeItem('wealth-plus-auth');
    localStorage.removeItem('wealth-plus-username');
    localStorage.removeItem('wealth-plus-email');
    localStorage.removeItem('wealth-plus-full-name');
    localStorage.removeItem('wealth-plus-last-login');
    localStorage.removeItem('wealth-plus-password');
    setMenuOpen(false);
    navigate('/home');
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
                setShowProfileDetails(true);
                setMenuOpen(false);
              }}
            >
              My Profile
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

      {showProfileDetails && (
        <ProfileDetails onClose={() => setShowProfileDetails(false)} />
      )}
    </>
  );
}

export default ProfileComponent;