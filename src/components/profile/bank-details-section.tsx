import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { addBank, getBanksByUserEmail, type BankDetails } from '../../services/wallet-service';

export type BankFormState = {
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

type BankDetailsSectionProps = {
  registeredEmail: string;
  userName: string;
};

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

const toBankFormState = (bank: BankDetails | Record<string, unknown>): BankFormState => {
  const record = bank as Record<string, unknown>;
  const userDetails = (record.userBankDetails || record.userBankDetail || record.userBankDetailDTO || {}) as Record<string, unknown>;

  const rawSwift = (record.swiftCode || record.swiftcode || record.swift_code || userDetails.swiftCode || userDetails.swift_code || '') as string;
  const swiftCode = rawSwift === 'null' || !rawSwift ? '' : String(rawSwift);

  const rawDate = (record.createdAt || record.accountOpeningDate || record.created_at || record.account_opening_date || userDetails.accountOpeningDate || '') as string;
  const formattedOpeningDate = rawDate ? String(rawDate).split('T')[0] : '';

  return {
    bankName: String(record.bankName || record.bank_name || userDetails.bankName || userDetails.bank_name || ''),
    accountNumber: String(record.accountNumber || record.account_number || userDetails.accountNumber || userDetails.account_number || ''),
    ifscCode: String(record.ifscCode || record.ifsc_code || userDetails.ifscCode || userDetails.ifsc_code || ''),
    branchName: String(record.branchName || record.branch_name || userDetails.branchName || userDetails.branch_name || ''),
    swiftCode,
    bankCountry: String(record.bankCountry || record.country || userDetails.bankCountry || userDetails.country || ''),
    accountHolderName: String(record.accountHolderName || record.account_holder_name || userDetails.accountHolderName || userDetails.account_holder_name || ''),
    accountHolderAddress: String(record.accountHolderAddress || record.account_holder_address || userDetails.accountHolderAddress || userDetails.account_holder_address || ''),
    accountHolderPhoneNumber: String(record.accountHolderPhoneNumber || record.account_holder_phone_number || userDetails.accountHolderPhoneNumber || userDetails.account_holder_phone_number || ''),
    accountHolderEmail: String(record.accountHolderEmail || record.account_holder_email || userDetails.accountHolderEmail || userDetails.account_holder_email || ''),
    accountHolderDateOfBirth: String(record.accountHolderDateOfBirth || record.account_holder_date_of_birth || userDetails.accountHolderDateOfBirth || userDetails.account_holder_date_of_birth || ''),
    accountOpeningDate: formattedOpeningDate,
  };
};

export function BankDetailsSection({ registeredEmail, userName }: BankDetailsSectionProps) {
  const [isBankFormOpen, setIsBankFormOpen] = useState(false);
  const [isBankSaving, setIsBankSaving] = useState(false);
  const [isBankLoading, setIsBankLoading] = useState(true);
  const [bankFormError, setBankFormError] = useState<string | null>(null);
  const [bankFormMessage, setBankFormMessage] = useState<string | null>(null);
  const [savedBankList, setSavedBankList] = useState<BankFormState[]>(() => {
    try {
      const cached = localStorage.getItem('wealth-plus-bank-list');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
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
    let isMounted = true;

    const loadBankDetails = async () => {
      if (!registeredEmail) {
        setIsBankLoading(false);
        return;
      }

      try {
        const banks = await getBanksByUserEmail(registeredEmail);
        if (!isMounted) return;

        const bankDetailsList = banks.map(toBankFormState).filter((b) => b.accountNumber || b.bankName);
        if (bankDetailsList.length > 0) {
          setSavedBankList(bankDetailsList);
          try {
            localStorage.setItem('wealth-plus-bank-list', JSON.stringify(bankDetailsList));
          } catch {
            // ignore localStorage error
          }
        }
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
  }, [registeredEmail]);

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

      const updatedList = [...savedBankList, bankForm];
      setSavedBankList(updatedList);
      try {
        localStorage.setItem('wealth-plus-bank-list', JSON.stringify(updatedList));
      } catch {
        // ignore localStorage error
      }

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
        const mapped = updatedBanks.map(toBankFormState).filter((b) => b.accountNumber || b.bankName);
        if (mapped.length > 0) {
          setSavedBankList(mapped);
          localStorage.setItem('wealth-plus-bank-list', JSON.stringify(mapped));
        }
      } catch {
        // keep updatedList in state & localStorage
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

  const getBankDetailsList = (bank: BankFormState) =>
    [
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

  if (isBankLoading) {
    return <p className="ewallet-empty-message">Loading bank details...</p>;
  }

  if (savedBankList.length === 0) {
    return (
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
    );
  }

  return (
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
  );
}
