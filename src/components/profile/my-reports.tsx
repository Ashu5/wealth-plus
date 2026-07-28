import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import './my-reports.css';
import { fetchPortfolioSummary, type PortfolioSummaryApiResponse } from '../../services/portfolio-service';
import { getUserFixedDeposits } from '../../services/fund-service';

type YearlyInvestmentRow = {
  id: string;
  date: string;
  fundName: string;
  fundType: string;
  amountInvested: number;
  currentValue: number;
  status: string;
};

type YearlyFixedDepositRow = {
  id: string;
  date: string;
  bank: string;
  fdNumber: string;
  amount: number;
  rate: number;
};

const getStoredUser = () =>
  localStorage.getItem('wealth-plus-username')?.trim() ||
  localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() ||
  '';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

// India follows an April-to-March financial year, e.g. "2026-27" spans Apr 2026 - Mar 2027.
const getFinancialYearLabel = (dateInput: string | Date): string | null => {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const year = date.getFullYear();
  const startYear = date.getMonth() >= 3 ? year : year - 1;
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`;
};

const getFinancialYearBounds = (label: string) => {
  const startYear = Number(label.split('-')[0]);
  const start = new Date(startYear, 3, 1, 0, 0, 0, 0);
  const end = new Date(startYear + 1, 2, 31, 23, 59, 59, 999);
  return { start, end };
};

const buildInvestmentRows = (payload: PortfolioSummaryApiResponse | undefined): YearlyInvestmentRow[] => {
  if (!payload || !Array.isArray(payload.funds)) {
    return [];
  }

  const today = new Date().toISOString();

  return payload.funds
    .map((fund) => {
      if (Array.isArray(fund.investments) && fund.investments.length > 0) {
        return fund.investments.map((investment) => ({
          id: investment.transactionId,
          date: investment.transactionDate || today,
          fundName: fund.fundName,
          fundType: fund.fundType || 'Bonds/Others',
          amountInvested: investment.amountInvested,
          currentValue: investment.currentValue,
          status: investment.status,
        }));
      }

      return [
        {
          id: `${fund.fundName}-summary`,
          date: today,
          fundName: fund.fundName,
          fundType: fund.fundType || 'Bonds/Others',
          amountInvested: fund.amountInvested,
          currentValue: fund.currentValue,
          status: fund.status,
        },
      ];
    })
    .flat();
};

const buildFixedDepositRows = (payload: unknown): YearlyFixedDepositRow[] => {
  const getCollection = (source: unknown): unknown[] => {
    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === 'object') {
      const record = source as Record<string, unknown>;
      if (Array.isArray(record.data)) return record.data;
      if (Array.isArray(record.fixedDeposits)) return record.fixedDeposits;
      if (Array.isArray(record.items)) return record.items;
    }

    return [];
  };

  return getCollection(payload).map((entry, index) => {
    const record = entry as Record<string, unknown>;
    const transactionDate = typeof record.transactionDate === 'string' ? record.transactionDate : '';

    return {
      id: String(record.id || record.fdNumber || `${index}`),
      date: transactionDate,
      bank: String(record.bank || ''),
      fdNumber: String(record.fdNumber || 'Fixed Deposit'),
      amount: Number(record.amountFixed ?? record.amount ?? 0),
      rate: Number(record.interestRate ?? 0),
    };
  });
};

function MyReportsPage() {
  const navigate = useNavigate();
  const [investmentRows, setInvestmentRows] = useState<YearlyInvestmentRow[]>([]);
  const [fixedDepositRows, setFixedDepositRows] = useState<YearlyFixedDepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadInsights = async () => {
      const storedUser = getStoredUser();
      setLoading(true);
      setError(null);

      try {
        const [portfolioPayload, fixedDeposits] = await Promise.all([
          fetchPortfolioSummary(storedUser),
          getUserFixedDeposits(storedUser),
        ]);

        if (!isMounted) return;

        setInvestmentRows(buildInvestmentRows(portfolioPayload));
        setFixedDepositRows(buildFixedDepositRows(fixedDeposits));
      } catch (loadError) {
        console.error('Error loading insights data:', loadError);
        if (isMounted) {
          setError('Unable to load your insights right now.');
          setInvestmentRows([]);
          setFixedDepositRows([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadInsights();

    return () => {
      isMounted = false;
    };
  }, []);

  const financialYearOptions = useMemo(() => {
    const years = new Set<string>();

    investmentRows.forEach((row) => {
      const fy = getFinancialYearLabel(row.date);
      if (fy) years.add(fy);
    });

    fixedDepositRows.forEach((row) => {
      const fy = getFinancialYearLabel(row.date);
      if (fy) years.add(fy);
    });

    const currentYear = getFinancialYearLabel(new Date());
    if (currentYear) years.add(currentYear);

    return Array.from(years).sort().reverse();
  }, [investmentRows, fixedDepositRows]);

  useEffect(() => {
    if (financialYearOptions.length === 0) {
      return;
    }

    if (!selectedYear || !financialYearOptions.includes(selectedYear)) {
      setSelectedYear(financialYearOptions[0]);
    }
  }, [financialYearOptions, selectedYear]);

  const yearlyInvestmentRows = useMemo(() => {
    if (!selectedYear) return [];
    const { start, end } = getFinancialYearBounds(selectedYear);

    return investmentRows.filter((row) => {
      const date = new Date(row.date);
      return !Number.isNaN(date.getTime()) && date >= start && date <= end;
    });
  }, [investmentRows, selectedYear]);

  const yearlyFixedDepositRows = useMemo(() => {
    if (!selectedYear) return [];
    const { start, end } = getFinancialYearBounds(selectedYear);

    return fixedDepositRows.filter((row) => {
      const date = new Date(row.date);
      return !Number.isNaN(date.getTime()) && date >= start && date <= end;
    });
  }, [fixedDepositRows, selectedYear]);

  const metrics = useMemo(() => {
    const mutualInvested = yearlyInvestmentRows.reduce((sum, row) => sum + row.amountInvested, 0);
    const mutualCurrentValue = yearlyInvestmentRows.reduce((sum, row) => sum + row.currentValue, 0);
    const fdInvested = yearlyFixedDepositRows.reduce((sum, row) => sum + row.amount, 0);

    const totalInvested = mutualInvested + fdInvested;
    const totalCurrentValue = mutualCurrentValue + fdInvested;
    const totalGainLoss = totalCurrentValue - totalInvested;
    const totalGainLossPercentage = totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;

    const fundTypeBreakdownMap = new Map<string, { invested: number; currentValue: number; count: number }>();
    yearlyInvestmentRows.forEach((row) => {
      const existing = fundTypeBreakdownMap.get(row.fundType) || { invested: 0, currentValue: 0, count: 0 };
      existing.invested += row.amountInvested;
      existing.currentValue += row.currentValue;
      existing.count += 1;
      fundTypeBreakdownMap.set(row.fundType, existing);
    });

    const fundTypeBreakdown = Array.from(fundTypeBreakdownMap.entries())
      .map(([fundType, stats]) => ({
        fundType,
        ...stats,
        gainLoss: stats.currentValue - stats.invested,
      }))
      .sort((a, b) => b.invested - a.invested);

    return {
      mutualInvested,
      mutualCurrentValue,
      mutualGainLoss: mutualCurrentValue - mutualInvested,
      fdInvested,
      totalInvested,
      totalCurrentValue,
      totalGainLoss,
      totalGainLossPercentage,
      transactionCount: yearlyInvestmentRows.length,
      fdCount: yearlyFixedDepositRows.length,
      fundTypeBreakdown,
    };
  }, [yearlyInvestmentRows, yearlyFixedDepositRows]);

  const handleYearChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(event.target.value);
  };

  return (
    <main className="insights-page">
      <section className="insights-hero">
        <div>
          <p className="insights-eyebrow">My Reports</p>
          <h1>Yearly performance at a glance</h1>
          <p>Pick a financial year to see how your investments and fixed deposits performed.</p>
        </div>

        <div className="insights-filter">
          <label htmlFor="financial-year-select">Financial Year</label>
          <select id="financial-year-select" value={selectedYear} onChange={handleYearChange} disabled={financialYearOptions.length === 0}>
            {financialYearOptions.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </section>

      {loading && (
        <section className="insights-loading-state" aria-live="polite">
          <div className="insights-loader-card">
            <div className="insights-spinner" aria-hidden="true" />
            <div>
              <h2>Preparing your reports</h2>
              <p>Fetching your portfolio and fixed deposit data…</p>
            </div>
          </div>

          <div className="insights-metrics-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={`skeleton-metric-${index}`} className="insights-metric-card insights-skeleton-card">
                <div className="insights-skeleton-line insights-skeleton-line-short" />
                <div className="insights-skeleton-line insights-skeleton-line-long" />
              </div>
            ))}
          </div>

          <div className="insights-breakdown-card insights-skeleton-table-card">
            <div className="insights-skeleton-line insights-skeleton-line-short" />
            <div className="insights-skeleton-line insights-skeleton-line-medium" />
            <div className="insights-skeleton-line insights-skeleton-line-medium" />
          </div>
        </section>
      )}
      {!loading && error && <p className="insights-status insights-status-error">{error}</p>}

      {!loading && !error && (
        <>
          <section className="insights-metrics-grid">
            <div className="insights-metric-card">
              <span className="insights-metric-label">Total Invested</span>
              <strong>{formatCurrency(metrics.totalInvested)}</strong>
            </div>
            <div className="insights-metric-card">
              <span className="insights-metric-label">Current Value</span>
              <strong>{formatCurrency(metrics.totalCurrentValue)}</strong>
            </div>
            <div className="insights-metric-card">
              <span className="insights-metric-label">Gain / Loss</span>
              <strong className={metrics.totalGainLoss >= 0 ? 'gain' : 'loss'}>
                {formatCurrency(metrics.totalGainLoss)} ({metrics.totalGainLossPercentage.toFixed(2)}%)
              </strong>
            </div>
            <div className="insights-metric-card">
              <span className="insights-metric-label">Mutual Fund Transactions</span>
              <strong>{metrics.transactionCount}</strong>
            </div>
            <div className="insights-metric-card">
              <span className="insights-metric-label">Fixed Deposits Opened</span>
              <strong>{metrics.fdCount}</strong>
            </div>
            <div className="insights-metric-card">
              <span className="insights-metric-label">Fixed Deposit Amount</span>
              <strong>{formatCurrency(metrics.fdInvested)}</strong>
            </div>
          </section>

          <section className="insights-breakdown-card">
            <div className="insights-breakdown-header">
              <h2>Fund Type Breakdown for {selectedYear || '—'}</h2>
              <p>Investment and current value grouped by fund type for the selected financial year.</p>
            </div>

            {metrics.fundTypeBreakdown.length === 0 ? (
              <p className="insights-empty">No mutual fund investments found for this financial year.</p>
            ) : (
              <div className="insights-table-wrap">
                <table className="insights-table">
                  <thead>
                    <tr>
                      <th>Fund Type</th>
                      <th>Transactions</th>
                      <th>Invested</th>
                      <th>Current Value</th>
                      <th>Gain / Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics.fundTypeBreakdown.map((row) => (
                      <tr key={row.fundType}>
                        <td>{row.fundType}</td>
                        <td>{row.count}</td>
                        <td>{formatCurrency(row.invested)}</td>
                        <td>{formatCurrency(row.currentValue)}</td>
                        <td className={row.gainLoss >= 0 ? 'gain' : 'loss'}>{formatCurrency(row.gainLoss)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <div className="insights-actions">
        <button type="button" className="insights-back-btn" onClick={() => navigate('/dashboard', { state: { fromApp: true } })}>
          Back to Dashboard
        </button>
      </div>
    </main>
  );
}

export default MyReportsPage;
