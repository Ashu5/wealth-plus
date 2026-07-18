type MonthlySummaryProps = {
  mutualFundContribution: number;
  fixedDepositContribution: number;
  periodLabel: string;
};

function MonthlySummary({ mutualFundContribution, fixedDepositContribution, periodLabel }: MonthlySummaryProps) {
  return (
    <section className="summary-card monthly-summary-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Monthly Contribution</p>
          <h2>{periodLabel}</h2>
        </div>
        <span className="pill">₹{(mutualFundContribution + fixedDepositContribution).toLocaleString()}</span>
      </div>

      <div className="summary-grid monthly-summary-grid">
        <div className="summary-item">
          <span className="stat-label">Mutual Funds</span>
          <strong>₹{mutualFundContribution.toLocaleString()}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">Fixed Deposits</span>
          <strong>₹{fixedDepositContribution.toLocaleString()}</strong>
        </div>
      </div>
    </section>
  );
}

export default MonthlySummary;
