import { useState, useRef, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import "./home.css";
import logo from "../../assets/koshmitra-logo.svg";
import UserRegistration from "../register/user-registration";
import { assignUsername, googleLogin, login, profileDetails, refreshAccessToken, registerUser, ssoLogin, trackLogoutActivity } from "../../services/user-service";
import { getAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from "../../services/auth-token";

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

export default function Homepage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [identifier, setIdentifier] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    return localStorage.getItem("wealth-plus-email") || localStorage.getItem("wealth-plus-username") || "";
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState<string | null>(null);
  const [signInError, setSignInError] = useState<string | null>(null);
  const [pendingSessionId, setPendingSessionId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState<string | null>(null);
  const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [isForgotPasswordSubmitting, setIsForgotPasswordSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const extractTokenValue = (value: unknown, allowRaw = false): string | null => {
    if (typeof value !== "string") {
      return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (/^bearer\s+/i.test(trimmed)) {
      const token = trimmed.replace(/^bearer\s+/i, "").trim();
      return token || null;
    }

    return allowRaw ? trimmed : null;
  };

  const extractTokenFromPayload = (payload: unknown, depth = 0): string | null => {
    if (depth > 6 || !payload) {
      return null;
    }

    if (Array.isArray(payload)) {
      for (const item of payload) {
        const token = extractTokenFromPayload(item, depth + 1);
        if (token) {
          return token;
        }
      }
      return null;
    }

    if (typeof payload !== "object") {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const tokenKeys = ["token", "jwtToken", "accessToken", "authToken", "authorization", "Authorization"];

    for (const key of tokenKeys) {
      if (record[key] !== undefined) {
        const token = extractTokenValue(record[key], true);
        if (token) {
          return token;
        }
      }
    }

    if (record.data !== undefined) {
      const nestedToken = extractTokenFromPayload(record.data, depth + 1);
      if (nestedToken) {
        return nestedToken;
      }
    }

    return null;
  };

  const extractAuthTokenFromResponse = (response: unknown): string | null => {
    if (!response || typeof response !== "object") {
      return null;
    }

    const responseRecord = response as Record<string, unknown>;
    return extractTokenFromPayload(responseRecord.data) ?? extractTokenFromPayload(responseRecord);
  };

  const extractRefreshTokenFromPayload = (payload: unknown, depth = 0): string | null => {
    if (depth > 6 || !payload) {
      return null;
    }

    if (Array.isArray(payload)) {
      for (const item of payload) {
        const token = extractRefreshTokenFromPayload(item, depth + 1);
        if (token) {
          return token;
        }
      }
      return null;
    }

    if (typeof payload !== "object") {
      return null;
    }

    const record = payload as Record<string, unknown>;
    const refreshTokenKeys = ["refreshToken", "refresh_token", "refresh-token", "refreshTokenValue", "refreshTokenString"];

    for (const key of refreshTokenKeys) {
      if (record[key] !== undefined) {
        const token = extractTokenValue(record[key], true);
        if (token) {
          return token;
        }
      }
    }

    if (record.data !== undefined) {
      const nestedToken = extractRefreshTokenFromPayload(record.data, depth + 1);
      if (nestedToken) {
        return nestedToken;
      }
    }

    return null;
  };

  const extractRefreshTokenFromResponse = (response: unknown): string | null => {
    if (!response || typeof response !== "object") {
      return null;
    }

    const responseRecord = response as Record<string, unknown>;
    return extractRefreshTokenFromPayload(responseRecord.data) ?? extractRefreshTokenFromPayload(responseRecord);
  };

  const resolveUsernameFromPayload = (payload: unknown): string => {
    if (typeof payload === "string") {
      return payload.trim();
    }

    if (Array.isArray(payload)) {
      for (const item of payload) {
        const resolved = resolveUsernameFromPayload(item);
        if (resolved) {
          return resolved;
        }
      }
      return "";
    }

    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const candidateKeys = ["username", "userName", "user_name", "assignedUsername", "generatedUsername", "value"];

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

    return "";
  };

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
    const response = await login(emailValue, passwordValue);
    const payloadRecord = response?.data && typeof response.data === "object" ? (response.data as Record<string, unknown>) : {};
    const nestedPayload = payloadRecord.data && typeof payloadRecord.data === "object" ? (payloadRecord.data as Record<string, unknown>) : null;
    const statusCode = typeof response?.data?.status === "number"
      ? response?.data?.status
      : typeof payloadRecord.status === "number"
        ? payloadRecord.status
        : typeof nestedPayload?.status === "number"
          ? nestedPayload.status
          : 0;
    const sessionIdFromPayload =
      typeof payloadRecord.sessionId === "string"
        ? payloadRecord.sessionId
        : typeof nestedPayload?.sessionId === "string"
          ? nestedPayload.sessionId
          : null;
    const message = typeof payloadRecord.message === "string"
      ? payloadRecord.message
      : typeof nestedPayload?.message === "string"
        ? nestedPayload.message
        : "";

    const alreadyLoggedIn = Boolean(nestedPayload?.alreadyLoggedIn) || message.toLowerCase().includes("already logged") || statusCode === 409;
    const userPayload = (nestedPayload || payloadRecord) as Record<string, unknown>;

    if (statusCode === 409 || alreadyLoggedIn) {
      sessionStorage.removeItem("wealth-plus-session-id");
      setPendingSessionId(sessionIdFromPayload);
      setSignInError("This account is already active on another device. Please sign out there first or continue using the existing session.");
      return false;
    }

    if (statusCode === 401) {
      setPendingSessionId(null);
      setSignInError("Your credentials are incorrect or your session has expired. Please try again.");
      return false;
    }


    if (statusCode === 200 && !alreadyLoggedIn) {
      const authToken = extractAuthTokenFromResponse(response);
      const refreshToken = extractRefreshTokenFromResponse(response) ?? getRefreshToken();

      if (!authToken) {
        setSignInError("Login succeeded but no authorization token was returned. Please try again.");
        return false;
      }

      setAuthToken(authToken);

      if (refreshToken) {
        setRefreshToken(refreshToken);

        try {
          const refreshedSession = await refreshAccessToken(authToken, refreshToken);
          const refreshedAuthToken = extractAuthTokenFromResponse(refreshedSession);

          if (refreshedAuthToken) {
            setAuthToken(refreshedAuthToken);
          }
        } catch (error) {
          console.warn("Unable to refresh access token after login:", error);
        }
      }

      persistAuthenticatedUser(emailValue, userPayload, sessionIdFromPayload);
      setPendingSessionId(null);
      navigate("/dashboard", { replace: true, state: { fromApp: true } });
      return true;
    }
    if(statusCode === 500) {  
      setSignInError("Invalid email or password.");
      return false;
    }
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
      setSignInError("Invalid email or password.");
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
      if (response?.status === 200 || response?.status === 204) {
        console.log("Successfully logged out other device:", response);
        setPendingSessionId(null);
        setSuccessMessage("Logged out other device. Please sign in now.");
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

  const handleForgotPassword = async () => {
    const emailValue = (forgotPasswordEmail || identifier).trim();

    if (!emailValue) {
      setForgotPasswordError("Please enter an email address.");
      return;
    }

    try {
      setIsForgotPasswordSubmitting(true);
      setForgotPasswordError(null);
      setForgotPasswordMessage(null);
      const authToken = getAuthToken();
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || "/koshmitra/api"}/update/forgotPassword`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ email: emailValue }),
      });

      if (!response.ok) {
        throw new Error("Unable to process the request.");
      }

      setForgotPasswordMessage("An email has been sent on your email ID. Follow the instructions to reset the password.");
      setForgotPasswordEmail(emailValue);
    } catch (error) {
      console.error("Unable to send forgot password request:", error);
      setForgotPasswordError("We could not process your request right now.");
    } finally {
      setIsForgotPasswordSubmitting(false);
    }
  };

  const handleOAuthLogin = async () => {
    try {
      setOauthLoading(true);
      setOauthError(null);

      const result = await googleLogin();
      const ssoResponse = await ssoLogin(result.token);
      const user = result.user;
      const email = user?.email?.trim();
      const fullName = user?.displayName?.trim() || "User";
      const firebaseAuthToken = extractTokenValue(result.token, true);

      if (!email) {
        throw new Error("Google did not return an email address.");
      }

      if (!firebaseAuthToken) {
        throw new Error("Google sign-in did not return an authorization token.");
      }

      const authTokenFromSsoResponse = extractAuthTokenFromResponse(ssoResponse);
      if (!authTokenFromSsoResponse) {
        throw new Error("SSO login succeeded but no JWT token was returned.");
      }

      // Firebase token is used for /auth/sso-login validation; use backend JWT afterwards.
      setAuthToken(authTokenFromSsoResponse);

      let storedUserName = user?.displayName?.trim() || email.split("@")[0];
      let storedFullName = fullName;

      try {
        const profileResponse = await profileDetails(email);
        const profileRecord = profileResponse && typeof profileResponse === "object"
          ? (profileResponse as Record<string, unknown>)
          : null;
        const profileData = profileRecord?.data && typeof profileRecord.data === "object"
          ? (profileRecord.data as Record<string, unknown>)
          : profileRecord;

        if (profileData) {
          storedUserName =
            typeof profileData?.userName === "string" && profileData.userName.trim()
              ? profileData.userName
              : typeof profileData?.username === "string" && profileData.username.trim()
                ? profileData.username
                : storedUserName;
          storedFullName =
            typeof profileData?.fullName === "string" && profileData.fullName.trim()
              ? profileData.fullName
              : typeof profileData?.firstName === "string" || typeof profileData?.lastName === "string"
                ? [profileData?.firstName, profileData?.lastName].filter(Boolean).join(" ").trim() || storedFullName
                : storedFullName;
        } else {
          const assignedUsernameResponse = await assignUsername(email);
          const assignedUsername = resolveUsernameFromPayload(assignedUsernameResponse);
          const username = assignedUsername || storedUserName.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 20) || email.split("@")[0];
          const firstName = fullName.split(" ")[0]?.trim() || "User";
          const lastName = fullName.split(" ").slice(1).join(" ").trim() || "User";

          const createResponse = await registerUser({
            userName: username,
            password: `oauth-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
            email,
            firstName,
            lastName,
            isAdmin: false,
            isActive: true,
            isRestrictedUser: false,
          });

          if (createResponse?.status === 200 || createResponse?.status === 201) {
            storedUserName = username;
            storedFullName = `${firstName} ${lastName}`.trim();
          }
        }
      } catch (error) {
        console.warn("Google profile lookup failed, falling back to Google data:", error);
      }

      persistAuthenticatedUser(email, {
        userName: storedUserName,
        userEmail: email,
        fullName: storedFullName,
      });

      navigate("/dashboard", { replace: true, state: { fromApp: true } });
    } catch (error) {
      console.error("Unable to complete Google sign-in:", error);
      setOauthError("Unable to sign in with Google right now.");
    } finally {
      setOauthLoading(false);
    }
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

            <div className="login-card-top">
              <div>
                <h2 className="login-title font-display">
                  {authMode === "signin" ? "Welcome back" : "Open door to your portfolio"}
                </h2>
                <p className="login-copy">
                  Secure access to your portfolio, transactions, and account activity.
                </p>
              </div>
              <span className="login-badge">Protected</span>
            </div>

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
                    {signInError.toLowerCase().includes("already active") || signInError.toLowerCase().includes("another device") ? (
                      <>
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
                      </>
                    ) : (
                      <div style={{ fontWeight: 600 }}>{signInError}</div>
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
                      <button
                        type="button"
                        className="link-gold"
                        style={{ fontSize: 12, background: "none", border: "none", cursor: "pointer", padding: 0 }}
                        onClick={() => setIsForgotPasswordOpen(true)}
                      >
                        Forgot password?
                      </button>
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
                        onFocus={() => setSuccessMessage(null)}
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword((prev) => !prev)}
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
              <span className="label">CONTINUE WITH</span>
              <div className="line" />
            </div>

            <div className="oauth-grid">
              <button type="button" className="btn-oauth" onClick={() => void handleOAuthLogin()} disabled={oauthLoading || isSubmitting}>
                <GoogleMark />
                {oauthLoading ? "Connecting..." : "Google"}
              </button>
            </div>
            {oauthError && (
              <div
                style={{
                  marginTop: 10,
                  padding: "10px 12px",
                  borderRadius: 10,
                  background: "rgba(198, 40, 40, 0.12)",
                  color: "#c62828",
                  fontSize: 13,
                  border: "1px solid rgba(198, 40, 40, 0.22)",
                }}
              >
                {oauthError}
              </div>
            )}

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

      {isForgotPasswordOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Reset password">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">Reset Password</h3>
              <button type="button" className="modal-close" onClick={() => setIsForgotPasswordOpen(false)} aria-label="Close reset password modal">
                ×
              </button>
            </div>

            <div className="modal-body">
              <label className="field">
                <span className="field-label">Email address</span>
                <div className="login-field">
                  <Mail className="icon-sm" />
                  <input
                    type="email"
                    name="forgotPasswordEmail"
                    placeholder="you@example.com"
                    value={forgotPasswordEmail || identifier}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  />
                </div>
              </label>

              {forgotPasswordMessage && (
                <div className="modal-success-message">
                  <span className="modal-success-icon">✓</span>
                  <span>{forgotPasswordMessage}</span>
                </div>
              )}

              {forgotPasswordError && (
                <div className="modal-error-message">{forgotPasswordError}</div>
              )}

              {!forgotPasswordMessage && (
                <button type="button" className="btn-primary modal-action-btn" onClick={() => void handleForgotPassword()} disabled={isForgotPasswordSubmitting}>
                  {isForgotPasswordSubmitting ? "Sending..." : "Reset Password"}
                  <ArrowUpRight className="icon-sm" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}