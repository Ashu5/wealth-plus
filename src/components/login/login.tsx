import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';

const DEMO_CREDENTIALS = {
  email: 'ashu01',
  password: 'password123',
};

function LoginComponent() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const emailValue = email.trim();
    const passwordValue = password.trim();

    if (!emailValue || !passwordValue) {
      setError('Please enter both email/username and password.');
      setLoading(false);
      return;
    }

    if (
      emailValue === DEMO_CREDENTIALS.email &&
      passwordValue === DEMO_CREDENTIALS.password
    ) {
      const displayName = emailValue.includes('@')
        ? emailValue.split('@')[0]
        : emailValue;

      localStorage.setItem('wealth-plus-auth', 'true');
      localStorage.setItem('wealth-plus-user', displayName);
      localStorage.setItem('wealth-plus-email', emailValue);
      localStorage.setItem('wealth-plus-full-name', 'Admin User');
      localStorage.setItem('wealth-plus-last-login', new Date().toLocaleString());
      localStorage.setItem('wealth-plus-password', DEMO_CREDENTIALS.password);

      setTimeout(() => {
        navigate('/dashboard');
        setLoading(false);
      }, 300);
      return;
    }

    setError('Invalid email/username or password.');
    setLoading(false);
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <h2>Welcome Back</h2>
        <p>Sign in to continue to Wealth Plus</p>

        <label htmlFor="email">Email or Username</label>
        <input
          id="email"
          type="text"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="admin@example.com"
          autoComplete="email"
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="password123"
          autoComplete="current-password"
        />

        {error ? <p className="error-message">{error}</p> : null}

        <button type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

export default LoginComponent;