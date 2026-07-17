import { useId, useState } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { PortfolioEntry } from '../dashboard/types';
import './portfolio-summary-section.css';

type PortfolioSummarySectionProps = {
  entries: PortfolioEntry[];
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
  const [selectedFund, setSelectedFund] = useState<PortfolioEntry | null>(null);
  const [modalMonthFilter, setModalMonthFilter] = useState('All');

  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);

  const getModalMonthOptions = () => {
    if (!selectedFund) return ['All'];
    const fundEntries = entries.filter((e) => e.name === selectedFund.name);
    const months = Array.from(new Set(fundEntries.map((item) => item.month))).sort();
    return ['All', ...months];
  };

  const getFilteredModalEntries = () => {
    if (!selectedFund) return [];
    return entries.filter((e) => {
      const nameMatch = e.name === selectedFund.name;
      const monthMatch = modalMonthFilter === 'All' || e.month === modalMonthFilter;
      return nameMatch && monthMatch;
    });
  };

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
      name: 'Month',
      selector: (row) => row.month,
      sortable: true,
      grow: 1,
    },
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
         <span className="pill">₹{totalAmount.toLocaleString()}</span>
      </div>

      <FilterBar
        secondaryFilter={fundTypeFilter}
        setSecondaryFilter={setFundTypeFilter}
        secondaryOptions={fundTypeOptions}
        secondaryLabel="Fund Type"
      />

      {selectedFund && (
        <div className="modal-backdrop" onClick={() => setSelectedFund(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>{selectedFund.name}</h3>
                <p className="modal-subtitle">Fund Transactions</p>
              </div>
              <button type="button" className="modal-close" onClick={() => setSelectedFund(null)}>
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
            </div>
          </div>
        </div>
      )}

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
            onRowClicked={(row) => setSelectedFund(row)}
            pointerOnHover
          />
        </div>
      )}
    </section>
  );
}

export default PortfolioSummarySection;