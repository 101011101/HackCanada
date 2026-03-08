import { useNavigate } from 'react-router-dom';

export default function DesktopTopbar() {
  const navigate = useNavigate();
  return (
    <div className="d-topbar">
      <div className="d-topbar-logo">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <circle cx="10" cy="10" r="4"/>
          <path d="M10 2C10 2 6 5 6 10s4 8 4 8"/>
          <path d="M10 2c0 0 4 3 4 8s-4 8-4 8"/>
          <line x1="2" y1="10" x2="18" y2="10"/>
        </svg>
        <span className="d-topbar-name">MyCelium</span>
        <span className="d-topbar-dot"></span>
      </div>
      <div className="d-topbar-actions">
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/dashboard')} type="button">My Farm</button>
        <button className="btn btn--ghost btn--sm" onClick={() => navigate('/wallet')} type="button">My Food</button>
        <button className="btn btn--ghost btn--icon btn--sm" style={{ marginLeft: 8, background: 'rgba(255,255,255,0.08)' }} type="button" aria-label="Menu">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <line x1="3" y1="6" x2="17" y2="6"/>
            <line x1="3" y1="10" x2="17" y2="10"/>
            <line x1="3" y1="14" x2="17" y2="14"/>
          </svg>
        </button>
        <button className="btn btn--ghost btn--icon btn--sm" style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} type="button" aria-label="Profile">
          <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="16" height="16">
            <circle cx="10" cy="7" r="3"/>
            <path d="M4 17c0-3.3 2.7-6 6-6s6 2.7 6 6"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
