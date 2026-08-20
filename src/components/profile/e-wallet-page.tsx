import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { generateEmailOtp, verifyEmailOtp } from '../../services/auth-token';
import { addBank, getBanksByUserEmail, type BankDetails } from '../../services/wallet-service';
import './e-wallet-page.css';

type WalletSection = {
  id: string;
  title: string;
  details: Array<{ label: string; value: string }>;
  unavailableMessage?: string;
};

type SecurityStep = 'email' | 'otp' | 'verified';

type BankFormState = {
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  branchName: string;
  swiftCode: string;
  bankCountry: string;
  accountHolderName: string;
  accountHolderAddress: string;
  accountHolderPhoneNumber: string;
  accountHolderEmail: string;
  accountHolderDateOfBirth: string;
  accountOpeningDate: string;
};

const TRUSTED_ACCESS_KEY = 'wealth-plus-ewallet-verified-at';
const OTP_EXPIRY_STORAGE_KEY = 'wealth-plus-ewallet-otp-expiry';
const OTP_ATTEMPTS_STORAGE_KEY = 'wealth-plus-ewallet-otp-attempts';
const LOCKED_UNTIL_STORAGE_KEY = 'wealth-plus-ewallet-locked-until';
const MAX_OTP_ATTEMPTS = 5;
const OTP_EXPIRY_MS = 2 * 60 * 1000;
const TRUSTED_ACCESS_MS = 10 * 60 * 1000;
const LOCKOUT_MS = 5 * 60 * 1000;

const formatDateOfBirth = (date: string) => {
  const [year, month, day] = date.split('-');
  return year && month && day ? `${day}-${month}-${year}` : '';
};

const getLocalDateTime = () => {
  const date = new Date();
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .replace('Z', '');
};

const toBankFormState = (bank: BankDetails): BankFormState => {
  const userDetails = bank.userBankDetails || {};

  const rawSwift = bank.swiftCode || userDetails.swiftCode || '';
  const swiftCode = (rawSwift === 'null' || !rawSwift) ? '' : rawSwift;

  const rawDate = bank.createdAt || bank.accountOpeningDate || '';
  const formattedOpeningDate = rawDate ? rawDate.split('T')[0] : '';

  return {
    bankName: bank.bankName || '',
    accountNumber: userDetails.accountNumber || bank.accountNumber || '',
    ifscCode: bank.ifscCode || userDetails.ifscCode || '',
    branchName: userDetails.branchName || bank.branchName || '',
    swiftCode,
    bankCountry: bank.country || bank.bankCountry || '',
    accountHolderName: userDetails.accountHolderName || bank.accountHolderName || '',
    accountHolderAddress: userDetails.accountHolderAddress || bank.accountHolderAddress || '',
    accountHolderPhoneNumber: userDetails.accountHolderPhoneNumber || bank.accountHolderPhoneNumber || '',
    accountHolderEmail: userDetails.accountHolderEmail || bank.accountHolderEmail || '',
    accountHolderDateOfBirth: userDetails.accountHolderDateOfBirth || bank.accountHolderDateOfBirth || '',
    accountOpeningDate: formattedOpeningDate,
  };
};

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
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(true);
  const [bankFormError, setBankFormError] = useState<string | null>(null);
  const [bankFormMessage, setBankFormMessage] = useState<string | null>(null);
  const [savedBankList, setSavedBankList] = useState<BankFormState[]>([]);
  const [visibleAccounts, setVisibleAccounts] = useState<Record<number, boolean>>({});

  const toggleAccountVisibility = (index: number) => {
    setVisibleAccounts((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const maskAccountNumber = (accNum: string) => {
    if (!accNum) return '••••';
    if (accNum.startsWith('*')) {
      return `••••${accNum.replace(/^\*+/, '')}`;
    }
    if (accNum.length <= 4) {
      return '••••' + accNum;
    }
    const lastFour = accNum.slice(-4);
    const hiddenCount = Math.min(accNum.length - 4, 8);
    return '•'.repeat(hiddenCount) + lastFour;
  };
  const [bankForm, setBankForm] = useState<BankFormState>(() => ({
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branchName: '',
    swiftCode: '',
    bankCountry: '',
    accountHolderName: '',
    accountHolderAddress: '',
    accountHolderPhoneNumber: '',
    accountHolderEmail: registeredEmail,
    accountHolderDateOfBirth: '',
    accountOpeningDate: '',
  }));

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

  useEffect(() => {
    let isMounted = true;

    const loadBankDetails = async () => {
      if (securityStep !== 'verified') {
        return;
      }

      if (!registeredEmail) {
        setIsBankLoading(false);
        return;
      }

      try {
        const banks = await getBanksByUserEmail(registeredEmail);
        if (!isMounted) {
          return;
        }

        const bankDetailsList = banks.map(toBankFormState);
        setSavedBankList(bankDetailsList);
      } catch (error) {
        console.error('Unable to load bank details:', error);
      } finally {
        if (isMounted) {
          setIsBankLoading(false);
        }
      }
    };

    void loadBankDetails();

    return () => {
      isMounted = false;
    };
  }, [registeredEmail, securityStep]);

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

  const handleBankFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as keyof BankFormState;
    setBankForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleAddBank = async (event: FormEvent) => {
    event.preventDefault();
    setBankFormError(null);
    setBankFormMessage(null);

    if (!registeredEmail || !userName) {
      setBankFormError('Your user profile could not be found. Please re-login and try again.');
      return;
    }

    try {
      setIsBankSaving(true);
      await addBank({
        userEmail: registeredEmail,
        userName,
        ...bankForm,
        accountHolderDateOfBirth: formatDateOfBirth(bankForm.accountHolderDateOfBirth),
        createdAt: getLocalDateTime(),
        updatedAt: null,
      });

      try {
        const updatedBanks = await getBanksByUserEmail(registeredEmail);
        setSavedBankList(updatedBanks.length > 0 ? updatedBanks.map(toBankFormState) : [...savedBankList, bankForm]);
      } catch {
        setSavedBankList((previous) => [...previous, bankForm]);
      }

      setBankFormMessage('Bank details saved securely.');
      setIsBankFormOpen(false);

      setBankForm({
        bankName: '',
        accountNumber: '',
        ifscCode: '',
        branchName: '',
        swiftCode: '',
        bankCountry: '',
        accountHolderName: '',
        accountHolderAddress: '',
        accountHolderPhoneNumber: '',
        accountHolderEmail: registeredEmail,
        accountHolderDateOfBirth: '',
        accountOpeningDate: '',
      });
    } catch {
      setBankFormError('Unable to save bank details right now. Please try again.');
    } finally {
      setIsBankSaving(false);
    }
  };

  const getBankDetailsList = (bank: BankFormState) => [
    { label: 'Account Holder', value: bank.accountHolderName },
    { label: 'Bank Name', value: bank.bankName },
    { label: 'Account Number', value: bank.accountNumber },
    { label: 'IFSC Code', value: bank.ifscCode },
    { label: 'Branch Name', value: bank.branchName },
    { label: 'Address', value: bank.accountHolderAddress },
    { label: 'Phone Number', value: bank.accountHolderPhoneNumber },
    { label: 'Date of Birth', value: bank.accountHolderDateOfBirth },
    { label: 'SWIFT Code', value: bank.swiftCode || 'Not provided' },
    { label: 'Country', value: bank.bankCountry },
    { label: 'Created At', value: bank.accountOpeningDate },
  ].filter((item) => item.value && item.value.trim() !== '');

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
                      isBankLoading ? (
                        <p className="ewallet-empty-message">Loading bank details...</p>
                      ) : savedBankList.length === 0 ? (
                        <div className="ewallet-empty-state">
                          <p className="ewallet-empty-message">Add your details to secure it digitally</p>
                          <button
                            type="button"
                            className="ewallet-add-bank-btn"
                            onClick={() => setIsBankFormOpen((previous) => !previous)}
                            aria-expanded={isBankFormOpen}
                          >
                            {isBankFormOpen ? 'Hide Bank Form' : 'Add Bank Details'}
                          </button>

                          {isBankFormOpen ? (
                            <form className="ewallet-bank-form" onSubmit={handleAddBank}>
                              <div className="ewallet-bank-form-grid">
                                <label>
                                  Bank Name
                                  <input name="bankName" value={bankForm.bankName} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Number
                                  <input name="accountNumber" value={bankForm.accountNumber} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  IFSC Code
                                  <input name="ifscCode" value={bankForm.ifscCode} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Branch Name
                                  <input name="branchName" value={bankForm.branchName} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  SWIFT Code
                                  <input name="swiftCode" value={bankForm.swiftCode} onChange={handleBankFormChange} />
                                </label>
                                <label>
                                  Bank Country
                                  <input name="bankCountry" value={bankForm.bankCountry} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Holder Name
                                  <input name="accountHolderName" value={bankForm.accountHolderName} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Holder Address
                                  <input name="accountHolderAddress" value={bankForm.accountHolderAddress} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Holder Phone Number
                                  <input name="accountHolderPhoneNumber" type="tel" value={bankForm.accountHolderPhoneNumber} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Holder Email
                                  <input name="accountHolderEmail" type="email" value={bankForm.accountHolderEmail} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Holder Date of Birth
                                  <input name="accountHolderDateOfBirth" type="date" value={bankForm.accountHolderDateOfBirth} onChange={handleBankFormChange} required />
                                </label>
                                <label>
                                  Account Opening Date
                                  <input name="accountOpeningDate" type="date" value={bankForm.accountOpeningDate} onChange={handleBankFormChange} required />
                                </label>
                              </div>

                              {bankFormError ? <p className="ewallet-bank-form-error">{bankFormError}</p> : null}
                              <button type="submit" className="ewallet-add-bank-btn" disabled={isBankSaving}>
                                {isBankSaving ? 'Saving...' : 'Save Bank Details'}
                              </button>
                            </form>
                          ) : null}
                        </div>
                      ) : (
                        <div className="ewallet-banks-container">
                          {bankFormMessage ? <p className="ewallet-bank-form-message">{bankFormMessage}</p> : null}

                          <div className="ewallet-banks-header">
                            <span className="ewallet-banks-count">
                              Saved Bank Accounts ({savedBankList.length})
                            </span>
                            <button
                              type="button"
                              className="ewallet-add-bank-btn"
                              onClick={() => setIsBankFormOpen((previous) => !previous)}
                              aria-expanded={isBankFormOpen}
                            >
                              {isBankFormOpen ? 'Hide Bank Form' : '+ Add Another Bank'}
                            </button>
                          </div>

                          {isBankFormOpen ? (
                            <div className="ewallet-bank-form-wrapper">
                              <form className="ewallet-bank-form" onSubmit={handleAddBank}>
                                <div className="ewallet-bank-form-grid">
                                  <label>
                                    Bank Name
                                    <input name="bankName" value={bankForm.bankName} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Number
                                    <input name="accountNumber" value={bankForm.accountNumber} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    IFSC Code
                                    <input name="ifscCode" value={bankForm.ifscCode} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Branch Name
                                    <input name="branchName" value={bankForm.branchName} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    SWIFT Code
                                    <input name="swiftCode" value={bankForm.swiftCode} onChange={handleBankFormChange} />
                                  </label>
                                  <label>
                                    Bank Country
                                    <input name="bankCountry" value={bankForm.bankCountry} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Holder Name
                                    <input name="accountHolderName" value={bankForm.accountHolderName} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Holder Address
                                    <input name="accountHolderAddress" value={bankForm.accountHolderAddress} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Holder Phone Number
                                    <input name="accountHolderPhoneNumber" type="tel" value={bankForm.accountHolderPhoneNumber} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Holder Email
                                    <input name="accountHolderEmail" type="email" value={bankForm.accountHolderEmail} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Holder Date of Birth
                                    <input name="accountHolderDateOfBirth" type="date" value={bankForm.accountHolderDateOfBirth} onChange={handleBankFormChange} required />
                                  </label>
                                  <label>
                                    Account Opening Date
                                    <input name="accountOpeningDate" type="date" value={bankForm.accountOpeningDate} onChange={handleBankFormChange} required />
                                  </label>
                                </div>

                                {bankFormError ? <p className="ewallet-bank-form-error">{bankFormError}</p> : null}
                                <button type="submit" className="ewallet-add-bank-btn" disabled={isBankSaving}>
                                  {isBankSaving ? 'Saving...' : 'Save Bank Details'}
                                </button>
                              </form>
                            </div>
                          ) : null}

                          <div className="ewallet-banks-list">
                            {savedBankList.map((bank, index) => {
                              const isRevealed = Boolean(visibleAccounts[index]);
                              const displayAccNum = isRevealed ? bank.accountNumber : maskAccountNumber(bank.accountNumber);

                              return (
                                <div className="ewallet-bank-card" key={`bank-${index}-${bank.accountNumber}`}>
                                  <div className="ewallet-bank-card-header">
                                    <h3 className="ewallet-bank-card-title">{bank.bankName || `Bank Account #${index + 1}`}</h3>
                                    <span className="ewallet-bank-card-badge">
                                      Acc: {displayAccNum}
                                      <button
                                        type="button"
                                        className="ewallet-eye-btn ewallet-eye-btn-inline"
                                        onClick={() => toggleAccountVisibility(index)}
                                        title={isRevealed ? 'Hide account number' : 'Show account number'}
                                        aria-label={isRevealed ? 'Hide account number' : 'Show account number'}
                                      >
                                        {isRevealed ? (
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                            <line x1="1" y1="1" x2="23" y2="23"></line>
                                          </svg>
                                        ) : (
                                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                            <circle cx="12" cy="12" r="3"></circle>
                                          </svg>
                                        )}
                                      </button>
                                    </span>
                                  </div>
                                  <dl>
                                    {getBankDetailsList(bank).map((detail) => (
                                      <div className="ewallet-detail-row" key={`bank-${index}-${detail.label}`}>
                                        <dt>{detail.label}</dt>
                                        <dd className={detail.label === 'Account Number' ? 'ewallet-account-number-value' : ''}>
                                          {detail.label === 'Account Number' ? (
                                            <>
                                              <span>{displayAccNum}</span>
                                              <button
                                                type="button"
                                                className="ewallet-eye-btn"
                                                onClick={() => toggleAccountVisibility(index)}
                                                title={isRevealed ? 'Hide account number' : 'Show account number'}
                                                aria-label={isRevealed ? 'Hide account number' : 'Show account number'}
                                              >
                                                {isRevealed ? (
                                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                                    <line x1="1" y1="1" x2="23" y2="23"></line>
                                                  </svg>
                                                ) : (
                                                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                    <circle cx="12" cy="12" r="3"></circle>
                                                  </svg>
                                                )}
                                              </button>
                                            </>
                                          ) : (
                                            detail.value
                                          )}
                                        </dd>
                                      </div>
                                    ))}
                                  </dl>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )
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
