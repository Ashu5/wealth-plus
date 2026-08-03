type MatchingFundSuggestion = {
  label: string;
  schemeCode?: string;
  fundName?: string;
};

type MatchingFundsSuggestionsProps = {
  suggestions: MatchingFundSuggestion[];
  isLoading: boolean;
  error: string;
  onSelect: (suggestion: MatchingFundSuggestion) => void;
};

function MatchingFundsSuggestions({ suggestions, isLoading, error, onSelect }: MatchingFundsSuggestionsProps) {
  if (!isLoading && !error && suggestions.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        marginTop: '0.45rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.35rem',
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        padding: '0.5rem',
        background: '#fff',
        boxShadow: '0 4px 10px rgba(0, 0, 0, 0.06)',
      }}
    >
      {isLoading && <p style={{ margin: 0, fontSize: '0.9rem', color: '#6b7280' }}>Searching matching funds...</p>}
      {error && <p style={{ margin: 0, fontSize: '0.9rem', color: '#dc2626' }}>{error}</p>}
      {!isLoading && !error && suggestions.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {suggestions.map((suggestion) => (
            <li key={`${suggestion.label}-${suggestion.schemeCode || 'no-code'}`}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => onSelect(suggestion)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '0.55rem 0.7rem',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  background: '#f9fafb',
                  cursor: 'pointer',
                  color: '#111827',
                }}
              >
                {suggestion.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MatchingFundsSuggestions;
