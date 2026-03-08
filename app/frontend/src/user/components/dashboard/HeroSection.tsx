import { useNavigate } from 'react-router-dom';
import type { BundleResponse } from '../../types';

interface HeroSectionProps {
  bundle: BundleResponse;
  totalGrownKg: number;
  monthsFarming: number;
  dayOfCycle: number;
  totalDays: number;
  progressPct: number;
  cycleStartLabel: string;
  cycleEndLabel: string;
}

function formatJoinedAt(joinedAt: string | null): string | null {
  if (!joinedAt) return null;
  const d = new Date(joinedAt);
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export default function HeroSection({
  bundle,
  totalGrownKg,
  monthsFarming,
  dayOfCycle,
  totalDays,
  progressPct,
  cycleStartLabel,
  cycleEndLabel,
}: HeroSectionProps) {
  const navigate = useNavigate();
  const joinedLabel = formatJoinedAt(bundle.joined_at);

  const epochParts: string[] = [];
  if (joinedLabel) epochParts.push(`Member since ${joinedLabel}`);
  if (bundle.cycle_number != null) epochParts.push(`${bundle.cycle_number} cycles`);
  epochParts.push(`${totalGrownKg.toFixed(1)} kg grown total`);
  const epochText = epochParts.join(' · ');

  const dEpochParts: string[] = [];
  if (joinedLabel) dEpochParts.push(`Member since ${joinedLabel}`);
  if (bundle.cycle_number != null) dEpochParts.push(`${bundle.cycle_number} cycles`);
  dEpochParts.push(`${totalGrownKg.toFixed(1)} kg grown total`);
  dEpochParts.push(`${monthsFarming} months farming`);
  const dEpochText = dEpochParts.join(' · ');

  return (
    <>
      {/* Mobile hero */}
      <div className="m-hero m-only" id="hero-section">
        <div className="hero-body">
          <div className="hero-cycle">
            Cycle {bundle.cycle_number ?? 1} · Active
          </div>
          <div className="hero-dates">
            {cycleStartLabel} – {cycleEndLabel}
          </div>
          <div className="hero-epoch">{epochText}</div>

          <div className="hero-progress">
            <div className="hero-progress-head">
              <span style={{ color: 'var(--ink-2)' }}>Cycle progress</span>
              <span>Day {dayOfCycle} of {totalDays}</span>
            </div>
            <div className="pbar">
              <div className="pbar-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-val">{bundle.quantity_kg} kg</div>
              <div className="hero-stat-lbl">Target</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{totalGrownKg.toFixed(1)} kg</div>
              <div className="hero-stat-lbl">Total grown</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-val">{monthsFarming} mo</div>
              <div className="hero-stat-lbl">Farming</div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop hero */}
      <div className="d-hero d-only">
        <div className="d-hero-content">
          <div className="d-hero-tag">
            Cycle {bundle.cycle_number ?? 1} · Active — {bundle.crop_name}
          </div>
          <div className="d-hero-title">
            {cycleStartLabel} – {cycleEndLabel}
          </div>
          <div className="d-hero-sub">
            Day {dayOfCycle} of {totalDays} · Target: {bundle.quantity_kg} kg
          </div>
          <div className="d-hero-epoch">{dEpochText}</div>
          <div className="d-hero-actions">
            <button
              className="btn btn--accent"
              type="button"
              onClick={() => navigate('/update')}
            >
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="13" height="13">
                <path d="M8 2v12M2 8h12" strokeLinecap="round" />
              </svg>
              Log today's update
            </button>
          </div>
        </div>

        <div className="d-hero-stats">
          <div className="d-hero-stat">
            <div className="d-hero-stat-val">{totalGrownKg.toFixed(1)}</div>
            <div className="d-hero-stat-lbl">kg total grown</div>
          </div>
          <div className="d-hero-stat">
            <div className="d-hero-stat-val">{bundle.cycle_number ?? 1}</div>
            <div className="d-hero-stat-lbl">Cycles done</div>
          </div>
          <div className="d-hero-stat">
            <div className="d-hero-stat-val">{monthsFarming} mo</div>
            <div className="d-hero-stat-lbl">Farming</div>
          </div>
        </div>
      </div>
    </>
  );
}
