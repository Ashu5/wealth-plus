import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './dashboard.css';
import PortfolioSummarySection from '../portfoliosummary/portfolio-summary-section';
import FixedDepositsSummarySection from '../deposit/deposit-summary-section';
import InvestmentSummarySection from '../investmentsummary/investment-summary-section';
import MonthlySummary from './monthly-summary';
import OverallSummary from './overall-summary';
import type { FixedDepositEntry, ModalConfig, PortfolioEntry, StepDefinition } from './types';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import {addFund} from '../../services/fund-service';
import { fetchPortfolioSummary, type PortfolioSummaryApiResponse } from '../../services/portfolio-service';
import { fetchFixedDeposits } from '../../services/deposit-service';
import AddAllocationModal from '../allocate/add-allocation-modal';
import AddTrackingModal from '../track/add-tracking-modal';
import AddGrowthModal from '../grow/add-growth-modal';
import AddFundMasterModal from '../fundmaster/add-fund-master-modal';

const formatMonth = (value: string) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  const year = parsedDate.getFullYear();
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const buildPortfolioSummaryEntries = (payload: PortfolioSummaryApiResponse): PortfolioEntry[] => {
  if (!payload || !Array.isArray(payload.funds)) {
    console.warn('Invalid portfolio summary response structure:', payload);
    return [];
  }

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  return payload.funds.map((fund) => {
    // If fund has investments array, flatten it
    if (Array.isArray(fund.investments) && fund.investments.length > 0) {
      return fund.investments.map((investment) => ({
        id: investment.transactionId,
        month: formatMonth(investment.transactionDate),
        investmentType: fund.fundType || 'Bonds/Others',
        bank: '',
        name: fund.fundName,
        amount: investment.amountInvested,
        currentValue: investment.currentValue,
        status: investment.status,
        folioNumber: fund.folioNumber || '',
        nav: fund.currentNav,
        units: investment.units,
      }));
    }

    // If no investments array, create a single entry from the fund summary
    return {
      id: `${fund.fundName}-${currentMonth}`,
      month: currentMonth,
      investmentType: fund.fundType || 'Bonds/Others',
      bank: '',
      name: fund.fundName,
      amount: fund.amountInvested,
      currentValue: fund.currentValue,
      status: fund.status,
      folioNumber: fund.folioNumber || '',
      nav: fund.currentNav,
      units: fund.totalUnits,
    };
  }).flat();
};

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
    detail: 'Increase contributions over time.',
    actionLabel: 'Add Growth',
  },
];

const monthlyModalConfig: ModalConfig = {
  id: 'add-fund',
  title: 'Add Fund Details',
  submitLabel: 'Add Fund',
};

function Dashboard() {
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>([]);
  const [fixedDepositEntries, setFixedDepositEntries] = useState<FixedDepositEntry[]>([]);
  const [portfolioSummaryEntries, setPortfolioSummaryEntries] = useState<PortfolioEntry[]>([]);
  const [portfolioSummaryLoading, setPortfolioSummaryLoading] = useState(true);
  const [portfolioSummaryError, setPortfolioSummaryError] = useState<string | null>(null);
  const [fixedDepositLoading, setFixedDepositLoading] = useState(true);
  const [fixedDepositError, setFixedDepositError] = useState<string | null>(null);
  const [monthFilter, setMonthFilter] = useState('All');
  const [fundTypeFilter, setFundTypeFilter] = useState('All');
  const [bankFilter, setBankFilter] = useState('All');
  const [activeModal, setActiveModal] = useState<ModalConfig | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({
    investmentType: 'Bonds/Others',
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

  const getStoredUser = () => {
    return (
      localStorage.getItem('wealth-plus-username')?.trim() ||
      localStorage.getItem('wealth-plus-user')?.trim() ||
      localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() ||
      'ashu01'
    );
  };

  const loadPortfolioSummary = async () => {
    const storedUser = getStoredUser();

    console.log('Loading portfolio summary for user:', storedUser);

    setPortfolioSummaryLoading(true);
    setPortfolioSummaryError(null);

    try {
      const payload = await fetchPortfolioSummary(storedUser);
      console.log('Portfolio summary API response:', payload);
      const entries = buildPortfolioSummaryEntries(payload);
      setPortfolioSummaryEntries(entries);
      setPortfolioEntries(entries);
    } catch (error) {
      console.error('Error loading portfolio summary:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error details:', errorMessage);
      setPortfolioSummaryEntries([]);
      setPortfolioEntries([]);
      setPortfolioSummaryError('Unable to load portfolio summary right now.');
    } finally {
      setPortfolioSummaryLoading(false);
    }
  };

  const loadFixedDeposits = async () => {
    const storedUser = getStoredUser();

    setFixedDepositLoading(true);
    setFixedDepositError(null);

    try {
      const deposits = await fetchFixedDeposits(storedUser);
      setFixedDepositEntries(deposits);
    } catch (error) {
      console.error('Error loading fixed deposits:', error);
      setFixedDepositEntries([]);
      setFixedDepositError('Unable to load fixed deposit details right now.');
    } finally {
      setFixedDepositLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadDataIfMounted = async () => {
      if (!isMounted) {
        return;
      }

      await Promise.all([loadPortfolioSummary(), loadFixedDeposits()]);
    };

    void loadDataIfMounted();

    return () => {
      isMounted = false;
    };
  }, []);

  const monthOptions = useMemo(() => {
    const months = Array.from(
      new Set([
        ...portfolioSummaryEntries.map((item) => item.month),
        ...fixedDepositEntries.map((item) => item.month),
      ])
    ).sort();
    return ['All', ...months];
  }, [portfolioSummaryEntries, fixedDepositEntries]);

  const fundTypeOptions = useMemo(() => {
    const fundTypes = Array.from(new Set(portfolioSummaryEntries.map((item) => item.investmentType))).sort();
    return ['All', ...fundTypes];
  }, [portfolioSummaryEntries]);

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

  const filteredPortfolioSummaryEntries = useMemo(() => {
    return portfolioSummaryEntries.filter((entry) => {
      const fundTypeMatch = fundTypeFilter === 'All' || entry.investmentType === fundTypeFilter;
      return fundTypeMatch;
    });
  }, [portfolioSummaryEntries, fundTypeFilter]);

  const filteredFixedDeposits = useMemo(() => {
    return fixedDepositEntries.filter((entry) => {
      const monthMatch = monthFilter === 'All' || entry.month === monthFilter;
      const bankMatch = bankFilter === 'All' || entry.bank === bankFilter;
      return monthMatch && bankMatch;
    });
  }, [fixedDepositEntries, monthFilter, bankFilter]);

  const monthlyMutualContribution = filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0);
  const monthlyFixedContribution = filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);
  const monthlyTotal = monthlyMutualContribution + monthlyFixedContribution;

  const totalInvestment = portfolioEntries.reduce((sum, item) => sum + item.amount, 0) + fixedDepositEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentValue = portfolioEntries.reduce((sum, item) => sum + item.currentValue, 0) + fixedDepositEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalGainLoss = totalCurrentValue - totalInvestment;
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  const portfolioValue = filteredPortfolioEntries.reduce((sum, item) => sum + item.currentValue, 0);
  const fixedDepositValue = filteredFixedDeposits.reduce((sum, item) => sum + item.amount, 0);
  const portfolioGain = portfolioValue - filteredPortfolioEntries.reduce((sum, item) => sum + item.amount, 0);

  const openModal = (defaultInvestmentType = 'Bonds/Others') => {
    setActiveModal(monthlyModalConfig);
    setFormData({
      investmentType: defaultInvestmentType,
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
    investmentType: 'Bonds/Others',
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

  const investmentType = formData.investmentType ?? 'Bonds/Others';
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
        investmentType: 'Bonds/Others',
        bank: '',
        name: formData.fundName || 'New Bonds/Others',
        amount,
        currentValue: Number(formData.currentValue || amount),
        status: 'Growing',
        folioNumber,
      };

      setPortfolioEntries((prev) => [entry, ...prev]);
      setRecentEntries((prev) => [
        `Bonds/Others added: ${entry.name} - ₹${entry.amount.toLocaleString()}`,
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
      <AddTrackingModal
        isOpen={showTrackingModal}
        onClose={() => setShowTrackingModal(false)}
        onSuccess={() => {
          void loadPortfolioSummary();
        }}
      />
      <AddGrowthModal isOpen={showGrowthModal} onClose={() => setShowGrowthModal(false)} />
      <AddFundMasterModal isOpen={showFundMasterModal} onClose={() => setShowFundMasterModal(false)} />

      <div className="dashboard-grid">
        <div>
          <MonthlySummary
            mutualFundContribution={monthlyMutualContribution}
            fixedDepositContribution={monthlyFixedContribution}
            periodLabel="Monthly Contribution"
          />

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
        </div>

        <div className="right-column">
          <OverallSummary
            totalInvestment={totalInvestment}
            totalCurrentValue={totalCurrentValue}
            totalGainLoss={totalGainLoss}
            gainLossPercentage={totalGainLossPercentage}
          />

          <PortfolioSummarySection
            entries={filteredPortfolioSummaryEntries}
            allEntries={portfolioSummaryEntries}
            fundTypeFilter={fundTypeFilter}
            setFundTypeFilter={setFundTypeFilter}
            fundTypeOptions={fundTypeOptions}
            isLoading={portfolioSummaryLoading}
            error={portfolioSummaryError}
          />

          <FixedDepositsSummarySection
            entries={filteredFixedDeposits}
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            bankFilter={bankFilter}
            setBankFilter={setBankFilter}
            monthOptions={monthOptions}
            bankOptions={bankOptions}
            onAddFD={() => openModal('Fixed Deposit')}
            isLoading={fixedDepositLoading}
            error={fixedDepositError}
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
                  value={formData.investmentType || 'Bonds/Others'}
                  onChange={handleChange}
                >
                  <option value="Fixed Deposit">Fixed Deposit</option>
                  <option value="Bonds/Others">Bonds/Others</option>
                </select>
              </div>
              {formData.investmentType === 'Bonds/Others' && (
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

               {formData.investmentType === 'Bonds/Others' && (
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


               {formData.investmentType === 'Bonds/Others' && (
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
              {formData.investmentType === 'Bonds/Others' ? (
              
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