import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowUpRight } from "lucide-react";
import "./home.css";
import logo from "../../assets/logo_big.png";
import UserRegistration from "../register/user-registration";
import { signIn, trackLogoutActivity } from "../../services/user-service";

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
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const persistAuthenticatedUser = (
    emailValue: string,
    payloadRecord: Record<string, unknown>,
    sessionId?: string | null
  ) => {
    const normalizedUserName =
      typeof payloadRecord?.userName === "string" && payloadRecord.userName.trim()
        ? payloadRecord.userName
        : emailValue.split("@")[0] || "User";
    const normalizedUserEmail =
      typeof payloadRecord.userEmail === "string" && payloadRecord.userEmail.trim()
        ? payloadRecord.userEmail
        : emailValue;
    const normalizedFullName =
      typeof payloadRecord.fullName === "string" && payloadRecord.fullName.trim()
        ? payloadRecord.fullName
        : "Unknown User";

    localStorage.setItem("wealth-plus-auth", "true");
    localStorage.setItem("wealth-plus-username", normalizedUserName);
    localStorage.setItem("wealth-plus-email", normalizedUserEmail);
    localStorage.setItem("wealth-plus-full-name", normalizedFullName);
    localStorage.setItem("wealth-plus-last-login", new Date().toLocaleString());
    localStorage.removeItem("wealth-plus-password");

    if (sessionId) {
      sessionStorage.setItem("wealth-plus-session-id", sessionId);
    } else {
      sessionStorage.setItem("wealth-plus-session-id", `${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
  };

  const performSignIn = async (emailValue: string, passwordValue: string) => {
    const response = await signIn(emailValue, passwordValue);
    const payloadRecord = response?.data?.data as Record<string, unknown>;
    const statusCode = response?.status;
    // Debugging: log server response to help diagnose redirect issues
    // (temporary - can be removed once confirmed)
    // eslint-disable-next-line no-console
    console.debug('performSignIn - response status:', statusCode, 'payload:', payloadRecord);
    const dataPayload = payloadRecord.data && typeof payloadRecord.data === "object" ? (payloadRecord.data as Record<string, unknown>) : null;
    const sessionIdFromPayload =
      typeof payloadRecord.sessionId === "string"
        ? payloadRecord.sessionId
        : typeof dataPayload?.sessionId === "string"
          ? dataPayload.sessionId
          : null;
    const message = typeof payloadRecord.message === "string" ? payloadRecord.message : "";

    // Treat a session conflict only when the server explicitly indicates it:
    // - HTTP 409
    // - a data flag `alreadyLoggedIn` or an 'already logged' message
    const alreadyLoggedIn = Boolean(dataPayload?.alreadyLoggedIn) || message.toLowerCase().includes("already logged") || statusCode === 409;

    if (statusCode === 409 || alreadyLoggedIn) {
      sessionStorage.removeItem("wealth-plus-session-id");
      setPendingSessionId(sessionIdFromPayload || (typeof dataPayload?.sessionId === "string" ? dataPayload.sessionId : null));
      setSignInError("This account is already active on another device. Please sign out there first or continue using the existing session.");
      return false;
    }
    if (statusCode === 200 && !alreadyLoggedIn) {
      persistAuthenticatedUser(emailValue, payloadRecord, sessionIdFromPayload);
      setPendingSessionId(null);
      navigate("/dashboard", { replace: true });
      return true;
    }

    return false;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (authMode !== "signin") return;
    if (isSubmittingRef.current) return;

    const emailValue = identifier.trim();
    const passwordValue = password.trim();

    if (!emailValue || !passwordValue) return;


    try {
      isSubmittingRef.current = true;
      setIsSubmitting(true);
      setSignInError(null);
      setSuccessMessage(null);
      await performSignIn(emailValue, passwordValue);
    } catch (error) {
      console.error("Unable to sign in:", error);
      setPassword("");
      setSignInError("Unauthorised User. Check Password or Register.");
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      // if (response?.status == 200) {
      //   setPassword("");
      // }
    }
  };

  const handleLogoutAndRetrySignIn = async () => {
    const emailValue = identifier.trim();
    const passwordValue = password.trim();

    if (!emailValue || !passwordValue || !pendingSessionId) return;
    console.log("Logging out other device with session ID:", emailValue, pendingSessionId);
    try {
      setIsSubmitting(true);
      setSignInError(null);
      setSuccessMessage(null);
      const response = await trackLogoutActivity(emailValue, pendingSessionId);
      if (response?.status === 200) {
        console.log("Successfully logged out other device:", response);
        setPendingSessionId(null);
        setSuccessMessage("Logged out other device. Pls sign in now.");
      } else {
        throw new Error("Logout did not return a successful status.");
      }
    } catch (error) {
      console.error("Unable to logout and sign in:", error);
      setSuccessMessage(null);
      setSignInError("We could not log out the other device. Please try again.");
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
      localStorage.setItem("wealth-plus-email", email || "");
      localStorage.setItem("wealth-plus-full-name", name || "User");
      localStorage.setItem("wealth-plus-username", name || "User");
      localStorage.setItem("wealth-plus-last-login", new Date().toLocaleString());
      localStorage.setItem("wealth-plus-password", "oauth");
      sessionStorage.setItem("wealth-plus-session-id", `${Date.now()}-${Math.random().toString(36).slice(2)}`);

      window.removeEventListener("message", handleMessage);
      popup?.close();
      navigate("/dashboard", { replace: true });
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
                {successMessage && (
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
                    {successMessage}
                  </div>
                )}
                {!successMessage && signInError && (
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
                    <strong>You are already logged into another device.</strong>
                    <div style={{ marginTop: 4 }}>Want to login here?</div>
                    <div style={{ marginTop: 6, fontSize: 12, color: "#8e2a2a" }}>
                      {signInError}
                    </div>
                    {pendingSessionId && (
                      <button
                        type="button"
                        onClick={handleLogoutAndRetrySignIn}
                        disabled={isSubmitting}
                        style={{
                          marginTop: 10,
                          border: "none",
                          borderRadius: 8,
                          padding: "8px 12px",
                          background: "#1e3a8a",
                          color: "#fff",
                          cursor: isSubmitting ? "not-allowed" : "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                      >
                        {isSubmitting ? "Signing in..." : "Logout from other and Sign in here"}
                      </button>
                    )}
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
                        onFocus={() => setSuccessMessage(null)}
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
                        type="password"
                        name="password"
                        placeholder="••••••••••"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onFocus={() => setSuccessMessage(null)}
                      />
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