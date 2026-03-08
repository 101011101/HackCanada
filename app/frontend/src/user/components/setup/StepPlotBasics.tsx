import { useState } from 'react';

export interface PlotBasicsDraft {
  name: string;
  lat: number | null;
  lng: number | null;
  plot_size_sqft: number;
  plot_type: 'balcony' | 'rooftop' | 'backyard' | 'community' | '';
  sunlight_hours: number;
}

interface StepPlotBasicsProps {
  draft: PlotBasicsDraft;
  onChange: (updated: PlotBasicsDraft) => void;
  onNext: () => void;
}

const PLOT_TYPES = [
  { value: 'balcony', label: 'Balcony' },
  { value: 'rooftop', label: 'Rooftop' },
  { value: 'backyard', label: 'Backyard' },
  { value: 'community', label: 'Community' },
] as const;

export default function StepPlotBasics({
  draft,
  onChange,
  onNext,
}: StepPlotBasicsProps) {
  const [showErrors, setShowErrors] = useState(false);
  const handleGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        onChange({ ...draft, lat, lng });
      },
      () => {},
      { timeout: 10000 }
    );
  };

  const errors = {
    name: draft.name.trim().length === 0 ? 'Farm name is required' : null,
    plot_size_sqft: draft.plot_size_sqft <= 0 ? 'Plot size is required' : null,
    plot_type: draft.plot_type === '' ? 'Select a plot type' : null,
  };
  const canAdvance = !errors.name && !errors.plot_size_sqft && !errors.plot_type;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <h2
        style={{
          fontFamily: 'var(--fd)',
          fontSize: 22,
          fontWeight: 700,
          marginBottom: 4,
        }}
      >
        Plot basics
      </h2>

      {/* Farm name */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="farm-name"
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Farm name
        </label>
        <input
          id="farm-name"
          type="text"
          value={draft.name}
          onChange={(e) => onChange({ ...draft, name: e.target.value })}
          placeholder="My rooftop garden"
          style={{
            padding: '10px 14px',
            border: `1.5px solid ${showErrors && errors.name ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 14,
            background: 'var(--bg-elev)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        {showErrors && errors.name && <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.name}</span>}
      </div>

      {/* Location */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Location
        </label>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={handleGps}
          style={{ alignSelf: 'flex-start' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} width={14} height={14}>
            <circle cx={8} cy={8} r={3} />
            <line x1={8} y1={1} x2={8} y2={3} />
            <line x1={8} y1={13} x2={8} y2={15} />
            <line x1={1} y1={8} x2={3} y2={8} />
            <line x1={13} y1={8} x2={15} y2={8} />
          </svg>
          Use my location
        </button>
        {draft.lat !== null && draft.lng !== null && (
          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {draft.lat.toFixed(4)}, {draft.lng.toFixed(4)}
          </span>
        )}
      </div>

      {/* Plot size */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="plot-size"
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Plot size (sq ft)
        </label>
        <input
          id="plot-size"
          type="number"
          min={1}
          step={1}
          value={draft.plot_size_sqft || ''}
          onChange={(e) =>
            onChange({ ...draft, plot_size_sqft: parseFloat(e.target.value) || 0 })
          }
          placeholder="120"
          style={{
            padding: '10px 14px',
            border: `1.5px solid ${showErrors && errors.plot_size_sqft ? 'var(--error)' : 'var(--border)'}`,
            borderRadius: 'var(--r-md)',
            fontSize: 14,
            background: 'var(--bg-elev)',
            color: 'var(--ink)',
            outline: 'none',
          }}
        />
        {showErrors && errors.plot_size_sqft && <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_size_sqft}</span>}
      </div>

      {/* Plot type */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Plot type
        </span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {PLOT_TYPES.map((pt) => (
            <button
              key={pt.value}
              type="button"
              className={`btn btn--sm ${draft.plot_type === pt.value ? 'btn--primary' : 'btn--secondary'}`}
              onClick={() => onChange({ ...draft, plot_type: pt.value })}
            >
              {pt.label}
            </button>
          ))}
        </div>
        {showErrors && errors.plot_type && <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_type}</span>}
      </div>

      {/* Sunlight hours — Gap 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <label
          htmlFor="sunlight-hours"
          style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
        >
          Average daily sunlight (hours)
        </label>
        <input
          id="sunlight-hours"
          type="number"
          min={0}
          max={16}
          step={0.5}
          value={draft.sunlight_hours}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            const clamped = isNaN(val) ? 0 : Math.min(16, Math.max(0, val));
            onChange({ ...draft, sunlight_hours: clamped });
          }}
          style={{
            padding: '10px 14px',
            border: '1.5px solid var(--border)',
            borderRadius: 'var(--r-md)',
            fontSize: 14,
            background: 'var(--bg-elev)',
            color: 'var(--ink)',
            outline: 'none',
            maxWidth: 160,
          }}
        />
        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
          0–16 hours. Used to display sunlight in your zone conditions.
        </span>
      </div>

      <button
        type="button"
        className="btn btn--primary btn--full"
        onClick={() => {
          setShowErrors(true);
          if (canAdvance) onNext();
        }}
        style={{ marginTop: 8 }}
      >
        Continue
      </button>
    </div>
  );
}
