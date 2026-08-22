import { useEffect, useState, type FormEvent } from 'react';
import { generateEmailOtp, verifyEmailOtp } from '../../services/auth-token';
import { BankDetailsSection } from './bank-details-section';
import { EpfDetailsSection } from './epf-details-section';
import './e-wallet-page.css';

type WalletSection = {
  id: string;
  title: string;
  details: Array<{ label: string; value: string }>;
  unavailableMessage?: string;
};

type SecurityStep = 'email' | 'otp' | 'verified';

const TRUSTED_ACCESS_KEY = 'wealth-plus-ewallet-verified-at';
const OTP_EXPIRY_STORAGE_KEY = 'wealth-plus-ewallet-otp-expiry';
const OTP_ATTEMPTS_STORAGE_KEY = 'wealth-plus-ewallet-otp-attempts';
const LOCKED_UNTIL_STORAGE_KEY = 'wealth-plus-ewallet-locked-until';
const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 2 * 60 * 1000;
const TRUSTED_ACCESS_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;

// Call on logout so the next login requires eWallet OTP verification again.
export const clearEWalletSession = () => {
  sessionStorage.removeItem(TRUSTED_ACCESS_KEY);
  sessionStorage.removeItem(OTP_EXPIRY_STORAGE_KEY);
  sessionStorage.removeItem(OTP_ATTEMPTS_STORAGE_KEY);
  sessionStorage.removeItem(LOCKED_UNTIL_STORAGE_KEY);
};

function EWalletPage() {
  const registeredEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
  const userName = localStorage.getItem('wealth-plus-username')?.trim() || '';
  const [expandedSection, setExpandedSection] = useState<string>('bank-details');
  const [securityStep, setSecurityStep] = useState<SecurityStep>('email');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [securityMessage, setSecurityMessage] = useState<string>('');
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [lockedSecondsLeft, setLockedSecondsLeft] = useState(0);

  useEffect(() => {
    const verifiedAt = Number(sessionStorage.getItem(TRUSTED_ACCESS_KEY) ?? 0);
    if (verifiedAt && Date.now() - verifiedAt < TRUSTED_ACCESS_MS) {
      setSecurityStep('verified');
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const now = Date.now();

      const expiryAt = Number(sessionStorage.getItem(OTP_EXPIRY_STORAGE_KEY) ?? 0);
      if (expiryAt > now) {
        setSecondsLeft(Math.ceil((expiryAt - now) / 1000));
      } else {
        setSecondsLeft(0);
      }

      const lockedUntil = Number(sessionStorage.getItem(LOCKED_UNTIL_STORAGE_KEY) ?? 0);
      if (lockedUntil > now) {
        setLockedSecondsLeft(Math.ceil((lockedUntil - now) / 1000));
      } else {
        setLockedSecondsLeft(0);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const maskEmail = (email: string) => {
    if (!email.includes('@')) {
      return 'your registered email';
    }

    const [name, domain] = email.split('@');
    const visible = name.slice(0, 2);
    const masked = `${visible}${'*'.repeat(Math.max(1, name.length - 2))}`;
    return `${masked}@${domain}`;
  };

  const clearOtpArtifacts = () => {
    sessionStorage.removeItem(OTP_EXPIRY_STORAGE_KEY);
    sessionStorage.removeItem(OTP_ATTEMPTS_STORAGE_KEY);
  };

  const sendOtp = async () => {
    const expiry = Date.now() + OTP_EXPIRY_MS;
    await generateEmailOtp({ email: registeredEmail });
    sessionStorage.setItem(OTP_EXPIRY_STORAGE_KEY, String(expiry));
    sessionStorage.setItem(OTP_ATTEMPTS_STORAGE_KEY, '0');
    setSecondsLeft(Math.ceil(OTP_EXPIRY_MS / 1000));
    setSecurityMessage(`Email OTP sent to ${maskEmail(registeredEmail)}. It expires in 2 minutes.`);
  };

  const handleEmailVerification = async (event: FormEvent) => {
    event.preventDefault();
    setSecurityError(null);

    if (!registeredEmail) {
      setSecurityError('Registered email was not found. Please re-login and try again.');
      return;
    }

    if (emailInput.trim().toLowerCase() !== registeredEmail.toLowerCase()) {
      setSecurityError('Email verification failed. Enter your registered email to continue.');
      return;
    }

    try {
      await sendOtp();
      setSecurityStep('otp');
    } catch {
      setSecurityError('Unable to generate OTP right now. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    setSecurityError(null);

    const lockedUntil = Number(sessionStorage.getItem(LOCKED_UNTIL_STORAGE_KEY) ?? 0);
    if (lockedUntil > Date.now()) {
      setSecurityError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)} seconds.`);
      return;
    }

    try {
      await sendOtp();
    } catch {
      setSecurityError('Unable to resend OTP right now. Please try again.');
    }
  };

  const handleOtpVerification = async (event: FormEvent) => {
    event.preventDefault();
    setSecurityError(null);

    const lockedUntil = Number(sessionStorage.getItem(LOCKED_UNTIL_STORAGE_KEY) ?? 0);
    if (lockedUntil > Date.now()) {
      setSecurityError(`Too many attempts. Try again in ${Math.ceil((lockedUntil - Date.now()) / 1000)} seconds.`);
      return;
    }

    const expiryAt = Number(sessionStorage.getItem(OTP_EXPIRY_STORAGE_KEY) ?? 0);
    const now = Date.now();

    if (expiryAt <= now) {
      setSecurityError('OTP expired. Request a new OTP to continue.');
      clearOtpArtifacts();
      setSecondsLeft(0);
      return;
    }

    const currentAttempts = Number(sessionStorage.getItem(OTP_ATTEMPTS_STORAGE_KEY) ?? 0);

    try {
      await verifyEmailOtp({
        email: registeredEmail,
        otp: otpInput.trim(),
      });

      sessionStorage.setItem(TRUSTED_ACCESS_KEY, String(now));
      clearOtpArtifacts();
      sessionStorage.removeItem(LOCKED_UNTIL_STORAGE_KEY);
      setLockedSecondsLeft(0);
      setSecurityStep('verified');
      setOtpInput('');
      setSecurityMessage('Two-factor verification successful. eWallet unlocked.');
    } catch {
      const updatedAttempts = currentAttempts + 1;
      sessionStorage.setItem(OTP_ATTEMPTS_STORAGE_KEY, String(updatedAttempts));

      if (updatedAttempts >= MAX_OTP_ATTEMPTS) {
        const lockedUntilAt = now + LOCKOUT_MS;
        sessionStorage.setItem(LOCKED_UNTIL_STORAGE_KEY, String(lockedUntilAt));
        clearOtpArtifacts();
        setLockedSecondsLeft(Math.ceil(LOCKOUT_MS / 1000));
        setSecurityError('Too many invalid attempts. Access has been temporarily locked for 5 minutes.');
      } else {
        setSecurityError(`Invalid OTP. ${MAX_OTP_ATTEMPTS - updatedAttempts} attempt(s) remaining.`);
      }
    }
  };

  const sections: WalletSection[] = [
    {
      id: 'bank-details',
      title: 'Bank Details',
      details: [],
    },
    {
      id: 'financial-details',
      title: 'Financial Details',
      details: registeredEmail ? [{ label: 'Registered Email', value: registeredEmail }] : [],
      unavailableMessage: 'Add your details to secure it digitally',
    },
    {
      id: 'nps',
      title: 'NPS',
      details: [],
      unavailableMessage: 'Add your details to secure it digitally',
    },
    {
      id: 'epf',
      title: 'EPF',
      details: [],
      unavailableMessage: 'Add your details to secure it digitally',
    },
    {
      id: 'insurance',
      title: 'Insurance',
      details: [],
      unavailableMessage: 'Add your details to secure it digitally',
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSection((prev) => (prev === sectionId ? '' : sectionId));
  };

  if (securityStep !== 'verified') {
    return (
      <main className="ewallet-page">
        <section className="ewallet-card ewallet-security-card">
          <div className="ewallet-header">
            <p className="eyebrow">eWallet</p>
            <p className="ewallet-subtitle">Two-factor verification is required before you can view financial details.</p>
          </div>

          <div className="ewallet-security-banner">
            <strong>Security layer enabled:</strong> identity confirmation + one-time passcode verification.
          </div>

          {securityMessage ? <p className="ewallet-security-message">{securityMessage}</p> : null}
          {securityError ? <p className="ewallet-security-error">{securityError}</p> : null}

          {lockedSecondsLeft > 0 ? (
            <p className="ewallet-lock-message">Access locked. Retry in {lockedSecondsLeft}s.</p>
          ) : null}

          {securityStep === 'email' ? (
            <form onSubmit={handleEmailVerification} className="ewallet-auth-form">
              <label htmlFor="ewallet-email">Confirm registered email</label>
              <input
                id="ewallet-email"
                type="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                placeholder="Enter your registered email"
                autoComplete="email"
                required
              />
              <button type="submit" className="ewallet-auth-btn">Continue</button>
            </form>
          ) : (
            <form onSubmit={handleOtpVerification} className="ewallet-auth-form">
              <label htmlFor="ewallet-otp">Enter 6-digit OTP</label>
              <input
                id="ewallet-otp"
                type="text"
                value={otpInput}
                onChange={(event) => setOtpInput(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Enter OTP"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
              />
              <div className="ewallet-auth-actions">
                <button type="submit" className="ewallet-auth-btn" disabled={lockedSecondsLeft > 0}>Verify OTP</button>
                <button type="button" className="ewallet-auth-link" onClick={handleResendOtp} disabled={lockedSecondsLeft > 0}>
                  Resend OTP
                </button>
              </div>
              <p className="ewallet-timer">OTP expires in: {secondsLeft}s</p>
            </form>
          )}
        </section>
      </main>
    );
  }

  return (
    <main className="ewallet-page">
      <section className="ewallet-card">
        <div className="ewallet-header">
          <p className="eyebrow">eWallet</p>
          <h2>Personal Financial Vault</h2>
          <p className="ewallet-subtitle">Review and manage your consolidated financial details in one place.</p>
        </div>

        <div className="ewallet-sections">
          {sections.map((section) => {
            const isOpen = expandedSection === section.id;

            return (
              <article className="ewallet-section" key={section.id}>
                <button
                  type="button"
                  className="ewallet-section-toggle"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={`${section.id}-content`}
                >
                  <span>{section.title}</span>
                  <span className={`ewallet-caret ${isOpen ? 'open' : ''}`}>▾</span>
                </button>

                {isOpen && (
                  <div id={`${section.id}-content`} className="ewallet-section-content">
                    {section.id === 'bank-details' ? (
                      <BankDetailsSection registeredEmail={registeredEmail} userName={userName} />
                    ) : section.id === 'epf' ? (
                      <EpfDetailsSection userName={userName} />
                    ) : (
                      <>
                        <dl>
                          {section.details.map((detail) => (
                            <div className="ewallet-detail-row" key={`${section.id}-${detail.label}`}>
                              <dt>{detail.label}</dt>
                              <dd>{detail.value}</dd>
                            </div>
                          ))}
                        </dl>
                        {section.unavailableMessage && section.details.length === 0 ? (
                          <p className="ewallet-empty-message">{section.unavailableMessage}</p>
                        ) : null}
                      </>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

export default EWalletPage;
