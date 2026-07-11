import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ProfileDetails from './profile-details';
import './profile.css';

function ProfileComponent() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Guest');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('wealth-plus-user');
    if (storedUser) {
      setUserName(storedUser);
    }
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

  const handleLogout = () => {
    localStorage.removeItem('wealth-plus-auth');
    localStorage.removeItem('wealth-plus-user');
    localStorage.removeItem('wealth-plus-email');
    localStorage.removeItem('wealth-plus-full-name');
    localStorage.removeItem('wealth-plus-last-login');
    localStorage.removeItem('wealth-plus-password');
    setMenuOpen(false);
    navigate('/login');
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

            <button type="button" className="profile-menu-item" role="menuitem">
              Settings
            </button>

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