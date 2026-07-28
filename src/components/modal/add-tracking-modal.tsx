import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { getUserFunds } from '../../services/fund-service';
import { addFundTransaction, type FundTransaction } from '../../services/transaction-service';

type AddTrackingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

type FundOption = {
  fundName: string;
  fundCode: string;
  folioNumber: string;
  fundType: string;
};

type FundResponseItem = {
  fundName?: string | null;
  fundCode?: string | null;
  fundType?: string | null;
  folioNumber?: string | null;
  id?: string | null;
  platform?: {
    platformCode?: string | null;
  } | null;
};

function AddTrackingModal({ isOpen, onClose, onSuccess }: AddTrackingModalProps) {
  const [trackingData, setTrackingData] = useState({
    fundName: '',
    fundCode: '',
    fundType: '',
    amount: 0,
    nav: 0,
    units: 0,
    userName: '',
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
      const storedUser = localStorage.getItem('wealth-plus-username')?.trim()|| localStorage.getItem('wealth-plus-email')?.trim();
      const candidateUsers = [storedUser].filter(
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
                fundType: item?.fundType || '',
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
              fundType: normalizedFunds[0].fundType,
              folioNumber: normalizedFunds[0].folioNumber,
              userName: userId,
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
        userName: candidateUsers[0] ?? 'ashu01',
      }));
      setIsLoadingFunds(false);
    };

    loadFunds();
  }, [isOpen]);

  useEffect(() => {
    if (!trackingData.amount || !trackingData.nav) {
      setTrackingData((prev) => ({ ...prev, units: 0 }));
      return;
    }

    const amount = Number(trackingData.amount);
    const nav = Number(trackingData.nav);

    if (amount > 0 && nav > 0) {
      const calculatedUnits: any= (amount / nav).toFixed(3);
      setTrackingData((prev) => ({ ...prev, units: calculatedUnits }));
    }
  }, [trackingData.amount, trackingData.nav]);

  if (!isOpen) {
    return null;
  }

  const formatSelectedDate = (date: Date | null) => {
    const selectedDate = date ?? new Date();
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'fundName') {
      const selectedFund = fundOptions.find((item) => item.fundName === value);
      setTrackingData((prev) => ({
        ...prev,
        fundName: value,
        fundCode: selectedFund?.fundCode || '',
        fundType: selectedFund?.fundType || '',
        folioNumber: selectedFund?.folioNumber || '',
      }));
      return;
    }

    setTrackingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    setTrackingData({
      fundName: '',
      fundCode: '',
      fundType: '',
      amount: 0,
      nav: 0,
      units: 0,
      userName: '',
      folioNumber: '',
    });
    setSelectedDate(new Date());
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const currentUser = localStorage.getItem('wealth-plus-username')?.trim() || localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() || 'null';

    const payload :FundTransaction= {
      folioNumber: trackingData.folioNumber || '002',
      fundName: trackingData.fundName,
      fundType: trackingData.fundType,
      amount: trackingData.amount,
      transactionDate:formatSelectedDate(selectedDate),
      fundCode: trackingData.fundCode,
      nav: Number(trackingData.nav),
      units: Number(trackingData.units),
      userName: currentUser,
    };
    console.log('Submitting payload:', payload);

    try {
      setIsSubmitting(true);
      const response = await addFundTransaction(payload);
      if (response?.status === 200 || response?.status === 201) {
        setTrackingData({
          fundName: '',
          fundCode: '',
          fundType: '',
          amount: 0,
          nav: 0,
          units: 0,
          userName: '',
          folioNumber: '',
        });
        setSelectedDate(new Date());
        setSuccessMessage('Transaction added successfully.');
        onSuccess?.();
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
          <div className="modal-header-title-group">
            <button type="button" className="modal-back" onClick={handleCancel} aria-label="Go back">
              ←
            </button>
            <h3>Add Tracking</h3>
          </div>
          <button type="button" className="modal-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="transactionDate">Transaction Date & Time</label>
            <DatePicker
              id="transactionDate"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy HH:mm"
              showTimeSelect
              timeFormat="HH:mm"
              timeIntervals={15}
              timeCaption="Time"
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
              style={{ backgroundColor: '#f5f5f5', color: '#555' }}
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundType">Fund Type</label>
            <input
              id="fundType"
              name="fundType"
              type="text"
              value={trackingData.fundType}
              placeholder="--"
              readOnly
              style={{ backgroundColor: '#f5f5f5', color: '#555' }}
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
              placeholder="12.22"
              readOnly
              required
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={handleCancel}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Tracking'}
            </button>
          </div>

          {successMessage && (
            <div className="modal-success-message" role="status" aria-live="polite">
              ✓ {successMessage}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default AddTrackingModal;
