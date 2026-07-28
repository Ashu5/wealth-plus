import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import './dashboard.css';
import FixedDepositsSummarySection from '../deposit/deposit-summary-section';
import MonthlySummary from './monthly-summary';
import OverallSummary from './overall-summary';
import TrendsSection from './trends-section';
import type { FixedDepositEntry, ModalConfig, PortfolioEntry } from './types';
import { addFixedDeposit, getUserFixedDeposits } from '../../services/fund-service';
import { fetchPortfolioSummary, type PortfolioSummaryApiResponse } from '../../services/portfolio-service';
import AddAllocationModal from '../modal/add-allocation-modal';
import AddTrackingModal from '../modal/add-tracking-modal';
import AddGrowthModal from '../modal/add-growth-modal';
import AddFundMasterModal from '../modal/add-fund-master-modal';
import AddFDModal from '../modal/add-fd-modal';
import PortfolioSummarySection from '../portfoliosummary/portfolio-summary-section';
import RecentTransaction from '../recenttransaction/recent-transaction';

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

const monthlyModalConfig: ModalConfig = {
  id: 'add-fund',
  title: 'Add Fund Details',
  submitLabel: 'Add FD',
};

const buildFixedDepositEntries = (payload: unknown): FixedDepositEntry[] => {
  const getCollection = (source: unknown): unknown[] => {
    if (Array.isArray(source)) {
      return source;
    }

    if (source && typeof source === 'object') {
      const record = source as Record<string, unknown>;
      if (Array.isArray(record.data)) {
        return record.data;
      }
      if (Array.isArray(record.fixedDeposits)) {
        return record.fixedDeposits;
      }
      if (Array.isArray(record.items)) {
        return record.items;
      }
    }

    return [];
  };

  const getTenureLabel = (startDate: string, endDate: string) => {
    if (!startDate || !endDate) {
      return 'N/A';
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 'N/A';
    }

    const monthDifference = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    return monthDifference > 0 ? `${monthDifference} months` : '0 months';
  };

  return getCollection(payload).map((entry, index) => {
    const record = entry as Record<string, unknown>;
    const transactionDate = typeof record.transactionDate === 'string' ? record.transactionDate : '';
    const maturityDate = typeof record.maturityDate === 'string' ? record.maturityDate : '';
    const investmentType = typeof record.investmentType === 'string' ? record.investmentType : 'FIXED_DEPOSIT';
    const schemeLabel = investmentType.toLowerCase().includes('fixed') ? 'Fixed Deposit' : investmentType.replace(/_/g, ' ');

    return {
      id: String(record.id || record.fdNumber || record.userName || `${index}`),
      month: transactionDate ? formatMonth(transactionDate) : '',
      investmentType: 'Fixed Deposit',
      bank: String(record.bank || ''),
      fdNumber: String(record.fdNumber || schemeLabel || 'Fixed Deposit'),
      amount: Number(record.amountFixed ?? record.amount ?? 0),
      tenure: getTenureLabel(transactionDate, maturityDate),
      rate: Number(record.interestRate ?? 0),
      maturityDate: maturityDate,
    };
  });
};

function Dashboard() {
  const [portfolioEntries, setPortfolioEntries] = useState<PortfolioEntry[]>([]);
  const [fixedDepositEntries, setFixedDepositEntries] = useState<FixedDepositEntry[]>([]);
  const [portfolioSummaryEntries, setPortfolioSummaryEntries] = useState<PortfolioEntry[]>([]);
  const [portfolioSummaryStats, setPortfolioSummaryStats] = useState({
    totalAmountInvested: 0,
    totalCurrentValue: 0,
    totalGainLossAmount: 0,
    totalGainLossPercentage: 0,
    overallStatus: 'Neutral',
  });
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
  const [selectedMaturityDate, setSelectedMaturityDate] = useState<Date | null>(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [showGrowthModal, setShowGrowthModal] = useState(false);
  const [showFundMasterModal, setShowFundMasterModal] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const getStoredUser = () => {
    return (
      localStorage.getItem('wealth-plus-username')?.trim() ||
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
      setPortfolioSummaryStats({
        totalAmountInvested: Number(payload?.totalAmountInvested ?? 0),
        totalCurrentValue: Number(payload?.totalCurrentValue ?? 0),
        totalGainLossAmount: Number(payload?.totalGainLossAmount ?? 0),
        totalGainLossPercentage: Number(payload?.totalGainLossPercentage ?? 0),
        overallStatus: typeof payload?.overallStatus === 'string' && payload.overallStatus.trim() ? payload.overallStatus : 'Neutral',
      });
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
      const deposits = await getUserFixedDeposits(storedUser);
      setFixedDepositEntries(buildFixedDepositEntries(deposits));
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

  const totalInvestment = portfolioEntries.reduce((sum, item) => sum + item.amount, 0) + fixedDepositEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalCurrentValue = portfolioEntries.reduce((sum, item) => sum + item.currentValue, 0) + fixedDepositEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalGainLoss = totalCurrentValue - totalInvestment;
  const totalGainLossPercentage = totalInvestment > 0 ? (totalGainLoss / totalInvestment) * 100 : 0;

  const openModal = (defaultInvestmentType = 'Bonds/Others') => {
    setActiveModal(monthlyModalConfig);
    setModalError(null);
    setFormData({
      investmentType: defaultInvestmentType,
      bank: 'ICICI Bank',
      folioNumber: '',
    });
    setSelectedDate(new Date());
    setSelectedMaturityDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
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

  
const resetAddFdForm = () => {
  setFormData({
    investmentType: 'Bonds/Others',
    bank: 'ICICI Bank',
    folioNumber: '',
  });
  setSelectedDate(new Date());
  setSelectedMaturityDate(new Date(new Date().setFullYear(new Date().getFullYear() + 1)));
};

const closeModal = () => {
  setActiveModal(null);
  setModalError(null);
  resetAddFdForm();
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
  const selectedDate = date ?? new Date();
  const year = selectedDate.getFullYear();
  const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
  const day = String(selectedDate.getDate()).padStart(2, '0');
  const hours = String(selectedDate.getHours()).padStart(2, '0');
  const minutes = String(selectedDate.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const handleSubmit = async (e: FormEvent) => {
  e.preventDefault();
  const storedUser = getStoredUser();
  const transactionDate = formatSelectedDate(selectedDate);
  const maturityDateValue = formatSelectedDate(selectedMaturityDate);
  const transactionDateObj = new Date(transactionDate);
  const maturityDateObj = new Date(maturityDateValue);

  if (maturityDateObj <= transactionDateObj) {
    setModalError('Maturity date must be after FD Open Date');
    return;
  }

  const amountInvested = Number(formData.amount || 0);
  const interestRate = Number(formData.rate || 0);
  const payload = {
    transactionDate,
    investmentType: 'FIXED_DEPOSIT',
    bank: formData.bank || 'HDFC Bank',
    amountInvested,
    interestRate,
    maturityDate: maturityDateValue,
    fdNumber: formData.fdNumber || `FD${Date.now()}`,
    username: storedUser,
  };

  const selectedMonth = selectedDate
    ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
    : '2026-08';

  try {
    setIsSubmitting(true);
    await addFixedDeposit(payload);
    showSuccessMessage();

    const entry: FixedDepositEntry = {
      id: `fd-${Date.now()}`,
      month: selectedMonth,
      investmentType: 'Fixed Deposit',
      bank: payload.bank,
      fdNumber: formData.fdNumber || `FD${Date.now()}`,
      amount: amountInvested,
      tenure: formData.tenure || '12 Months',
      rate: interestRate,
      maturityDate: payload.maturityDate,
    };

    setFixedDepositEntries((prev) => [entry, ...prev]);
    resetAddFdForm();
    closeModal();
  } catch (error) {
    console.error('Failed to add fixed deposit:', error);
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
          <TrendsSection
            portfolioEntries={filteredPortfolioEntries}
            fixedDepositEntries={filteredFixedDeposits}
          />

          <MonthlySummary
            mutualFundContribution={monthlyMutualContribution}
            fixedDepositContribution={monthlyFixedContribution}
            periodLabel="Monthly Contribution"
          />

          <RecentTransaction
            entries={filteredPortfolioSummaryEntries}
            isLoading={portfolioSummaryLoading}
            error={portfolioSummaryError}
            totalAmountInvested={portfolioSummaryStats.totalAmountInvested}
            totalCurrentValue={portfolioSummaryStats.totalCurrentValue}
            totalGainLossAmount={portfolioSummaryStats.totalGainLossAmount}
            totalGainLossPercentage={portfolioSummaryStats.totalGainLossPercentage}
            overallStatus={portfolioSummaryStats.overallStatus}
            actions={[
              { id: 'fundMaster', label: 'Fund Master', onClick: openFundMasterModal },
              { id: 'allocate', label: 'Add Allocation', onClick: openAllocationModal },
              { id: 'track', label: 'Add Tracking', onClick: openTrackingModal },
              { id: 'grow', label: 'Add Growth', onClick: openGrowthModal },
              { id: 'fixedDeposit', label: 'Add Fixed Deposit', onClick: () => openModal('Fixed Deposit') },
            ]}
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
            fundTypeFilter={fundTypeFilter}
            setFundTypeFilter={setFundTypeFilter}
            fundTypeOptions={fundTypeOptions}
            isLoading={portfolioSummaryLoading}
            error={portfolioSummaryError}
            title="Portfolio Summary"
            eyebrow="Portfolio Details"
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

      <AddFDModal
        activeModal={activeModal}
        isOpen={Boolean(activeModal)}
        onClose={closeModal}
        formData={formData}
        selectedDate={selectedDate}
        selectedMaturityDate={selectedMaturityDate}
        onDateChange={(date) => setSelectedDate(date)}
        onMaturityDateChange={(date) => setSelectedMaturityDate(date)}
        onFormChange={handleChange}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
        errorMessage={modalError}
      />
    </main>
  );
}

export default Dashboard;