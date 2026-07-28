import { useId, useState } from 'react';
import type { PortfolioEntry } from '../dashboard/types';
import './portfolio-summary-section.css';

type PortfolioSummarySectionProps = {
  entries: PortfolioEntry[];
  allEntries?: PortfolioEntry[];
  fundTypeFilter: string;
  setFundTypeFilter: (value: string) => void;
  fundTypeOptions: string[];
  isLoading?: boolean;
  error?: string | null;
  title?: string;
  eyebrow?: string;
};

function FilterBar({
  secondaryFilter,
  setSecondaryFilter,
  secondaryOptions,
  secondaryLabel,
}: {
  secondaryFilter: string;
  setSecondaryFilter: (value: string) => void;
  secondaryOptions: string[];
  secondaryLabel: string;
}) {
  const secondaryId = useId();

  return (
    <div className="filter-bar">
      <div className="filter-control">
        <label htmlFor={secondaryId}>{secondaryLabel}</label>
        <select id={secondaryId} value={secondaryFilter} onChange={(e) => setSecondaryFilter(e.target.value)}>
          {secondaryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function PortfolioSummarySection({
  entries,
  fundTypeFilter,
  setFundTypeFilter,
  fundTypeOptions,
  isLoading = false,
  error = null,
  title = 'Portfolio Summary',
  eyebrow = 'Portfolio Details',
}: PortfolioSummarySectionProps) {
  const [isVisible, setIsVisible] = useState(true);

  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);
  const currentValue = entries.reduce((sum, item) => sum + item.currentValue, 0);
  const gainLoss = currentValue - totalAmount;
  const overallStatus = gainLoss >= 0 ? 'Positive' : 'Negative';

  return (
    <section className="table-card">
      <div className="table-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        <div className="summary-actions">
          <button
            type="button"
            className="visibility-toggle"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide portfolio summary amounts' : 'Show portfolio summary amounts'}
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
          <span className="pill">{isVisible ? `₹${totalAmount.toLocaleString()}` : '••••••'}</span>
        </div>
      </div>

      <FilterBar
        secondaryFilter={fundTypeFilter}
        setSecondaryFilter={setFundTypeFilter}
        secondaryOptions={fundTypeOptions}
        secondaryLabel="Fund Type"
      />

      <div className="portfolio-summary-metrics">
        <div className="portfolio-summary-item">
          <span className="stat-label">Total Invested</span>
          <strong>{isVisible ? `₹${totalAmount.toLocaleString()}` : '••••••'}</strong>
        </div>
        <div className="portfolio-summary-item">
          <span className="stat-label">Gain / Loss</span>
          <strong className={gainLoss >= 0 ? 'gain' : 'loss'}>
            {isVisible ? `₹${gainLoss.toLocaleString()}` : '••••••'}
          </strong>
        </div>
        <div className="portfolio-summary-item">
          <span className="stat-label">Status</span>
          <strong>{overallStatus}</strong>
        </div>
      </div>

      {isLoading ? (
        <div className="summary-state-banner">
          <p>Loading portfolio summary…</p>
        </div>
      ) : error ? (
        <div className="summary-state-banner error">
          <p>{error}</p>
        </div>
      ) : entries.length > 0 ? null : (
        <div className="summary-state-banner" role="status">
          <p>Add your fund and transaction to start tracking your investment</p>
        </div>
      )}
    </section>
  );
}

export default PortfolioSummarySection;