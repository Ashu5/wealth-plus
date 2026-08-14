type MonthlySummaryProps = {
  mutualFundContribution: number;
  fixedDepositContribution: number;
  periodLabel: string;
};

function MonthlySummary({ mutualFundContribution, fixedDepositContribution }: MonthlySummaryProps) {
  const totalContribution = mutualFundContribution + fixedDepositContribution;

  return (
    <section className="summary-card monthly-summary-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Monthly Contribution</p>
        </div>
        <span className="pill pill-success">₹{totalContribution.toLocaleString()}</span>
      </div>

      <div className="summary-grid monthly-summary-grid">
        <div className="summary-item summary-item-highlight">
          <div className="summary-item-icon">📈</div>
          <div>
            <span className="stat-label">Mutual Funds</span>
            <strong>₹{mutualFundContribution.toLocaleString()}</strong>
          </div>
        </div>
        <div className="summary-item summary-item-highlight alternate">
          <div className="summary-item-icon">🏦</div>
          <div>
            <span className="stat-label">Fixed Deposits</span>
            <strong>₹{fixedDepositContribution.toLocaleString()}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MonthlySummary;
