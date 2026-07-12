import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getUserFunds } from '../../services/fund-service';

type AddTrackingModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type FundOption = {
  fundName: string;
  fundCode: string;
  folioNumber: string;
};

type FundResponseItem = {
  fundName?: string | null;
  fundCode?: string | null;
  folioNumber?: string | null;
  id?: string | null;
  platform?: {
    platformCode?: string | null;
  } | null;
};

function AddTrackingModal({ isOpen, onClose }: AddTrackingModalProps) {
  const [trackingData, setTrackingData] = useState({
    fundName: '',
    fundCode: '',
    amount: '',
    nav: '',
    units: '',
    userId: '',
    folioNumber: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [fundOptions, setFundOptions] = useState<FundOption[]>([]);
  const [isLoadingFunds, setIsLoadingFunds] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadFunds = async () => {
      const storedUser = localStorage.getItem('wealth-plus-user')?.trim();
      const storedEmail = localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim();
      const candidateUsers = [storedUser, storedEmail, 'ashu01', 'ashu'].filter(
        (value): value is string => Boolean(value)
      );

      setIsLoadingFunds(true);

      for (const userId of candidateUsers) {
        try {
          const payload = await getUserFunds(userId);
          const funds = Array.isArray(payload)
            ? payload
            : Array.isArray(payload?.data)
              ? payload.data
              : Array.isArray(payload?.result)
                ? payload.result
                : [];

          const normalizedFunds = funds
            .map((item: FundResponseItem) => {
              const derivedFundCode = item?.fundCode?.trim() || item?.platform?.platformCode?.trim() || item?.id?.slice(0, 8) || '';

              return {
                fundName: item?.fundName || '',
                fundCode: derivedFundCode,
                folioNumber: item?.folioNumber || '',
              };
            })
            .filter((item: FundOption) => item.fundName);

          if (normalizedFunds.length > 0) {
            setFundOptions(normalizedFunds);
            setTrackingData((prev) => ({
              ...prev,
              fundName: normalizedFunds[0].fundName,
              fundCode: normalizedFunds[0].fundCode,
              folioNumber: normalizedFunds[0].folioNumber,
              userId,
            }));
            setIsLoadingFunds(false);
            return;
          }
        } catch (error) {
          console.warn(`Unable to load funds for ${userId}:`, error);
        }
      }

      setFundOptions([]);
      setTrackingData((prev) => ({
        ...prev,
        userId: candidateUsers[0] ?? 'ashu01',
      }));
      setIsLoadingFunds(false);
    };

    loadFunds();
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const formatSelectedDate = (date: Date | null) => {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'fundName') {
      const selectedFund = fundOptions.find((item) => item.fundName === value);
      setTrackingData((prev) => ({
        ...prev,
        fundName: value,
        fundCode: selectedFund?.fundCode || '',
        folioNumber: selectedFund?.folioNumber || '',
      }));
      return;
    }

    setTrackingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const currentUser = localStorage.getItem('wealth-plus-user')?.trim() || localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() || 'ashu01';

    const payload = {
      folioNumber: trackingData.folioNumber || '002',
      fundName: trackingData.fundName,
      amount: trackingData.amount,
      fundCode: trackingData.fundCode,
      transactionDate: formatSelectedDate(selectedDate),
      nav: Number(trackingData.nav),
      units: Number(trackingData.units),
      userId: currentUser,
    };

    try {
      setIsSubmitting(true);
      const response = await axios.post('/wealth-plus/api/transactions/newTransaction', payload, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response?.status === 200 || response?.status === 201) {
        setSuccessMessage('Transaction added successfully.');
        window.setTimeout(() => {
          setSuccessMessage('');
          onClose();
        }, 1200);
      } else {
        window.alert('Unable to save tracking right now.');
      }
    } catch (error) {
      console.error('Unable to save tracking:', error);
      window.alert('Unable to save tracking right now.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Tracking</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="transactionDate">Transaction Date</label>
            <DatePicker
              id="transactionDate"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
              className="date-picker-input"
              popperPlacement="bottom-start"
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundName">Fund Name</label>
            <select
              id="fundName"
              name="fundName"
              value={trackingData.fundName}
              onChange={handleChange}
              disabled={isLoadingFunds || fundOptions.length === 0}
              required
            >
              {fundOptions.length === 0 ? (
                <option value="">{isLoadingFunds ? 'Loading funds...' : 'Select a fund'}</option>
              ) : (
                <>
                  <option value="" disabled>
                    Select a fund
                  </option>
                  {fundOptions.map((fund) => (
                    <option key={`${fund.fundName}-${fund.fundCode}`} value={fund.fundName}>
                      {fund.fundName}
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="fundCode">Fund Code</label>
            <input
              id="fundCode"
              name="fundCode"
              type="text"
              value={trackingData.fundCode}
              onChange={handleChange}
              placeholder="01"
              readOnly
            />
          </div>

          <div className="field-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              value={trackingData.amount}
              onChange={handleChange}
              placeholder="2000.86"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="nav">NAV</label>
            <input
              id="nav"
              name="nav"
              type="number"
              step="0.01"
              value={trackingData.nav}
              onChange={handleChange}
              placeholder="13.5"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="units">Units</label>
            <input
              id="units"
              name="units"
              type="number"
              step="0.01"
              value={trackingData.units}
              onChange={handleChange}
              placeholder="12.22"
              required
            />
          </div>

          {successMessage && (
            <div className="success-message" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddTrackingModal;
