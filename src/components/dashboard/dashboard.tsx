import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './dashboard.css';
import PortfolioSummarySection from '../portfoliosummary/portfolio-summary-section';
import FixedDepositsSummarySection from '../deposit/deposit-summary-section';
import InvestmentSummarySection from '../investmentsummary/investment-summary-section';
import type { FixedDepositEntry, ModalConfig, PortfolioEntry, StepDefinition } from './types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const initialPortfolioEntries: PortfolioEntry[] = [
  {
    id: 'p1',
    month: '2026-06',
    investmentType: 'Mutual Fund',
    bank: 'HDFC Bank',
    name: 'Apex Equity Fund',
    amount: 25000,
    currentValue: 30250,
    status: 'Growing',
  },
  {
    id: 'p2',
    month: '2026-05',
    investmentType: 'Mutual Fund',
    bank: 'SBI Bank',
    name: 'BlueBond ETF',
    amount: 18000,
    currentValue: 19140,
    status: 'Stable',
  },
  {
    id: 'p3',
    month: '2026-06',
    investmentType: 'Mutual Fund',
    bank: 'ICICI Bank',
    name: 'Nova Real Estate',
    amount: 12000,
    currentValue: 13800,
    status: 'Growing',
  },
  {
    id: 'p4',
    month: '2026-07',
    investmentType: 'Mutual Fund',
    bank: 'HDFC Bank',
    name: 'Cash Reserve',
    amount: 8000,
    currentValue: 8240,
    status: 'Stable',
  },
];

const initialFixedDeposits: FixedDepositEntry[] = [
  {
    id: 'fd1',
    month: '2026-06',
    investmentType: 'Fixed Deposit',
    bank: 'HDFC Bank',
    scheme: 'Regular FD',
    amount: 120000,
    tenure: '12 Months',
    rate: 7.2,
    maturityDate: '2026-08-10',
  },
  {
    id: 'fd2',
    month: '2026-05',
    investmentType: 'Fixed Deposit',
    bank: 'SBI Bank',
    scheme: 'Tax Saver FD',
    amount: 80000,
    tenure: '5 Years',
    rate: 6.8,
    maturityDate: '2031-07-20',
  },
  {
    id: 'fd3',
    month: '2026-07',
    investmentType: 'Fixed Deposit',
    bank: 'ICICI Bank',
    scheme: 'Senior Citizen FD',
    amount: 150000,
    tenure: '24 Months',
    rate: 7.5,
    maturityDate: '2028-06-15',
  },
];

const stepDefinitions: StepDefinition[] = [
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

const monthlyModalConfig: ModalConfig = {
  id: 'monthly',
  title: 'Add Monthly Investment',
  submitLabel: 'Save Investment',
};

function Dashboard() {
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>(initialPortfolioEntries);
  const [fixedDepositEntries, setFixedDepositEntries] = useState<FixedDepositEntry[]>(initialFixedDeposits);
  const [monthFilter, setMonthFilter] = useState('All');
  const [fundTypeFilter, setFundTypeFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    investmentType: 'Mutual Fund',
    bank: 'ICICI Bank',
     folioNumber: '',
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
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

  const monthlyTotal =
    filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0) +
    filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);

  const portfolioValue = filteredPortfolioEntries.reduce((sum, item) => sum + item.currentValue, 0);
  const fixedDepositValue = filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);
  const portfolioGain = portfolioValue - filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0);

  const openModal = () => {
  setActiveModal(monthlyModalConfig);
  setFormData({
    investmentType: 'Mutual Fund',
    bank: 'ICICI Bank',
    folioNumber: '',
  });
  setSelectedDate(new Date());
};

  
const closeModal = () => {
  setActiveModal(null);
  setFormData({
    investmentType: 'Mutual Fund',
    bank: 'ICICI Bank',
    folioNumber: '',
  });
  setSelectedDate(new Date());
};

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const handleSubmit = (e: FormEvent) => {
  e.preventDefault();

  const investmentType = formData.investmentType ?? 'Mutual Fund';
  const bank = formData.bank || 'ICICI Bank';
  const folioNumber = formData.folioNumber || '';
  const amount = Number(formData.amount || 0);

  const selectedMonth = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    : '2026-08';

  if (investmentType === 'Fixed Deposit') {
    const entry: FixedDepositEntry = {
      id: `fd-${Date.now()}`,
      month: selectedMonth,
      investmentType: 'Fixed Deposit',
      bank,
      scheme: formData.scheme || 'Fixed Deposit',
      amount,
      tenure: formData.tenure || '12 Months',
      rate: Number(formData.rate || 0),
      maturityDate: formData.maturityDate || '2027-01-01',
    };

    setFixedDepositEntries((prev) => [entry, ...prev]);
    setRecentEntries((prev) => [
      `FD added: ${entry.bank} - ₹${entry.amount.toLocaleString()}`,
      ...prev,
    ].slice(0, 4));
  } else {
    const entry: PortfolioEntry = {
      id: `pf-${Date.now()}`,
      month: selectedMonth,
      investmentType: 'Mutual Fund',
      bank: '',
      name: formData.name || 'New Mutual Fund',
      amount,
      currentValue: Number(formData.currentValue || amount),
      status: 'Growing',
      // @ts-expect-error - add runtime field for the portfolio table
      folioNumber,
    };

    setPortfolioEntries((prev) => [entry, ...prev]);
    setRecentEntries((prev) => [
      `Mutual fund added: ${entry.name} - ₹${entry.amount.toLocaleString()}`,
      ...prev,
    ].slice(0, 4));
  }

  closeModal();
};

  return (
    <main className="dashboard-page">
      <div className="dashboard-grid">
        <InvestmentSummarySection
          monthlyTotal={monthlyTotal}
          portfolioValue={portfolioValue}
          fixedDepositValue={fixedDepositValue}
          portfolioGain={portfolioGain}
          recentEntries={recentEntries}
          onAdd={openModal}
          steps={stepDefinitions}
        />

        <div className="right-column">
          <PortfolioSummarySection
            entries={filteredPortfolioEntries}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            fundTypeFilter={fundTypeFilter}
            setFundTypeFilter={setFundTypeFilter}
            monthOptions={monthOptions}
            fundTypeOptions={fundTypeOptions}
          />

          <FixedDepositsSummarySection
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
                <label htmlFor="investmentDate">Investment Date</label>
                <DatePicker
                  id="investmentDate"
                  selected={selectedDate}
                  onChange={(date:Date|null) => setSelectedDate(date)}
                  dateFormat="dd/MM/yyyy"
                  className="date-picker-input"
                  popperPlacement="bottom-start"
                />
              </div>

              <div className="field-group">
                <label htmlFor="investmentType">Investment Type</label>
                <select
                  id="investmentType"
                  name="investmentType"
                  value={formData.investmentType || 'Mutual Fund'}
                  onChange={handleChange}
                >
                  <option value="Mutual Fund">Mutual Fund</option>
                  <option value="Fixed Deposit">Fixed Deposit</option>
                </select>
              </div>
              
              {formData.investmentType === 'Fixed Deposit' ? (
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
              ) : (
                <div className="field-group">
                  <label htmlFor="folioNumber">Folio Number</label>
                  <input
                    id="folioNumber"
                    name="folioNumber"
                    type="text"
                    placeholder="123456789"
                    value={formData.folioNumber || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}

                  <div className="field-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="100000"
                      value={formData.amount || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="tenure">Tenure</label>
                    <input
                      id="tenure"
                      name="tenure"
                      type="text"
                      placeholder="12 Months"
                      value={formData.tenure || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="rate">Interest Rate (%)</label>
                    <input
                      id="rate"
                      name="rate"
                      type="number"
                      placeholder="7.2"
                      value={formData.rate || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="maturityDate">Maturity Date</label>
                    <input
                      id="maturityDate"
                      name="maturityDate"
                      type="text"
                      placeholder="2027-01-01"
                      value={formData.maturityDate || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>
               : (
                <>
                  <div className="field-group">
                    <label htmlFor="name">Investment Name</label>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="SIP Fund"
                      value={formData.name || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="amount">Amount</label>
                    <input
                      id="amount"
                      name="amount"
                      type="number"
                      placeholder="5000"
                      value={formData.amount || ''}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="field-group">
                    <label htmlFor="currentValue">Current Value</label>
                    <input
                      id="currentValue"
                      name="currentValue"
                      type="number"
                      placeholder="5200"
                      value={formData.currentValue || ''}
                      onChange={handleChange}
                    />
                  </div>
                </>
              

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