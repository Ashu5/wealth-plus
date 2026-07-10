import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './dashboard.css';

type InvestmentKind = 'Mutual Fund' | 'Fixed Deposit';

type PortfolioEntry = {
  id: string;
  month: string;
  investmentType: InvestmentKind;
  bank: string;
  name: string;
  amount: number;
  currentValue: number;
  status: 'Growing' | 'Stable';
};

type FixedDepositEntry = {
  id: string;
  month: string;
  investmentType: 'Fixed Deposit';
  bank: string;
  scheme: string;
  amount: number;
  tenure: string;
  rate: number;
  maturityDate: string;
};

type StepDefinition = {
  id: string;
  title: string;
  subtitle: string;
  detail: string;
  actionLabel: string;
};

type ModalConfig = {
  id: string;
  title: string;
  submitLabel: string;
};

const initialPortfolioEntries: PortfolioEntry[] = [
  { id: 'p1', month: '2026-06', investmentType: 'Mutual Fund', bank: 'HDFC Bank', name: 'Apex Equity Fund', amount: 25000, currentValue: 30250, status: 'Growing' },
  { id: 'p2', month: '2026-05', investmentType: 'Mutual Fund', bank: 'SBI Bank', name: 'BlueBond ETF', amount: 18000, currentValue: 19140, status: 'Stable' },
  { id: 'p3', month: '2026-06', investmentType: 'Mutual Fund', bank: 'ICICI Bank', name: 'Nova Real Estate', amount: 12000, currentValue: 13800, status: 'Growing' },
  { id: 'p4', month: '2026-07', investmentType: 'Mutual Fund', bank: 'HDFC Bank', name: 'Cash Reserve', amount: 8000, currentValue: 8240, status: 'Stable' },
];

const initialFixedDeposits: FixedDepositEntry[] = [
  { id: 'fd1', month: '2026-06', investmentType: 'Fixed Deposit', bank: 'HDFC Bank', scheme: 'Regular FD', amount: 120000, tenure: '12 Months', rate: 7.2, maturityDate: '2026-08-10' },
  { id: 'fd2', month: '2026-05', investmentType: 'Fixed Deposit', bank: 'SBI Bank', scheme: 'Tax Saver FD', amount: 80000, tenure: '5 Years', rate: 6.8, maturityDate: '2031-07-20' },
  { id: 'fd3', month: '2026-07', investmentType: 'Fixed Deposit', bank: 'ICICI Bank', scheme: 'Senior Citizen FD', amount: 150000, tenure: '24 Months', rate: 7.5, maturityDate: '2028-06-15' },
];

const stepDefinitions: StepDefinition[] = [
  { id: 'plan', title: 'Plan', subtitle: 'Set goals', detail: 'Define your target returns and risk comfort level.', actionLabel: 'Add Plan' },
  { id: 'allocate', title: 'Allocate', subtitle: 'Distribute capital', detail: 'Balance equities, bonds, and cash for better stability.', actionLabel: 'Add Allocation' },
  { id: 'track', title: 'Track', subtitle: 'Monitor growth', detail: 'Review performance regularly and rebalance if needed.', actionLabel: 'Add Tracking' },
  { id: 'grow', title: 'Grow', subtitle: 'Compound wealth', detail: 'Increase contributions and let returns build over time.', actionLabel: 'Add Growth' },
];

const monthlyModalConfig: ModalConfig = {
  id: 'monthly',
  title: 'Add Monthly Investment',
  submitLabel: 'Save Investment',
};

function FlowStepCard({ step, index, onAdd }: { step: StepDefinition; index: number; onAdd: (stepId: string) => void }) {
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

      <button type="button" className="flow-action" onClick={() => onAdd(step.id)}>
        {step.actionLabel}
      </button>

      {index < stepDefinitions.length - 1 && <div className="flow-arrow">→</div>}
    </div>
  );
}

function FilterBar({
  monthFilter,
  setMonthFilter,
  secondaryFilter,
  setSecondaryFilter,
  monthOptions,
  secondaryOptions,
  secondaryLabel,
}: {
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  secondaryFilter: string;
  setSecondaryFilter: (value: string) => void;
  monthOptions: string[];
  secondaryOptions: string[];
  secondaryLabel: string;
}) {
  return (
    <div className="filter-bar">
      <div className="filter-control">
        <label htmlFor="monthFilter">Month</label>
        <select id="monthFilter" value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

      <div className="filter-control">
        <label htmlFor="secondaryFilter">{secondaryLabel}</label>
        <select id="secondaryFilter" value={secondaryFilter} onChange={(e) => setSecondaryFilter(e.target.value)}>
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

function InvestmentSummary({
  monthlyTotal,
  portfolioValue,
  fixedDepositValue,
  portfolioGain,
  recentEntries,
  onAdd,
}: {
  monthlyTotal: number;
  portfolioValue: number;
  fixedDepositValue: number;
  portfolioGain: number;
  recentEntries: string[];
  onAdd: (stepId: string) => void;
}) {
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
        {stepDefinitions.map((step, index) => (
          <FlowStepCard key={step.id} step={step} index={index} onAdd={onAdd} />
        ))}
      </div>

      <div className="summary-footer">
        <div className="gain-box">
          <span>Portfolio Gain</span>
          <strong>₹{portfolioGain.toLocaleString()}</strong>
        </div>

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

function InvestmentTable({
  entries,
  monthFilter,
  setMonthFilter,
  fundTypeFilter,
  setFundTypeFilter,
  monthOptions,
  fundTypeOptions,
}: {
  entries: PortfolioEntry[];
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  fundTypeFilter: string;
  setFundTypeFilter: (value: string) => void;
  monthOptions: string[];
  fundTypeOptions: string[];
}) {
  return (
    <section className="table-card">
      <div className="table-header">
        <div>
          <p className="eyebrow">Portfolio Details</p>
          <h2>Portfolio Summary</h2>
        </div>
      </div>

      <FilterBar
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        secondaryFilter={fundTypeFilter}
        setSecondaryFilter={setFundTypeFilter}
        monthOptions={monthOptions}
        secondaryOptions={fundTypeOptions}
        secondaryLabel="Fund Type"
      />

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Investment</th>
              <th>Amount</th>
              <th>Current</th>
              <th>Gain</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7}>No portfolio entries found for the selected filters.</td>
              </tr>
            ) : (
              entries.map((item) => {
                const gain = item.currentValue - item.amount;
                return (
                  <tr key={item.id}>
                    <td>{item.month}</td>
                    <td>{item.name}</td>
                    <td>₹{item.amount.toLocaleString()}</td>
                    <td>₹{item.currentValue.toLocaleString()}</td>
                    <td className="gain">₹{gain.toLocaleString()}</td>
                    <td>
                      <span className={`status ${item.status.toLowerCase()}`}>{item.status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FixedDepositsSummary({
  entries,
  monthFilter,
  setMonthFilter,
  bankFilter,
  setBankFilter,
  monthOptions,
  bankOptions,
}: {
  entries: FixedDepositEntry[];
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  bankFilter: string;
  setBankFilter: (value: string) => void;
  monthOptions: string[];
  bankOptions: string[];
}) {
  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);

  return (
    <section className="fd-card">
      <div className="table-header">
        <div>
          <p className="eyebrow">Fixed Deposits</p>
          <h2>Fixed Deposits Summary</h2>
        </div>
        <span className="pill">₹{totalAmount.toLocaleString()}</span>
      </div>

      <FilterBar
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        secondaryFilter={bankFilter}
        setSecondaryFilter={setBankFilter}
        monthOptions={monthOptions}
        secondaryOptions={bankOptions}
        secondaryLabel="Bank"
      />

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Month</th>
              <th>Bank</th>
              <th>Scheme</th>
              <th>Amount</th>
              <th>Tenure</th>
              <th>Rate</th>
              <th>Maturity</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7}>No fixed deposit entries found for the selected filters.</td>
              </tr>
            ) : (
              entries.map((item) => (
                <tr key={item.id}>
                  <td>{item.month}</td>
                  <td>{item.bank}</td>
                  <td>{item.scheme}</td>
                  <td>₹{item.amount.toLocaleString()}</td>
                  <td>{item.tenure}</td>
                  <td>{item.rate}%</td>
                  <td>{item.maturityDate}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Dashboard() {
  const [portfolioEntries, setPortfolioEntries] = useState(initialPortfolioEntries);
  const [fixedDepositEntries, setFixedDepositEntries] = useState(initialFixedDeposits);
  const [monthFilter, setMonthFilter] = useState('All');
  const [fundTypeFilter, setFundTypeFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({ investmentType: 'Mutual Fund', bank: 'ICICI Bank' });
  const [recentEntries, setRecentEntries] = useState<string[]>([]);

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set([
        ...portfolioEntries.map((item) => item.month),
        ...fixedDepositEntries.map((item) => item.month),
      ])
    ).sort();
    return ['All', ...months];
  }, [portfolioEntries, fixedDepositEntries]);

  const fundTypeOptions = ['All', 'Mutual Fund', 'Fixed Deposit'];

  const bankOptions = useMemo(() => {
    const banks = Array.from(
      new Set([
        ...portfolioEntries.map((item) => item.bank),
        ...fixedDepositEntries.map((item) => item.bank),
      ])
    ).sort();
    return ['All', ...banks];
  }, [portfolioEntries, fixedDepositEntries]);

  const filteredPortfolioEntries = useMemo(() => {
    return portfolioEntries.filter((entry) => {
      const monthMatch = monthFilter === 'All' || entry.month === monthFilter;
      const fundTypeMatch = fundTypeFilter === 'All' || entry.investmentType === fundTypeFilter;
      return monthMatch && fundTypeMatch;
    });
  }, [portfolioEntries, monthFilter, fundTypeFilter]);

  const filteredFixedDeposits = useMemo(() => {
    return fixedDepositEntries.filter((entry) => {
      const monthMatch = monthFilter === 'All' || entry.month === monthFilter;
      const bankMatch = bankFilter === 'All' || entry.bank === bankFilter;
      return monthMatch && bankMatch;
    });
  }, [fixedDepositEntries, monthFilter, bankFilter]);

  const monthlyTotal = filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0) + filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);
  const portfolioValue = filteredPortfolioEntries.reduce((sum, item) => sum + item.currentValue, 0);
  const fixedDepositValue = filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);
  const portfolioGain = portfolioValue - filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0);

  const openModal = () => {
    setActiveModal(monthlyModalConfig);
    setFormData({ investmentType: 'Mutual Fund', bank: 'ICICI Bank' });
  };

  const closeModal = () => {
    setActiveModal(null);
    setFormData({ investmentType: 'Mutual Fund', bank: 'ICICI Bank' });
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const investmentType = formData.investmentType ?? 'Mutual Fund';
    const bank = formData.bank || 'ICICI Bank';
    const month = formData.month || '2026-08';
    const amount = Number(formData.amount || 0);

    if (investmentType === 'Fixed Deposit') {
      const entry: FixedDepositEntry = {
        id: `fd-${Date.now()}`,
        month,
        investmentType: 'Fixed Deposit',
        bank,
        scheme: formData.scheme || 'Fixed Deposit',
        amount,
        tenure: formData.tenure || '12 Months',
        rate: Number(formData.rate || 0),
        maturityDate: formData.maturityDate || '2027-01-01',
      };
      setFixedDepositEntries((prev) => [entry, ...prev]);
      setRecentEntries((prev) => [`FD added: ${entry.bank} - ₹${entry.amount.toLocaleString()}`, ...prev].slice(0, 4));
    } else {
      const entry: PortfolioEntry = {
        id: `pf-${Date.now()}`,
        month,
        investmentType: 'Mutual Fund',
        bank,
        name: formData.name || 'New Mutual Fund',
        amount,
        currentValue: Number(formData.currentValue || amount),
        status: 'Growing',
      };
      setPortfolioEntries((prev) => [entry, ...prev]);
      setRecentEntries((prev) => [`Mutual fund added: ${entry.name} - ₹${entry.amount.toLocaleString()}`, ...prev].slice(0, 4));
    }

    closeModal();
  };

  return (
    <main className="dashboard-page">
      <div className="dashboard-grid">
        <InvestmentSummary
          monthlyTotal={monthlyTotal}
          portfolioValue={portfolioValue}
          fixedDepositValue={fixedDepositValue}
          portfolioGain={portfolioGain}
          recentEntries={recentEntries}
          onAdd={openModal}
        />

        <div className="right-column">
          <InvestmentTable
            entries={filteredPortfolioEntries}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            fundTypeFilter={fundTypeFilter}
            setFundTypeFilter={setFundTypeFilter}
            monthOptions={monthOptions}
            fundTypeOptions={fundTypeOptions}
          />

          <FixedDepositsSummary
            entries={filteredFixedDeposits}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            bankFilter={bankFilter}
            setBankFilter={setBankFilter}
            monthOptions={monthOptions}
            bankOptions={bankOptions}
          />
        </div>
      </div>

      {activeModal && (
        <div className="modal-backdrop" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{activeModal.title}</h3>
              <button type="button" className="modal-close" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="field-group">
                <label htmlFor="month">Month</label>
                <input id="month" name="month" type="text" placeholder="2026-06" value={formData.month || ''} onChange={handleChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="investmentType">Investment Type</label>
                <select id="investmentType" name="investmentType" value={formData.investmentType || 'Mutual Fund'} onChange={handleChange}>
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="Fixed Deposit">Fixed Deposit</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="bank">Bank</label>
                <select id="bank" name="bank" value={formData.bank || 'ICICI Bank'} onChange={handleChange}>
                  {['ICICI Bank', 'HDFC Bank', 'SBI Bank'].map((bank) => (
                    <option key={bank} value={bank}>
                      {bank}
                    </option>
                  ))}
                </select>
              </div>

              {formData.investmentType === 'Fixed Deposit' ? (
                <>
                  <div className="field-group">
                    <label htmlFor="scheme">Scheme</label>
                    <input id="scheme" name="scheme" type="text" placeholder="Regular FD" value={formData.scheme || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="amount">Amount</label>
                    <input id="amount" name="amount" type="number" placeholder="100000" value={formData.amount || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="tenure">Tenure</label>
                    <input id="tenure" name="tenure" type="text" placeholder="12 Months" value={formData.tenure || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="rate">Interest Rate (%)</label>
                    <input id="rate" name="rate" type="number" placeholder="7.2" value={formData.rate || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="maturityDate">Maturity Date</label>
                    <input id="maturityDate" name="maturityDate" type="text" placeholder="2027-01-01" value={formData.maturityDate || ''} onChange={handleChange} required />
                  </div>
                </>
              ) : (
                <>
                  <div className="field-group">
                    <label htmlFor="name">Investment Name</label>
                    <input id="name" name="name" type="text" placeholder="SIP Fund" value={formData.name || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="amount">Amount</label>
                    <input id="amount" name="amount" type="number" placeholder="5000" value={formData.amount || ''} onChange={handleChange} required />
                  </div>

                  <div className="field-group">
                    <label htmlFor="currentValue">Current Value</label>
                    <input id="currentValue" name="currentValue" type="number" placeholder="5200" value={formData.currentValue || ''} onChange={handleChange} />
                  </div>
                </>
              )}

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn">
                  {activeModal.submitLabel}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;