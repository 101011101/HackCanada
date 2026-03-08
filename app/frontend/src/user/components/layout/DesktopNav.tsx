interface DesktopNavProps {
  activeView: 'tasks' | 'zone';
  onSelect: (view: 'tasks' | 'zone') => void;
  onOpenCropPicker: () => void;
}

export default function DesktopNav({ activeView, onSelect, onOpenCropPicker }: DesktopNavProps) {
  return (
    <div className="d-nav">
      <button
        className={`d-nav-item${activeView === 'tasks' ? ' d-nav-item--on' : ''}`}
        onClick={() => onSelect('tasks')}
        type="button"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <rect x="2" y="3" width="12" height="2" rx="0.5"/>
          <rect x="2" y="7" width="12" height="2" rx="0.5"/>
          <rect x="2" y="11" width="8" height="2" rx="0.5"/>
        </svg>
        Tasks
      </button>
      <button
        className={`d-nav-item${activeView === 'zone' ? ' d-nav-item--on' : ''}`}
        onClick={() => onSelect('zone')}
        type="button"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <path d="M8 2C8 2 4 6 4 11a4 4 0 0 0 8 0C12 6 8 2 8 2Z"/>
        </svg>
        Zone Data
      </button>
      <button
        id="nav-crop-btn"
        className="d-nav-crop-btn"
        onClick={onOpenCropPicker}
        type="button"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
          <rect x="2" y="8" width="3" height="6" rx="0.5"/>
          <rect x="6.5" y="5" width="3" height="9" rx="0.5"/>
          <rect x="11" y="2" width="3" height="12" rx="0.5"/>
        </svg>
        All crops
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11">
          <polyline points="4 6 8 10 12 6"/>
        </svg>
      </button>
    </div>
  );
}
