import { useState, type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

type AddGrowthModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

function AddGrowthModal({ isOpen, onClose }: AddGrowthModalProps) {
  const [growthData, setGrowthData] = useState({
    growthName: '',
    growthRate: '',
    horizon: '5 Years',
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
    setGrowthData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log('Growth submitted:', growthData);
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
            <h3>Add Growth</h3>
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
            <label htmlFor="growthName">Growth Name</label>
            <input
              id="growthName"
              name="growthName"
              type="text"
              value={growthData.growthName}
              onChange={handleChange}
              placeholder="Growth Name"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="growthRate">Growth Rate (%)</label>
            <input
              id="growthRate"
              name="growthRate"
              type="number"
              value={growthData.growthRate}
              onChange={handleChange}
              placeholder="12"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="horizon">Horizon</label>
            <select id="horizon" name="horizon" value={growthData.horizon} onChange={handleChange}>
              <option value="3 Years">3 Years</option>
              <option value="5 Years">5 Years</option>
              <option value="10 Years">10 Years</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="folioNumber">Folio Number(s)</label>
            <input
              id="folioNumber"
              name="folioNumber"
              type="text"
              value={growthData.folioNumber}
              onChange={handleChange}
              placeholder="e.g. 12345, 67890"
            />
          </div>

          <div className="field-group">
            <label htmlFor="currentType">Currency</label>
            <select id="currentType" name="currentType" value={growthData.currentType} onChange={handleChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="platformType">Platform Type</label>
            <select id="platformType" name="platformType" value={growthData.platformType} onChange={handleChange}>
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
              Save Growth
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddGrowthModal;
