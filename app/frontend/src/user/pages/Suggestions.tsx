import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';
import { getSuggestions, createNode, addCropsToNode } from '../services/api';
import type { AddPlotFormData, CropSuggestion } from '../types';

interface SuggestionsRouterState {
  formData?: AddPlotFormData;
  farmId?: number;
  mode?: 'initial-setup' | 'add-crop';
}

// ── Icons ────────────────────────────────────────────────────────────────────

const ChevronLeft = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} width={16} height={16}>
    <polyline points="10 4 6 8 10 12" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2.5} width={14} height={14}>
    <polyline points="3 8 7 12 13 4" />
  </svg>
);

const LeafIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={1.5} width={16} height={16}>
    <path d="M8 13C8 13 3 10 3 6a5 5 0 0 1 10 0c0 4-5 7-5 7Z" />
    <line x1={8} y1={13} x2={8} y2={7} />
  </svg>
);

// ── CropCard ─────────────────────────────────────────────────────────────────

function CropCard({ suggestion, selected, onToggle }: {
  suggestion: CropSuggestion;
  selected: boolean;
  onToggle: () => void;
}) {
  const pct = Math.round(suggestion.suitability_pct);
  const barColor = pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--border)';

  return (
    <button
      type="button"
      onClick={onToggle}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        background: selected ? 'var(--bg-elev)' : 'var(--bg-card)',
        border: `1.5px solid ${selected ? 'var(--accent)' : 'var(--border-lt)'}`,
        borderRadius: 'var(--r-lg)',
        padding: '16px',
        cursor: 'pointer',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxShadow: selected ? '0 0 0 3px var(--accent-bg)' : 'var(--sh-sm)',
      }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40,
          borderRadius: 'var(--r-md)',
          background: selected ? 'var(--accent-bg)' : 'var(--bg-warm)',
          color: selected ? 'var(--accent)' : 'var(--ink-3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s, color 0.15s',
        }}>
          <LeafIcon />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2, marginBottom: 3 }}>
            {suggestion.crop_name}
          </div>
          <div style={{
            fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.4,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {suggestion.reason}
          </div>
        </div>

        <div style={{
          width: 22, height: 22, borderRadius: '50%',
          border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
          background: selected ? 'var(--accent)' : 'transparent',
          color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s, border-color 0.15s',
        }}>
          {selected && <CheckIcon />}
        </div>
      </div>

      {/* Suitability bar */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 5 }}>
          <span>Suitability</span>
          <span style={{ color: barColor }}>{pct}%</span>
        </div>
        <div style={{ width: '100%', height: 4, background: 'var(--border-lt)', borderRadius: 'var(--r-pill)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 'var(--r-pill)', transition: 'width 0.4s ease' }} />
        </div>
      </div>

      {/* Meta chips */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {[`~${suggestion.estimated_yield_kg.toFixed(1)} kg yield`, `${suggestion.grow_weeks}w grow`].map((label) => (
          <span key={label} style={{ display: 'inline-flex', alignItems: 'center', fontSize: 10, fontWeight: 600, color: 'var(--ink-2)', background: 'var(--bg-warm)', borderRadius: 'var(--r-xs)', padding: '2px 7px' }}>
            {label}
          </span>
        ))}
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Suggestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { join, joined } = useFarm();

  const state = location.state as SuggestionsRouterState | null;
  const formData    = state?.formData ?? null;
  const routeFarmId = state?.farmId ?? null;
  const mode        = state?.mode ?? null;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [confirmSwitch, setConfirmSwitch] = useState(false);

  const [suggestions, setSuggestions] = useState<CropSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);

  const fetchSuggestions = useCallback(async () => {
    if (!formData) return;
    setLoading(true);
    setError(null);
    try {
      const result = await getSuggestions({
        plot_size_sqft: formData.plot_size_sqft,
        plot_type:      formData.plot_type,
        tools:          formData.tools,
        budget:         formData.budget,
        pH:             formData.pH,
        moisture:       formData.moisture,
        temperature:    formData.temperature,
        humidity:       formData.humidity,
      });
      setSuggestions(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load suggestions. Please try again.');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData]);

  useEffect(() => {
    if (formData) fetchSuggestions();
  }, [formData, fetchSuggestions]);

  const toggleCrop = (id: number) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleConfirm = async () => {
    if (!formData || selectedIds.size === 0) return;

    // For 'initial-setup' and 'add-crop' modes we update the existing farm —
    // no need for the confirmSwitch gate (we're not replacing the whole farm).
    const isExistingFarmMode = mode === 'initial-setup' || mode === 'add-crop';

    // Legacy path: warn if user already has a joined farm and is about to replace it
    if (!isExistingFarmMode && joined && !confirmSwitch) {
      setConfirmSwitch(true);
      return;
    }

    // Soft warning if no GPS lock
    const lat = formData.lat ?? 0;
    const lng = formData.lng ?? 0;
    if (lat === 0 && lng === 0 && !isExistingFarmMode) {
      setLocationWarning('Location not set — your plot will be placed at a default location.');
    } else {
      setLocationWarning(null);
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      if (mode === 'initial-setup' && routeFarmId != null) {
        // Farm was just created in Setup — set user's chosen crops (replace placeholder assignment)
        await addCropsToNode(routeFarmId, Array.from(selectedIds), true);
        navigate('/dashboard');
      } else if (mode === 'add-crop' && routeFarmId != null) {
        // User tapped + on dashboard — append crops to existing farm
        await addCropsToNode(routeFarmId, Array.from(selectedIds), false);
        navigate('/dashboard');
      } else {
        // Legacy: create a brand-new farm
        const bundles = await createNode({
          name:               formData.name,
          lat,
          lng,
          plot_size_sqft:     formData.plot_size_sqft,
          plot_type:          formData.plot_type,
          tools:              formData.tools,
          budget:             formData.budget,
          pH:                 formData.pH,
          moisture:           formData.moisture,
          temperature:        formData.temperature,
          humidity:           formData.humidity,
          preferred_crop_ids: Array.from(selectedIds),
        });
        const firstBundle = bundles[0];
        if (!firstBundle) throw new Error('No farm assignment returned from server.');
        const farmId = firstBundle.farm_id;
        localStorage.setItem(`mycelium:sunlight_hours:${farmId}`, String(formData.sunlight_hours));
        join(farmId, lat, lng, formData.name || firstBundle.farm_name);
        navigate('/dashboard');
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Guard: user navigated here without going through AddPlotSheet
  if (!formData) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16 }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 14, textAlign: 'center' }}>
          No plot data found. Please start from your dashboard.
        </p>
        <button type="button" className="btn btn--primary" onClick={() => navigate('/dashboard')}>
          Back to dashboard
        </button>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>

      {/* Topbar */}
      <div style={{ background: 'var(--ink)', padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10, position: 'sticky', top: 0, zIndex: 60 }}>
        <button type="button" className="btn btn--ghost btn--icon btn--sm" onClick={() => navigate(-1)}
          style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }} aria-label="Go back">
          <ChevronLeft />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--fd)', fontSize: 15, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
            {mode === 'add-crop' ? 'Add crops' : 'Pick crops'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {mode === 'add-crop'
              ? 'Adding to your existing farm'
              : `${formData.name || 'Your farm'} · ${formData.plot_size_sqft} sq ft`}
          </div>
        </div>
        {selectedCount > 0 && <span className="badge badge--info">{selectedCount} selected</span>}
      </div>

      {/* Body */}
      <div style={{ flex: 1, padding: '20px 16px', paddingBottom: 100, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600, width: '100%', margin: '0 auto' }}>

        <div>
          <p className="overline" style={{ marginBottom: 6 }}>Recommended for your plot</p>
          <h1 style={{ fontFamily: 'var(--fd)', fontSize: 22, fontWeight: 700, lineHeight: 1.2, color: 'var(--ink)' }}>
            Choose what to grow
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            Select one or more crops. Ranked by suitability for your soil, climate, tools, and budget.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ height: 130, borderRadius: 'var(--r-lg)', background: 'var(--bg-card)', border: '1.5px solid var(--border-lt)', opacity: 0.6 }} />
            ))}
            <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>Analysing your plot conditions…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div>
            <div className="toast toast--e" style={{ marginBottom: 12 }}>{error}</div>
            <button type="button" className="btn btn--secondary" onClick={fetchSuggestions}>Retry</button>
          </div>
        )}

        {/* Empty */}
        {!loading && !error && suggestions.length === 0 && (
          <div style={{ background: 'var(--bg-card)', border: '1.5px solid var(--border-lt)', borderRadius: 'var(--r-lg)', padding: '32px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              No crop suggestions found for your conditions.
              {!mode && ' Try adjusting your plot settings.'}
            </p>
            <button type="button" className="btn btn--secondary" onClick={() => navigate(-1)} style={{ marginTop: 16 }}>
              {mode ? 'Go back' : 'Adjust plot details'}
            </button>
          </div>
        )}

        {/* Crop cards */}
        {!loading && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((s) => (
              <CropCard key={s.crop_id} suggestion={s} selected={selectedIds.has(s.crop_id)} onToggle={() => toggleCrop(s.crop_id)} />
            ))}
          </div>
        )}
      </div>

      {/* Sticky CTA */}
      {!loading && suggestions.length > 0 && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: 'var(--bg-elev)', borderTop: '1px solid var(--border-lt)', padding: '12px 16px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', zIndex: 50 }}>
          {locationWarning && (
            <p style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 8, textAlign: 'center' }}>{locationWarning}</p>
          )}
          {submitError && (
            <p style={{ fontSize: 12, color: 'var(--error)', marginBottom: 8, textAlign: 'center' }}>{submitError}</p>
          )}
          {confirmSwitch && !mode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--warn)', textAlign: 'center', lineHeight: 1.5 }}>
                This will replace your current farm. This cannot be undone.
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" className="btn btn--secondary btn--full" onClick={() => setConfirmSwitch(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn--accent btn--full" disabled={submitting} onClick={handleConfirm}>
                  {submitting ? 'Starting…' : 'Replace & continue →'}
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn--accent btn--full btn--lg"
              disabled={selectedCount === 0 || submitting}
              onClick={handleConfirm}
              style={{ opacity: selectedCount === 0 ? 0.45 : 1, transition: 'opacity 0.15s' }}
            >
              {submitting
                ? (mode === 'add-crop' ? 'Adding crops…' : 'Starting your farm…')
                : selectedCount === 0
                ? 'Select at least one crop'
                : mode === 'add-crop'
                  ? `Add ${selectedCount} crop${selectedCount > 1 ? 's' : ''} →`
                  : `Start growing ${selectedCount} crop${selectedCount > 1 ? 's' : ''} →`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
