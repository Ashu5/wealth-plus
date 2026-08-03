import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { PortfolioEntry } from '../dashboard/types';
import './recent-transaction.css';

type RecentTransactionAction = {
  id: string;
  label: string;
  onClick: () => void;
};

type RecentTransactionProps = {
  entries: PortfolioEntry[];
  isLoading?: boolean;
  error?: string | null;
  totalAmountInvested?: number;
  totalCurrentValue?: number;
  totalGainLossAmount?: number;
  totalGainLossPercentage?: number;
  overallStatus?: string;
  actions?: RecentTransactionAction[];
};

function RecentTransaction({
  entries,
  isLoading = false,
  error = null,
  actions = []
}: RecentTransactionProps) {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const hasPortfolioEntries = entries.length > 0;

  const getStatusBadgeClassName = (row: PortfolioEntry) => {
    const gain = row.currentValue - row.amount;
    if (gain < 0) {
      return 'status negative';
    }

    if (gain > 0) {
      return 'status positive';
    }

    return 'status neutral';
  };

  const columns: TableColumn<PortfolioEntry>[] = [
    {
      name: 'Fund Name',
      selector: (row) => row.name,
      sortable: true,
      grow: 2,
      style: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minWidth: '220px',
      },
    },
    {
      name: 'Folio #',
      cell: (row) => {
        const folioNumber = (row as PortfolioEntry & { folioNumber?: string }).folioNumber;
        return <span style={{ display: 'inline-block', whiteSpace: 'normal', wordBreak: 'break-word', overflowWrap: 'anywhere' }}>{folioNumber || '-'}</span>;
      },
      sortable: true,
      grow: 1,
      style: {
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        minWidth: '140px',
      },
    },
    {
      name: 'Invested',
      cell: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amount - b.amount,
      grow: 1,
    },
    {
      name: 'Current',
      cell: (row) => `₹${row.currentValue.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.currentValue - b.currentValue,
      grow: 1,
    },
    {
      name: 'Gain',
      cell: (row) => `₹${(row.currentValue - row.amount).toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => (a.currentValue - a.amount) - (b.currentValue - b.amount),
      grow: 1,
    },
    {
      name: 'Status',
      cell: (row) => <span className={getStatusBadgeClassName(row)}>{row.status}</span>,
      sortable: true,
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
    <section className="recent-transactions-card">
      <div className="recent-transactions-header">
        <div>
          <p className="eyebrow">Latest Activity</p>
          <h2>Recent Transactions</h2>
        </div>
        <div className="summary-actions">
          {actions.length > 0 ? (
            <div className="summary-menu">
              <button
                type="button"
                className="hamburger-button"
                onClick={() => setIsMenuOpen((prev) => !prev)}
                aria-label="Open recent transaction actions"
                aria-expanded={isMenuOpen}
              >
                <span />
                <span />
                <span />
              </button>

              {isMenuOpen && (
                <div className="action-menu" role="menu">
                  {actions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      className="action-menu-item"
                      onClick={() => {
                        action.onClick();
                        setIsMenuOpen(false);
                      }}
                      role="menuitem"
                    >
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : null}
          
        </div>
      </div>

      {isLoading ? (
        <div className="recent-table-wrapper">
          <p style={{ padding: '16px 0', color: '#64748b' }}>Loading recent transactions…</p>
        </div>
      ) : error ? (
        <div className="recent-table-wrapper">
          <p style={{ padding: '16px 0', color: '#c62828' }}>{error}</p>
        </div>
      ) : (
        <div className="recent-table-wrapper">
          {hasPortfolioEntries ? (
            <DataTable
              columns={columns}
              data={entries}
              pagination
              paginationPerPage={6}
              paginationRowsPerPageOptions={[6, 10, 15]}
              fixedHeader
              fixedHeaderScrollHeight="320px"
              dense
              noDataComponent="No portfolio entries found for the selected filters."
              customStyles={customStyles}
              onRowClicked={(row) => navigate('/fund-transactions', { state: { selectedFund: row, fromApp: true } })}
              pointerOnHover
            />
          ) : (
            <div className="empty-state-banner" role="status">
              Add your fund and transaction to start tracking your investment
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default RecentTransaction;
