import { useId } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import type { PortfolioEntry } from '../dashboard/types';

type PortfolioSummarySectionProps = {
  entries: PortfolioEntry[];
  monthFilter: string;
  setMonthFilter: (value: string) => void;
  fundTypeFilter: string;
  setFundTypeFilter: (value: string) => void;
  monthOptions: string[];
  fundTypeOptions: string[];
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

function PortfolioSummarySection({
  entries,
  monthFilter,
  setMonthFilter,
  fundTypeFilter,
  setFundTypeFilter,
  monthOptions,
  fundTypeOptions,
}: PortfolioSummarySectionProps) {
  const columns: TableColumn<PortfolioEntry>[] = [
    {
      name: 'Month',
      selector: (row) => row.month,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Investment',
      selector: (row) => row.name,
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
      cell: (row) => <span className={`status ${row.status.toLowerCase()}`}>{row.status}</span>,
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
      </div>

      <FilterBar
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        secondaryFilter={fundTypeFilter}
        setSecondaryFilter={setFundTypeFilter}
        monthOptions={monthOptions}
        secondaryOptions={fundTypeOptions}
        secondaryLabel="Fund Type"
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
          noDataComponent="No portfolio entries found for the selected filters."
          customStyles={customStyles}
        />
      </div>
    </section>
  );
}

export default PortfolioSummarySection;