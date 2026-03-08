I now have a thorough understanding of every pattern in the codebase. Here is the complete draft code for all three deliverables.

---

## 1. Type additions for `types.ts`

Add these to the bottom of `/Users/ray/Coding/Hackathons/HackCanada/app/frontend/src/user/types.ts`:

```ts
// ---------------------------------------------------------------------------
// Suggestions / Add-plot flow
// ---------------------------------------------------------------------------

/** The form data collected in AddPlotSheet, passed via router state to /suggestions */
export interface AddPlotFormData {
  name: string;
  lat: number | null;
  lng: number | null;
  plot_size_sqft: number;
  plot_type: string;
  sunlight_hours: number;
  tools: 'basic' | 'intermediate' | 'advanced';
  budget: 'low' | 'medium' | 'high';
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}

/** A single ranked crop suggestion returned by POST /suggestions */
export interface CropSuggestion {
  crop_id: number;
  crop_name: string;
  suitability_pct: number;   // 0–100
  estimated_yield_kg: number;
  grow_weeks: number;
  reason: string;
}

/** POST /suggestions request body */
export interface SuggestionsRequest {
  plot_size_sqft: number;
  plot_type: string;
  tools: string;
  budget: string;
  pH: number;
  moisture: number;
  temperature: number;
  humidity: number;
}
```

---

## 2. API additions for `api.ts`

Add these two functions to the bottom of `/Users/ray/Coding/Hackathons/HackCanada/app/frontend/src/user/services/api.ts`:

```ts
import type { CropSuggestion, SuggestionsRequest } from '../types';

export function getSuggestions(body: SuggestionsRequest): Promise<CropSuggestion[]> {
  return request<CropSuggestion[]>('/suggestions', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
```

> `createNode` already exists and handles `POST /nodes` — Suggestions.tsx will call it directly via the imported `createNode`.

---

## 3. `AddPlotSheet.tsx`

File path: `/Users/ray/Coding/Hackathons/HackCanada/app/frontend/src/user/components/sheets/AddPlotSheet.tsx`

```tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../shared/BottomSheet';
import { getSoilData } from '../../services/api';
import { useFarm } from '../../store/FarmContext';
import type { AddPlotFormData } from '../../types';

// ── Sub-component: an overline label, matching the exact style used in Setup.tsx
function FieldLabel({ htmlFor, children }: { htmlFor?: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: 'var(--ink-3)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      }}
    >
      {children}
    </label>
  );
}

// ── Sub-component: number input, matching the exact style used in Setup.tsx
function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      type="number"
      {...props}
      style={{
        padding: '10px 14px',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--r-md)',
        fontSize: 14,
        background: 'var(--bg-elev)',
        color: 'var(--ink)',
        outline: 'none',
        maxWidth: 160,
        ...props.style,
      }}
    />
  );
}

// ── Plot types, mirroring StepPlotBasics.tsx exactly
const PLOT_TYPES = [
  { value: 'balcony',   label: 'Balcony' },
  { value: 'rooftop',   label: 'Rooftop' },
  { value: 'backyard',  label: 'Backyard' },
  { value: 'community', label: 'Community' },
] as const;

type PlotType = typeof PLOT_TYPES[number]['value'] | '';

const DEFAULT_FORM: AddPlotFormData = {
  name: '',
  lat: null,
  lng: null,
  plot_size_sqft: 0,
  plot_type: '',
  sunlight_hours: 6,
  tools: 'basic',
  budget: 'low',
  pH: 7.0,
  moisture: 50,
  temperature: 20,
  humidity: 50,
};

interface AddPlotSheetProps {
  open: boolean;
  onClose: () => void;
}

export default function AddPlotSheet({ open, onClose }: AddPlotSheetProps) {
  const { farmId } = useFarm();
  const navigate = useNavigate();

  const [form, setForm] = useState<AddPlotFormData>(DEFAULT_FORM);
  const [showErrors, setShowErrors] = useState(false);
  // Track whether soil fields have been pre-filled so we show a hint
  const [soilPrefilled, setSoilPrefilled] = useState(false);

  // Pre-fill soil/climate values from the user's existing node on open
  useEffect(() => {
    if (!open || !farmId) return;
    getSoilData(farmId)
      .then((soil) => {
        setForm((prev) => ({
          ...prev,
          pH: soil.pH,
          moisture: soil.moisture,
          temperature: soil.temperature,
          humidity: soil.humidity,
        }));
        setSoilPrefilled(true);
      })
      .catch(() => {
        // Non-fatal: user will see defaults, which is fine
      });
  }, [open, farmId]);

  // Reset errors and pre-fill flag when sheet closes
  useEffect(() => {
    if (!open) {
      setShowErrors(false);
      setSoilPrefilled(false);
      setForm(DEFAULT_FORM);
    }
  }, [open]);

  // GPS handler, identical pattern to StepPlotBasics.tsx
  const handleGps = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setForm((prev) => ({ ...prev, lat, lng }));
      },
      (err) => console.error('[GPS] error', err.code, err.message),
      { timeout: 10000 }
    );
  };

  const set = <K extends keyof AddPlotFormData>(key: K, value: AddPlotFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = {
    name:           form.name.trim().length === 0    ? 'Plot name is required' : null,
    plot_size_sqft: form.plot_size_sqft <= 0         ? 'Plot size is required' : null,
    plot_type:      form.plot_type === ''             ? 'Select a plot type'   : null,
  };
  const canAdvance = !errors.name && !errors.plot_size_sqft && !errors.plot_type;

  const handleNext = () => {
    setShowErrors(true);
    if (!canAdvance) return;
    onClose();
    navigate('/suggestions', { state: { formData: form } });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add new plot">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── Plot name ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel htmlFor="ap-name">Plot name</FieldLabel>
          <input
            id="ap-name"
            type="text"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="My second plot"
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
          {showErrors && errors.name && (
            <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.name}</span>
          )}
        </div>

        {/* ── Location ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Location</FieldLabel>
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
          {form.lat !== null && form.lng !== null && (
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
              {form.lat.toFixed(4)}, {form.lng.toFixed(4)}
            </span>
          )}
        </div>

        {/* ── Plot size ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel htmlFor="ap-size">Plot size (sq ft)</FieldLabel>
          <NumberInput
            id="ap-size"
            min={1}
            step={1}
            value={form.plot_size_sqft || ''}
            onChange={(e) => set('plot_size_sqft', parseFloat(e.target.value) || 0)}
            placeholder="120"
            style={{
              border: `1.5px solid ${showErrors && errors.plot_size_sqft ? 'var(--error)' : 'var(--border)'}`,
            }}
          />
          {showErrors && errors.plot_size_sqft && (
            <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_size_sqft}</span>
          )}
        </div>

        {/* ── Plot type ─────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--ink-3)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
            }}
          >
            Plot type
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLOT_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                className={`btn btn--sm ${form.plot_type === pt.value ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => set('plot_type', pt.value as PlotType)}
              >
                {pt.label}
              </button>
            ))}
          </div>
          {showErrors && errors.plot_type && (
            <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_type}</span>
          )}
        </div>

        {/* ── Sunlight ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel htmlFor="ap-sunlight">Average daily sunlight (hours)</FieldLabel>
          <NumberInput
            id="ap-sunlight"
            min={0}
            max={16}
            step={0.5}
            value={form.sunlight_hours}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              set('sunlight_hours', isNaN(val) ? 0 : Math.min(16, Math.max(0, val)));
            }}
          />
        </div>

        {/* ── Soil conditions ───────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border-lt)',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Soil &amp; climate
            </span>
            {soilPrefilled && (
              <span className="badge badge--info">Pre-filled from your farm</span>
            )}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-ph">Soil pH</FieldLabel>
              <NumberInput
                id="ap-ph"
                min={0}
                max={14}
                step={0.1}
                value={form.pH}
                onChange={(e) => set('pH', parseFloat(e.target.value) || 7.0)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-moisture">Moisture (%)</FieldLabel>
              <NumberInput
                id="ap-moisture"
                min={0}
                max={100}
                step={1}
                value={form.moisture}
                onChange={(e) => set('moisture', parseFloat(e.target.value) || 50)}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-temp">Temperature (°C)</FieldLabel>
              <NumberInput
                id="ap-temp"
                step={0.5}
                value={form.temperature}
                onChange={(e) => set('temperature', parseFloat(e.target.value) || 20)}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-humidity">Humidity (%)</FieldLabel>
              <NumberInput
                id="ap-humidity"
                min={0}
                max={100}
                step={1}
                value={form.humidity}
                onChange={(e) => set('humidity', parseFloat(e.target.value) || 50)}
              />
            </div>
          </div>
        </div>

        {/* ── Resources ─────────────────────────────────────────── */}
        <div
          style={{
            borderTop: '1px solid var(--border-lt)',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Tools
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['basic', 'intermediate', 'advanced'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`btn btn--sm ${form.tools === t ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => set('tools', t)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--ink-3)',
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
              }}
            >
              Budget
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map((b) => (
                <button
                  key={b}
                  type="button"
                  className={`btn btn--sm ${form.budget === b ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => set('budget', b)}
                  style={{ textTransform: 'capitalize' }}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CTA ───────────────────────────────────────────────── */}
        <button
          type="button"
          className="btn btn--accent btn--full btn--lg"
          onClick={handleNext}
          style={{ marginTop: 4 }}
        >
          Next: Pick crops
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth={2} width={14} height={14}>
            <line x1={3} y1={8} x2={13} y2={8} />
            <polyline points="9 4 13 8 9 12" />
          </svg>
        </button>
      </div>
    </BottomSheet>
  );
}
```

---

## 4. `Suggestions.tsx` (full replacement)

File path: `/Users/ray/Coding/Hackathons/HackCanada/app/frontend/src/user/pages/Suggestions.tsx`

```tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';
import { useAsync } from '../hooks/useAsync';
import { getSuggestions, createNode } from '../services/api';
import MobileTopbar from '../components/layout/MobileTopbar';
import type { AddPlotFormData, CropSuggestion } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Icons
// ─────────────────────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────────────────────
// CropCard
// ─────────────────────────────────────────────────────────────────────────────

interface CropCardProps {
  suggestion: CropSuggestion;
  selected: boolean;
  onToggle: () => void;
}

function CropCard({ suggestion, selected, onToggle }: CropCardProps) {
  const pct = Math.round(suggestion.suitability_pct);

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
      {/* ── Header row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}>
        {/* Crop icon */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 'var(--r-md)',
            background: selected ? 'var(--accent-bg)' : 'var(--bg-warm)',
            color: selected ? 'var(--accent)' : 'var(--ink-3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, color 0.15s',
          }}
        >
          <LeafIcon />
        </div>

        {/* Name + reason */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--ink)',
              lineHeight: 1.2,
              marginBottom: 3,
            }}
          >
            {suggestion.crop_name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              lineHeight: 1.4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {suggestion.reason}
          </div>
        </div>

        {/* Selection indicator */}
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `2px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
            background: selected ? 'var(--accent)' : 'transparent',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background 0.15s, border-color 0.15s',
          }}
        >
          {selected && <CheckIcon />}
        </div>
      </div>

      {/* ── Suitability bar ── */}
      <div style={{ marginBottom: 10 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--ink-3)',
            marginBottom: 5,
          }}
        >
          <span>Suitability</span>
          <span style={{ color: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--ink-3)' }}>
            {pct}%
          </span>
        </div>
        {/* Progress bar — matching .pbar / .pbar-fill but with a light bg for card context */}
        <div
          style={{
            width: '100%',
            height: 4,
            background: 'var(--border-lt)',
            borderRadius: 'var(--r-pill)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${pct}%`,
              background: pct >= 75 ? 'var(--success)' : pct >= 50 ? 'var(--accent)' : 'var(--border)',
              borderRadius: 'var(--r-pill)',
              transition: 'width 0.4s ease',
            }}
          />
        </div>
      </div>

      {/* ── Meta chips ── */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--ink-2)',
            background: 'var(--bg-warm)',
            borderRadius: 'var(--r-xs)',
            padding: '2px 7px',
          }}
        >
          ~{suggestion.estimated_yield_kg.toFixed(1)} kg yield
        </span>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
            fontWeight: 600,
            color: 'var(--ink-2)',
            background: 'var(--bg-warm)',
            borderRadius: 'var(--r-xs)',
            padding: '2px 7px',
          }}
        >
          {suggestion.grow_weeks}w grow
        </span>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Suggestions page
// ─────────────────────────────────────────────────────────────────────────────

export default function Suggestions() {
  const navigate = useNavigate();
  const location = useLocation();
  const { join } = useFarm();

  // Form data arrives via router state from AddPlotSheet
  const formData = (location.state as { formData?: AddPlotFormData } | null)?.formData ?? null;

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch suggestions — runs once when formData is available
  const suggestionsState = useAsync(
    () => {
      if (!formData) return Promise.resolve([]);
      return getSuggestions({
        plot_size_sqft: formData.plot_size_sqft,
        plot_type:      formData.plot_type,
        tools:          formData.tools,
        budget:         formData.budget,
        pH:             formData.pH,
        moisture:       formData.moisture,
        temperature:    formData.temperature,
        humidity:       formData.humidity,
      });
    },
    // formData is stable (came from router state), so stringifying is safe here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(formData)]
  );

  const suggestions: CropSuggestion[] = suggestionsState.data ?? [];

  const toggleCrop = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleConfirm = async () => {
    if (!formData || selectedIds.size === 0) return;

    setSubmitting(true);
    setSubmitError(null);

    try {
      const bundles = await createNode({
        name:               formData.name,
        lat:                formData.lat ?? 0,
        lng:                formData.lng ?? 0,
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

      // Persist sunlight hours (Gap 1 pattern from Setup.tsx)
      localStorage.setItem(
        `mycelium:sunlight_hours:${farmId}`,
        String(formData.sunlight_hours)
      );

      // Persist farm identity
      join(farmId, formData.lat ?? 0, formData.lng ?? 0);

      navigate('/dashboard');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── No form data guard: user navigated here directly without going through AddPlotSheet ──
  if (!formData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'var(--bg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          gap: 16,
        }}
      >
        <p style={{ color: 'var(--ink-3)', fontSize: 14, textAlign: 'center' }}>
          No plot data found. Please start from your dashboard.
        </p>
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => navigate('/dashboard')}
        >
          Back to dashboard
        </button>
      </div>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Topbar ──────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--ink)',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          position: 'sticky',
          top: 0,
          zIndex: 60,
        }}
      >
        <button
          type="button"
          className="btn btn--ghost btn--icon btn--sm"
          onClick={() => navigate(-1)}
          style={{ color: 'rgba(255,255,255,0.6)', flexShrink: 0 }}
          aria-label="Go back"
        >
          <ChevronLeft />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 15,
              fontWeight: 700,
              color: '#fff',
              lineHeight: 1,
            }}
          >
            Pick crops
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            {formData.name || 'New plot'} · {formData.plot_size_sqft} sq ft
          </div>
        </div>
        {selectedCount > 0 && (
          <span className="badge badge--info">
            {selectedCount} selected
          </span>
        )}
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div
        style={{
          flex: 1,
          padding: '20px 16px',
          paddingBottom: 100, // space for sticky footer
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          maxWidth: 600,
          width: '100%',
          margin: '0 auto',
        }}
      >
        {/* Intro text */}
        <div>
          <p className="overline" style={{ marginBottom: 6 }}>Recommended for your plot</p>
          <h1
            style={{
              fontFamily: 'var(--fd)',
              fontSize: 22,
              fontWeight: 700,
              lineHeight: 1.2,
              color: 'var(--ink)',
            }}
          >
            Choose what to grow
          </h1>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, lineHeight: 1.5 }}>
            Select one or more crops. We ranked these based on your soil, climate, tools, and budget.
          </p>
        </div>

        {/* ── Loading state ── */}
        {suggestionsState.loading && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: 130,
                  borderRadius: 'var(--r-lg)',
                  background: 'var(--bg-card)',
                  border: '1.5px solid var(--border-lt)',
                  opacity: 0.6,
                  animation: 'pulse 1.4s ease-in-out infinite',
                }}
              />
            ))}
            <p style={{ fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
              Analysing your plot conditions…
            </p>
          </div>
        )}

        {/* ── Error state ── */}
        {suggestionsState.error && (
          <div>
            <div className="toast toast--e" style={{ marginBottom: 12 }}>
              {suggestionsState.error}
            </div>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={suggestionsState.refetch}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty state ── */}
        {!suggestionsState.loading && !suggestionsState.error && suggestions.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1.5px solid var(--border-lt)',
              borderRadius: 'var(--r-lg)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 14, color: 'var(--ink-3)' }}>
              No crop suggestions found for your conditions. Try adjusting your plot settings.
            </p>
            <button
              type="button"
              className="btn btn--secondary"
              onClick={() => navigate(-1)}
              style={{ marginTop: 16 }}
            >
              Adjust plot details
            </button>
          </div>
        )}

        {/* ── Crop cards ── */}
        {!suggestionsState.loading && suggestions.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {suggestions.map((s) => (
              <CropCard
                key={s.crop_id}
                suggestion={s}
                selected={selectedIds.has(s.crop_id)}
                onToggle={() => toggleCrop(s.crop_id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Sticky footer CTA ───────────────────────────────────── */}
      {!suggestionsState.loading && suggestions.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            background: 'var(--bg-elev)',
            borderTop: '1px solid var(--border-lt)',
            padding: '12px 16px',
            paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
            zIndex: 50,
          }}
        >
          {submitError && (
            <p
              style={{
                fontSize: 12,
                color: 'var(--error)',
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              {submitError}
            </p>
          )}
          <button
            type="button"
            className="btn btn--accent btn--full btn--lg"
            disabled={selectedCount === 0 || submitting}
            onClick={handleConfirm}
            style={{
              opacity: selectedCount === 0 ? 0.45 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {submitting
              ? 'Starting your farm…'
              : selectedCount === 0
              ? 'Select at least one crop'
              : `Start growing ${selectedCount} crop${selectedCount > 1 ? 's' : ''} →`}
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 5. Dashboard wiring change (where `AddPlotSheet` gets opened)

The existing `Dashboard.tsx` already has `onAddPlot={() => setCropSheetOpen(true)}` on `BottomTabBar`, and `CropPickerSheet` has an "Add new plot" button at the bottom. The cleanest integration: replace the stub button inside `CropPickerSheet` with one that calls an `onAddPlot` prop, and introduce `AddPlotSheet` alongside `CropPickerSheet` in `Dashboard.tsx`. No new state needed beyond `addPlotOpen`.

**Changes needed in `Dashboard.tsx`** (draft, not written to disk yet):

```tsx
// Add to imports
import AddPlotSheet from '../components/sheets/AddPlotSheet';

// Add state
const [addPlotOpen, setAddPlotOpen] = useState(false);

// Update CropPickerSheet call — add onAddPlot prop
<CropPickerSheet
  open={cropSheetOpen}
  onClose={() => setCropSheetOpen(false)}
  bundles={bundles}
  selectedCropId={selectedCropId}
  onSelect={(id) => { setSelectedCropId(id); setCropSheetOpen(false); }}
  onAddPlot={() => { setCropSheetOpen(false); setAddPlotOpen(true); }}
/>

// Add AddPlotSheet alongside the other sheets
<AddPlotSheet
  open={addPlotOpen}
  onClose={() => setAddPlotOpen(false)}
/>
```

**Change needed in `CropPickerSheet.tsx`** — add `onAddPlot` prop and wire the button:

```tsx
interface CropPickerSheetProps {
  // ... existing props ...
  onAddPlot: () => void;   // new
}

// Replace the existing static "Add new plot" button:
<button className="btn btn--secondary btn--full" type="button" onClick={onAddPlot}>
  {/* ... svg ... */}
  Add new plot
</button>
```

---

## Summary of all files involved

| File | Status | Change |
|---|---|---|
| `src/user/types.ts` | Extend | Add `AddPlotFormData`, `CropSuggestion`, `SuggestionsRequest` |
| `src/user/services/api.ts` | Extend | Add `getSuggestions()` |
| `src/user/components/sheets/AddPlotSheet.tsx` | New | Full bottom-sheet form |
| `src/user/pages/Suggestions.tsx` | Replace | Full page with cards, selection, confirm |
| `src/user/components/sheets/CropPickerSheet.tsx` | Extend | Add `onAddPlot` prop, wire button |
| `src/user/pages/Dashboard.tsx` | Extend | Import & render `AddPlotSheet`, pass `onAddPlot` to `CropPickerSheet` |

### Key design decisions

- **Form pre-fill**: `AddPlotSheet` calls `getSoilData(farmId)` on open (not eagerly) and patches only the soil/climate fields, showing a `badge--info` "Pre-filled from your farm" label. If the API fails it silently falls back to defaults — matches the resilience pattern everywhere else.
- **Navigation**: Sheet closes before `navigate('/suggestions', { state: … })` so the back-button from Suggestions returns to Dashboard (not a half-open sheet).
- **`useAsync` for suggestions**: The deps array uses `JSON.stringify(formData)` since `formData` is a plain object from router state — it's stable, so this fires exactly once.
- **Selection state**: `Set<number>` of `crop_id` values; toggling is O(1); the CTA button label and disabled state are derived from `selectedIds.size`.
- **`createNode` reuse**: Suggestions page calls the existing `createNode` with `preferred_crop_ids: Array.from(selectedIds)` — no new API function needed for the final confirm step.
- **Sunlight persistence**: Same `localStorage.setItem('mycelium:sunlight_hours:${farmId}', ...)` pattern as `Setup.tsx`.
- **No new CSS classes**: all layout is inline styles using CSS vars; only existing classes (`.btn`, `.btn--accent`, `.badge`, `.overline`, `.toast`, etc.) are used.