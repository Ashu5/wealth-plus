import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DataTable, { type TableColumn } from 'react-data-table-component';
import './fund-transactions.css';
import { fetchUserFundTransactions } from '../../services/transaction-service';

type FundTransactionRow = {
  id: string;
  month: string;
  transactionDate: string;
  displayDate: string;
  investmentType: string;
  folioNumber: string;
  fundName: string;
  amount: number;
  nav: number;
  units: number;
};

function FundTransactionsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedFund = (location.state as { selectedFund?: { name?: string; folioNumber?: string } } | null)?.selectedFund;
  const [transactions, setTransactions] = useState<FundTransactionRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('All');

  useEffect(() => {
    const loadTransactions = async () => {
      setIsLoading(true);
      try {
        const userName =
          localStorage.getItem('wealth-plus-username')?.trim() ||
          localStorage.getItem('wealth-plus-email')?.split('@')[0]?.trim() ||
          'ashu01';

        const payload = await fetchUserFundTransactions(userName, selectedFund?.name || '');
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
            id: `${transaction?.folioNumber || 'txn'}-${transactionDate || Date.now()}`,
            month: transactionDate ? transactionDate.substring(0, 7) : '',
            transactionDate,
            displayDate,
            investmentType: transaction?.fundType || 'Mutual Fund',
            folioNumber: transaction?.folioNumber || '',
            fundName: transaction?.fundName || selectedFund?.name || 'Unknown Fund',
            amount: Number(transaction?.amount || 0),
            nav: Number(transaction?.nav || 0),
            units: Number(transaction?.units || 0),
          };
        });

        setTransactions(transformed);
      } catch (error) {
        console.error('Error loading fund transactions:', error);
        setTransactions([]);
      } finally {
        setIsLoading(false);
      }
    };

    void loadTransactions();
  }, [selectedFund?.name]);

  const dateOptions = useMemo(() => {
    const months = Array.from(new Set(transactions.map((item) => item.month))).sort();
    return ['All', ...months];
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (selectedDate === 'All') {
      return transactions;
    }

    return transactions.filter((item) => item.month === selectedDate);
  }, [selectedDate, transactions]);

  const columns: TableColumn<FundTransactionRow>[] = [
    {
      name: 'Date',
      selector: (row) => row.displayDate,
      sortable: true,
      grow: 1,
      minWidth: '180px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Fund',
      selector: (row) => row.fundName,
      sortable: true,
      grow: 2,
      minWidth: '220px',
      style: {
        whiteSpace: 'normal',
        overflowWrap: 'anywhere',
      },
    },
    {
      name: 'Folio #',
      selector: (row) => row.folioNumber,
      sortable: true,
      grow: 1,
      minWidth: '120px',
    },
    {
      name: 'Fund Type',
      selector: (row) => row.investmentType,
      sortable: true,
      grow: 1,
      minWidth: '140px',
    },
    {
      name: 'Amount',
      cell: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amount - b.amount,
      grow: 1,
      minWidth: '120px',
    },
    {
      name: 'NAV',
      cell: (row) => `₹${row.nav.toFixed(2)}`,
      sortable: true,
      sortFunction: (a, b) => a.nav - b.nav,
      grow: 1,
      minWidth: '120px',
    },
    {
      name: 'Units',
      cell: (row) => row.units.toFixed(3),
      sortable: true,
      sortFunction: (a, b) => a.units - b.units,
      grow: 1,
      minWidth: '110px',
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
        whiteSpace: 'normal',
      },
    },
  };

  return (
    <div className="fund-transactions-page">
      <div className="fund-transactions-card">
        <div className="fund-transactions-header">
          <div>
            <p className="eyebrow">Portfolio</p>
            <h2>{selectedFund?.name ? `${selectedFund.name} Transactions` : 'Fund Transactions'}</h2>
          </div>
          <button type="button" className="back-link-btn" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-control">
            <label htmlFor="transaction-date-filter">Date</label>
            <select
              id="transaction-date-filter"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            >
              {dateOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="loader-state">Loading transactions...</div>
        ) : filteredTransactions.length === 0 ? (
          <div className="empty-state">No transactions found for the selected date.</div>
        ) : (
          <DataTable
            columns={columns}
            data={filteredTransactions}
            pagination
            paginationPerPage={8}
            paginationRowsPerPageOptions={[8, 12, 20]}
            fixedHeader
            dense
            noDataComponent="No transactions found."
            customStyles={customStyles}
          />
        )}
      </div>
    </div>
  );
}

export default FundTransactionsPage;
