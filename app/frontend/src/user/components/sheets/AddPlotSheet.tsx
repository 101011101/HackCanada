import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BottomSheet from '../shared/BottomSheet';
import { getSoilData } from '../../services/api';
import { useFarm } from '../../store/FarmContext';
import type { AddPlotFormData } from '../../types';

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

const PLOT_TYPES = [
  { value: 'balcony',   label: 'Balcony' },
  { value: 'rooftop',   label: 'Rooftop' },
  { value: 'backyard',  label: 'Backyard' },
  { value: 'community', label: 'Community' },
] as const;

function randomSlug() {
  return `zone-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_FORM: AddPlotFormData = {
  name: randomSlug(),
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
  const { farmId, farmLat, farmLng } = useFarm();
  const navigate = useNavigate();

  const [form, setForm] = useState<AddPlotFormData>(DEFAULT_FORM);
  const [showErrors, setShowErrors] = useState(false);
  const [soilPrefilled, setSoilPrefilled] = useState(false);

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
      .catch(() => {});
  }, [open, farmId]);

  useEffect(() => {
    if (!open) {
      setShowErrors(false);
      setSoilPrefilled(false);
      setForm({ ...DEFAULT_FORM, name: randomSlug() });
    }
  }, [open]);

  // Fill lat/lng from existing farm location if GPS hasn't provided a value yet
  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      lat: prev.lat ?? farmLat,
      lng: prev.lng ?? farmLng,
    }));
  }, [open, farmLat, farmLng]);

  const set = <K extends keyof AddPlotFormData>(key: K, value: AddPlotFormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const errors = {
    plot_size_sqft: form.plot_size_sqft <= 0 ? 'Plot size is required' : null,
    plot_type:      form.plot_type === ''     ? 'Select a plot type'   : null,
  };
  const canAdvance = !errors.plot_size_sqft && !errors.plot_type;

  const handleNext = () => {
    setShowErrors(true);
    if (!canAdvance) return;
    onClose();
    navigate('/suggestions', {
      state: {
        formData: form,
        farmId:   farmId ?? undefined,
        mode:     'add-crop' as const,
      },
    });
  };

  return (
    <BottomSheet open={open} onClose={onClose} title="Add new plot">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Location — static, inherited from existing farm */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel>Location</FieldLabel>
          <span style={{ fontSize: 13, color: 'var(--ink-3)', padding: '10px 14px', background: 'var(--bg-warm)', borderRadius: 'var(--r-md)', border: '1.5px solid var(--border-lt)' }}>
            {form.lat !== null && form.lng !== null
              ? `${form.lat.toFixed(4)}, ${form.lng.toFixed(4)}`
              : 'Using your farm location'}
            <span style={{ marginLeft: 8, fontSize: 11, opacity: 0.6 }}>· fixed</span>
          </span>
        </div>

        {/* Plot size */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <FieldLabel htmlFor="ap-size">Plot size (sq ft)</FieldLabel>
          <NumberInput
            id="ap-size"
            min={1}
            step={1}
            value={form.plot_size_sqft || ''}
            onChange={(e) => set('plot_size_sqft', parseFloat(e.target.value) || 0)}
            placeholder="120"
            style={{ border: `1.5px solid ${showErrors && errors.plot_size_sqft ? 'var(--error)' : 'var(--border)'}` }}
          />
          {showErrors && errors.plot_size_sqft && (
            <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_size_sqft}</span>
          )}
        </div>

        {/* Plot type */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Plot type
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PLOT_TYPES.map((pt) => (
              <button
                key={pt.value}
                type="button"
                className={`btn btn--sm ${form.plot_type === pt.value ? 'btn--primary' : 'btn--secondary'}`}
                onClick={() => set('plot_type', pt.value)}
              >
                {pt.label}
              </button>
            ))}
          </div>
          {showErrors && errors.plot_type && (
            <span style={{ fontSize: 11, color: 'var(--error)' }}>{errors.plot_type}</span>
          )}
        </div>

        {/* Sunlight */}
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

        {/* Soil & climate */}
        <div style={{ borderTop: '1px solid var(--border-lt)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Soil &amp; climate
            </span>
            {soilPrefilled && <span className="badge badge--info">Pre-filled from your farm</span>}
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-ph">Soil pH</FieldLabel>
              <NumberInput id="ap-ph" min={0} max={14} step={0.1} value={form.pH}
                onChange={(e) => set('pH', parseFloat(e.target.value) || 7.0)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-moisture">Moisture (%)</FieldLabel>
              <NumberInput id="ap-moisture" min={0} max={100} step={1} value={form.moisture}
                onChange={(e) => set('moisture', parseFloat(e.target.value) || 50)} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-temp">Temperature (°C)</FieldLabel>
              <NumberInput id="ap-temp" step={0.5} value={form.temperature}
                onChange={(e) => set('temperature', parseFloat(e.target.value) || 20)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <FieldLabel htmlFor="ap-humidity">Humidity (%)</FieldLabel>
              <NumberInput id="ap-humidity" min={0} max={100} step={1} value={form.humidity}
                onChange={(e) => set('humidity', parseFloat(e.target.value) || 50)} />
            </div>
          </div>
        </div>

        {/* Tools & budget */}
        <div style={{ borderTop: '1px solid var(--border-lt)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tools</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['basic', 'intermediate', 'advanced'] as const).map((t) => (
                <button key={t} type="button"
                  className={`btn btn--sm ${form.tools === t ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => set('tools', t)}
                  style={{ textTransform: 'capitalize' }}
                >{t}</button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Budget</span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['low', 'medium', 'high'] as const).map((b) => (
                <button key={b} type="button"
                  className={`btn btn--sm ${form.budget === b ? 'btn--primary' : 'btn--secondary'}`}
                  onClick={() => set('budget', b)}
                  style={{ textTransform: 'capitalize' }}
                >{b}</button>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button type="button" className="btn btn--accent btn--full btn--lg" onClick={handleNext} style={{ marginTop: 4 }}>
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
