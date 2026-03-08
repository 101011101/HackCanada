import BottomSheet from '../shared/BottomSheet';
import type { BundleResponse } from '../../types';

interface CropPickerSheetProps {
  open: boolean;
  onClose: () => void;
  bundles: BundleResponse[];
  loading?: boolean;
  onAddPlot: () => void;
  onLogData: (cropId: number) => void;
}

const PlantIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="13" height="13">
    <path d="M8 13C8 13 3 10 3 6a5 5 0 0 1 10 0c0 4-5 7-5 7Z" />
    <line x1="8" y1="13" x2="8" y2="7" />
  </svg>
);


export default function CropPickerSheet({
  open,
  onClose,
  bundles,
  loading,
  onAddPlot,
  onLogData,
}: CropPickerSheetProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="My crops">

      {/* Crops for active farm */}
      {loading && (
        <div style={{ padding: '12px 0', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
          Loading your crops…
        </div>
      )}
      {!loading && bundles.length === 0 && (
        <div style={{ padding: '12px 0', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
          No crops assigned yet.
        </div>
      )}
      {bundles.map(bundle => (
        <div
          key={`${bundle.farm_id}-${bundle.crop_id}`}
          className="crop-option"
          role="button"
          tabIndex={0}
          onClick={() => { onLogData(bundle.crop_id); onClose(); }}
          onKeyDown={(e) => { if (e.key === 'Enter') { onLogData(bundle.crop_id); onClose(); } }}
        >
          <div className="d-crop-icon">
            <PlantIcon />
          </div>
          <div style={{ flex: 1 }}>
            <div className="crop-option-name">{bundle.crop_name}</div>
            <div className="crop-option-sub">Cycle {bundle.cycle_number ?? 1} · tap to log data</div>
          </div>
          <svg viewBox="0 0 16 16" fill="none" stroke="var(--ink-3)" strokeWidth="1.5" width="13" height="13" style={{ flexShrink: 0 }}>
            <path d="M11 2H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
            <line x1="6" y1="6" x2="10" y2="6"/>
            <line x1="6" y1="9" x2="10" y2="9"/>
          </svg>
        </div>
      ))}

      <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-lt)' }}>
        <button className="btn btn--secondary btn--full" type="button" onClick={onAddPlot}>
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
            <path d="M8 2v12M2 8h12" strokeLinecap="round" />
          </svg>
          Add crops
        </button>
      </div>
    </BottomSheet>
  );
}
