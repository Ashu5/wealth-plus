import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import './profile-details.css';

type ProfileDetailsProps = {
  onClose: () => void;
};

function ProfileDetails({ onClose }: ProfileDetailsProps) {
  const [name, setName] = useState('Guest');
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('Guest User');
  const [lastLogin, setLastLogin] = useState('Not available');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const loadProfile = async () => {
      const storedName = localStorage.getItem('wealth-plus-user') || 'Guest';
      const storedEmail = localStorage.getItem('wealth-plus-email') || '';
      const storedFullName = localStorage.getItem('wealth-plus-full-name') || 'Guest User';
      const storedLastLogin = localStorage.getItem('wealth-plus-last-login') || 'Not available';

      setName(storedName);
      setEmail(storedEmail);
      setFullName(storedFullName);
      setLastLogin(storedLastLogin);

      if (!storedEmail) {
        return;
      }

      try {
        const response = await axios.get(`/wealth-plus/api/user/profile/${encodeURIComponent(storedEmail)}`, {
          withCredentials: true,
        });

        const profileData = response?.data?.data || response?.data || {};
        const firstName = profileData?.firstName || profileData?.first_name || '';
        const lastName = profileData?.lastName || profileData?.last_name || '';
        const resolvedFullName = [firstName, lastName].filter(Boolean).join(' ').trim();

        if (resolvedFullName) {
          setFullName(resolvedFullName);
        }

        if (firstName) {
          setName(firstName);
        }

        if (profileData?.email) {
          setEmail(profileData.email);
        }

        const profileLastLogin = profileData?.lastLogin || profileData?.lastLoginDate || profileData?.last_login || storedLastLogin;
        if (profileLastLogin) {
          setLastLogin(profileLastLogin);
        }
      } catch (error) {
        console.error('Unable to load profile details:', error);
      }
    };

    loadProfile();
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

  return (
    <div className="profile-details-overlay" onClick={onClose}>
      <div className="profile-details-card" onClick={(e) => e.stopPropagation()}>
        <div className="profile-details-header">
          <div>
            <h3>Profile Details</h3>
            <p>Manage your account information</p>
          </div>
          <button type="button" className="profile-details-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="profile-details-body">
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
    </div>
  );
}

export default ProfileDetails;