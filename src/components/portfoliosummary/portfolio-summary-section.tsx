import { useId, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { PortfolioEntry } from '../dashboard/types';
import './portfolio-summary-section.css';

type PortfolioSummarySectionProps = {
  entries: PortfolioEntry[];
  allEntries?: PortfolioEntry[];
  fundTypeFilter: string;
  setFundTypeFilter: (value: string) => void;
  fundTypeOptions: string[];
  isLoading?: boolean;
  error?: string | null;
};

function FilterBar({
  secondaryFilter,
  setSecondaryFilter,
  secondaryOptions,
  secondaryLabel,
}: {
  secondaryFilter: string;
  setSecondaryFilter: (value: string) => void;
  secondaryOptions: string[];
  secondaryLabel: string;
}) {
  const secondaryId = useId();

  return (
    <div className="filter-bar">
      <div className="filter-control">
        <label htmlFor={secondaryId}>{secondaryLabel}</label>
        <select id={secondaryId} value={secondaryFilter} onChange={(e) => setSecondaryFilter(e.target.value)}>
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

function PortfolioSummarySection({
  entries,
  fundTypeFilter,
  setFundTypeFilter,
  fundTypeOptions,
  isLoading = false,
  error = null,
}: PortfolioSummarySectionProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);

  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);
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
    <section className="table-card">
      <div className="table-header">
        <div>
          <p className="eyebrow">Portfolio Details</p>
          <h2>Portfolio Summary</h2>
        </div>
        <div className="summary-actions">
          <button
            type="button"
            className="visibility-toggle"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide portfolio summary amounts' : 'Show portfolio summary amounts'}
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
          <span className="pill">{isVisible ? `₹${totalAmount.toLocaleString()}` : '••••••'}</span>
        </div>
      </div>

      <FilterBar
        secondaryFilter={fundTypeFilter}
        setSecondaryFilter={setFundTypeFilter}
        secondaryOptions={fundTypeOptions}
        secondaryLabel="Fund Type"
      />

      {isLoading ? (
        <div className="table-wrapper">
          <p style={{ padding: '16px 0', color: '#64748b' }}>Loading portfolio summary…</p>
        </div>
      ) : error ? (
        <div className="table-wrapper">
          <p style={{ padding: '16px 0', color: '#c62828' }}>{error}</p>
        </div>
      ) : (
        <div className="table-wrapper">
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
              Add your fund and transaction to start traking your investment
            </div>
          )}
        </div>
      )}
    </section>
  );
}

export default PortfolioSummarySection;