import { useEffect, useState } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { PortfolioEntry } from '../dashboard/types';
import { fetchUserFundTransactions } from '../../services/transaction-service';

type FundDetailsModalProps = {
  selectedFund: PortfolioEntry | null;
  entries: PortfolioEntry[];
  allEntries?: PortfolioEntry[];
  onClose: () => void;
};

function FundDetailsModal({ selectedFund, entries, allEntries, onClose }: FundDetailsModalProps) {
  const [modalMonthFilter, setModalMonthFilter] = useState('All');
  const [transactionData, setTransactionData] = useState<PortfolioEntry[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  useEffect(() => {
    if (!selectedFund) return;

    const loadTransactions = async () => {
      setIsLoadingTransactions(true);
      try {
        const userName =
          localStorage.getItem('wealth-plus-username')?.trim() ||
          localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() ||
          'ashu01';

        const transactions = await fetchUserFundTransactions(userName, selectedFund.name);
        
        // Transform API response to PortfolioEntry format
        const transformed: PortfolioEntry[] = transactions.map((transaction) => ({
          id: `${transaction.folioNumber}-${transaction.transactionDate}`,
          month: transaction.transactionDate.substring(0, 7), // Convert to YYYY-MM format
          investmentType: transaction.fundType || 'Mutual Fund',
          bank: '',
          name: transaction.fundName,
          amount: transaction.amount,
          currentValue: transaction.amount, // Using amount as current value for now
          status: 'Active',
          folioNumber: transaction.folioNumber,
          nav: transaction.nav,
          units: transaction.units,
        }));

        setTransactionData(transformed);
      } catch (error) {
        console.error('Error loading fund transactions:', error);
        setTransactionData([]);
      } finally {
        setIsLoadingTransactions(false);
      }
    };

    void loadTransactions();
  }, [selectedFund]);

  if (!selectedFund) {
    return null;
  }

  // Use API data if available, otherwise fall back to allEntries
  const dataSource = transactionData.length > 0 ? transactionData : (allEntries || entries);

  const getModalMonthOptions = () => {
    const fundEntries = dataSource.filter((e) => e.name === selectedFund.name);
    const months = Array.from(new Set(fundEntries.map((item) => item.month))).sort();
    return ['All', ...months];
  };

  const getFilteredModalEntries = () => {
    return dataSource.filter((e) => {
      const nameMatch = e.name === selectedFund.name;
      const monthMatch = modalMonthFilter === 'All' || e.month === modalMonthFilter;
      return nameMatch && monthMatch;
    });
  };

  const columns: TableColumn<PortfolioEntry>[] = [
    {
      name: 'Date',
      selector: (row) => row.month,
      sortable: true,
      grow: 1,
    },
    {
      name: 'TranID',
      selector: (row) => row.id,
      sortable: true,
      grow: 1,
      style: {
        fontSize: '0.875rem',
      },
    },
    {
      name: 'Fund',
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      style: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minWidth: '150px',
      },
    },
    {
      name: 'Folio#',
      cell: (row) => {
        const folioNumber = (row as PortfolioEntry & { folioNumber?: string }).folioNumber;
        return <span>{folioNumber || '-'}</span>;
      },
      sortable: true,
      grow: 1,
    },
    {
      name: 'Fund Type',
      selector: (row) => row.investmentType,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Amount',
      cell: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amount - b.amount,
      grow: 1,
    },
    {
      name: 'NAV',
      cell: (row) => `₹${(row.nav || 0).toFixed(2)}`,
      sortable: true,
      sortFunction: (a, b) => (a.nav || 0) - (b.nav || 0),
      grow: 1,
    },
    {
      name: 'Units',
      cell: (row) => (row.units || 0).toFixed(3),
      sortable: true,
      sortFunction: (a, b) => (a.units || 0) - (b.units || 0),
      grow: 1,
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontWeight: 600,
        padding: '12px 16px',
      },
    },
    cells: {
      style: {
        padding: '10px 16px',
      },
    },
    pagination: {
      style: {
        borderTop: '1px solid #e2e8f0',
        paddingTop: '12px',
      },
    },
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{selectedFund.name}</h3>
            <p className="modal-subtitle">Fund Transactions</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="filter-bar" style={{ marginBottom: '16px' }}>
          <div className="filter-control">
            <label htmlFor="modal-month-filter">Month</label>
            <select
              id="modal-month-filter"
              value={modalMonthFilter}
              onChange={(e) => setModalMonthFilter(e.target.value)}
            >
              {getModalMonthOptions().map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="modal-table-wrapper">
          {isLoadingTransactions ? (
            <p style={{ padding: '16px', color: '#64748b' }}>Loading transactions...</p>
          ) : (
            <DataTable
              columns={columns}
              data={getFilteredModalEntries()}
              pagination
              paginationPerPage={6}
              paginationRowsPerPageOptions={[6, 10, 15]}
              fixedHeader
              fixedHeaderScrollHeight="320px"
              dense
              noDataComponent="No transactions found for this fund."
              customStyles={customStyles}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default FundDetailsModal;
