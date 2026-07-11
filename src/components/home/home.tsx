import React, { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Lock, Mail, TrendingUp, TrendingDown, ArrowUpRight } from "lucide-react";
import "./home.css";

type Holding = {
  symbol: string;
  name: string;
  price: number;
  changePct: number;
};

const INITIAL_HOLDINGS: Holding[] = [
  { symbol: "NVDA", name: "Nvidia Corp", price: 187.42, changePct: 2.14 },
  { symbol: "VOO", name: "Vanguard S&P 500", price: 612.08, changePct: 0.38 },
  { symbol: "AAPL", name: "Apple Inc", price: 231.55, changePct: -0.62 },
  { symbol: "BTC", name: "Bitcoin", price: 96_340, changePct: 1.87 },
  { symbol: "TSLA", name: "Tesla Inc", price: 268.91, changePct: -1.24 },
];

const TICKER_ROW = [
  { symbol: "S&P 500", delta: "+0.42%", up: true },
  { symbol: "NASDAQ", delta: "+0.71%", up: true },
  { symbol: "DOW", delta: "-0.18%", up: false },
  { symbol: "BTC/USD", delta: "+1.87%", up: true },
  { symbol: "10Y YIELD", delta: "-0.03%", up: false },
  { symbol: "GOLD", delta: "+0.29%", up: true },
  { symbol: "EUR/USD", delta: "-0.11%", up: false },
  { symbol: "VIX", delta: "-2.40%", up: false },
];

function formatMoney(n: number) {
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function Sparkline() {
  // A hand-authored path suggesting an upward, slightly volatile equity curve.
  return (
    <svg viewBox="0 0 320 96" className="sparkline" preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3FB68B" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#3FB68B" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M0,70 L20,66 L40,72 L60,58 L80,62 L100,46 L120,52 L140,38 L160,42 L180,26 L200,32 L220,20 L240,24 L260,12 L280,16 L300,6 L320,10 L320,96 L0,96 Z"
        fill="url(#sparkFill)"
      />
      <path
        d="M0,70 L20,66 L40,72 L60,58 L80,62 L100,46 L120,52 L140,38 L160,42 L180,26 L200,32 L220,20 L240,24 L260,12 L280,16 L300,6 L320,10"
        fill="none"
        stroke="#3FB68B"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
  const [holdings, setHoldings] = useState<Holding[]>(INITIAL_HOLDINGS);
  const [portfolioValue, setPortfolioValue] = useState(284_612.4);
  const [portfolioDelta, setPortfolioDelta] = useState(1.92);
  const [showPassword, setShowPassword] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setHoldings((prev) =>
        prev.map((h) => {
          const wiggle = (Math.random() - 0.5) * 0.6;
          return {
            ...h,
            price: Math.max(0.01, h.price * (1 + wiggle / 100)),
            changePct: h.changePct + wiggle * 0.4,
          };
        })
      );
      setPortfolioDelta((d) => d + (Math.random() - 0.5) * 0.15);
      setPortfolioValue((v) => Math.max(0, v * (1 + (Math.random() - 0.48) / 400)));
    }, 2600);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="ledgerline-page">
      {/* faint grid texture, financial-graph-paper feel */}
      <div className="bg-grid" />
      {/* radial glow behind the login card */}
      <div className="bg-glow" />

      {/* ticker tape */}
      <div className="ticker-tape">
        <div className="ticker-track">
          {[...TICKER_ROW, ...TICKER_ROW, ...TICKER_ROW, ...TICKER_ROW].map((t, i) => (
            <span key={i} className="ticker-item font-mono-data">
              <span className="symbol">{t.symbol}</span>
              <span className={`delta ${t.up ? "up" : "down"}`}>{t.delta}</span>
            </span>
          ))}
        </div>
      </div>

      {/* top bar */}
      <header className="page-header">
        <div className="brand">
          <div className="brand-mark">
            <span className="font-display">W</span>
          </div>
          <span className="brand-name font-display">Wealth Plus</span>
        </div>
      
      </header>

      {/* main content: hero left, login card right */}
      <main className="main-grid">
        {/* HERO */}
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

          {/* portfolio summary card */}
       

      
        </section>

        {/* LOGIN CARD — right corner */}
        <aside className="login-aside">
          <div className="login-card">
            <div className="login-kicker">
              <div className="login-kicker-bar" />
              <p className="login-kicker-text font-mono-data">
                {authMode === "signin" ? "ACCOUNT ACCESS" : "NEW ACCOUNT"}
              </p>
            </div>
            <h2 className="login-title font-display">
              {authMode === "signin" ? "Welcome back" : "Open your ledger"}
            </h2>

            <form
              className="login-form"
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <label className="field">
                <span className="field-label">Email or username</span>
                <div className="login-field">
                  <Mail className="icon-sm" />
                  <input
                    type="text"
                    name="identifier"
                    placeholder="you@example.com"
                    autoComplete="username"
                  />
                </div>
              </label>

              <label className="field">
                <div className="field-row">
                  <span className="field-label">Password</span>
                  {authMode === "signin" && (
                    <a href="#" className="link-gold" style={{ fontSize: 12 }}>
                      Forgot password?
                    </a>
                  )}
                </div>
                <div className="login-field">
                  <Lock className="icon-sm" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••••"
                    autoComplete={authMode === "signin" ? "current-password" : "new-password"}
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

              <button type="submit" className="btn-primary">
                {authMode === "signin" ? "Sign in" : "Create account"}
                <ArrowUpRight className="icon-sm" />
              </button>
            </form>

            <div className="divider">
              <div className="line" />
              <span className="label">OR CONTINUE WITH</span>
              <div className="line" />
            </div>

            <div className="oauth-grid">
              <button className="btn-oauth">
                <GoogleMark />
                Google
              </button>
              <button className="btn-oauth">
                <AppleMark />
                Apple
              </button>
            </div>

            <p className="login-footer">
              {authMode === "signin" ? (
                <>
                  New to Ledgerline?{" "}
                  <button onClick={() => setAuthMode("signup")} className="link-gold" style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}>
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button onClick={() => setAuthMode("signin")} className="link-gold" style={{ background: "none", border: "none", cursor: "pointer", font: "inherit" }}>
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
