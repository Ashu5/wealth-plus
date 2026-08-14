import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import DataTable, { type TableColumn } from 'react-data-table-component';
import {  getUserFundsV2, updateFundV2 } from '../../services/fund-service';
import { fetchFixedDeposits, updateFixedDeposit, type UpdateFixedDepositPayload } from '../../services/deposit-service';
import AddFundMasterModal from '../modal/add-fund-master-modal';
import './my-funds-page.css';

const platformDetailsByName: Record<string, { platformCode: string; platformDescription: string }> = {
  Groww: {
    platformCode: 'GW-01',
    platformDescription: 'Groww',
  },
  Coin: {
    platformCode: 'GN-01',
    platformDescription: 'Coin by Zerodha',
  },
  Smallcase: {
    platformCode: 'SC-01',
    platformDescription: 'Smallcase',
  },
};

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

type FixedDepositRecord = {
  id: string;
  fdNumber: string;
  userName: string;
  userEmail: string;
  bankName: string;
  amountFixed: number;
  maturityAmount: number;
  maturityDate: string;
  interestRate: number;
  tenure: string;
  active: boolean;
};

type FixedDepositFormState = {
  amountFixed: string;
  maturityAmount: string;
  maturityDate: string;
  interestRate: string;
  tenure: string;
  bankName: string;
  active: 'true' | 'false';
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

const toBoolean = (value: unknown, fallback = true): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();

    if (normalized === 'true' || normalized === '1') {
      return true;
    }

    if (normalized === 'false' || normalized === '0') {
      return false;
    }
  }

  return fallback;
};

const toDateTimeLocalValue = (value: string): string => {
  if (!value) {
    return '';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  const hours = String(parsed.getHours()).padStart(2, '0');
  const minutes = String(parsed.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

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

const normalizeFixedDeposits = (payload: unknown): FixedDepositRecord[] => {
  const normalizeEntry = (entry: Record<string, unknown>, index: number): FixedDepositRecord => {
    const rawId = entry.fdId ?? entry.id ?? entry.fdNumber ?? `${index}`;
    const fdNumber = String(entry.fdNumber ?? entry.fdId ?? "");
    const storedUserName = localStorage.getItem('wealth-plus-username')?.trim() || '';
    const storedUserEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';

    return {
      id: String(entry.id ?? rawId),
      fdNumber: fdNumber,
      userName: String(entry.userName ?? entry.username ?? storedUserName),
      userEmail: String(entry.userEmail ?? storedUserEmail),
      bankName: String(entry.bankName ?? entry.bank ?? ''),
      amountFixed: Number(entry.amountFixed ?? entry.amount ?? 0),
      maturityAmount: Number(entry.maturityAmount ?? 0),
      maturityDate: String(entry.maturityDate ?? ''),
      interestRate: Number(entry.interestRate ?? entry.rate ?? 0),
      tenure: String(entry.tenure ?? ''),
      active: toBoolean(entry.active ?? entry.isActive, true),
    };
  };

  if (Array.isArray(payload)) {
    return payload
      .map((item, index) => normalizeEntry(item && typeof item === 'object' ? (item as Record<string, unknown>) : {}, index))
      .filter((fd) => fd.fdNumber);
  }

  if (payload && typeof payload === 'object') {
    const record = payload as Record<string, unknown>;
    const candidateArrays = [record.fixedDeposits, record.data, record.items, record.result].filter(Array.isArray);
    const sourceArray = candidateArrays[0] as unknown[] | undefined;

    if (sourceArray) {
      return sourceArray
        .map((item, index) => normalizeEntry(item && typeof item === 'object' ? (item as Record<string, unknown>) : {}, index))
        .filter((fd) => fd.fdNumber);
    }
  }

  return [];
};

const emptyFixedDepositForm = (record: FixedDepositRecord): FixedDepositFormState => ({
  amountFixed: String(record.amountFixed),
  maturityAmount: String(record.maturityAmount),
  maturityDate: toDateTimeLocalValue(record.maturityDate),
  interestRate: String(record.interestRate),
  tenure: record.tenure,
  bankName: record.bankName,
  active: record.active ? 'true' : 'false',
});

function MyFundsPage() {
  const [funds, setFunds] = useState<FundRecord[]>([]);
  const [isFundsLoading, setIsFundsLoading] = useState(true);
  const [fundError, setFundError] = useState<string | null>(null);
  const [selectedFund, setSelectedFund] = useState<FundRecord | null>(null);
  const [formState, setFormState] = useState<FundFormState | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isAddFundFormOpen, setIsAddFundFormOpen] = useState(false);
  const [fixedDeposits, setFixedDeposits] = useState<FixedDepositRecord[]>([]);
  const [isFixedDepositsLoading, setIsFixedDepositsLoading] = useState(true);
  const [fixedDepositError, setFixedDepositError] = useState<string | null>(null);
  const [selectedFixedDeposit, setSelectedFixedDeposit] = useState<FixedDepositRecord | null>(null);
  const [fixedDepositFormState, setFixedDepositFormState] = useState<FixedDepositFormState | null>(null);
  const [isFixedDepositSaving, setIsFixedDepositSaving] = useState(false);

  const loadFunds = useCallback(async () => {
    const storedUser = localStorage.getItem('wealth-plus-username')?.trim() || localStorage.getItem('wealth-plus-email')?.trim() || '';
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
    if (!storedUser) {
      setFunds([]);
      setIsFundsLoading(false);
      setFundError('No user profile found.');
      return;
    }

    try {
      setIsFundsLoading(true);
      setFundError(null);
      const response = await getUserFundsV2(userEmail);
      setFunds(normalizeFunds(response));
    } catch (err) {
      console.error('Failed to load funds:', err);
      setFundError('Unable to load funds right now.');
    } finally {
      setIsFundsLoading(false);
    }
  }, []);

  const loadFixedDeposits = useCallback(async () => {
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';
    const userName = localStorage.getItem('wealth-plus-username')?.trim() || userEmail;

    if (!userName) {
      setFixedDeposits([]);
      setIsFixedDepositsLoading(false);
      setFixedDepositError('No user profile found.');
      return;
    }

    try {
      setIsFixedDepositsLoading(true);
      setFixedDepositError(null);
      const response = await fetchFixedDeposits(userEmail || userName);
      setFixedDeposits(normalizeFixedDeposits(response));
    } catch (err) {
      console.error('Failed to load fixed deposits:', err);
      setFixedDepositError('Unable to load fixed deposits right now.');
    } finally {
      setIsFixedDepositsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFunds();
    void loadFixedDeposits();
  }, [loadFunds, loadFixedDeposits]);

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
      name: 'SIP Amount',
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
      const selectedPlatform = platformDetailsByName[formState.platform] ?? {
        platformCode: formState.fundCode,
        platformDescription: formState.platform,
      };
      const userName = localStorage.getItem('wealth-plus-username')?.trim() || selectedFund.userName || '';
      const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || '';

      await updateFundV2(formState.fundCode, {
        fundName: formState.fundName,
        fundCode: formState.fundCode,
        fundType: formState.fundType,
        folioNumber: formState.folioNumber,
        fundAmount: formState.fundAmount,
        platform: {
          platformName: formState.platform,
          platformCode: selectedPlatform.platformCode,
          platformDescription: selectedPlatform.platformDescription,
        },
        currency: formState.currency,
        userName,
        userEmail,
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
      setFundError('Unable to update fund right now.');
    } finally {
      setIsSaving(false);
    }
  };

  const fixedDepositColumns = useMemo<TableColumn<FixedDepositRecord>[]>(() => [
    {
      name: 'FD#',
      selector: (row) => row.fdNumber,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Bank',
      selector: (row) => row.bankName,
      sortable: true,
      grow: 1,
    },
    {
      name: 'Amount Fixed',
      cell: (row) => `₹${row.amountFixed.toLocaleString()}`,
      sortable: true,
      sortFunction: (a, b) => a.amountFixed - b.amountFixed,
      grow: 1,
    },
    {
      name: 'Interest Rate',
      cell: (row) => `${row.interestRate}%`,
      sortable: true,
      sortFunction: (a, b) => a.interestRate - b.interestRate,
      grow: 1,
    },
    {
      name: 'Maturity Date',
      selector: (row) => row.maturityDate,
      sortable: true,
      grow: 2,
    },
    {
      name: 'Status',
      cell: (row) => (
        <span className={`fd-status-chip ${row.active ? 'active' : 'inactive'}`}>
          {row.active ? 'Active' : 'Inactive'}
        </span>
      ),
      grow: 1,
    },
    {
      name: 'Action',
      cell: (row) => (
        <button type="button" className="fund-action-btn" onClick={() => {
          setSelectedFixedDeposit(row);
          setFixedDepositFormState(emptyFixedDepositForm(row));
        }}>
          Update
        </button>
      ),
      ignoreRowClick: true,
      allowOverflow: true,
      button: true,
      grow: 1,
    },
  ], []);

  const handleFixedDepositFormChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFixedDepositFormState((prev) => (prev ? { ...prev, [name]: value } : prev));
  };

  const handleFixedDepositSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFixedDeposit || !fixedDepositFormState) {
      return;
    }

    const userName = localStorage.getItem('wealth-plus-username')?.trim() || selectedFixedDeposit.userName || '';
    const userEmail = localStorage.getItem('wealth-plus-email')?.trim() || selectedFixedDeposit.userEmail || '';

    const payload: UpdateFixedDepositPayload = {
      fdNumber: selectedFixedDeposit.fdNumber,
      userName,
      userEmail,
      amountFixed: fixedDepositFormState.amountFixed,
      maturityAmount: fixedDepositFormState.maturityAmount,
      maturityDate: fixedDepositFormState.maturityDate,
      interestRate: fixedDepositFormState.interestRate,
      tenure: fixedDepositFormState.tenure,
      bankName: fixedDepositFormState.bankName,
      active: fixedDepositFormState.active === 'true',
    };

    try {
      setIsFixedDepositSaving(true);
      await updateFixedDeposit(selectedFixedDeposit.fdNumber, payload);

      setFixedDeposits((prev) => prev.map((deposit) => (
        deposit.fdNumber === selectedFixedDeposit.fdNumber
          ? {
              ...deposit,
              userName: payload.userName,
              userEmail: payload.userEmail,
              amountFixed: Number(payload.amountFixed),
              maturityAmount: Number(payload.maturityAmount),
              maturityDate: payload.maturityDate,
              interestRate: Number(payload.interestRate),
              tenure: payload.tenure,
              bankName: payload.bankName,
              active: payload.active,
            }
          : deposit
      )));

      setSelectedFixedDeposit(null);
      setFixedDepositFormState(null);
    } catch (err) {
      console.error('Failed to update fixed deposit:', err);
      setFixedDepositError('Unable to update fixed deposit right now.');
    } finally {
      setIsFixedDepositSaving(false);
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
          </div>
          <div className="my-funds-actions">
            <button type="button" className="add-fund-btn" onClick={() => setIsAddFundFormOpen(true)}>
              Add Fund
            </button>
            <span className="pill">{funds.length} funds</span>
          </div>
        </div>

        {isAddFundFormOpen && (
          <div className="add-fund-form-shell">
            <AddFundMasterModal
              isOpen
              mode="inline"
              title="Add New Fund"
              onClose={() => setIsAddFundFormOpen(false)}
              onSuccess={() => {
                setIsAddFundFormOpen(false);
                void loadFunds();
              }}
            />
          </div>
        )}

        {isFundsLoading ? (
          <div className="my-funds-state">Loading your funds…</div>
        ) : fundError ? (
          <div className="my-funds-state">{fundError}</div>
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

      <section className="my-funds-card my-funds-card-secondary">
        <div className="my-funds-header">
          <div>
            <p className="eyebrow">My Fixed Deposits</p>
          </div>
          <div className="my-funds-actions">
            <span className="pill">{fixedDeposits.length} fixed deposits</span>
          </div>
        </div>

        {isFixedDepositsLoading ? (
          <div className="my-funds-state">Loading your fixed deposits...</div>
        ) : fixedDepositError ? (
          <div className="my-funds-state">{fixedDepositError}</div>
        ) : (
          <div className="table-wrapper">
            <DataTable
              columns={fixedDepositColumns}
              data={fixedDeposits}
              pagination
              paginationPerPage={8}
              paginationRowsPerPageOptions={[8, 12, 16]}
              dense
              noDataComponent="No fixed deposits found."
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

      {selectedFixedDeposit && fixedDepositFormState && (
        <div className="modal-backdrop" onClick={() => setSelectedFixedDeposit(null)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Fixed Deposit</h3>
              <button type="button" className="modal-close" onClick={() => setSelectedFixedDeposit(null)}>
                ×
              </button>
            </div>

            <form onSubmit={handleFixedDepositSubmit} className="fund-edit-form">
              <div className="field-group">
                <label htmlFor="fdId">FD Id</label>
                <input id="fdId" value={selectedFixedDeposit.fdNumber} disabled />
              </div>

              <div className="field-group">
                <label htmlFor="bankName">Bank Name</label>
                <input id="bankName" name="bankName" value={fixedDepositFormState.bankName} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="amountFixed">Amount Fixed</label>
                <input id="amountFixed" name="amountFixed" type="number" value={fixedDepositFormState.amountFixed} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="maturityAmount">Maturity Amount</label>
                <input id="maturityAmount" name="maturityAmount" type="number" value={fixedDepositFormState.maturityAmount} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="interestRate">Interest Rate</label>
                <input id="interestRate" name="interestRate" type="number" step="0.01" value={fixedDepositFormState.interestRate} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="tenure">Tenure</label>
                <input id="tenure" name="tenure" value={fixedDepositFormState.tenure} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="maturityDate">Maturity Date</label>
                <input id="maturityDate" name="maturityDate" type="datetime-local" value={fixedDepositFormState.maturityDate} onChange={handleFixedDepositFormChange} required />
              </div>

              <div className="field-group">
                <label htmlFor="active">Status</label>
                <select id="active" name="active" value={fixedDepositFormState.active} onChange={handleFixedDepositFormChange}>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={() => setSelectedFixedDeposit(null)}>
                  Cancel
                </button>
                <button type="submit" className="save-btn" disabled={isFixedDepositSaving}>
                  {isFixedDepositSaving ? 'Saving...' : 'Save Changes'}
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
