import { useState, type FormEvent } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ArrowUpRight } from "lucide-react";
import "./home.css";
import logo from "../../assets/logo_big.png";
import UserRegistration from "../register/user-registration";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.7 15.9 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.8 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5.1C9.6 39.6 16.2 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.6 5.6C41.9 36 44 30.6 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 384 512" aria-hidden="true" fill="#E9E7DF">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

export default function Homepage() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (authMode !== "signin") return;

    const emailValue = identifier.trim();
    const passwordValue = password.trim();

    if (!emailValue || !passwordValue) return;

    try {
      setIsSubmitting(true);
      setSignInError(null);

      const response = await axios.post(
        "/wealth-plus/api/user/signin",
        {
          email: emailValue,
          password: passwordValue,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response?.status === 200) {
        localStorage.setItem("wealth-plus-auth", "true");
        localStorage.setItem(
          "wealth-plus-user",
          emailValue.includes("@") ? emailValue.split("@")[0] : emailValue
        );
        localStorage.setItem("wealth-plus-email", emailValue);
        localStorage.setItem("wealth-plus-full-name", "Admin User");
        localStorage.setItem("wealth-plus-last-login", new Date().toLocaleString());
        localStorage.setItem("wealth-plus-password", passwordValue);

        navigate("/dashboard");
      }
    } catch (error) {
      console.error("Unable to sign in:", error);
      setSignInError("Unauthorised User. Check Password or Register.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setRegistrationMessage("You are registered. Log in to access portfolio.");
    setAuthMode("signin");
  };

  const handleOAuthLogin = (provider: "google" | "apple") => {
    const baseUrl =
      provider === "google"
        ? "https://accounts.google.com/o/oauth2/v2/auth"
        : "https://appleid.apple.com/auth/authorize";

    const params =
      provider === "google"
        ? new URLSearchParams({
            client_id: "YOUR_GOOGLE_CLIENT_ID",
            redirect_uri: `${window.location.origin}/oauth/google/callback`,
            response_type: "code",
            scope: "openid email profile",
            prompt: "select_account",
          })
        : new URLSearchParams({
            client_id: "YOUR_APPLE_CLIENT_ID",
            redirect_uri: `${window.location.origin}/oauth/apple/callback`,
            response_type: "code",
            scope: "name email",
            response_mode: "form_post",
          });

    const authUrl = `${baseUrl}?${params.toString()}`;

    const popup = window.open(
      authUrl,
      "oauth",
      "width=500,height=700,left=200,top=100"
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type !== "oauth-success") return;

      const { name, email } = event.data;

      localStorage.setItem("wealth-plus-auth", "true");
      localStorage.setItem("wealth-plus-user", name || email?.split("@")[0] || "User");
      localStorage.setItem("wealth-plus-email", email || "");
      localStorage.setItem("wealth-plus-full-name", name || "User");
      localStorage.setItem("wealth-plus-last-login", new Date().toLocaleString());
      localStorage.setItem("wealth-plus-password", "oauth");

      window.removeEventListener("message", handleMessage);
      popup?.close();
      navigate("/dashboard");
    };

    window.addEventListener("message", handleMessage);
  };

  return (
    <div className="wealthplus-page">
      <div className="bg-grid" />
      <div className="bg-glow" />

      <header className="page-header">
        <div className="brand">
          {/* <div className="brand-mark">
            <span className="font-display">W</span>
          </div>
          <span className="brand-name font-display">Wealth Plus</span> */}
          <img src={logo} alt="Wealth Plus Logo" className="brand-logo" />
        </div>
      </header>

      <main className="main-grid">
        <section className="hero">
          <p className="hero-eyebrow font-mono-data">PORTFOLIO INTELLIGENCE</p>
          <h1 className="hero-title font-display">
            Track every basis point,
            <br />
            without the guesswork.
          </h1>
          <p className="hero-subtitle">
            One ledger for every account — brokerage, retirement, and crypto —
            reconciled nightly and priced in real time.
          </p>
        </section>

        <aside className="login-aside">
          <div className="login-card">
            <div className="login-kicker">
              <div className="login-kicker-bar" />
              <p className="login-kicker-text font-mono-data">
                {authMode === "signin" ? "ACCOUNT ACCESS" : "NEW ACCOUNT"}
              </p>
            </div>

            <h2 className="login-title font-display">
              {authMode === "signin" ? "Welcome back" : "Open door to your portfolio"}
            </h2>

            {authMode === "signin" ? (
              <>
                {registrationMessage && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(46, 125, 50, 0.12)",
                      color: "#2e7d32",
                      fontSize: 13,
                      border: "1px solid rgba(46, 125, 50, 0.22)",
                    }}
                  >
                    {registrationMessage}
                  </div>
                )}
                {signInError && (
                  <div
                    style={{
                      marginBottom: 12,
                      padding: "10px 12px",
                      borderRadius: 10,
                      background: "rgba(198, 40, 40, 0.12)",
                      color: "#c62828",
                      fontSize: 13,
                      border: "1px solid rgba(198, 40, 40, 0.22)",
                    }}
                  >
                    {signInError}
                  </div>
                )}
                <form className="login-form" onSubmit={handleSubmit}>
                <label className="field">
                  <span className="field-label">Email or username</span>
                  <div className="login-field">
                    <Mail className="icon-sm" />
                    <input
                      type="text"
                      name="identifier"
                      placeholder="you@example.com"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                    />
                  </div>
                </label>

                <label className="field">
                  <div className="field-row">
                    <span className="field-label">Password</span>
                    <a href="#" className="link-gold" style={{ fontSize: 12 }}>
                      Forgot password?
                    </a>
                  </div>
                  <div className="login-field">
                    <Lock className="icon-sm" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••••"
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((s) => !s)}
                      className="field-toggle"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                    </button>
                  </div>
                </label>

                <button type="submit" className="btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : "Sign in"}
                  <ArrowUpRight className="icon-sm" />
                </button>
              </form>
              </>
            ) : (
              <UserRegistration
                onSwitchToLogin={() => setAuthMode("signin")}
                onRegistrationSuccess={handleRegistrationSuccess}
              />
            )}

            <div className="divider">
              <div className="line" />
              <span className="label">OR CONTINUE WITH</span>
              <div className="line" />
            </div>

            <div className="oauth-grid">
              <button type="button" className="btn-oauth" onClick={() => handleOAuthLogin("google")}>
                <GoogleMark />
                Google
              </button>
              <button type="button" className="btn-oauth" onClick={() => handleOAuthLogin("apple")}>
                <AppleMark />
                Apple
              </button>
            </div>

            <p className="login-footer">
              {authMode === "signin" ? (
                <>
                  New to Wealth Plus?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="link-gold"
                    style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signin")}
                    className="link-gold"
                    style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </aside>
      </main>
    </div>
  );
}