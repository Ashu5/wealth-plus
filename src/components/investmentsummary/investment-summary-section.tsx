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
  onFundMaster?: () => void;
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

function FlowStepCard({
  step,
  index,
  onAdd,
  onAllocate,
  onTrack,
  onGrow,
  onFundMaster,
}: {
  step: StepDefinition;
  index: number;
  onAdd: (stepId: string) => void;
  onAllocate?: () => void;
  onTrack?: () => void;
  onGrow?: () => void;
  onFundMaster?: () => void;
}) {
  const handleClick = () => {
    if (step.id === 'allocate') {
      onAllocate?.();
      return;
    }

    if (step.id === 'track') {
      onTrack?.();
      return;
    }

    if (step.id === 'grow') {
      onGrow?.();
      return;
    }

    if (step.id === 'fundMaster') {
      onFundMaster?.();
      return;
    }

    onAdd(step.id);
  };

  return (
    <div className="flow-step">
      <div className="flow-node">
        <div className="flow-icon">{index + 1}</div>
        <div className="flow-content">
          <h3>{step.title}</h3>
          <p>{step.subtitle}</p>
          <span>{step.detail}</span>
        </div>
      </div>

      <button type="button" className="flow-action" onClick={handleClick}>
        {step.actionLabel}
      </button>

      {index < defaultSteps.length - 1 && <div className="flow-arrow">→</div>}
    </div>
  );
}

function InvestmentSummarySection({
  monthlyTotal,
  portfolioValue,
  fixedDepositValue,
  portfolioGain,
  recentEntries,
  onAdd,
  onAllocate,
  onTrack,
  onGrow,
  onFundMaster,
  steps = defaultSteps,
}: InvestmentSummarySectionProps) {
  return (
    <section className="summary-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Investment Summary</p>
          <h2>Monthly Overview</h2>
        </div>
        <span className="pill">Tracked Monthly</span>
      </div>

      <div className="summary-stats">
        <div>
          <span className="stat-label">Monthly Contribution</span>
          <strong>₹{monthlyTotal.toLocaleString()}</strong>
        </div>
        <div>
          <span className="stat-label">Portfolio Value</span>
          <strong>₹{portfolioValue.toLocaleString()}</strong>
        </div>
        <div>
          <span className="stat-label">FD Value</span>
          <strong>₹{fixedDepositValue.toLocaleString()}</strong>
        </div>
      </div>

      <div className="flowchart">
        {steps.map((step, index) => (
          <FlowStepCard
            key={step.id}
            step={step}
            index={index}
            onAdd={onAdd}
            onAllocate={onAllocate}
            onTrack={onTrack}
            onGrow={onGrow}
            onFundMaster={onFundMaster}
          />
        ))}
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