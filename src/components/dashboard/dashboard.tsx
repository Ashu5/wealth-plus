import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './dashboard.css';
import PortfolioSummarySection from '../portfoliosummary/portfolio-summary-section';
import FixedDepositsSummarySection from '../deposit/deposit-summary-section';
import InvestmentSummarySection from '../investmentsummary/investment-summary-section';
import type { FixedDepositEntry, ModalConfig, PortfolioEntry, StepDefinition } from './types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {addFund} from '../../services/fund-service';
import AddAllocationModal from '../allocate/add-allocation-modal';
import AddTrackingModal from '../track/add-tracking-modal';
import AddGrowthModal from '../grow/add-growth-modal';
import AddFundMasterModal from '../fundmaster/add-fund-master-modal';

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
    id: 'fundMaster',
    title: 'Fund Master',
    subtitle: 'Set Funds',
    detail: 'Add a new fund, set your target, and define your investment strategy.',
    actionLabel: 'Fund Master',
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
  id: 'add-fund',
  title: 'Add Fund Details',
  submitLabel: 'Add Fund',
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showFundMasterModal, setShowFundMasterModal] = useState(false);

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

  const openAllocationModal = () => {
    setShowAllocationModal(true);
  };

  const openTrackingModal = () => {
    setShowTrackingModal(true);
  };

  const openGrowthModal = () => {
    setShowGrowthModal(true);
  };

  const openFundMasterModal = () => {
    setShowFundMasterModal(true);
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

const showSuccessMessage = () => {
  setShowSuccessModal(true);
  window.setTimeout(() => setShowSuccessModal(false), 2500);
};

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

const formatSelectedDate = (date: Date | null) => {
  if (!date) {
    return new Date().toISOString().split('T')[0];
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();

  const investmentType = formData.investmentType ?? 'Mutual Fund';
  const bank = formData.bank || 'ICICI Bank';
  const folioNumber = formData.folioNumber || '';
  const amount = Number(formData.amount || formData.sipAmount || 0);

  const selectedMonth = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    : '2026-08';

  const fundPayload = {
    fundName: formData?.fundName,
    fundCode: formData?.fundCode,
    fundType: formData?.fundType || 'Mid Cap',
    fundAmount: String(formData?.sipAmount || formData?.amount || '1222'),
    folioNumber: folioNumber || '002',
    currency: formData.currentType || 'INR',
    createdDate: formatSelectedDate(selectedDate),
    platform: {
      platformCode: formData?.platformCode || '01',
      platformName: formData?.platformType || 'Groww',
      platformDescription: formData?.platformDescription || `${formData?.platformType || 'Groww'} Platform`,
    },
  };

  try {
    setIsSubmitting(true);
    await addFund(fundPayload);
    showSuccessMessage();

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
        name: formData.fundName || 'New Mutual Fund',
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
  } catch (error) {
    console.error('Failed to add fund:', error);
    window.alert('Unable to add fund right now. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  return (
    <main className="dashboard-page">
      {showSuccessModal && (
        <div className="success-modal-backdrop" role="dialog" aria-modal="true">
          <div className="success-modal-card">
            <div className="success-modal-icon">✓</div>
            <h3>Fund Added successfully.</h3>
          </div>
        </div>
      )}

      <AddAllocationModal isOpen={showAllocationModal} onClose={() => setShowAllocationModal(false)} />
      <AddTrackingModal isOpen={showTrackingModal} onClose={() => setShowTrackingModal(false)} />
      <AddGrowthModal isOpen={showGrowthModal} onClose={() => setShowGrowthModal(false)} />
      <AddFundMasterModal isOpen={showFundMasterModal} onClose={() => setShowFundMasterModal(false)} />

      <div className="dashboard-grid">
        <InvestmentSummarySection
          monthlyTotal={monthlyTotal}
          portfolioValue={portfolioValue}
          fixedDepositValue={fixedDepositValue}
          portfolioGain={portfolioGain}
          recentEntries={recentEntries}
          onAdd={openModal}
          steps={stepDefinitions}
          onAllocate={openAllocationModal}
          onTrack={openTrackingModal}
          onGrow={openGrowthModal}
          onFundMaster={openFundMasterModal}
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
                <label htmlFor="investmentDate">Select Date</label>
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
              {formData.investmentType === 'Mutual Fund' && (
                  <div className="field-group">
                    <label htmlFor="fundName">Fund Name</label>
                    <input
                      id="fundName"
                      name="fundName"
                      type="text"
                      placeholder="Fund Name"
                      value={formData.fundName || ''}
                      onChange={handleChange}
                      required
                />
              </div>
              )}

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

               {formData.investmentType === 'Mutual Fund' && (
                   <div className="field-group">
                  <label htmlFor="fundType">Fund Type</label>
                  <select id="fundType" name="fundType" value={formData.fundType || 'Equity'} onChange={handleChange}>
                    {['ELSS', 'Equity Fund', 'Flexi Cap', 'Multi Asset', 'Mid Cap', 'Commodities Fund', 'Liquid Fund', 'Large Cap','Debt', 'Hybrid'].map((fundType) => (
                      <option key={fundType} value={fundType}>
                        {fundType}
                      </option>
                    ))}
                  </select>
                </div>
              )}


               {formData.investmentType === 'Mutual Fund' && (
                   <div className="field-group">
                  <label htmlFor="currentType">Current Type</label>
                  <select id="currentType" name="currentType" value={formData.currentType || 'Equity'} onChange={handleChange}>
                    {['INR', 'USD', 'EUR'].map((currentType) => (
                      <option key={currentType} value={currentType}>
                        {currentType}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formData.investmentType === 'Fixed Deposit'? (
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
              ):(
                <div className="field-group">
                  <label htmlFor="sipAmount">SIP Amount</label>
                  <input
                    id="sipAmount"
                    name="sipAmount"
                    type="number"
                    placeholder="100000"
                    value={formData.sipAmount || ''}
                    onChange={handleChange}
                    required
                  />
                </div>
              )}
              {formData.investmentType === 'Mutual Fund' ? (
              
                   <div className="field-group">
                  <label htmlFor="platformType">Platform Type</label>
                  <select id="platformType" name="platformType" value={formData.platformType || 'Equity'} onChange={handleChange}>
                    {['Groww', 'Coin', 'Smallcase'].map((platformType) => (
                      <option key={platformType} value={platformType}>
                        {platformType}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (

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
              )}
                {formData.investmentType === 'Fixed Deposit' && (
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
                )}
                <>
                {formData.investmentType === 'Fixed Deposit' && (
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
                )}
                 {formData.investmentType === 'Fixed Deposit' && (
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
                 )}
                 {formData.investmentType === 'Fixed Deposit' && (
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
                    )}
                </>
               
              

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : activeModal.submitLabel}
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