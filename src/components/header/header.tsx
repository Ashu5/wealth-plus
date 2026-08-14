import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './header.css';
import logo from '../../assets/koshmitra-logo.svg';
import ProfileComponent from '../profile/profile';

function Header() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigate = (path: string) => {
    setMenuOpen(false);
    setProfileMenuOpen(false);
    navigate(path, { state: { fromApp: true } });
  };

  const handleHamburgerToggle = () => {
    setMenuOpen((prev) => {
      const next = !prev;
      if (next) {
        setProfileMenuOpen(false);
      }
      return next;
    });
  };

  const handleProfileMenuChange = (isOpen: boolean) => {
    setProfileMenuOpen(isOpen);
    if (isOpen) {
      setMenuOpen(false);
    }
  };

  return (
    <header className="header">
      <div className="header-content">
        <img src={logo} alt="Koshmitra Logo" className="header-logo" />
        <div className="header-actions" ref={menuRef}>
          <div className="header-menu-wrap">
            <button
              type="button"
              className="header-hamburger"
              onClick={handleHamburgerToggle}
              aria-label="Open menu"
              aria-expanded={menuOpen}
            >
              <span />
              <span />
              <span />
            </button>

            {menuOpen && (
              <div className="header-menu" role="menu">
                <button type="button" role="menuitem" className="header-menu-item" onClick={() => handleNavigate('/my-funds')}>
                  My Fund
                </button>
                <button type="button" role="menuitem" className="header-menu-item" onClick={() => handleNavigate('/my-journey')}>
                  My Journey
                </button>
                <button type="button" role="menuitem" className="header-menu-item" onClick={() => handleNavigate('/my-reports')}>
                  My Reports
                </button>
              </div>
            )}
          </div>
          <ProfileComponent isMenuOpen={profileMenuOpen} onMenuOpenChange={handleProfileMenuChange} />
        </div>
      </div>
    </header>
  );
}

export default Header;