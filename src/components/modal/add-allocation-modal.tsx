import { useState, type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type AddAllocationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AddAllocationModal({ isOpen, onClose }: AddAllocationModalProps) {
  const [allocationData, setAllocationData] = useState({
    allocationName: '',
    amount: '',
    category: 'Equity',
    folioNumber: '',
    currentType: 'INR',
    platformType: 'Groww',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  if (!isOpen) {
    return null;
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAllocationData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Allocation submitted:', allocationData);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title-group">
            <button type="button" className="modal-back" onClick={onClose} aria-label="Go back">
              ←
            </button>
            <h3>Add Allocation</h3>
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
            <label htmlFor="allocationName">Allocation Name</label>
            <input
              id="allocationName"
              name="allocationName"
              type="text"
              value={allocationData.allocationName}
              onChange={handleChange}
              placeholder="Allocation Name"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="amount">Amount</label>
            <input
              id="amount"
              name="amount"
              type="number"
              value={allocationData.amount}
              onChange={handleChange}
              placeholder="5000"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              name="category"
              value={allocationData.category}
              onChange={handleChange}
            >
              <option value="Equity">Equity</option>
              <option value="Debt">Debt</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="folioNumber">Folio Number(s)</label>
            <input
              id="folioNumber"
              name="folioNumber"
              type="text"
              value={allocationData.folioNumber}
              onChange={handleChange}
              placeholder="e.g. 12345, 67890"
            />
          </div>

          <div className="field-group">
            <label htmlFor="currentType">Currency</label>
            <select
              id="currentType"
              name="currentType"
              value={allocationData.currentType}
              onChange={handleChange}
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="platformType">Platform Type</label>
            <select
              id="platformType"
              name="platformType"
              value={allocationData.platformType}
              onChange={handleChange}
            >
              <option value="Groww">Groww</option>
              <option value="Coin">Coin</option>
              <option value="Smallcase">Smallcase</option>
            </select>
          </div>

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn">
              Save Allocation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddAllocationModal;
