import { useState } from 'react';

type StepDefinition = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  actionLabel: string;
};

type InvestmentSummarySectionProps = {
  monthlyTotal: number;
  portfolioValue: number;
  fixedDepositValue: number;
  portfolioGain: number;
  recentEntries: string[];
  onAdd: (stepId: string) => void;
  onAllocate?: () => void;
  onTrack?: () => void;
  onGrow?: () => void;
  onAddFD?: () => void;
  steps?: StepDefinition[];
};

const defaultSteps: StepDefinition[] = [
  {
    id: 'plan',
    title: 'Plan',
    subtitle: 'Set goals',
    detail: 'Define your target returns and risk comfort level.',
    actionLabel: 'Add Plan',
  },
  {
    id: 'allocate',
    title: 'Allocate',
    subtitle: 'Distribute capital',
    detail: 'Balance equities, bonds, and cash for better stability.',
    actionLabel: 'Add Allocation',
  },
  {
    id: 'track',
    title: 'Track',
    subtitle: 'Monitor growth',
    detail: 'Review performance regularly and rebalance if needed.',
    actionLabel: 'Add Tracking',
  },
  {
    id: 'grow',
    title: 'Grow',
    subtitle: 'Compound wealth',
    detail: 'Increase contributions and let returns build over time.',
    actionLabel: 'Add Growth',
  },
];

function InvestmentSummarySection({
  monthlyTotal,
  portfolioValue,
  fixedDepositValue,
  recentEntries,
  onAdd,
  onAllocate,
  onTrack,
  onGrow,
  onAddFD,
  steps = defaultSteps,
}: InvestmentSummarySectionProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleStepClick = (stepId: string) => {
    if (stepId === 'allocate') {
      onAllocate?.();
      return;
    }

    if (stepId === 'track') {
      onTrack?.();
      return;
    }

    if (stepId === 'grow') {
      onGrow?.();
      return;
    }

    if (stepId === 'fixedDeposit') {
      onAddFD?.();
      return;
    }

    onAdd(stepId);
  };

  return (
    <section className="summary-card">
      <div className="summary-header summary-header-compact">
        <div>
          <p className="eyebrow">Investment Summary</p>
        </div>
        <div className="summary-menu">
          <button
            type="button"
            className="hamburger-button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Open step actions"
            aria-expanded={isMenuOpen}
          >
            <span />
            <span />
            <span />
          </button>

          {isMenuOpen && (
            <div className="action-menu" role="menu">
              {steps.map((step, index) => (
                <button
                  key={step.id}
                  type="button"
                  className="action-menu-item"
                  onClick={() => {
                    handleStepClick(step.id);
                    setIsMenuOpen(false);
                  }}
                  role="menuitem"
                >
                  <span className="menu-index">{index + 1}</span>
                  <span>{step.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="summary-stats">
        <div className="stat-card stat-card-primary">
          <span className="stat-label">Monthly Contribution</span>
          <strong>₹{monthlyTotal.toLocaleString()}</strong>
        </div>
        <div className="stat-card stat-card-secondary">
          <span className="stat-label">Portfolio Value</span>
          <strong>₹{portfolioValue.toLocaleString()}</strong>
        </div>
        <div className="stat-card stat-card-accent">
          <span className="stat-label">FD Value</span>
          <strong>₹{fixedDepositValue.toLocaleString()}</strong>
        </div>
      </div>

      <div className="summary-footer">
        {recentEntries.length > 0 && (
          <div className="saved-list">
            <h4>Recent Actions</h4>
            <ul>
              {recentEntries.map((entry, index) => (
                <li key={`${entry}-${index}`}>{entry}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

export default InvestmentSummarySection;