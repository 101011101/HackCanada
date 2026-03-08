import BottomSheet from '../shared/BottomSheet';

interface MenuSheetProps {
  open: boolean;
  onClose: () => void;
  onCropSuggestions: () => void;
  onRequestAssistance: () => void;
  onRestartCycle: () => void;
  onProfile: () => void;
  onReportProblem: () => void;
}

const ChevronRight = () => (
  <svg className="menu-arrow" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
    <polyline points="6 4 10 8 6 12" />
  </svg>
);

export default function MenuSheet({
  open,
  onClose,
  onCropSuggestions,
  onRequestAssistance,
  onRestartCycle,
  onProfile,
  onReportProblem,
}: MenuSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="More options">
      {/* Crop suggestions */}
      <div className="menu-item" role="button" tabIndex={0} onClick={onCropSuggestions} onKeyDown={(e) => { if (e.key === 'Enter') onCropSuggestions(); }}>
        <div className="menu-icon" style={{ background: 'var(--accent-bg)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--accent)" strokeWidth="1.5" width="18" height="18">
            <path d="M8 2v4M8 10v4M4 6H2M14 6h-2M5.2 5.2 3.8 3.8M12.2 12.2l-1.4-1.4M10.8 5.2l1.4-1.4M5.2 10.8 3.8 12.2" />
            <circle cx="8" cy="8" r="2.5" />
          </svg>
        </div>
        <div className="menu-text">
          <div className="menu-title">Crop suggestions</div>
          <div className="menu-sub">Get AI crop recommendations for your plot</div>
        </div>
        <ChevronRight />
      </div>

      {/* Request assistance */}
      <div className="menu-item" role="button" tabIndex={0} onClick={onRequestAssistance} onKeyDown={(e) => { if (e.key === 'Enter') onRequestAssistance(); }}>
        <div className="menu-icon" style={{ background: 'rgba(91,141,239,0.12)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--info)" strokeWidth="1.5" width="18" height="18">
            <path d="M8 2a6 6 0 1 0 0 12A6 6 0 0 0 8 2Z" />
            <line x1="8" y1="7" x2="8" y2="11" />
            <circle cx="8" cy="5.5" r="0.6" fill="var(--info)" />
          </svg>
        </div>
        <div className="menu-text">
          <div className="menu-title">Request further assistance</div>
          <div className="menu-sub">Message your hub coordinator</div>
        </div>
        <ChevronRight />
      </div>

      {/* Restart cycle */}
      <div className="menu-item" role="button" tabIndex={0} onClick={onRestartCycle} onKeyDown={(e) => { if (e.key === 'Enter') onRestartCycle(); }}>
        <div className="menu-icon" style={{ background: 'rgba(91,141,239,0.12)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--info)" strokeWidth="1.5" width="18" height="18">
            <path d="M2 8a6 6 0 0 1 11.3-2.8" />
            <polyline points="14 2 14 6 10 6" />
            <path d="M14 8a6 6 0 0 1-11.3 2.8" />
            <polyline points="2 14 2 10 6 10" />
          </svg>
        </div>
        <div className="menu-text">
          <div className="menu-title">Restart current cycle</div>
          <div className="menu-sub">Request a reset for your active crop</div>
        </div>
        <ChevronRight />
      </div>

      {/* Profile & settings */}
      <div className="menu-item" role="button" tabIndex={0} onClick={onProfile} onKeyDown={(e) => { if (e.key === 'Enter') onProfile(); }}>
        <div className="menu-icon" style={{ background: 'rgba(76,175,80,0.1)' }}>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--success)" strokeWidth="1.5" width="18" height="18">
            <circle cx="8" cy="6" r="3" />
            <path d="M2 14c0-3.3 2.7-6 6-6s6 2.7 6 6" />
          </svg>
        </div>
        <div className="menu-text">
          <div className="menu-title">Profile &amp; settings</div>
          <div className="menu-sub">Account, notifications, preferences</div>
        </div>
        <ChevronRight />
      </div>

      {/* Report a problem */}
      <div className="menu-item menu-item--danger" role="button" tabIndex={0} onClick={onReportProblem} onKeyDown={(e) => { if (e.key === 'Enter') onReportProblem(); }}>
        <div className="menu-icon">
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--error)" strokeWidth="1.5" width="18" height="18">
            <path d="M8 2L14 13H2L8 2Z" />
            <line x1="8" y1="7" x2="8" y2="10" />
            <circle cx="8" cy="12" r="0.5" fill="var(--error)" />
          </svg>
        </div>
        <div className="menu-text">
          <div className="menu-title">Report a problem</div>
          <div className="menu-sub">Something is wrong with my farm or crops</div>
        </div>
        <svg className="menu-arrow" viewBox="0 0 16 16" fill="none" stroke="var(--error)" strokeWidth="2" width="14" height="14">
          <polyline points="6 4 10 8 6 12" />
        </svg>
      </div>
    </BottomSheet>
  );
}
