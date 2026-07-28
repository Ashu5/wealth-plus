import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addFund, generateFundCode } from '../../services/fund-service';

type AddFundMasterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};
const storedUser = localStorage.getItem('wealth-plus-username')?.trim()|| localStorage.getItem('wealth-plus-email')?.trim();

function AddFundMasterModal({ isOpen, onClose }: AddFundMasterModalProps) {
  const [fundMasterData, setFundMasterData] = useState({
    fundName: '',
    fundCode: '',
    fundType: '',
    fundAmount: '',
    folioNumber: '',
    currency: 'INR',
    platform: 'Groww',
    userName: storedUser || '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [codeError, setCodeError] = useState('');
  const [generatedFor, setGeneratedFor] = useState({ fundName: '', fundType: '', folioPrefix: '' });

  const { fundName, fundType, folioNumber } = fundMasterData;
  const folioPrefix = folioNumber.slice(0, 3);

  useEffect(() => {
    let cancelled = false;

    const generateCode = async () => {
      if (!fundName || !fundType || folioNumber.length < 3) {
        setFundMasterData((prev) => ({ ...prev, fundCode: '' }));
        setGeneratedFor({ fundName: '', fundType: '', folioPrefix: '' });
        setCodeError('');
        return;
      }

      if (generatedFor.fundName === fundName && generatedFor.fundType === fundType && generatedFor.folioPrefix === folioPrefix) {
        return;
      }

      setIsCodeLoading(true);
      setCodeError('');
      setFundMasterData((prev) => ({ ...prev, fundCode: '' }));

      try {
        const response = await generateFundCode({ fundName, fundType, folioNumber });
        if (cancelled) {
          return;
        }

        const responseData = response && typeof response === 'object' && 'data' in response
          ? (response as { data?: unknown }).data
          : response;

        const generatedCode = typeof responseData === 'string'
          ? responseData
          : responseData?.fundCode
          || responseData?.code
          || responseData?.result
          || (typeof responseData?.data === 'string' ? responseData.data : '')
          || '';

        if (!generatedCode) {
          console.warn('generateFundCode returned no fund code:', responseData);
          setCodeError('No fund code returned from API.');
        }

        setFundMasterData((prev) => ({ ...prev, fundCode: generatedCode }));
        setGeneratedFor({ fundName, fundType, folioPrefix });
      } catch {
        if (!cancelled) {
          setFundMasterData((prev) => ({ ...prev, fundCode: '' }));
          setCodeError('Unable to generate fund code.');
        }
      } finally {
        if (!cancelled) {
          setIsCodeLoading(false);
        }
      }
    };

    generateCode();

    return () => {
      cancelled = true;
    };
  }, [fundName, fundType, folioNumber]);

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const shouldClearCode = name === 'fundName' || name === 'fundType' || (name === 'folioNumber' && value.length < 3);

    setFundMasterData((prev) => ({
      ...prev,
      [name]: value,
      ...(shouldClearCode ? { fundCode: '' } : {}),
    }));

    if (name === 'fundName' || name === 'fundType' || (name === 'folioNumber' && value.length < 3)) {
      setGeneratedFor({ fundName: '', fundType: '', folioPrefix: '' });
    }
  };

  const formatSelectedDate = (date: Date | null) => {
    const selectedDate = date ?? new Date();
    const year = selectedDate.getFullYear();
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(selectedDate.getDate()).padStart(2, '0');
    const hours = String(selectedDate.getHours()).padStart(2, '0');
    const minutes = String(selectedDate.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fundPayload = {
      fundName: fundMasterData.fundName,
      fundType: fundMasterData.fundType,
      folioNumber: fundMasterData.folioNumber,
      fundCode: fundMasterData.fundCode,
      fundAmount: fundMasterData.fundAmount,
      currency: fundMasterData.currency,
      createdDate: formatSelectedDate(selectedDate),
      platform: {
        platformCode: fundMasterData.platform === 'Groww' ? '01' : fundMasterData.platform === 'Coin' ? '02' : '03',
        platformName: fundMasterData.platform,
        platformDescription: `${fundMasterData.platform} Platform`,
      },
      userName: fundMasterData.userName,
    };

    try {
      setIsSubmitting(true);
      await addFund(fundPayload);
      setSuccessMessage('Fund Added successfully.');
      window.setTimeout(() => {
        setSuccessMessage('');
        onClose();
      }, 1200);
    } catch (error) {
      console.error('Failed to add fund master:', error);
      window.alert('Unable to add fund right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title-group">
            <button type="button" className="modal-back" onClick={onClose} aria-label="Go back">
              ←
            </button>
            <h3>Fund Master</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="investmentDate">Select Date & Time</label>
            <DatePicker
              id="investmentDate"
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
            <input
              id="fundName"
              name="fundName"
              type="text"
              value={fundMasterData.fundName}
              onChange={handleChange}
              placeholder="Fund Name"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundCode">Fund Code</label>
            <input
              id="fundCode"
              name="fundCode"
              type="text"
              value={fundMasterData.fundCode}
              placeholder={isCodeLoading ? 'Generating fund code...' : 'Auto-generated fund code'}
              readOnly
              required
              className="readonly-input"
              style={{ backgroundColor: '#f5f5f5', color: '#555' }}
            />
            {codeError && <p className="field-error">{codeError}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="fundType">Fund Type</label>
            <select id="fundType" name="fundType" value={fundMasterData.fundType} onChange={handleChange}>
              <option value="Mid Cap">Mid Cap</option>
              <option value="Large Cap">Large Cap</option>
              <option value="ELSS">ELSS</option>
              <option value="Hybrid">Hybrid</option>
              <option value="Flexi Cap">Flexi Cap</option>
              <option value="Liquid Fund">Liquid Fund</option>
              <option value="Debt Fund">Debt Fund</option>
              <option value="Equity Fund">Equity Fund</option>
              <option value="Commodities Fund">Commodities Fund</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="fundAmount">Fund Amount</label>
            <input
              id="fundAmount"
              name="fundAmount"
              type="number"
              value={fundMasterData.fundAmount}
              onChange={handleChange}
              placeholder="1222"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="folioNumber">Folio Number</label>
            <input
              id="folioNumber"
              name="folioNumber"
              type="text"
              value={fundMasterData.folioNumber}
              onChange={handleChange}
              placeholder="002"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="currency">Currency</label>
            <select id="currency" name="currency" value={fundMasterData.currency} onChange={handleChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" value={fundMasterData.platform} onChange={handleChange}>
              <option value="Groww">Groww</option>
              <option value="Coin">Coin</option>
              <option value="Smallcase">Smallcase</option>
            </select>
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
              {isSubmitting ? 'Saving...' : 'Add Master Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFundMasterModal;
