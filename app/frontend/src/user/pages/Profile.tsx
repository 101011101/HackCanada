import { useNavigate } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';
import { useAsync } from '../hooks/useAsync';
import { getNode, getBalance } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const { farmId, leave } = useFarm();

  const nodeState = useAsync(() => getNode(farmId!), [farmId]);
  const balanceState = useAsync(() => getBalance(farmId!), [farmId]);

  const bundle = nodeState.data?.[0] ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="m-topbar">
        <button
          className="btn btn--ghost btn--icon btn--sm"
          onClick={() => navigate(-1)}
          type="button"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="10 4 6 8 10 12" />
          </svg>
        </button>
        <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15, color: 'var(--inv)' }}>
          Profile
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div className="m-section">
        <span className="m-section-title">Your farm</span>
        <div className="m-content" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nodeState.loading && (
            <div style={{ color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
          )}
          {bundle && (
            <>
              <div>
                <div className="overline" style={{ marginBottom: 4 }}>Farm name</div>
                <div style={{ fontFamily: 'var(--fd)', fontSize: 20, fontWeight: 700 }}>{bundle.farm_name}</div>
              </div>
              <div>
                <div className="overline" style={{ marginBottom: 4 }}>Current crop</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{bundle.crop_name}</div>
              </div>
              {bundle.joined_at && (
                <div>
                  <div className="overline" style={{ marginBottom: 4 }}>Member since</div>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>
                    {new Date(bundle.joined_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </div>
                </div>
              )}
              <div>
                <div className="overline" style={{ marginBottom: 4 }}>Cycles completed</div>
                <div style={{ fontSize: 14, color: 'var(--ink-2)' }}>{bundle.cycle_number ?? 1}</div>
              </div>
            </>
          )}
        </div>
      </div>

      {balanceState.data && (
        <div className="m-section">
          <span className="m-section-title">Balance</span>
          <div className="m-content" style={{ padding: '16px 20px' }}>
            <div style={{ fontFamily: 'var(--fd)', fontSize: 28, fontWeight: 700 }}>
              {balanceState.data.currency_balance} HC
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>Hub Currency</div>
          </div>
        </div>
      )}

      <div className="m-section">
        <span className="m-section-title">Account</span>
        <div className="m-content" style={{ padding: '16px 20px' }}>
          <button
            className="btn btn--secondary btn--full"
            style={{ color: 'var(--error)', borderColor: 'var(--error)' }}
            onClick={() => {
              if (window.confirm('Leave the network? This will clear all local data.')) {
                leave();
                navigate('/');
              }
            }}
            type="button"
          >
            Leave network
          </button>
        </div>
      </div>
    </div>
  );
}
