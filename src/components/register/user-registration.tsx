import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { ArrowUpRight, CheckCircle2, Eye, EyeOff, Lock, Mail, UserRound } from 'lucide-react';

type UserRegistrationProps = {
  onSwitchToLogin: () => void;
  onRegistrationSuccess?: () => void;
};

const resolveUsernameFromPayload = (payload: unknown): string => {
  if (typeof payload === 'string') {
    return payload.trim();
  }

  if (Array.isArray(payload)) {
    for (const item of payload) {
      const resolved = resolveUsernameFromPayload(item);
      if (resolved) {
        return resolved;
      }
    }
    return '';
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidateKeys = ['username', 'userName', 'user_name', 'assignedUsername', 'generatedUsername', 'value'];

    for (const key of candidateKeys) {
      const resolved = resolveUsernameFromPayload(record[key]);
      if (resolved) {
        return resolved;
      }
    }

    if (record.data !== undefined) {
      const resolved = resolveUsernameFromPayload(record.data);
      if (resolved) {
        return resolved;
      }
    }
  }

  return '';
};

function UserRegistration({ onSwitchToLogin, onRegistrationSuccess }: UserRegistrationProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'available' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEmailValid = useMemo(() => /\S+@\S+\.\S+/.test(email), [email]);

  useEffect(() => {
    if (!email.trim() || !isEmailValid) {
      setUsername('');
      setUsernameStatus('idle');
      return;
    }

    const timeout = window.setTimeout(async () => {
      setUsernameStatus('checking');

      try {
        const response = await axios.get(`/wealth-plus/api/user/assignUsername/${encodeURIComponent(email.trim())}`);
        const assignedUsername = resolveUsernameFromPayload(response?.data);

        if (assignedUsername) {
          setUsername(assignedUsername);
          setUsernameStatus('available');
        } else {
          setUsername('');
          setUsernameStatus('error');
        }
      } catch (error) {
        console.error('Unable to fetch username:', error);
        setUsername('');
        setUsernameStatus('error');
      }
    }, 400);

    return () => window.clearTimeout(timeout);
  }, [email, isEmailValid]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !username.trim()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await axios.post(
        '/wealth-plus/api/user/register',
        {
          username,
          password,
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          isAdmin: false,
          isActive: true,
          isRestrictedUser: false,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response?.status === 200 || response?.status === 201) {
        localStorage.setItem('wealth-plus-auth', 'true');
        localStorage.setItem('wealth-plus-user', username);
        localStorage.setItem('wealth-plus-email', email.trim());
        localStorage.setItem('wealth-plus-full-name', `${firstName.trim()} ${lastName.trim()}`);
        localStorage.setItem('wealth-plus-last-login', new Date().toLocaleString());
        localStorage.setItem('wealth-plus-password', password);
        onRegistrationSuccess?.();
      }
    } catch (error) {
      console.error('Unable to register user:', error);
      window.alert('Unable to create account right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label className="field">
        <span className="field-label">First Name</span>
        <div className="login-field">
          <UserRound className="icon-sm" />
          <input
            type="text"
            name="firstName"
            placeholder="John"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Last Name</span>
        <div className="login-field">
          <UserRound className="icon-sm" />
          <input
            type="text"
            name="lastName"
            placeholder="Doe"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
          />
        </div>
      </label>

      <label className="field">
        <span className="field-label">Email</span>
        <div className="login-field">
          <Mail className="icon-sm" />
          <input
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </label>

      <label className="field">
        <div className="field-row">
          <span className="field-label">Password</span>
        </div>
        <div className="login-field">
          <Lock className="icon-sm" />
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••••"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="field-toggle"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
          </button>
        </div>
      </label>

      <label className="field">
        <div className="field-row">
          <span className="field-label">Username</span>
          {usernameStatus === 'available' && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#2e7d32', fontSize: 12 }}>
              <CheckCircle2 size={14} /> Available
            </span>
          )}
        </div>
        <div className="login-field">
          <UserRound className="icon-sm" />
          <input
            type="text"
            name="username"
            placeholder="Auto assigned username"
            value={username}
            readOnly
          />
        </div>
        {usernameStatus === 'checking' && (
          <p style={{ margin: '6px 0 0', color: '#d6b152', fontSize: 12 }}>Loading username…</p>
        )}
        {usernameStatus === 'error' && (
          <p style={{ margin: '6px 0 0', color: '#c62828', fontSize: 12 }}>Unable to fetch username right now.</p>
        )}
      </label>

      <button type="submit" className="btn-primary" disabled={isSubmitting || usernameStatus !== 'available'}>
        {isSubmitting ? 'Creating account...' : 'Create account'}
        <ArrowUpRight className="icon-sm" />
      </button>

      <p className="login-footer" style={{ marginTop: 12 }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="link-gold"
          style={{ background: 'none', border: 'none', cursor: 'pointer', font: 'inherit' }}
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

export default UserRegistration;
