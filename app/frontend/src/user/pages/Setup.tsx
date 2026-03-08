import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import StepPlotBasics from '../components/setup/StepPlotBasics';
import type { PlotBasicsDraft } from '../components/setup/StepPlotBasics';

interface SetupProps {
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4;

interface StepSoilDraft {
  pH: number;
  moisture: number;
}

interface StepClimateDraft {
  temperature: number;
  humidity: number;
}

interface StepResourcesDraft {
  tools: 'basic' | 'intermediate' | 'advanced';
  budget: 'low' | 'medium' | 'high';
  max_delivery_distance_m: number | null;  // null = network default (5 km)
}

const DEFAULT_PLOT_BASICS: PlotBasicsDraft = {
  name: '',
  lat: null,
  lng: null,
  plot_size_sqft: 0,
  plot_type: '',
  sunlight_hours: 6,
};

const DEFAULT_SOIL: StepSoilDraft = { pH: 7.0, moisture: 50 };
const DEFAULT_CLIMATE: StepClimateDraft = { temperature: 20, humidity: 50 };
const DEFAULT_RESOURCES: StepResourcesDraft = { tools: 'basic', budget: 'low', max_delivery_distance_m: null };

export default function Setup({ onComplete: _onComplete }: SetupProps) {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [plotBasics, setPlotBasics] = useState<PlotBasicsDraft>(DEFAULT_PLOT_BASICS);
  const [soil, setSoil] = useState<StepSoilDraft>(DEFAULT_SOIL);
  const [climate, setClimate] = useState<StepClimateDraft>(DEFAULT_CLIMATE);
  const [resources, setResources] = useState<StepResourcesDraft>(DEFAULT_RESOURCES);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = () => {
    setError(null);
    if (plotBasics.plot_type === '') {
      setError('Please select a plot type.');
      return;
    }

    // Don't create the farm here — pass all collected data to the Suggestions
    // page, which creates the farm once the user has chosen their crops.
    navigate('/suggestions', {
      state: {
        formData: {
          name:           plotBasics.name,
          lat:            plotBasics.lat,
          lng:            plotBasics.lng,
          plot_size_sqft: plotBasics.plot_size_sqft,
          plot_type:      plotBasics.plot_type,
          sunlight_hours: plotBasics.sunlight_hours,
          tools:          resources.tools,
          budget:         resources.budget,
          max_delivery_distance_m: resources.max_delivery_distance_m,
          pH:             soil.pH,
          moisture:       soil.moisture,
          temperature:    climate.temperature,
          humidity:       climate.humidity,
        },
      },
    });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '32px 20px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 480 }}>
        {/* Step indicator */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 28,
          }}
        >
          {([1, 2, 3, 4] as Step[]).map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: 3,
                borderRadius: 'var(--r-pill)',
                background: s <= step ? 'var(--accent)' : 'var(--border)',
              }}
            />
          ))}
        </div>

        {step === 1 && (
          <StepPlotBasics
            draft={plotBasics}
            onChange={setPlotBasics}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Soil conditions
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="soil-ph"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Soil pH
              </label>
              <input
                id="soil-ph"
                type="number"
                min={0}
                max={14}
                step={0.1}
                value={soil.pH}
                onChange={(e) => setSoil({ ...soil, pH: parseFloat(e.target.value) || 7.0 })}
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="soil-moisture"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Moisture (%)
              </label>
              <input
                id="soil-moisture"
                type="number"
                min={0}
                max={100}
                step={1}
                value={soil.moisture}
                onChange={(e) => setSoil({ ...soil, moisture: parseFloat(e.target.value) || 50 })}
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
            </div>

            <button
              type="button"
              className="btn btn--secondary btn--sm"
              onClick={() => setSoil(DEFAULT_SOIL)}
            >
              Use defaults
            </button>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn--secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--primary"
                style={{ flex: 1 }}
                onClick={() => setStep(3)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Climate
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="climate-temp"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Temperature (°C)
              </label>
              <input
                id="climate-temp"
                type="number"
                step={0.5}
                value={climate.temperature}
                onChange={(e) =>
                  setClimate({ ...climate, temperature: parseFloat(e.target.value) || 20 })
                }
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
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label
                htmlFor="climate-humidity"
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Humidity (%)
              </label>
              <input
                id="climate-humidity"
                type="number"
                min={0}
                max={100}
                step={1}
                value={climate.humidity}
                onChange={(e) =>
                  setClimate({ ...climate, humidity: parseFloat(e.target.value) || 50 })
                }
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
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn--secondary" onClick={() => setStep(2)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--primary"
                style={{ flex: 1 }}
                onClick={() => setStep(4)}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <h2
              style={{
                fontFamily: 'var(--fd)',
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Resources
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Tools
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['basic', 'intermediate', 'advanced'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    className={`btn btn--sm ${resources.tools === t ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setResources({ ...resources, tools: t })}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span
                style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}
              >
                Budget
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['low', 'medium', 'high'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    className={`btn btn--sm ${resources.budget === b ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setResources({ ...resources, budget: b })}
                    style={{ textTransform: 'capitalize' }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Delivery Radius
              </span>
              <p style={{ fontSize: 12, color: 'var(--ink-2)', margin: 0 }}>
                How far are you willing to travel to deliver to a hub? Your nearest hub is always primary.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {([
                  { label: '1 km', value: 1000 },
                  { label: '2 km', value: 2000 },
                  { label: '3 km', value: 3000 },
                  { label: '5 km', value: null },
                ] as { label: string; value: number | null }[]).map(({ label, value }) => (
                  <button
                    key={label}
                    type="button"
                    className={`btn btn--sm ${resources.max_delivery_distance_m === value ? 'btn--primary' : 'btn--secondary'}`}
                    onClick={() => setResources({ ...resources, max_delivery_distance_m: value })}
                  >
                    {label}{value === null ? ' (default)' : ''}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <p style={{ color: 'var(--error)', fontSize: 13 }}>{error}</p>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="btn btn--secondary" onClick={() => setStep(3)}>
                Back
              </button>
              <button
                type="button"
                className="btn btn--accent"
                style={{ flex: 1 }}
                onClick={handleSubmit}
              >
                Connect to network
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
