import { useState, type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { addFund } from '../../services/fund-service';

type AddFundMasterModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AddFundMasterModal({ isOpen, onClose }: AddFundMasterModalProps) {
  const [fundMasterData, setFundMasterData] = useState({
    fundName: '',
    fundCode: '',
    fundType: 'Mid Cap',
    fundAmount: '',
    folioNumber: '',
    currency: 'INR',
    platform: 'Groww',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFundMasterData((prev) => ({ ...prev, [name]: value }));
  };

  const formatSelectedDate = (date: Date | null) => {
    if (!date) {
      return new Date().toISOString().split('T')[0];
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fundPayload = {
      fundName: fundMasterData.fundName,
      fundCode: fundMasterData.fundCode,
      fundType: fundMasterData.fundType,
      fundAmount: fundMasterData.fundAmount,
      folioNumber: fundMasterData.folioNumber,
      currency: fundMasterData.currency,
      createdDate: formatSelectedDate(selectedDate),
      platform: {
        platformCode: fundMasterData.platform === 'Groww' ? '01' : fundMasterData.platform === 'Coin' ? '02' : '03',
        platformName: fundMasterData.platform,
        platformDescription: `${fundMasterData.platform} Platform`,
      },
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
          <h3>Fund Master</h3>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="investmentDate">Select Date</label>
            <DatePicker
              id="investmentDate"
              selected={selectedDate}
              onChange={(date: Date | null) => setSelectedDate(date)}
              dateFormat="dd/MM/yyyy"
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
              onChange={handleChange}
              placeholder="01"
              required
            />
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
