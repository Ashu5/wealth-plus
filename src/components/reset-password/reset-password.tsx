// pages/ResetPasswordPage.jsx
import { useState, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Lock, ArrowUpRight, Eye, EyeOff } from "lucide-react";
import { resetPassword } from "../../services/user-service";
import logo from "../../assets/logo_big.png";
import "./reset-password.css";

export default function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get("token");

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [status, setStatus] = useState<"success" | "error" | null>(null);
    const [message, setMessage] = useState("");
    const MIN_PASS_LENGTH = 6;
    const isFormValid = useMemo(() => {
        const hasRequiredFields = Boolean(newPassword.trim() && confirmPassword.trim());
        const passwordIsValid = newPassword.trim().length >= MIN_PASS_LENGTH;
        return hasRequiredFields && passwordIsValid;
    }, [newPassword, confirmPassword]);

    if (!token) {
        return (
            <div className="reset-page">
                <div className="bg-grid" />
                <div className="bg-glow" />
                <header className="page-header">
                    <div className="brand">
                        <img src={logo} alt="Wealth Plus Logo" className="brand-logo" />
                    </div>
                </header>
                <main className="main-grid">
                    <section className="hero">
                        <div className="hero-kicker">
                            <span className="hero-dot" />
                            Password reset
                        </div>
                        <p className="hero-eyebrow font-mono-data">SECURITY</p>
                        <h1 className="hero-title">Create a new secure password.</h1>
                        <p className="hero-subtitle">This reset link is missing a token. Please request a new one and try again.</p>
                    </section>
                    <aside className="reset-aside">
                        <div className="reset-card">
                            <div className="reset-kicker">
                                <div className="reset-kicker-bar" />
                                <p className="reset-kicker-text font-mono-data">ACCOUNT ACCESS</p>
                            </div>
                            <h2 className="reset-title">Reset unavailable</h2>
                            <p className="reset-copy">The password reset link cannot be used right now.</p>
                        </div>
                    </aside>
                </main>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!isFormValid) {
            return;
        }
        if (newPassword !== confirmPassword) {
            setStatus("error");
            setMessage("Passwords don't match.");
            return;
        }

        try {
            const response = await resetPassword(token, newPassword);

            setStatus(response.status === 200 ? "success" : "error");
            setMessage(response.message);

            if (response.status === 200) {
                setTimeout(() => navigate("/login"), 2000);
            }
        } catch {
            setStatus("error");
            setMessage("Link is expired. Please try again.");
        }
    };

    return (
        <div className="reset-page">
            <div className="bg-grid" />
            <div className="bg-glow" />

            <header className="page-header">
                <div className="brand">
                    <img src={logo} alt="Wealth Plus Logo" className="brand-logo" />
                </div>
            </header>

            <main className="main-grid">
                <section className="hero">
                    <div className="hero-kicker">
                        <span className="hero-dot" />
                        Secure account recovery
                    </div>
                    <p className="hero-eyebrow font-mono-data">SECURITY</p>
                    <h1 className="hero-title">Reset your password and get back in.</h1>
                    <p className="hero-subtitle">
                        Choose a strong new password for your Wealth Plus account and continue managing your portfolio with confidence.
                    </p>
                </section>

                <aside className="reset-aside">
                    <div className="reset-card">
                        <div className="reset-kicker">
                            <div className="reset-kicker-bar" />
                            <p className="reset-kicker-text font-mono-data">ACCOUNT ACCESS</p>
                        </div>

                        <h2 className="reset-title">Set a new password</h2>
                        <p className="reset-copy">Use a password that is unique and easy for you to remember.</p>

                        <form className="reset-form" onSubmit={handleSubmit}>
                            <label className="field">
                                <span className="field-label">New password</span>
                                <div className="login-field">
                                    <Lock className="icon-sm" />
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Enter new password"
                                        value={newPassword}
                                        name="new-password"
                                        minLength={6}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowNewPassword((prev) => !prev)}
                                        aria-label={showNewPassword ? "Hide password" : "Show password"}
                                    >
                                        {showNewPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                                    </button>
                                </div>
                            </label>

                            <label className="field">
                                <span className="field-label">Confirm password</span>
                                <div className="login-field">
                                    <Lock className="icon-sm" />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm new password"
                                        value={confirmPassword}
                                        name="confirm-password"
                                        minLength={6}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                                        aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                                    >
                                        {showConfirmPassword ? <EyeOff className="icon-sm" /> : <Eye className="icon-sm" />}
                                    </button>
                                </div>
                            </label>

                            <button type="submit" className="btn-primary">
                                Reset Password
                                <ArrowUpRight className="icon-sm" />
                            </button>
                        </form>

                        {message && (
                            <p className={`message ${status === "success" ? "success" : "error"}`}>
                                {message}
                            </p>
                        )}

                        <button type="button" className="link-gold" onClick={() => navigate("/login")}>Back to login</button>
                    </div>
                </aside>
            </main>
        </div>
    );
}