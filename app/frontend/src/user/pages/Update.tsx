import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';
import { useAsync } from '../hooks/useAsync';
import { useTaskCompletion } from '../hooks/useTaskCompletion';
import { getSoilData, getTasks, postReadings, getNode, getReadings } from '../services/api';
import BottomTabBar from '../components/layout/BottomTabBar';
import BundlePicker from '../components/shared/BundlePicker';

export default function Update() {
  const navigate = useNavigate();
  const { farmId } = useFarm();

  const soilState = useAsync(() => getSoilData(farmId!), [farmId]);
  const tasksState = useAsync(() => getTasks(farmId!), [farmId]);
  const nodeState = useAsync(() => getNode(farmId!), [farmId]);
  const { getState, markDone, markSkipped } = useTaskCompletion(farmId!);

  const [selectedCropId, setSelectedCropId] = useState<number | null>(null);

  const readingsState = useAsync(
    () => getReadings(farmId!, 20, selectedCropId ?? undefined),
    [farmId, selectedCropId],
  );

  const [ph, setPh] = useState<number>(7);
  const [moisture, setMoisture] = useState<number>(50);
  const [temperature, setTemperature] = useState<number>(20);
  const [humidity, setHumidity] = useState<number>(50);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    if (soilState.data) {
      setPh(soilState.data.pH);
      setMoisture(soilState.data.moisture);
      setTemperature(soilState.data.temperature);
      setHumidity(soilState.data.humidity);
    }
  }, [soilState.data]);

  const handleConditionsSubmit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    try {
      const cropIds = (nodeState.data ?? []).map(b => b.crop_id);
      const targets = cropIds.length > 0 ? cropIds : [0];
      await Promise.all(
        targets.map(crop_id =>
          postReadings(farmId!, { crop_id, pH: ph, moisture, temperature, humidity })
        )
      );
      setSubmitSuccess(true);
      readingsState.refetch();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to sync. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Custom topbar */}
      <div className="m-topbar">
        <button
          className="btn btn--ghost btn--icon btn--sm"
          onClick={() => navigate(-1)}
          type="button"
          style={{ background: 'rgba(255,255,255,0.1)' }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
            <polyline points="10 4 6 8 10 12" />
          </svg>
        </button>
        <div style={{ fontFamily: 'var(--fd)', fontWeight: 700, fontSize: 15, color: 'var(--inv)' }}>
          Log update
        </div>
        <div style={{ width: 32 }} />
      </div>

      {/* Section 1: Conditions */}
      <div className="m-section">
        <div className="m-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Conditions today</span>
          {(nodeState.data ?? []).length > 1 && (
            <BundlePicker
              bundles={nodeState.data ?? []}
              value={selectedCropId}
              onChange={setSelectedCropId}
            />
          )}
        </div>
        <div className="m-content" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {submitSuccess && (
            <div className="toast toast--s">Readings logged</div>
          )}
          {submitError && (
            <div className="toast toast--e">{submitError}</div>
          )}

          {/* pH field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="overline" htmlFor="upd-ph">Soil pH</label>
            <input
              id="upd-ph"
              type="number"
              min={0}
              max={14}
              step={0.1}
              value={ph}
              onChange={e => setPh(parseFloat(e.target.value) || 7)}
              style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--bg-elev)', color: 'var(--ink)', outline: 'none', maxWidth: 160 }}
            />
          </div>

          {/* Moisture field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="overline" htmlFor="upd-moisture">Moisture (%)</label>
            <input
              id="upd-moisture"
              type="number"
              min={0}
              max={100}
              step={1}
              value={moisture}
              onChange={e => setMoisture(parseFloat(e.target.value) || 50)}
              style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--bg-elev)', color: 'var(--ink)', outline: 'none', maxWidth: 160 }}
            />
          </div>

          {/* Temperature field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="overline" htmlFor="upd-temp">Temperature (°C)</label>
            <input
              id="upd-temp"
              type="number"
              step={0.5}
              value={temperature}
              onChange={e => setTemperature(parseFloat(e.target.value) || 20)}
              style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--bg-elev)', color: 'var(--ink)', outline: 'none', maxWidth: 160 }}
            />
          </div>

          {/* Humidity field */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label className="overline" htmlFor="upd-humidity">Humidity (%)</label>
            <input
              id="upd-humidity"
              type="number"
              min={0}
              max={100}
              step={1}
              value={humidity}
              onChange={e => setHumidity(parseFloat(e.target.value) || 50)}
              style={{ padding: '10px 14px', border: '1.5px solid var(--border)', borderRadius: 'var(--r-md)', fontSize: 14, background: 'var(--bg-elev)', color: 'var(--ink)', outline: 'none', maxWidth: 160 }}
            />
          </div>

          <button
            className="btn btn--accent btn--full"
            disabled={submitting}
            onClick={handleConditionsSubmit}
            type="button"
          >
            {submitting ? 'Syncing…' : 'Sync conditions'}
          </button>
        </div>
      </div>

      {/* Section 2: Task checklist */}
      <div className="m-section">
        <span className="m-section-title">Task progress</span>
        <div className="m-content" style={{ padding: '8px 0' }}>
          {tasksState.loading && (
            <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>Loading tasks…</div>
          )}
          {tasksState.data?.map(task => {
            const state = getState(task.id);
            return (
              <div
                key={task.id}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--border-lt)' }}
              >
                <button
                  className={`toggle${state === 'done' ? ' toggle--on' : ''}`}
                  onClick={() => state !== 'done' && markDone(task.id)}
                  type="button"
                >
                  <span className="toggle__k" />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, textDecoration: state === 'done' ? 'line-through' : 'none', color: state ? 'var(--ink-3)' : 'var(--ink)' }}>
                    {task.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>{task.subtitle}</div>
                </div>
                {state === 'done' && <span className="badge badge--success">Done</span>}
                {state === 'skipped' && <span className="badge badge--info">Skipped</span>}
                {!state && (
                  <button className="btn btn--secondary btn--sm" onClick={() => markSkipped(task.id)} type="button">
                    Skip
                  </button>
                )}
              </div>
            );
          })}
          {!tasksState.loading && (tasksState.data?.length === 0) && (
            <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>No tasks for this cycle yet.</div>
          )}
        </div>
      </div>

      {/* Section 3: Reading history */}
      <div className="m-section">
        <div className="m-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Reading history</span>
          {(nodeState.data ?? []).length > 1 && (
            <BundlePicker
              bundles={nodeState.data ?? []}
              value={selectedCropId}
              onChange={setSelectedCropId}
            />
          )}
        </div>
        <div style={{ padding: '0' }}>
          {readingsState.loading && (
            <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>Loading history…</div>
          )}
          {readingsState.error && (
            <div style={{ padding: '16px 20px', color: 'var(--error)', fontSize: 13 }}>{readingsState.error}</div>
          )}
          {!readingsState.loading && !readingsState.error && (readingsState.data ?? []).length === 0 && (
            <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>No readings logged yet.</div>
          )}
          {(readingsState.data ?? []).slice().reverse().map(r => {
            const d = new Date(r.recorded_at);
            const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
            const cropName = (nodeState.data ?? []).find(b => b.crop_id === r.crop_id)?.crop_name;
            return (
              <div
                key={r.id}
                style={{ padding: '12px 20px', borderBottom: '1px solid var(--border-lt)', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>
                    {dateLabel} · {timeLabel}
                  </span>
                  {cropName && (
                    <span className="badge badge--info">{cropName}</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    <span className="overline" style={{ marginRight: 4 }}>pH</span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.pH.toFixed(1)}</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    <span className="overline" style={{ marginRight: 4 }}>Moist</span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.moisture}%</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    <span className="overline" style={{ marginRight: 4 }}>Temp</span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.temperature}°C</span>
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    <span className="overline" style={{ marginRight: 4 }}>Hum</span>
                    <span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.humidity}%</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ height: 80 }} />

      <BottomTabBar
        activeTab="farm"
        onTabChange={(tab) => { if (tab === 'food') navigate('/wallet'); }}
        onAddPlot={() => navigate('/dashboard')}
      />
    </div>
  );
}
