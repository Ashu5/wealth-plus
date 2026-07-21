import type { FixedDepositEntry } from '../dashboard/types';

type FixedDepositDetailsModalProps = {
  entry: FixedDepositEntry | null;
  isOpen: boolean;
  onClose: () => void;
};

function FixedDepositDetailsModal({ entry, isOpen, onClose }: FixedDepositDetailsModalProps) {
  if (!isOpen || !entry) {
    return null;
  }

  const parseTenureInYears = (tenure: string) => {
    const normalized = tenure.toLowerCase();
    const yearMatch = normalized.match(/(\d+)\s*year/);
    if (yearMatch) {
      return Number(yearMatch[1]);
    }

    const monthMatch = normalized.match(/(\d+)\s*month/);
    if (monthMatch) {
      return Number(monthMatch[1]) / 12;
    }

    return 1;
  };

  const inferCompoundingFrequency = (tenure: string) => {
    const normalized = tenure.toLowerCase();
    if (normalized.includes('quarter') || normalized.includes('3 month')) {
      return 4;
    }

    if (normalized.includes('year') || normalized.includes('annual')) {
      return 1;
    }

    return 4;
  };

  const tenureInYears = parseTenureInYears(entry.tenure);
  const compoundingFrequency = inferCompoundingFrequency(entry.tenure);
  const annualRate = entry.rate / 100;
  const currentAmount = entry.amount * Math.pow(1 + annualRate / compoundingFrequency, compoundingFrequency * tenureInYears);

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>Fixed Deposit Details</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close fixed deposit details">
            ×
          </button>
        </div>

        <div className="fd-details-grid">
          <div className="fd-detail-item">
            <span>Bank</span>
            <strong>{entry.bank}</strong>
          </div>
          <div className="fd-detail-item">
            <span>FD Number</span>
            <strong>{entry.fdNumber}</strong>
          </div>
          <div className="fd-detail-item">
            <span>Tenure</span>
            <strong>{entry.tenure}</strong>
          </div>
          <div className="fd-detail-item">
            <span>Amount Invested</span>
            <strong>₹{entry.amount.toLocaleString()}</strong>
          </div>
          <div className="fd-detail-item">
            <span>Interest Rate</span>
            <strong>{entry.rate}%</strong>
          </div>
          <div className="fd-detail-item">
            <span>Current Amount</span>
            <strong>₹{currentAmount.toLocaleString()}</strong>
          </div>
          <div className="fd-detail-item">
            <span>Maturity Date</span>
            <strong>{entry.maturityDate}</strong>
          </div>
          <div className="fd-detail-item">
            <span>Month</span>
            <strong>{entry.month}</strong>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FixedDepositDetailsModal;
