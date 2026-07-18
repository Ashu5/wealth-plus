type OverallSummaryProps = {
  totalInvestment: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPercentage: number;
};

function OverallSummary({ totalInvestment, totalCurrentValue, totalGainLoss, gainLossPercentage }: OverallSummaryProps) {
  return (
    <section className="summary-card overall-summary-card">
      <div className="summary-header">
        <div>
          <p className="eyebrow">Overall Summary</p>
          <h2>Lifetime Performance</h2>
        </div>
        <span className="pill">{gainLossPercentage.toFixed(2)}%</span>
      </div>

      <div className="summary-grid overall-summary-grid">
        <div className="summary-item">
          <span className="stat-label">Total Investment</span>
          <strong>₹{totalInvestment.toLocaleString()}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">All Time Return</span>
          <strong>₹{totalCurrentValue.toLocaleString()}</strong>
        </div>
        <div className="summary-item">
          <span className="stat-label">Gain / Loss</span>
          <strong className={totalGainLoss >= 0 ? 'gain' : 'loss'}>
            ₹{totalGainLoss.toLocaleString()}
          </strong>
        </div>
      </div>
    </section>
  );
}

export default OverallSummary;
