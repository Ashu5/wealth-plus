import { type ChangeEvent, type FormEvent } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import type { ModalConfig } from '../dashboard/types';

type AddFDModalProps = {
  activeModal: ModalConfig | null;
  isOpen: boolean;
  onClose: () => void;
  formData: Record<string, string>;
  selectedDate: Date | null;
  selectedMaturityDate: Date | null;
  onDateChange: (date: Date | null) => void;
  onMaturityDateChange: (date: Date | null) => void;
  onFormChange: (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onSubmit: (event: FormEvent) => void;
  isSubmitting: boolean;
  errorMessage?: string | null;
};

function AddFDModal({
  activeModal,
  isOpen,
  onClose,
  formData,
  selectedDate,
  selectedMaturityDate,
  onDateChange,
  onMaturityDateChange,
  onFormChange,
  onSubmit,
  isSubmitting,
  errorMessage,
}: AddFDModalProps) {
  if (!isOpen || !activeModal) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title-group">
            <button type="button" className="modal-back" onClick={onClose} aria-label="Go back">
              ←
            </button>
            <h3>{activeModal.title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMessage && (
          <div className="modal-error" role="alert">
            {errorMessage}
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="field-group">
            <label htmlFor="fdOpenDate">FD Open Date & Time</label>
            <DatePicker
              id="fdOpenDate"
              selected={selectedDate}
              onChange={onDateChange}
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
            <label htmlFor="depositType">Deposit Type</label>
            <select
              id="depositType"
              name="depositType"
              value={formData.depositType || 'Fixed Deposit'}
              onChange={onFormChange}
            >
              <option value="Fixed Deposit">Fixed Deposit</option>
              <option value="Bonds/Others">Bonds/Others</option>
            </select>
          </div>

          {formData.depositType === 'Bonds/Others' && (
            <div className="field-group">
              <label htmlFor="fundName">Bond Name</label>
              <input
                id="bondName"
                name="bondName"
                type="text"
                placeholder="Bond Name"
                value={formData.bondName || ''}
                onChange={onFormChange}
                required
              />
            </div>
          )}

          {formData.investmentType === 'Fixed Deposit' ? (
            <div className="field-group">
              <label htmlFor="bank">Bank</label>
              <select id="bank" name="bank" value={formData.bank || 'ICICI Bank'} onChange={onFormChange}>
                {['ICICI Bank', 'HDFC Bank', 'SBI Bank', 'Axis Bank', 'Kotak Bank','Punjab National Bank','Others'].map((bank) => (
                  <option key={bank} value={bank}>
                    {bank}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field-group">
              <label htmlFor="folioNumber">Bond Number</label>
              <input
                id="bondNumber"
                name="bondNumber"
                type="text"
                placeholder="123456789"
                value={formData.bondNumber || ''}
                onChange={onFormChange}
                required
              />
            </div>
          )}

          {formData.investmentType === 'Bonds/Others' && (
            <div className="field-group">
              <label htmlFor="bondType">Bond Type</label>
              <select id="bondType" name="bondType" value={formData.bondType || 'Corporate Bond'} onChange={onFormChange}>
                {['Government', 'Corporate', 'Debt', 'Hybrid'].map((bondType) => (
                  <option key={bondType} value={bondType}>
                    {bondType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.investmentType === 'Bonds/Others' && (
            <div className="field-group">
              <label htmlFor="currentType">Currency Type</label>
              <select id="currentType" name="currentType" value={formData.currentType || 'Equity'} onChange={onFormChange}>
                {['INR', 'USD', 'EUR'].map((currentType) => (
                  <option key={currentType} value={currentType}>
                    {currentType}
                  </option>
                ))}
              </select>
            </div>
          )}

          {formData.investmentType === 'Fixed Deposit' ? (
            <div className="field-group">
              <label htmlFor="amount">Amount Fixed</label>
              <input
                id="amount"
                name="amount"
                type="number"
                placeholder="100000"
                value={formData.amount || ''}
                onChange={onFormChange}
                required
              />
            </div>
          ) : (
            <div className="field-group">
              <label htmlFor="bondAmount">Invested Amount</label>
              <input
                id="bondAmount"
                name="bondAmount"
                type="number"
                placeholder="100000"
                value={formData.bondAmount || ''}
                onChange={onFormChange}
                required
              />
            
            </div>
          )}

          {formData.investmentType === 'Bonds/Others' ? (
            <div className="field-group">
              <label htmlFor="platformType">Platform Type</label>
              <select id="platformType" name="platformType" value={formData.platformType || 'Equity'} onChange={onFormChange}>
                {['Groww', 'Coin', 'Smallcase','Wint Money'].map((platformType) => (
                  <option key={platformType} value={platformType}>
                    {platformType}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="field-group">
              <label htmlFor="rate">Interest Rate (%)</label>
              <input
                id="rate"
                name="rate"
                type="number"
                placeholder="7.2"
                value={formData.rate || ''}
                onChange={onFormChange}
                required
              />
            </div>
          )}

          {formData.investmentType === 'Fixed Deposit' && (
            <div className="field-group">
              <label htmlFor="maturityDate">Maturity Date & Time</label>
              <DatePicker
                id="maturityDate"
                selected={selectedMaturityDate}
                onChange={onMaturityDateChange}
                dateFormat="dd/MM/yyyy HH:mm"
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={15}
                timeCaption="Time"
                className="date-picker-input"
                popperPlacement="bottom-start"
                required
              />
            </div>
          )}

          {formData.investmentType === 'Fixed Deposit' && (
            <div className="field-group">
              <label htmlFor="fdNumber">Fixed Deposit Number</label>
              <input
                id="fdNumber"
                name="fdNumber"
                type="text"
                placeholder="FD Number"
                value={formData.fdNumber || ''}
                onChange={onFormChange}
                required
              />
            </div>
          )}

          {formData.investmentType === 'Bonds/Others' && (
            <div className="field-group">
              <label htmlFor="currentValue">Current Value</label>
              <input
                id="currentValue"
                name="currentValue"
                type="number"
                placeholder="5200"
                value={formData.currentValue || ''}
                onChange={onFormChange}
              />
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : activeModal.submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFDModal;
