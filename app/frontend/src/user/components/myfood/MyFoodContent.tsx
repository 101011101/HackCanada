/**
 * My Food tab content — hub balance, groceries & donations (request flow).
 * Rendered inside the Dashboard when the user selects the My Food tab.
 */
import { useFarm } from '../../store/FarmContext';
import { useAsync } from '../../hooks/useAsync';
import { getBalance } from '../../services/api';

export default function MyFoodContent() {
  const { farmId } = useFarm();
  const balanceState = useAsync(
    () => (farmId != null ? getBalance(farmId) : Promise.resolve(null)),
    [farmId]
  );
  const balance = balanceState.data;
  const loading = balanceState.loading;

  if (farmId == null) {
    return (
      <div className="m-section">
        <div style={{ padding: '20px 24px', color: 'var(--ink-3)', fontSize: 14 }}>
          No farm selected. Set up or join a farm to use My Food.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="m-hero">
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'rgba(255,255,255,0.7)',
              textTransform: 'uppercase',
            }}
          >
            Hub Currency
          </span>
          <span
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 32,
              fontWeight: 700,
              color: 'var(--inv)',
              letterSpacing: '-0.02em',
            }}
          >
            {loading ? '…' : balance != null ? Number(balance.currency_balance).toFixed(2) : '—'} HC
          </span>
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>Your balance</span>
        </div>
      </div>

      <div className="m-section">
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn--accent">
            My Groceries
          </button>
          <button type="button" className="btn btn--accent">
            Donations
          </button>
        </div>
      </div>

      <div className="m-section">
        <span className="m-section-title">My requests</span>
        <div className="m-content">
          <p style={{ color: 'var(--ink-3)', fontSize: 13, padding: '12px 20px' }}>
            No requests yet. Use My Groceries or Donations to create one.
          </p>
        </div>
      </div>
    </>
  );
}
