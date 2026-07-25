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

type FundTransactionRow = PortfolioEntry & {
  transactionDate?: string;
  displayDate?: string;
};

function FundDetailsModal({ selectedFund, entries, allEntries, onClose }: FundDetailsModalProps) {
  const [modalMonthFilter, setModalMonthFilter] = useState('All');
  const [transactionData, setTransactionData] = useState<FundTransactionRow[]>([]);
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

        const payload = await fetchUserFundTransactions(userName, selectedFund.name);
        const sourceData = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
            ? payload.data
            : [];

        const transformed: FundTransactionRow[] = sourceData.map((transaction: any) => {
          const transactionDate = typeof transaction?.transactionDate === 'string' ? transaction.transactionDate : '';
          const parsedDate = transactionDate ? new Date(transactionDate) : null;
          const displayDate = parsedDate && !Number.isNaN(parsedDate.getTime())
            ? parsedDate.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
            : transactionDate;

          return {
            id: `${transaction?.folioNumber || selectedFund.folioNumber || 'txn'}-${transactionDate || Date.now()}`,
            month: transactionDate ? transactionDate.substring(0, 7) : '',
            investmentType: transaction?.fundType || 'Mutual Fund',
            bank: '',
            name: transaction?.fundName || selectedFund.name,
            amount: Number(transaction?.amount || 0),
            currentValue: Number(transaction?.amount || 0),
            status: 'Active',
            folioNumber: transaction?.folioNumber || '',
            nav: Number(transaction?.nav || 0),
            units: Number(transaction?.units || 0),
            transactionDate,
            displayDate,
          };
        });

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

  const dataSource = transactionData.length > 0 ? transactionData : (allEntries || entries);

  const getModalMonthOptions = () => {
    const fundEntries = dataSource.filter((e) => e.name === selectedFund.name);
    const months = Array.from(new Set(fundEntries.map((item) => item.month))).sort();
    return ['All', ...months];
  };

  const getFilteredModalEntries = () => {
    return dataSource.filter((e) => {
      const isApiData = transactionData.length > 0;
      const nameMatch = isApiData ? true : e.name === selectedFund.name;
      const monthMatch = modalMonthFilter === 'All' || e.month === modalMonthFilter;
      return nameMatch && monthMatch;
    });
  };

  const columns: TableColumn<FundTransactionRow>[] = [
    {
      name: 'Date',
      selector: (row) => (row as FundTransactionRow).displayDate || row.month,
      sortable: true,
      grow: 1,
      wrap: true,
      minWidth: '150px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'TranID',
      selector: (row) => row.id,
      sortable: true,
      grow: 1,
      wrap: true,
      minWidth: '150px',
      style: {
        fontSize: '0.875rem',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Fund',
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      wrap: true,
      minWidth: '220px',
      style: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
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
      wrap: true,
      minWidth: '120px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Fund Type',
      selector: (row) => row.investmentType,
      sortable: true,
      grow: 1,
      wrap: true,
      minWidth: '140px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Amount',
      cell: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amount - b.amount,
      grow: 1,
      wrap: true,
      minWidth: '120px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'NAV',
      cell: (row) => `₹${(row.nav || 0).toFixed(2)}`,
      sortable: true,
      sortFunction: (a, b) => (a.nav || 0) - (b.nav || 0),
      grow: 1,
      wrap: true,
      minWidth: '120px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Units',
      cell: (row) => (row.units || 0).toFixed(3),
      sortable: true,
      sortFunction: (a, b) => (a.units || 0) - (b.units || 0),
      grow: 1,
      wrap: true,
      minWidth: '110px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
  ];

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontWeight: 600,
        padding: '12px 16px',
        whiteSpace: 'nowrap',
      },
    },
    cells: {
      style: {
        padding: '10px 16px',
        whiteSpace: 'normal',
        overflowWrap: 'anywhere' as const,
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

        <div className="modal-table-wrapper" style={{ overflowX: 'auto', width: '100%' }}>
          {isLoadingTransactions ? (
            <p style={{ padding: '16px', color: '#64748b' }}>Loading transactions...</p>
          ) : (
            <DataTable
              columns={columns}
              responsive
              data={getFilteredModalEntries()}
              pagination
              paginationPerPage={6}
              paginationRowsPerPageOptions={[6, 10, 15]}
              fixedHeader
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
