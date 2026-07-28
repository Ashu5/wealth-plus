import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './profile-details.css';
import { profileDetails as fetchProfileDetails } from '../../services/user-service';
import MyInsights from './my-insights';

type ProfileDetailsProps = {
  onClose?: () => void;
};

function ProfileDetails({ onClose }: ProfileDetailsProps) {
  const navigate = useNavigate();
  const isOverlay = Boolean(onClose);
  const [name, setName] = useState('Guest');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('Guest User');
  const [lastLogin, setLastLogin] = useState('Not available');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  const setCookie = (cookieName: string, value: string, days: number = 30) => {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const cookieString = `${cookieName}=${encodeURIComponent(value)}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    document.cookie = cookieString;
  };

  useEffect(() => {
    const loadProfile = async () => {
      const storedUsername = localStorage.getItem('wealth-plus-username') || '';
      const storedEmail = localStorage.getItem('wealth-plus-email') || '';
      const storedFullName = localStorage.getItem('wealth-plus-full-name') || 'Guest User';
      const storedLastLogin = localStorage.getItem('wealth-plus-last-login') || 'Not available';

      setUsername(storedUsername);
      setEmail(storedEmail);
      setFullName(storedFullName);
      setLastLogin(storedLastLogin);

      if (!storedEmail) {
        return;
      }

      try {
        const response = await fetchProfileDetails(storedEmail);
        const profileData = response?.data ?? response ?? {};
        const firstName = profileData?.firstName || '';
        const lastName = profileData?.lastName || '';
        const resolvedFullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        const profileUsername = profileData?.userName || '';

        if (resolvedFullName) {
          setFullName(resolvedFullName);
        }

        if (firstName) {
          setName(firstName);
        }

        if (profileData?.email) {
          setEmail(profileData.email);
        }

        if (profileUsername) {
          setUsername(profileUsername);
          localStorage.setItem('wealth-plus-username', profileUsername);
          setCookie('wealth-plus-username', profileUsername);
        }

        const profileLastLogin = profileData?.lastLogin || profileData?.lastLoginDate || profileData?.last_login || storedLastLogin;
        if (profileLastLogin) {
          setLastLogin(profileLastLogin);
        }
      } catch (error) {
        console.error('Unable to load profile details:', error);
      }
    };

    void loadProfile();
  }, []);

  const handlePasswordChange = (e: FormEvent) => {
    e.preventDefault();

    const savedPassword = localStorage.getItem('wealth-plus-password') || 'password123';

    if (currentPassword !== savedPassword) {
      setMessage('Current password is incorrect.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setMessage('New password must be at least 4 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match.');
      return;
    }

    localStorage.setItem('wealth-plus-password', newPassword);
    setMessage('Password updated successfully.');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard', { state: { fromApp: true } });
  };

  const profileCard = (
    <div
      className={isOverlay ? 'profile-details-card' : 'profile-details-card profile-details-card--page'}
      onClick={isOverlay ? (e) => e.stopPropagation() : undefined}
    >
      <div className="profile-details-header">
        <div>
          <h3>Profile Details</h3>
          <p>Manage your account information</p>
        </div>
        {isOverlay ? (
          <button type="button" className="profile-details-close" onClick={onClose}>
            ×
          </button>
        ) : (
          <button type="button" className="profile-details-secondary-action" onClick={handleBackToDashboard}>
            Back to Dashboard
          </button>
        )}
      </div>

      <div className="profile-details-body">
        <div className="profile-detail-row">
          <span className="profile-detail-label">Username</span>
          <span className="profile-detail-value">{username || 'Not available'}</span>
        </div>

        <div className="profile-detail-row">
          <span className="profile-detail-label">Name</span>
          <span className="profile-detail-value">{name}</span>
        </div>

        <div className="profile-detail-row">
          <span className="profile-detail-label">Last Login Date</span>
          <span className="profile-detail-value">{lastLogin}</span>
        </div>

        <div className="profile-detail-row">
          <span className="profile-detail-label">Email</span>
          <span className="profile-detail-value">{email}</span>
        </div>

        <div className="profile-detail-row">
          <span className="profile-detail-label">Full Name</span>
          <span className="profile-detail-value">{fullName}</span>
        </div>

        <div className="profile-detail-actions">
          <button
            type="button"
            className="profile-change-password-btn"
            onClick={() => setShowPasswordForm((prev) => !prev)}
          >
            {showPasswordForm ? 'Hide Password Form' : 'Change Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form className="password-form" onSubmit={handlePasswordChange}>
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {message ? <p className="password-message">{message}</p> : null}

            <button type="submit" className="profile-save-btn">
              Update Password
            </button>
          </form>
        )}
      </div>
    </div>
  );

  if (isOverlay) {
    return (
      <div className="profile-details-overlay" onClick={onClose}>
        {profileCard}
      </div>
    );
  }

  return (
    <main className="profile-details-page">
      <section className="profile-details-page-hero">
        <p className="profile-details-kicker">Account overview</p>
        <h1>Profile Details</h1>
        <p>
          Review your account information, last login data, and password settings from a dedicated profile page.
        </p>
      </section>
      {profileCard}
      <MyInsights />
    </main>
  );
}

export default ProfileDetails;