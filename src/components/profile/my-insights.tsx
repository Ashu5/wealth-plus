import { useEffect, useState } from 'react';
import { getYearSummary } from '../../services/user-service';
import './my-insights.css';

type TransactionItem = {
  id?: string | number;
  date?: string;
  description?: string;
  fundName?: string;
  amount?: number | string;
  type?: string;
  status?: string;
};

type YearSummary = {
  financialYear: string;
  totalAmountInvested: number;
  totalGainLoss: number;
  transactions: TransactionItem[];
};

const fyOptions = ['2025-26', '2026-27'];

const buildFallbackSummary = (financialYear: string): YearSummary => {
  const isCurrent = financialYear === '2026-27';

  return {
    financialYear,
    totalAmountInvested: isCurrent ? 1542000 : 1384000,
    totalGainLoss: isCurrent ? 182600 : 143500,
    transactions: [
      {
        id: 'TX-1001',
        date: '2026-04-12',
        description: 'Axis Bluechip Investment',
        amount: 50000,
        type: 'Investment',
        status: 'Completed',
      },
      {
        id: 'TX-1002',
        date: '2026-02-19',
        description: 'SBI Small Cap Purchase',
        amount: 32000,
        type: 'Purchase',
        status: 'Completed',
      },
      {
        id: 'TX-1003',
        date: '2025-12-01',
        description: 'Dividend Reinvestment',
        amount: 7400,
        type: 'Dividend',
        status: 'Processed',
      },
    ],
  };
};

const normalizeSummary = (payload: unknown, financialYear: string): YearSummary => {
  const source = (payload && typeof payload === 'object' && 'data' in payload
    ? (payload as { data?: unknown }).data
    : payload) as Record<string, unknown> | undefined;

  const transactions = Array.isArray(source?.transactions)
    ? (source?.transactions as TransactionItem[])
    : Array.isArray(source?.data)
      ? (source.data as TransactionItem[])
      : Array.isArray(source?.items)
        ? (source.items as TransactionItem[])
        : [];

  const totalAmountInvested = Number(source?.totalAmountInvested ?? source?.totalInvested ?? 0);
  const totalGainLoss = Number(source?.totalGainLoss ?? source?.gainLoss ?? 0);

  return {
    financialYear: String(source?.financialYear ?? financialYear),
    totalAmountInvested: Number.isFinite(totalAmountInvested) ? totalAmountInvested : 0,
    totalGainLoss: Number.isFinite(totalGainLoss) ? totalGainLoss : 0,
    transactions,
  };
};

function MyInsights() {
  const [selectedYear, setSelectedYear] = useState('2026-27');
  const [summary, setSummary] = useState<YearSummary>(() => buildFallbackSummary('2026-27'));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadSummary = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const payload = await getYearSummary(selectedYear);
        if (!isMounted) {
          return;
        }

        setSummary(normalizeSummary(payload, selectedYear));
      } catch (requestError) {
        console.warn('Unable to load year summary from placeholder API:', requestError);

        if (isMounted) {
          setSummary(buildFallbackSummary(selectedYear));
          setError('Showing sample values because the placeholder API is unavailable right now.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadSummary();

    return () => {
      isMounted = false;
    };
  }, [selectedYear]);

  const formatCurrency = (value: number) =>
    `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

  return (
    <section className="my-insights-card">
      <div className="my-insights-header">
        <div>
          <p className="my-insights-kicker">My Insights</p>
          <h3>Financial Year Summary</h3>
        </div>
        <div className="my-insights-filter-group">
          <label htmlFor="financial-year-filter">Financial Filter</label>
          <select
            id="financial-year-filter"
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
          >
            {fyOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? <p className="my-insights-error">{error}</p> : null}

      <div className="my-insights-metrics">
        <div className="my-insights-metric-card">
          <span className="my-insights-label">Total Amount Invested</span>
          <strong>{isLoading ? 'Loading…' : formatCurrency(summary.totalAmountInvested)}</strong>
        </div>
        <div className="my-insights-metric-card">
          <span className="my-insights-label">Total Gain/Loss</span>
          <strong className={summary.totalGainLoss >= 0 ? 'positive' : 'negative'}>
            {isLoading ? 'Loading…' : `${summary.totalGainLoss >= 0 ? '+' : ''}${formatCurrency(summary.totalGainLoss)}`}
          </strong>
        </div>
      </div>

      <div className="my-insights-table-card">
        <div className="my-insights-table-header">
          <h4>All Transactions</h4>
          <span>{summary.transactions.length} records</span>
        </div>

        <div className="my-insights-table-wrapper">
          <table className="my-insights-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {summary.transactions.length > 0 ? (
                summary.transactions.map((transaction) => (
                  <tr key={transaction.id ?? `${transaction.date}-${transaction.description}`}>
                    <td>{transaction.date ?? '-'}</td>
                    <td>{transaction.description ?? transaction.fundName ?? '-'}</td>
                    <td>{transaction.type ?? '-'}</td>
                    <td>{transaction.status ?? '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>No transactions found for this financial year.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default MyInsights;
