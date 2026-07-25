import { useId, useState } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { FixedDepositEntry } from '../dashboard/types';
import FixedDepositDetailsModal from '../modal/fixed-deposit-details-modal';

type FixedDepositsSummarySectionProps = {
  entries: FixedDepositEntry[];
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  bankFilter: string;
  setBankFilter: (value: string) => void;
  monthOptions: string[];
  bankOptions: string[];
  onAddFD: () => void;
  isLoading?: boolean;
  error?: string | null;
};

function FilterBar({
  monthFilter,
  setMonthFilter,
  secondaryFilter,
  setSecondaryFilter,
  monthOptions,
  secondaryOptions,
  secondaryLabel,
}: {
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  secondaryFilter: string;
  setSecondaryFilter: (value: string) => void;
  monthOptions: string[];
  secondaryOptions: string[];
  secondaryLabel: string;
}) {
  const monthId = useId();
  const secondaryId = useId();

  return (
    <div className="filter-bar">
      <div className="filter-control">
        <label htmlFor={monthId}>Month</label>
        <select id={monthId} value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)}>
          {monthOptions.map((month) => (
            <option key={month} value={month}>
              {month}
            </option>
          ))}
        </select>
      </div>

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

function FixedDepositsSummarySection({
  entries,
  monthFilter,
  setMonthFilter,
  bankFilter,
  setBankFilter,
  monthOptions,
  bankOptions,
  onAddFD,
  isLoading,
  error,
}: FixedDepositsSummarySectionProps) {
  const [selectedEntry, setSelectedEntry] = useState<FixedDepositEntry | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const totalAmount = entries.reduce((sum, item) => sum + item.amount, 0);

  const columns: TableColumn<FixedDepositEntry>[] = [
    {
      name: 'Month',
      selector: (row) => row.month,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Bank',
      selector: (row) => row.bank,
      sortable: true,
      grow: 1,
    },
    {
      name: 'FD Number',
      selector: (row) => row.fdNumber,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Amount',
      cell: (row) => `₹${row.amount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amount - b.amount,
      grow: 1,
    },
    {
      name: 'Tenure',
      selector: (row) => row.tenure,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Rate',
      cell: (row) => `${row.rate}%`,
      sortable: true,
      sortFunction: (a, b) => a.rate - b.rate,
      grow: 1,
    },
    {
      name: 'Maturity',
      selector: (row) => row.maturityDate,
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
    <section className="fd-card">
      <div className="table-header fd-header-shell">
        <div>
          <p className="eyebrow">Fixed Deposits</p>
          <h2>Fixed Deposits Summary</h2>
        </div>
        <div className="summary-actions">
          <button
            type="button"
            className="visibility-toggle"
            onClick={() => setIsVisible((prev) => !prev)}
            aria-label={isVisible ? 'Hide fixed deposit summary amounts' : 'Show fixed deposit summary amounts'}
          >
            {isVisible ? '🙈' : '👁️'}
          </button>
          <span className="pill">{isVisible ? `₹${totalAmount.toLocaleString()}` : '••••••'}</span>
        </div>
      </div>

      <div className="fd-center-action">
        <button type="button" className="fd-action-pill" onClick={onAddFD}>
          <span className="fd-action-icon">＋</span>
          <span>Track FD</span>
        </button>
      </div>

      {isLoading ? (
        <div className="fd-loading-state">
          <p>Loading fixed deposit data...</p>
        </div>
      ) : error ? (
        <div className="fd-error-state">
          <div className="fd-state-card">
            <p className="eyebrow">Update needed</p>
            <h3>{error}</h3>
          </div>
        </div>
      ) : entries.length === 0 ? (
        <div className="fd-empty-state">
          <div className="fd-empty-state-content">
            <div className="fd-empty-icon">🏦</div>
            <p className="eyebrow">No fixed deposits yet</p>
            <h3>Add your first FD</h3>
          </div>
        </div>
      ) : (
        <>
          <FilterBar
            monthFilter={monthFilter}
            setMonthFilter={setMonthFilter}
            secondaryFilter={bankFilter}
            setSecondaryFilter={setBankFilter}
            monthOptions={monthOptions}
            secondaryOptions={bankOptions}
            secondaryLabel="Bank"
          />

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
              noDataComponent="No fixed deposit entries found for the selected filters."
              customStyles={customStyles}
              onRowClicked={(row) => setSelectedEntry(row)}
            />
          </div>
        </>
      )}

      <FixedDepositDetailsModal
        entry={selectedEntry}
        isOpen={Boolean(selectedEntry)}
        onClose={() => setSelectedEntry(null)}
      />
    </section>
  );
}

export default FixedDepositsSummarySection;