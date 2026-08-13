import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CarFront,
  CreditCard,
  GraduationCap,
  House,
  Landmark,
  WalletCards,
} from 'lucide-react';
import { FaEdit } from 'react-icons/fa';
import { addLiability, updateOutstandingAmount } from '../../services/liability-service';
import './liability-section.css';

export type LiabilityItem = {
  liabilityType: string;
  amount: number;
  loanNumber?: string;
  loanDate?: string;
  loanProvider?: string;
};

type LiabilitySectionProps = {
  liabilities: LiabilityItem[];
  totalLiability: number;
};

const formatCurrency = (value: number) => `₹${value.toLocaleString('en-IN')}`;

const getLiabilityIcon = (liabilityType: string) => {
  const normalizedType = liabilityType.toLowerCase();

  if (normalizedType.includes('car')) {
    return CarFront;
  }

  if (normalizedType.includes('home') || normalizedType.includes('mortgage')) {
    return House;
  }

  if (normalizedType.includes('education') || normalizedType.includes('student')) {
    return GraduationCap;
  }

  if (normalizedType.includes('credit') || normalizedType.includes('card')) {
    return CreditCard;
  }

  if (normalizedType.includes('landmark') || normalizedType.includes('loan')) {
    return Landmark;
  }

  return WalletCards;
};

const defaultForm = {
  liabilityNumber: '',
  liabilityType: 'CAR_LOAN',
  liabilityName: '',
  lender: '',
  liabilityAmount: '',
  outstandingAmount: '',
  interestRate: '',
  emiAmount: '',
  startDate: '',
  endDate: '',
};

export default function LiabilitySection({ liabilities, totalLiability }: LiabilitySectionProps) {
  const [localLiabilities, setLocalLiabilities] = useState<LiabilityItem[]>(liabilities);
  const [flippedLiabilityKey, setFlippedLiabilityKey] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<LiabilityItem | null>(null);
  const [editOutstandingAmount, setEditOutstandingAmount] = useState('');
  const [form, setForm] = useState(defaultForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  useEffect(() => {
    setLocalLiabilities(liabilities);
  }, [liabilities]);

  const effectiveTotalLiability = localLiabilities.reduce((sum, item) => sum + item.amount, 0);

  const handleFieldChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditOutstandingSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingLiability || !editingLiability.loanNumber) {
      setSubmitError('Unable to identify the liability to update.');
      return;
    }

    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
    const parsedValue = Number(editOutstandingAmount);

    if (!userEmail) {
      setSubmitError('User email is missing. Please log in again.');
      return;
    }

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
      setSubmitError('Please enter a valid outstanding amount.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      await updateOutstandingAmount({
        liabilityNumber: editingLiability.loanNumber,
        userEmail,
        outstandingAmount: parsedValue,
      });

      setLocalLiabilities((previous) => previous.map((item) => {
        const matchesCurrentLiability = item.loanNumber === editingLiability.loanNumber && item.liabilityType === editingLiability.liabilityType;
        return matchesCurrentLiability ? { ...item, amount: parsedValue } : item;
      }));

      setIsEditModalOpen(false);
      setEditingLiability(null);
      setEditOutstandingAmount('');
      setSubmitSuccess('Outstanding amount updated successfully.');
    } catch (error) {
      console.error('Unable to update liability outstanding amount:', error);
      setSubmitError('Unable to update the liability right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const username = localStorage.getItem('wealth-plus-username')?.trim() || localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() || '';
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';

    if (!username || !userEmail) {
      setSubmitError('User details are missing. Please log in again.');
      return;
    }

    const payload = {
      userName: username,
      userEmail: userEmail,
      liabilityNumber: form.liabilityNumber.trim(),
      liabilityType: form.liabilityType,
      liabilityName: form.liabilityName.trim() || form.liabilityType.replace(/_/g, ' '),
      lender: form.lender.trim(),
      liabilityAmount: form.liabilityAmount,
      outstandingAmount: form.outstandingAmount || form.liabilityAmount,
      interestRate: form.interestRate,
      emiAmount: form.emiAmount,
      startDate: form.startDate,
      endDate: form.endDate,
    };

    if (!payload.liabilityNumber || !payload.lender || !payload.liabilityAmount || !payload.startDate || !payload.endDate) {
      setSubmitError('Please fill in all required liability fields.');
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError(null);
      setSubmitSuccess(null);

      const response = await addLiability(payload);

      const insertedLiability: LiabilityItem = {
        liabilityType: payload.liabilityName || payload.liabilityType.replace(/_/g, ' '),
        amount: Number(payload.outstandingAmount || payload.liabilityAmount || 0),
        loanNumber: payload.liabilityNumber,
        loanDate: payload.startDate,
        loanProvider: payload.lender,
      };

      setLocalLiabilities((previous) => [insertedLiability, ...previous]);
      setForm(defaultForm);
      setSubmitSuccess('Liability added successfully.');
      setIsModalOpen(false);

      if (response && typeof response === 'object' && 'status' in response && response.status === 200) {
        setSubmitSuccess('Liability added successfully.');
      }
    } catch (error) {
      console.error('Unable to create liability:', error);
      setSubmitError('Unable to add liability right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="liabilities-section">
      <div className="liabilities-header">
        <div className="liabilities-title-group">
          <div>
            <p className="eyebrow">Borrowings</p>
            <h2>Liabilities</h2>
          </div>
          <button type="button" className="add-liability-btn" onClick={() => setIsModalOpen(true)}>
            + Add Liability
          </button>
        </div>

        <div className="liabilities-total">
          <span>Total Liability</span>
          <strong>{formatCurrency(effectiveTotalLiability || totalLiability || 0)}</strong>
        </div>
      </div>

      <div className="liability-grid">
        {localLiabilities.map((liability) => {
          const Icon = getLiabilityIcon(liability.liabilityType);
          const liabilityKey = `${liability.liabilityType}-${liability.loanNumber ?? 'unknown'}-${liability.amount}`;
          const isFlipped = flippedLiabilityKey === liabilityKey;

          return (
            <div
              key={liabilityKey}
              className={`liability-flip-card ${isFlipped ? 'is-flipped' : ''}`}
              onClick={() => setFlippedLiabilityKey((current) => (current === liabilityKey ? null : liabilityKey))}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  setFlippedLiabilityKey((current) => (current === liabilityKey ? null : liabilityKey));
                }
              }}
              role="button"
              tabIndex={0}
              aria-label={`${liability.liabilityType} details`}
            >
              <button
                type="button"
                className="liability-edit-btn"
                onClick={(event) => {
                  event.stopPropagation();
                  setEditingLiability(liability);
                  setEditOutstandingAmount(String(liability.amount));
                  setIsEditModalOpen(true);
                }}
                aria-label={`Edit ${liability.liabilityType} liability`}
              >
                <FaEdit size={12} />
              </button>

              <div className="liability-flipper">
                <div className="liability-face liability-front">
                  <div className="liability-icon-wrap">
                    <Icon className="liability-icon" />
                  </div>
                  <div className="liability-content">
                    <span className="liability-name">{liability.liabilityType}</span>
                    <strong className="liability-amount">{formatCurrency(liability.amount)}</strong>
                  </div>
                </div>

                <div className="liability-face liability-back">
                  <div className="liability-back-list">
                    <div><span>Loan Number</span><strong>{liability.loanNumber ?? 'N/A'}</strong></div>
                    <div><span>Loan Date</span><strong>{liability.loanDate ?? 'N/A'}</strong></div>
                    <div><span>Loan Provider</span><strong>{liability.loanProvider ?? 'Unknown Provider'}</strong></div>
                    <div><span>Current Outstanding</span><strong>{formatCurrency(liability.amount)}</strong></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {isEditModalOpen && editingLiability && (
        <div className="modal-backdrop" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title-group">
                <button type="button" className="modal-back" onClick={() => setIsEditModalOpen(false)} aria-label="Go back">
                  ←
                </button>
                <h3>Edit Outstanding Amount</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsEditModalOpen(false)} aria-label="Close edit liability form">
                ×
              </button>
            </div>

            {submitError && <div className="modal-error" role="alert">{submitError}</div>}
            {submitSuccess && <div className="modal-success-message">{submitSuccess}</div>}

            <form onSubmit={handleEditOutstandingSubmit}>
              <div className="field-group">
                <label htmlFor="edit-liability-number">Liability Number</label>
                <input id="edit-liability-number" value={editingLiability.loanNumber ?? 'N/A'} readOnly />
              </div>

              <div className="field-group">
                <label htmlFor="edit-outstanding-amount">Outstanding Amount</label>
                <input
                  id="edit-outstanding-amount"
                  type="number"
                  min="0"
                  value={editOutstandingAmount}
                  onChange={(event) => setEditOutstandingAmount(event.target.value)}
                  placeholder="280000"
                  required
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-title-group">
                <button type="button" className="modal-back" onClick={() => setIsModalOpen(false)} aria-label="Go back">
                  ←
                </button>
                <h3>Add Liability</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close liability form">
                ×
              </button>
            </div>

            {submitError && <div className="modal-error" role="alert">{submitError}</div>}
            {submitSuccess && <div className="modal-success-message">{submitSuccess}</div>}

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="liabilityNumber">Liability Number</label>
                <input id="liabilityNumber" name="liabilityNumber" value={form.liabilityNumber} onChange={handleFieldChange} placeholder="1234" required />
              </div>

              <div className="field-group">
                <label htmlFor="liabilityType">Liability Type</label>
                <select id="liabilityType" name="liabilityType" value={form.liabilityType} onChange={handleFieldChange}>
                  <option value="CAR_LOAN">Car Loan</option>
                  <option value="HOME_LOAN">Home Loan</option>
                  <option value="EDUCATION_LOAN">Education Loan</option>
                  <option value="PERSONAL_LOAN">Personal Loan</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="liabilityName">Liability Name</label>
                <input id="liabilityName" name="liabilityName" value={form.liabilityName} onChange={handleFieldChange} placeholder="Car loan" />
              </div>

              <div className="field-group">
                <label htmlFor="lender">Lender</label>
                <input id="lender" name="lender" value={form.lender} onChange={handleFieldChange} placeholder="Canara Bank" required />
              </div>

              <div className="field-group">
                <label htmlFor="liabilityAmount">Liability Amount</label>
                <input id="liabilityAmount" name="liabilityAmount" type="number" value={form.liabilityAmount} onChange={handleFieldChange} placeholder="500000" required />
              </div>

              <div className="field-group">
                <label htmlFor="outstandingAmount">Outstanding Amount</label>
                <input id="outstandingAmount" name="outstandingAmount" type="number" value={form.outstandingAmount} onChange={handleFieldChange} placeholder="300000" />
              </div>

              <div className="field-group">
                <label htmlFor="interestRate">Interest Rate (%)</label>
                <input id="interestRate" name="interestRate" type="number" step="0.1" value={form.interestRate} onChange={handleFieldChange} placeholder="7.9" required />
              </div>

              <div className="field-group">
                <label htmlFor="emiAmount">EMI Amount</label>
                <input id="emiAmount" name="emiAmount" type="number" value={form.emiAmount} onChange={handleFieldChange} placeholder="13200" required />
              </div>

              <div className="field-group">
                <label htmlFor="startDate">Start Date</label>
                <input id="startDate" name="startDate" type="date" value={form.startDate} onChange={handleFieldChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="endDate">End Date</label>
                <input id="endDate" name="endDate" type="date" value={form.endDate} onChange={handleFieldChange} required />
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Add Liability'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
