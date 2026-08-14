import { useState } from 'react';

type OverallSummaryProps = {
  totalInvestment: number;
  totalCurrentValue: number;
  totalLiabilities: number;
  totalGainLoss: number;
  gainLossPercentage: number;
};

function OverallSummary({ totalInvestment, totalCurrentValue, totalLiabilities, totalGainLoss, gainLossPercentage }: OverallSummaryProps) {
  const [isVisible, setIsVisible] = useState(true);

  const renderAmount = (value: number) => {
    if (!isVisible) {
      return '••••••';
    }

    return `₹${value.toLocaleString()}`;
  };

  return (
    <section className="summary-card overall-summary-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Overall Summary</p>
        </div>
        <div className="summary-actions">
          <button
            type="button"
            className="visibility-toggle"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide lifetime performance amounts' : 'Show lifetime performance amounts'}
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
          <span className={totalGainLoss >= 0 ? 'gain' : 'loss'}>{gainLossPercentage.toFixed(2)}%</span>
        </div>
      </div>

      <div className="summary-grid overall-summary-grid">
        <div className="summary-item">
          <span className="stat-label">Total Investment - Liabilities</span>
          <strong>{renderAmount(totalInvestment)}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">Liabilities</span>
          <strong>{renderAmount(totalLiabilities)}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">Net Portfolio Value</span>
          <strong>{renderAmount(totalCurrentValue)}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">Gain / Loss</span>
          <strong className={totalGainLoss >= 0 ? 'gain' : 'loss'}>
            {renderAmount(totalGainLoss)}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default OverallSummary;
