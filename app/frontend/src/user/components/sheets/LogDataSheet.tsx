import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BottomSheet from '../shared/BottomSheet';
import { postReadings } from '../../services/api';
import type { BundleResponse } from '../../types';

type GrowthTag = 'good' | 'okay' | 'struggling' | null;

interface LogDataSheetProps {
  open: boolean;
  onClose: () => void;
  farmId: number;
  bundle: BundleResponse | null;
  initialSoil: { pH: number; moisture: number; temperature: number; humidity: number } | null;
  onSuccess?: () => void;
}

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

function NumInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
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
        width: 120,
        ...props.style,
      }}
    />
  );
}

function readSunlight(farmId: number): number {
  const raw = localStorage.getItem(`mycelium:sunlight_hours:${farmId}`);
  if (!raw) return 6;
  const n = parseFloat(raw);
  return isNaN(n) ? 6 : n;
}

export default function LogDataSheet({ open, onClose, farmId, bundle, initialSoil, onSuccess }: LogDataSheetProps) {
  const [pH, setPH] = useState(7.0);
  const [moisture, setMoisture] = useState(50);
  const [temperature, setTemperature] = useState(20);
  const [humidity, setHumidity] = useState(50);
  const [sunlight, setSunlight] = useState(6);
  const [growthTag, setGrowthTag] = useState<GrowthTag>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Pre-fill from soil data whenever sheet opens
  useEffect(() => {
    if (!open) {
      setSuccess(false);
      setError(null);
      setGrowthTag(null);
      return;
    }
    if (initialSoil) {
      setPH(initialSoil.pH);
      setMoisture(initialSoil.moisture);
      setTemperature(initialSoil.temperature);
      setHumidity(initialSoil.humidity);
    }
    setSunlight(readSunlight(farmId));
  }, [open, initialSoil, farmId]);

  const handleSubmit = async () => {
    if (!bundle || !bundle.crop_id) {
      setError('No crop selected. Please select a crop before logging data.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await postReadings(farmId, { crop_id: bundle.crop_id, pH, moisture, temperature, humidity });

      // Persist updated sunlight to localStorage
      localStorage.setItem(`mycelium:sunlight_hours:${farmId}`, String(sunlight));

      // Persist growth tag to localStorage
      if (growthTag && bundle) {
        const today = new Date().toISOString().slice(0, 10);
        const key = `mycelium:growth_note:${farmId}:${bundle.crop_id}:${today}`;
        localStorage.setItem(key, growthTag);
      }

      setSuccess(true);
      onSuccess?.();
      setTimeout(onClose, 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to log data. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const cropName = bundle?.crop_name ?? 'Your crop';

  return (
    <BottomSheet open={open} onClose={onClose} title={`Log data · ${cropName}`}>
      <AnimatePresence mode="wait">
      {success ? (
        <motion.div
          key="success"
          style={{ textAlign: 'center', padding: '24px 0', color: 'var(--success)', fontWeight: 600, fontSize: 15 }}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
        >
          Logged successfully ✓
        </motion.div>
      ) : (
        <div key="form" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Soil readings */}
          <div>
            <p className="overline" style={{ marginBottom: 12 }}>Soil readings</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel htmlFor="log-ph">Soil pH</FieldLabel>
                <NumInput id="log-ph" min={0} max={14} step={0.1} value={pH}
                  onChange={(e) => { const v = parseFloat(e.target.value); setPH(isNaN(v) ? 7 : Math.min(14, Math.max(0, v))); }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel htmlFor="log-moisture">Moisture (%)</FieldLabel>
                <NumInput id="log-moisture" min={0} max={100} step={1} value={moisture}
                  onChange={(e) => { const v = parseFloat(e.target.value); setMoisture(isNaN(v) ? 0 : Math.min(100, Math.max(0, v))); }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel htmlFor="log-temp">Temperature (°C)</FieldLabel>
                <NumInput id="log-temp" step={0.5} value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value) || 20)} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <FieldLabel htmlFor="log-humidity">Humidity (%)</FieldLabel>
                <NumInput id="log-humidity" min={0} max={100} step={1} value={humidity}
                  onChange={(e) => { const v = parseFloat(e.target.value); setHumidity(isNaN(v) ? 0 : Math.min(100, Math.max(0, v))); }} />
              </div>
            </div>
          </div>

          {/* Sunlight */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <FieldLabel htmlFor="log-sunlight">Daily sunlight (hours)</FieldLabel>
            <NumInput id="log-sunlight" min={0} max={16} step={0.5} value={sunlight}
              onChange={(e) => {
                const v = parseFloat(e.target.value);
                setSunlight(isNaN(v) ? 0 : Math.min(16, Math.max(0, v)));
              }} />
          </div>

          {/* Growth health */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Plant health
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['good', 'okay', 'struggling'] as const).map((tag) => {
                const colors: Record<string, string> = { good: 'var(--success)', okay: 'var(--accent)', struggling: 'var(--error)' };
                const isSelected = growthTag === tag;
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setGrowthTag(isSelected ? null : tag)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: `1.5px solid ${isSelected ? colors[tag] : 'var(--border)'}`,
                      background: isSelected ? `${colors[tag]}18` : 'var(--bg-elev)',
                      color: isSelected ? colors[tag] : 'var(--ink-3)',
                      fontWeight: 600,
                      fontSize: 12,
                      textTransform: 'capitalize',
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          <AnimatePresence>
            {error && (
              <motion.span
                key="error"
                style={{ fontSize: 12, color: 'var(--error)', display: 'block' }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                {error}
              </motion.span>
            )}
          </AnimatePresence>

          <button
            type="button"
            className="btn btn--accent btn--full btn--lg"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Saving…' : 'Save reading'}
          </button>
        </div>
      )}
      </AnimatePresence>
    </BottomSheet>
  );
}
