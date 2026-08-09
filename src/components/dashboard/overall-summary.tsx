import { useState } from 'react';

type OverallSummaryProps = {
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
};

function OverallSummary({ totalInvestment, totalCurrentValue, totalGainLoss, gainLossPercentage }: OverallSummaryProps) {
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
          <h2>Lifetime Performance</h2>
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
          <span className="stat-label">Total Investment</span>
          <strong>{renderAmount(totalInvestment)}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">All Time Return</span>
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
