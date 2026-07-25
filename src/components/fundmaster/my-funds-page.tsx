import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import { getUserFunds, updateFund } from '../../services/fund-service';
import './my-funds-page.css';

type FundRecord = {
  id: string;
  fundName: string;
  fundCode: string;
  fundType: string;
  fundAmount: number;
  folioNumber: string;
  currency: string;
  platform: string;
  createdDate: string;
  userName: string;
};

type FundFormState = {
  fundName: string;
  fundCode: string;
  fundType: string;
  fundAmount: string;
  folioNumber: string;
  currency: string;
  platform: string;
};

const emptyForm = (record: FundRecord): FundFormState => ({
  fundName: record.fundName,
  fundCode: record.fundCode,
  fundType: record.fundType,
  fundAmount: String(record.fundAmount),
  folioNumber: record.folioNumber,
  currency: record.currency,
  platform: record.platform,
});

const normalizeFunds = (payload: unknown): FundRecord[] => {
  const normalizeEntry = (entry: Record<string, unknown>, index: number): FundRecord => {
    const platformValue = entry.platform;
    const platformName = typeof platformValue === 'object' && platformValue !== null
      ? String((platformValue as Record<string, unknown>).platformName ?? (platformValue as Record<string, unknown>).platformCode ?? '')
      : String(platformValue ?? '');

    return {
      id: String(entry.id ?? entry.fundId ?? entry.fundCode ?? entry.fundName ?? String(index)),
      fundName: String(entry.fundName ?? ''),
      fundCode: String(entry.fundCode ?? entry.platformCode ?? ''),
      fundType: String(entry.fundType ?? ''),
      fundAmount: Number(entry.fundAmount ?? entry.amount ?? 0),
      folioNumber: String(entry.folioNumber ?? ''),
      currency: String(entry.currency ?? 'INR'),
      platform: platformName || String(entry.platformName ?? entry.platformCode ?? ''),
      createdDate: String(entry.createdDate ?? ''),
      userName: String(entry.userName ?? ''),
    };
  };

  if (Array.isArray(payload)) {
    return payload.map((item, index) => {
      if (item && typeof item === 'object') {
        return normalizeEntry(item as Record<string, unknown>, index);
      }

      return normalizeEntry({}, index);
    }).filter((fund) => fund.fundName);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidateArrays = [record.funds, record.data, record.items, record.result].filter(Array.isArray);
    const sourceArray = candidateArrays[0] as unknown[] | undefined;

    if (sourceArray) {
      return sourceArray.map((item, index) => {
        const entry = (item && typeof item === 'object' ? item as Record<string, unknown> : {}) as Record<string, unknown>;
        return normalizeEntry(entry, index);
      }).filter((fund) => fund.fundName);
    }
  }

  return [];
};

function MyFundsPage() {
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFund, setSelectedFund] = useState<FundRecord | null>(null);
  const [formState, setFormState] = useState<FundFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('wealth-plus-username')?.trim() || localStorage.getItem('wealth-plus-email')?.trim() || '';

    const loadFunds = async () => {
      if (!storedUser) {
        setFunds([]);
        setIsLoading(false);
        setError('No user profile found.');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await getUserFunds(storedUser);
        console.log('MyFunds payload:', response);
        setFunds(normalizeFunds(response));
      } catch (err) {
        console.error('Failed to load funds:', err);
        setError('Unable to load funds right now.');
      } finally {
        setIsLoading(false);
      }
    };

    void loadFunds();
  }, []);

  const columns = useMemo<TableColumn<FundRecord>[]>(() => [
    {
      name: 'Fund Name',
      selector: (row) => row.fundName,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Code',
      selector: (row) => row.fundCode,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Type',
      selector: (row) => row.fundType,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Amount',
      cell: (row) => `₹${row.fundAmount.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.fundAmount - b.fundAmount,
      grow: 1,
    },
    {
      name: 'Folio',
      selector: (row) => row.folioNumber,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Platform',
      selector: (row) => row.platform,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Action',
      cell: (row) => (
        <button type="button" className="fund-action-btn" onClick={() => openEditModal(row)}>
          Update
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      grow: 1,
    },
  ], []);

  const openEditModal = (fund: FundRecord) => {
    setSelectedFund(fund);
    setFormState(emptyForm(fund));
  };

  const handleFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormState((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFund || !formState) {
      return;
    }

    try {
      setIsSaving(true);
      await updateFund(selectedFund.id, {
        ...selectedFund,
        ...formState,
        fundAmount: Number(formState.fundAmount),
      });

      setFunds((prev) => prev.map((fund) => (fund.id === selectedFund.id ? {
        ...fund,
        ...selectedFund,
        ...formState,
        fundAmount: Number(formState.fundAmount),
      } : fund)));

      setSelectedFund(null);
      setFormState(null);
    } catch (err) {
      console.error('Failed to update fund:', err);
      setError('Unable to update fund right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const customStyles = {
    headCells: {
      style: {
        backgroundColor: '#f8fafc',
        color: '#0f172a',
        fontWeight: 600,
        padding: '12px 14px',
      },
    },
    cells: {
      style: {
        padding: '10px 14px',
      },
    },
  };

  return (
    <main className="my-funds-page">
      <section className="my-funds-card">
        <div className="my-funds-header">
          <div>
            <p className="eyebrow">My Funds</p>
            <h2>All funds added by you</h2>
          </div>
          <span className="pill">{funds.length} funds</span>
        </div>

        {isLoading ? (
          <div className="my-funds-state">Loading your funds…</div>
        ) : error ? (
          <div className="my-funds-state">{error}</div>
        ) : (
          <div className="table-wrapper">
            <DataTable
              columns={columns}
              data={funds}
              pagination
              paginationPerPage={8}
              paginationRowsPerPageOptions={[8, 12, 16]}
              dense
              noDataComponent="No funds found."
              customStyles={customStyles}
            />
          </div>
        )}
      </section>

      {selectedFund && formState && (
        <div className="modal-backdrop" onClick={() => setSelectedFund(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Fund</h3>
              <button type="button" className="modal-close" onClick={() => setSelectedFund(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="fund-edit-form">
              <div className="field-group">
                <label htmlFor="fundName">Fund Name</label>
                <input id="fundName" name="fundName" value={formState.fundName} onChange={handleFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="fundCode">Fund Code</label>
                <input id="fundCode" name="fundCode" value={formState.fundCode} onChange={handleFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="fundType">Fund Type</label>
                <select id="fundType" name="fundType" value={formState.fundType} onChange={handleFormChange}>
                  <option value="Mid Cap">Mid Cap</option>
                  <option value="Large Cap">Large Cap</option>
                  <option value="ELSS">ELSS</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Flexi Cap">Flexi Cap</option>
                  <option value="Liquid Fund">Liquid Fund</option>
                  <option value="Debt Fund">Debt Fund</option>
                  <option value="Equity Fund">Equity Fund</option>
                  <option value="Commodities Fund">Commodities Fund</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="fundAmount">Amount</label>
                <input id="fundAmount" name="fundAmount" type="number" value={formState.fundAmount} onChange={handleFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="folioNumber">Folio Number</label>
                <input id="folioNumber" name="folioNumber" value={formState.folioNumber} onChange={handleFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="currency">Currency</label>
                <select id="currency" name="currency" value={formState.currency} onChange={handleFormChange}>
                  <option value="INR">INR</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>

              <div className="field-group">
                <label htmlFor="platform">Platform</label>
                <select id="platform" name="platform" value={formState.platform} onChange={handleFormChange}>
                  <option value="Groww">Groww</option>
                  <option value="Coin">Coin</option>
                  <option value="Smallcase">Smallcase</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setSelectedFund(null)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isSaving}>
                  {isSaving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

export default MyFundsPage;
