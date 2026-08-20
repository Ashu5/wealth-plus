import { useState, type ChangeEvent, type FormEvent } from 'react';

export type EpfFormState = {
  accountHolderName: string;
  uanNumber: string;
  currentBalance: string;
  lastContAmount: string;
  lastContMonth: string;
  currentEmployer: string;
  establishmentId: string;
  startDate: string;
  endDate: string;
};

type EpfDetailsSectionProps = {
  userName: string;
};

export function EpfDetailsSection({ userName }: EpfDetailsSectionProps) {
  const [isEpfFormOpen, setIsEpfFormOpen] = useState(false);
  const [isEpfSaving, setIsEpfSaving] = useState(false);
  const [epfFormError, setEpfFormError] = useState<string | null>(null);
  const [epfFormMessage, setEpfFormMessage] = useState<string | null>(null);
  const [savedEpfList, setSavedEpfList] = useState<EpfFormState[]>(() => {
    try {
      const cached = localStorage.getItem('wealth-plus-epf-list');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [epfForm, setEpfForm] = useState<EpfFormState>(() => ({
    accountHolderName: userName || '',
    uanNumber: '',
    currentBalance: '',
    lastContAmount: '',
    lastContMonth: '',
    currentEmployer: '',
    establishmentId: '',
    startDate: '',
    endDate: '',
  }));

  const handleEpfFormChange = (event: ChangeEvent<HTMLInputElement>) => {
    const field = event.target.name as keyof EpfFormState;
    setEpfForm((previous) => ({ ...previous, [field]: event.target.value }));
  };

  const handleAddEpf = (event: FormEvent) => {
    event.preventDefault();
    setEpfFormError(null);
    setEpfFormMessage(null);

    try {
      setIsEpfSaving(true);
      const updatedList = [...savedEpfList, epfForm];
      setSavedEpfList(updatedList);
      try {
        localStorage.setItem('wealth-plus-epf-list', JSON.stringify(updatedList));
      } catch (error) {
        console.error('Unable to save EPF details:', error);
      }

      setEpfFormMessage('EPF details saved securely.');
      setIsEpfFormOpen(false);

      setEpfForm({
        accountHolderName: userName || '',
        uanNumber: '',
        currentBalance: '',
        lastContAmount: '',
        lastContMonth: '',
        currentEmployer: '',
        establishmentId: '',
        startDate: '',
        endDate: '',
      });
    } catch {
      setEpfFormError('Unable to save EPF details right now. Please try again.');
    } finally {
      setIsEpfSaving(false);
    }
  };

  const getEpfDetailsList = (epf: EpfFormState) =>
    [
      { label: 'EPFO Account Holder Name', value: epf.accountHolderName },
      { label: 'UAN Number', value: epf.uanNumber },
      {
        label: 'Current Balance',
        value: epf.currentBalance
          ? epf.currentBalance.startsWith('₹')
            ? epf.currentBalance
            : `₹${epf.currentBalance}`
          : '',
      },
      {
        label: 'Last Cont. Amount',
        value: epf.lastContAmount
          ? epf.lastContAmount.startsWith('₹')
            ? epf.lastContAmount
            : `₹${epf.lastContAmount}`
          : '',
      },
      { label: 'Last Cont. Month', value: epf.lastContMonth },
      { label: 'Current Employer', value: epf.currentEmployer },
      { label: 'Establishment ID', value: epf.establishmentId },
      { label: 'Start Date', value: epf.startDate },
      { label: 'End Date', value: epf.endDate },
    ].filter((item) => item.value && item.value.trim() !== '');

  if (savedEpfList.length === 0) {
    return (
      <div className="ewallet-empty-state">
        <p className="ewallet-empty-message">Add your details to secure it digitally</p>
        <button
          type="button"
          className="ewallet-add-epf-btn"
          onClick={() => setIsEpfFormOpen((previous) => !previous)}
          aria-expanded={isEpfFormOpen}
        >
          {isEpfFormOpen ? 'Hide EPF Form' : 'Add EPF Details'}
        </button>

        {isEpfFormOpen ? (
          <form className="ewallet-bank-form" onSubmit={handleAddEpf}>
            <div className="ewallet-bank-form-grid">
              <label>
                EPFO Account Holder Name
                <input name="accountHolderName" value={epfForm.accountHolderName} onChange={handleEpfFormChange} required />
              </label>
              <label>
                UAN Number
                <input name="uanNumber" value={epfForm.uanNumber} onChange={handleEpfFormChange} required />
              </label>
              <label>
                Current Balance
                <input name="currentBalance" value={epfForm.currentBalance} onChange={handleEpfFormChange} placeholder="e.g. 150000" />
              </label>
              <label>
                Last Cont. Amount
                <input name="lastContAmount" value={epfForm.lastContAmount} onChange={handleEpfFormChange} placeholder="e.g. 3600" />
              </label>
              <label>
                Last Cont. Month
                <input name="lastContMonth" value={epfForm.lastContMonth} onChange={handleEpfFormChange} placeholder="e.g. July 2026" />
              </label>
              <label>
                Current Employer
                <input name="currentEmployer" value={epfForm.currentEmployer} onChange={handleEpfFormChange} />
              </label>
              <label>
                Establishment ID
                <input name="establishmentId" value={epfForm.establishmentId} onChange={handleEpfFormChange} />
              </label>
              <label>
                Start Date
                <input name="startDate" type="date" value={epfForm.startDate} onChange={handleEpfFormChange} />
              </label>
              <label>
                End Date
                <input name="endDate" type="date" value={epfForm.endDate} onChange={handleEpfFormChange} />
              </label>
            </div>

            {epfFormError ? <p className="ewallet-bank-form-error">{epfFormError}</p> : null}
            <button type="submit" className="ewallet-add-epf-btn" disabled={isEpfSaving}>
              {isEpfSaving ? 'Saving...' : 'Save EPF Details'}
            </button>
          </form>
        ) : null}
      </div>
    );
  }

  return (
    <div className="ewallet-banks-container">
      {epfFormMessage ? <p className="ewallet-bank-form-message">{epfFormMessage}</p> : null}

      <div className="ewallet-banks-header">
        <span className="ewallet-banks-count">
          Saved EPF Details ({savedEpfList.length})
        </span>
        <button
          type="button"
          className="ewallet-add-epf-btn"
          onClick={() => setIsEpfFormOpen((previous) => !previous)}
          aria-expanded={isEpfFormOpen}
        >
          {isEpfFormOpen ? 'Hide EPF Form' : '+ Add Another EPF'}
        </button>
      </div>

      {isEpfFormOpen ? (
        <div className="ewallet-bank-form-wrapper">
          <form className="ewallet-bank-form" onSubmit={handleAddEpf}>
            <div className="ewallet-bank-form-grid">
              <label>
                EPFO Account Holder Name
                <input name="accountHolderName" value={epfForm.accountHolderName} onChange={handleEpfFormChange} required />
              </label>
              <label>
                UAN Number
                <input name="uanNumber" value={epfForm.uanNumber} onChange={handleEpfFormChange} required />
              </label>
              <label>
                Current Balance
                <input name="currentBalance" value={epfForm.currentBalance} onChange={handleEpfFormChange} placeholder="e.g. 150000" />
              </label>
              <label>
                Last Cont. Amount
                <input name="lastContAmount" value={epfForm.lastContAmount} onChange={handleEpfFormChange} placeholder="e.g. 3600" />
              </label>
              <label>
                Last Cont. Month
                <input name="lastContMonth" value={epfForm.lastContMonth} onChange={handleEpfFormChange} placeholder="e.g. July 2026" />
              </label>
              <label>
                Current Employer
                <input name="currentEmployer" value={epfForm.currentEmployer} onChange={handleEpfFormChange} />
              </label>
              <label>
                Establishment ID
                <input name="establishmentId" value={epfForm.establishmentId} onChange={handleEpfFormChange} />
              </label>
              <label>
                Start Date
                <input name="startDate" type="date" value={epfForm.startDate} onChange={handleEpfFormChange} />
              </label>
              <label>
                End Date
                <input name="endDate" type="date" value={epfForm.endDate} onChange={handleEpfFormChange} />
              </label>
            </div>

            {epfFormError ? <p className="ewallet-bank-form-error">{epfFormError}</p> : null}
            <button type="submit" className="ewallet-add-epf-btn" disabled={isEpfSaving}>
              {isEpfSaving ? 'Saving...' : 'Save EPF Details'}
            </button>
          </form>
        </div>
      ) : null}

      <div className="ewallet-banks-list">
        {savedEpfList.map((epf, index) => (
          <div className="ewallet-bank-card" key={`epf-${index}-${epf.uanNumber}`}>
            <div className="ewallet-bank-card-header">
              <h3 className="ewallet-bank-card-title">{epf.accountHolderName || `EPF Account #${index + 1}`}</h3>
              {epf.uanNumber ? (
                <span className="ewallet-bank-card-badge">
                  UAN: {epf.uanNumber}
                </span>
              ) : null}
            </div>
            <dl>
              {getEpfDetailsList(epf).map((detail) => (
                <div className="ewallet-detail-row" key={`epf-${index}-${detail.label}`}>
                  <dt>{detail.label}</dt>
                  <dd>{detail.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </div>
  );
}
