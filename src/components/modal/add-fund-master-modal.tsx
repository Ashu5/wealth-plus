import { useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent } from 'react';
import '../fundmaster/my-funds-page.css';
import MatchingFundsSuggestions from './matching-funds-suggestions';
import { addFundV2, generateFundCodeV2, getMatchingFunds } from '../../services/fund-service';

type AddFundMasterModalProps = {
  isOpen?: boolean;
  onClose?: () => void;
  mode?: 'modal' | 'inline';
  title?: string;
  onSuccess?: () => void;
};

type MatchingFundSuggestion = {
  label: string;
  schemeCode?: string;
  fundName?: string;
};

const storedUser = localStorage.getItem('wealth-plus-username')?.trim() || localStorage.getItem('wealth-plus-email')?.trim();

// Unwraps common API envelope shapes (arrays, Spring Page.content, or a single fund object) into a flat array.
function extractSuggestionsArray(responseData: unknown): unknown[] {
  if (Array.isArray(responseData)) {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    const candidate = responseData as Record<string, unknown>;
    const wrapperKeys = ['funds', 'matchingFunds', 'data', 'content', 'items', 'results', 'fundNames'];

    for (const key of wrapperKeys) {
      if (Array.isArray(candidate[key])) {
        return candidate[key] as unknown[];
      }
    }

    return [responseData];
  }

  return responseData ? [responseData] : [];
}

function AddFundMasterModal({ isOpen = true, onClose, mode = 'modal', title = 'Fund Master', onSuccess }: AddFundMasterModalProps) {
  const [fundMasterData, setFundMasterData] = useState({
    fundName: '',
    fundCode: '',
    fundType: 'Mid Cap',
    fundAmount: '',
    folioNumber: '',
    currency: 'INR',
    platform: 'Groww',
    userName: storedUser || '',
    userEmail: localStorage.getItem('wealth-plus-email')?.trim() || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [codeError, setCodeError] = useState('');
  const [matchingFunds, setMatchingFunds] = useState<MatchingFundSuggestion[]>([]);
  const [matchingFundsError, setMatchingFundsError] = useState('');
  const [isMatchingFundsLoading, setIsMatchingFundsLoading] = useState(false);
  const [generatedFor, setGeneratedFor] = useState({ fundName: '', fundType: '', folioPrefix: '' });
  const matchingFundsRequestIdRef = useRef(0);

  const { fundName, fundType, folioNumber } = fundMasterData;

  const generateFundCodeForCurrentInput = async (trimmedFundName = fundName.trim()) => {
    if (!trimmedFundName) {
      setFundMasterData((prev) => ({ ...prev, fundCode: '' }));
      setGeneratedFor({ fundName: '', fundType: '', folioPrefix: '' });
      setCodeError('');
      return;
    }

    const currentFolioPrefix = folioNumber.slice(0, 3);

    if (
      generatedFor.fundName === trimmedFundName
      && generatedFor.fundType === fundType
      && generatedFor.folioPrefix === currentFolioPrefix
      && fundMasterData.fundCode
    ) {
      return;
    }

    setIsCodeLoading(true);
    setCodeError('');
    setFundMasterData((prev) => ({ ...prev, fundCode: '' }));

    try {
      const response = await generateFundCodeV2(trimmedFundName, fundType, currentFolioPrefix);

      const responseData = response && typeof response === 'object' && 'data' in response
        ? (response as { data?: unknown }).data
        : response;

      const generatedCode = typeof responseData === 'string'
        ? responseData
        : responseData?.fundCode
        || responseData?.code
        || responseData?.result
        || (typeof responseData?.data === 'string' ? responseData.data : '')
        || '';

      if (!generatedCode) {
        console.warn('generateFundCode returned no fund code:', responseData);
        setCodeError('No fund code returned from API.');
      } else {
        setCodeError('');
      }

      setFundMasterData((prev) => ({ ...prev, fundCode: generatedCode }));
      setGeneratedFor({ fundName: trimmedFundName, fundType, folioPrefix: currentFolioPrefix });
    } catch {
      setFundMasterData((prev) => ({ ...prev, fundCode: '' }));
      setCodeError('Unable to generate fund code.');
    } finally {
      setIsCodeLoading(false);
    }
  };

  const handleFundNameBlur = () => {
    void lookupMatchingFunds(fundName.trim());
    void generateFundCodeForCurrentInput();
  };

  const handleFundNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      void lookupMatchingFunds(fundName.trim());
    }
  };

  const handleMatchingFundsSelect = (selectedSuggestion: MatchingFundSuggestion) => {
    const selectedCode = selectedSuggestion.schemeCode || '';

    setFundMasterData((prev) => ({
      ...prev,
      fundName: selectedSuggestion.fundName || selectedSuggestion.label,
      fundCode: selectedCode,
    }));
    setMatchingFunds([]);
    setMatchingFundsError('');
    setCodeError('');
    setGeneratedFor({ fundName: '', fundType: '', folioPrefix: '' });
  };

  const lookupMatchingFunds = async (query: string) => {
    const trimmedQuery = query.trim();

    if (!trimmedQuery || trimmedQuery.length < 2) {
      setMatchingFunds([]);
      setMatchingFundsError('');
      setIsMatchingFundsLoading(false);
      return;
    }

    const requestId = matchingFundsRequestIdRef.current + 1;
    matchingFundsRequestIdRef.current = requestId;
    setIsMatchingFundsLoading(true);
    setMatchingFundsError('');

    try {
      const response = await getMatchingFunds(trimmedQuery);
      const responseData = response && typeof response === 'object' && 'data' in response
        ? (response as { data?: unknown }).data
        : response;

      const suggestionsArray = extractSuggestionsArray(responseData);

      const normalizedSuggestions = suggestionsArray
        .map((item: unknown) => {
          if (typeof item === 'string') {
            return { label: item, schemeCode: undefined, fundName: item } satisfies MatchingFundSuggestion;
          }

          if (typeof item === 'object' && item !== null) {
            const candidate = item as {
              fundName?: unknown;
              name?: unknown;
              value?: unknown;
              schemeName?: unknown;
              schemeCode?: unknown;
              code?: unknown;
              fundCode?: unknown;
            };

            const label = typeof candidate.fundName === 'string'
              ? candidate.fundName
              : typeof candidate.schemeName === 'string'
                ? candidate.schemeName
                : typeof candidate.name === 'string'
                  ? candidate.name
                  : typeof candidate.value === 'string'
                    ? candidate.value
                    : '';

            const schemeCode = typeof candidate.schemeCode === 'string'
              ? candidate.schemeCode
              : typeof candidate.code === 'string'
                ? candidate.code
                : typeof candidate.fundCode === 'string'
                  ? candidate.fundCode
                  : undefined;

            return { label, schemeCode, fundName: label } satisfies MatchingFundSuggestion;
          }

          return { label: '', schemeCode: undefined, fundName: '' } satisfies MatchingFundSuggestion;
        })
        .filter((item: MatchingFundSuggestion) => Boolean(item.label));

      if (normalizedSuggestions.length === 0 && suggestionsArray.length > 0) {
        console.warn('Unable to extract fund names from matching funds response:', responseData);
      }

      if (matchingFundsRequestIdRef.current !== requestId) {
        return;
      }

      setMatchingFunds(normalizedSuggestions);
      setMatchingFundsError('');
    } catch {
      if (matchingFundsRequestIdRef.current === requestId) {
        setMatchingFunds([]);
        setMatchingFundsError('Unable to load suggested funds.');
      }
    } finally {
      if (matchingFundsRequestIdRef.current === requestId) {
        setIsMatchingFundsLoading(false);
      }
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const shouldClearCode = name === 'fundName';

    setFundMasterData((prev) => ({
      ...prev,
      [name]: value,
      ...(shouldClearCode ? { fundCode: '' } : {}),
    }));

    if (name === 'fundName') {
      setGeneratedFor({ fundName: '', fundType: '', folioPrefix: '' });
      setCodeError('');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const fundPayload = {
      fundName: fundMasterData.fundName,
      fundType: fundMasterData.fundType,
      folioNumber: fundMasterData.folioNumber,
      fundCode: fundMasterData.fundCode,
      fundAmount: fundMasterData.fundAmount,
      currency: fundMasterData.currency,
      platform: {
        platformCode: fundMasterData.platform === 'Groww' ? '01' : fundMasterData.platform === 'Coin' ? '02' : '03',
        platformName: fundMasterData.platform,
        platformDescription: `${fundMasterData.platform} Platform`,
      },
      userName: fundMasterData.userName,
      userEmail: fundMasterData.userEmail,
    };

    try {
      setIsSubmitting(true);
      await addFundV2(fundPayload);
      setSuccessMessage('Fund Added successfully.');
      window.setTimeout(() => {
        setSuccessMessage('');
        if (onSuccess) {
          onSuccess();
        } else {
          onClose?.();
        }
      }, 1200);
    } catch (error) {
      console.error('Failed to add fund master:', error);
      window.alert('Unable to add fund right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (mode === 'inline') {
    return (
      <section className="add-fund-inline-card">
        <div className="inline-form-header">
          <div>
            <p className="eyebrow">Add New Fund</p>
            <h3>{title}</h3>
          </div>
          {onClose && (
            <button type="button" className="modal-close" onClick={onClose} aria-label="Close add fund form">
              ×
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="fund-edit-form">
          <div className="field-group">
            <label htmlFor="fundName">Fund Name</label>
            <input
              id="fundName"
              name="fundName"
              type="text"
              value={fundMasterData.fundName}
              onChange={handleChange}
              onBlur={handleFundNameBlur}
              onKeyDown={handleFundNameKeyDown}
              placeholder="Fund Name"
              required
            />
            <MatchingFundsSuggestions
              suggestions={matchingFunds}
              isLoading={isMatchingFundsLoading}
              error={matchingFundsError}
              onSelect={handleMatchingFundsSelect}
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundCode">Fund Code</label>
            <input
              id="fundCode"
              name="fundCode"
              type="text"
              value={fundMasterData.fundCode}
              placeholder={isCodeLoading ? 'Generating fund code...' : 'Auto-generated fund code'}
              readOnly
              required
              className="readonly-input"
              style={{ backgroundColor: '#f5f5f5', color: '#555' }}
            />
            {codeError && <p className="field-error">{codeError}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="fundType">Fund Type</label>
            <select id="fundType" name="fundType" value={fundMasterData.fundType} onChange={handleChange}>
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
            <label htmlFor="folioNumber">Folio Number</label>
            <input
              id="folioNumber"
              name="folioNumber"
              type="text"
              value={fundMasterData.folioNumber}
              onChange={handleChange}
              placeholder="002"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundAmount">SIP Amount</label>
            <input
              id="fundAmount"
              name="fundAmount"
              type="number"
              value={fundMasterData.fundAmount}
              onChange={handleChange}
              placeholder="1222"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="currency">Currency</label>
            <select id="currency" name="currency" value={fundMasterData.currency} onChange={handleChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" value={fundMasterData.platform} onChange={handleChange}>
              <option value="Groww">Groww</option>
              <option value="Coin">Coin</option>
              <option value="Smallcase">Smallcase</option>
            </select>
          </div>

          {successMessage && (
            <div className="success-message" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={() => onClose?.()}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Master Fund'}
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-backdrop" onClick={() => onClose?.()}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title-group">
            <button type="button" className="modal-back" onClick={() => onClose?.()} aria-label="Go back">
              ←
            </button>
            <h3>{title}</h3>
          </div>
          <button type="button" className="modal-close" onClick={() => onClose?.()}>
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field-group">
            <label htmlFor="fundName">Fund Name</label>
            <input
              id="fundName"
              name="fundName"
              type="text"
              value={fundMasterData.fundName}
              onChange={handleChange}
              onBlur={handleFundNameBlur}
              onKeyDown={handleFundNameKeyDown}
              placeholder="Fund Name"
              required
            />
            <MatchingFundsSuggestions
              suggestions={matchingFunds}
              isLoading={isMatchingFundsLoading}
              error={matchingFundsError}
              onSelect={handleMatchingFundsSelect}
            />
          </div>

          <div className="field-group">
            <label htmlFor="fundCode">Fund Code</label>
            <input
              id="fundCode"
              name="fundCode"
              type="text"
              value={fundMasterData.fundCode}
              placeholder={isCodeLoading ? 'Generating fund code...' : 'Auto-generated fund code'}
              readOnly
              required
              className="readonly-input"
              style={{ backgroundColor: '#f5f5f5', color: '#555' }}
            />
            {codeError && <p className="field-error">{codeError}</p>}
          </div>

          <div className="field-group">
            <label htmlFor="fundType">Fund Type</label>
            <select id="fundType" name="fundType" value={fundMasterData.fundType} onChange={handleChange}>
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
            <label htmlFor="fundAmount">Fund Amount</label>
            <input
              id="fundAmount"
              name="fundAmount"
              type="number"
              value={fundMasterData.fundAmount}
              onChange={handleChange}
              placeholder="1222"
              required
            />
          </div>


          <div className="field-group">
            <label htmlFor="folioNumber">Folio Number</label>
            <input
              id="folioNumber"
              name="folioNumber"
              type="text"
              value={fundMasterData.folioNumber}
              onChange={handleChange}
              placeholder="002"
              required
            />
          </div>

          <div className="field-group">
            <label htmlFor="currency">Currency</label>
            <select id="currency" name="currency" value={fundMasterData.currency} onChange={handleChange}>
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>

          <div className="field-group">
            <label htmlFor="platform">Platform</label>
            <select id="platform" name="platform" value={fundMasterData.platform} onChange={handleChange}>
              <option value="Groww">Groww</option>
              <option value="Coin">Coin</option>
              <option value="Smallcase">Smallcase</option>
            </select>
          </div>

          {successMessage && (
            <div className="success-message" role="status" aria-live="polite">
              {successMessage}
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="cancel-btn" onClick={() => onClose?.()}>
              Cancel
            </button>
            <button type="submit" className="save-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Add Master Fund'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddFundMasterModal;
