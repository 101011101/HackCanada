import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFarm } from '../store/FarmContext';
import { useAsync } from '../hooks/useAsync';
import { useTaskCompletion } from '../hooks/useTaskCompletion';
import { getNode, getTasks, getSoilData, getBalance, getReadings, getHubs } from '../services/api';
import MobileTopbar from '../components/layout/MobileTopbar';
import DesktopTopbar from '../components/layout/DesktopTopbar';
import DesktopNav from '../components/layout/DesktopNav';
import BottomTabBar from '../components/layout/BottomTabBar';
import HeroSection from '../components/dashboard/HeroSection';
import TaskList from '../components/dashboard/TaskList';
import DataWidget from '../components/dashboard/DataWidget';
import DataTrendsChart from '../components/dashboard/DataTrendsChart';
import StatsRow from '../components/dashboard/StatsRow';
import DesktopTaskPanel from '../components/dashboard/DesktopTaskPanel';
import CropPickerSheet from '../components/sheets/CropPickerSheet';
import MenuSheet from '../components/sheets/MenuSheet';
import AddPlotSheet from '../components/sheets/AddPlotSheet';
import LogDataSheet from '../components/sheets/LogDataSheet';
import BundlePicker from '../components/shared/BundlePicker';
import MyFoodContentFull from '@/components/myfood/MyFoodContentFull';
import type { HubEntry } from '../types';

type Metric = 'moisture' | 'temperature' | 'pH' | 'humidity';

function kmBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function Dashboard() {
  const { farmId, farmLat, farmLng } = useFarm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [menuOpen, setMenuOpen] = useState(false);
  const [cropSheetOpen, setCropSheetOpen] = useState(false);
  const [addPlotOpen, setAddPlotOpen] = useState(false);
  const [desktopView, setDesktopView] = useState<'tasks' | 'zone'>('tasks');
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [chartMetric, setChartMetric] = useState<Metric>('moisture');
  const [zoneSelectedCropId, setZoneSelectedCropId] = useState<number | null>(null);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [logSheetCropId, setLogSheetCropId] = useState<number | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'farm' | 'food'>(() =>
    searchParams.get('tab') === 'food' ? 'food' : 'farm'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'food') setActiveTab('food');
    else if (tab !== 'food' && tab !== null) setActiveTab('farm');
  }, [searchParams]);

  const setActiveTabWithUrl = (tab: 'farm' | 'food') => {
    setActiveTab(tab);
    const next = new URLSearchParams(searchParams);
    if (tab === 'food') next.set('tab', 'food'); else next.delete('tab');
    setSearchParams(next, { replace: true });
  };

  // Parallel data fetches
  const nodeState = useAsync(() => getNode(farmId!), [farmId]);
  const tasksState = useAsync(() => getTasks(farmId!), [farmId]);
  const soilState = useAsync(() => getSoilData(farmId!), [farmId]);
  const balanceState = useAsync(() => getBalance(farmId!), [farmId]);
  const readingsState = useAsync(
    () => getReadings(farmId!, 30, zoneSelectedCropId ?? undefined),
    [farmId, zoneSelectedCropId],
  );
  const hubsState = useAsync(() => getHubs(), []);

  const { getState, markDone, markSkipped } = useTaskCompletion(farmId ?? 0);

  // Derived values
  const bundle = nodeState.data?.[0] ?? null;
  const bundles = nodeState.data ?? [];
  const tasks = tasksState.data ?? [];
  const soil = soilState.data ?? null;
  const readings = readingsState.data ?? [];
  const allHubs: HubEntry[] = hubsState.data ?? [];
  const reversedReadings = useMemo(() => readings.slice().reverse(), [readings]);
  const nearbyHubs = useMemo(() => {
    if (farmLat !== null && farmLng !== null) {
      return allHubs
        .map(h => ({ ...h, distKm: kmBetween(farmLat, farmLng, h.lat, h.lng) }))
        .sort((a, b) => a.distKm - b.distKm)
        .slice(0, 4);
    }
    return allHubs.slice(0, 4).map(h => ({ ...h, distKm: null as number | null }));
  }, [allHubs, farmLat, farmLng]);

  const totalGrownKg = balanceState.data
    ? Object.values(balanceState.data.crops_lifetime).reduce((a, b) => a + b, 0)
    : 0;

  const monthsFarming = bundle?.joined_at
    ? Math.max(0, Math.floor((Date.now() - new Date(bundle.joined_at).getTime()) / (1000 * 60 * 60 * 24 * 30)))
    : 0;

  const totalDays = (bundle?.grow_weeks ?? 14) * 7;
  const cycleStart = bundle?.cycle_start_date ? new Date(bundle.cycle_start_date) : new Date();
  const dayOfCycle = Math.min(totalDays, Math.max(1, Math.ceil((Date.now() - cycleStart.getTime()) / (1000 * 60 * 60 * 24))));
  const progressPct = Math.round((dayOfCycle / totalDays) * 100);

  const cycleEnd = new Date(cycleStart);
  cycleEnd.setDate(cycleEnd.getDate() + totalDays);

  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const cycleStartLabel = fmt(cycleStart);
  const cycleEndLabel = fmt(cycleEnd);

  const moisture = soil ? {
    value: soil.moisture,
    status: soil.moisture >= 40 && soil.moisture <= 80 ? 'Optimal' : soil.moisture < 40 ? 'Low' : 'High',
  } : null;
  const tempDelta = (() => {
    if (readings.length < 2) return '';
    const diff = readings.at(-1)!.temperature - readings.at(-2)!.temperature;
    if (diff === 0) return '';
    return `${diff > 0 ? '+' : ''}${diff.toFixed(1)}°`;
  })();
  const temperature = soil ? { value: soil.temperature, delta: tempDelta } : null;
  const updatedMinutesAgo = readings.length > 0
    ? Math.floor((Date.now() - new Date(readings.at(-1)!.recorded_at).getTime()) / 60000)
    : null;

  if (!farmId) {
    return (
      <div style={{ padding: 24, background: 'var(--bg)', minHeight: '100vh' }}>
        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No farm found. Please complete setup first.</p>
      </div>
    );
  }

  return (
    <>
      {/* ── MOBILE LAYOUT ── */}
      <div className="shell m-only">
        <MobileTopbar onOpenMenu={() => setMenuOpen(true)} />

        {activeTab === 'food' ? (
          <MyFoodContentFull nodeId={farmId} />
        ) : (
        <>
        {/* Hero */}
        {nodeState.loading && (
          <div className="m-hero">
            <div style={{ padding: 24, color: 'var(--inv)', opacity: 0.5 }}>Loading…</div>
          </div>
        )}
        {nodeState.error && (
          <div className="toast toast--e" style={{ margin: 16 }}>
            {nodeState.error}{' '}
            <button className="btn btn--ghost btn--sm" onClick={nodeState.refetch} type="button">Retry</button>
          </div>
        )}
        {bundle && (
          <HeroSection
            bundle={bundle}
            totalGrownKg={totalGrownKg}
            monthsFarming={monthsFarming}
            dayOfCycle={dayOfCycle}
            totalDays={totalDays}
            progressPct={progressPct}
            cycleStartLabel={cycleStartLabel}
            cycleEndLabel={cycleEndLabel}
          />
        )}

        {/* Tasks */}
        {tasksState.loading && (
          <div className="m-section">
            <span className="m-section-title">Your tasks today</span>
            <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>Loading tasks…</div>
          </div>
        )}
        {tasksState.error && (
          <div className="m-section">
            <span className="m-section-title">Your tasks today</span>
            <div style={{ padding: '16px 20px' }}>
              <div style={{ color: 'var(--error)', fontSize: 13, marginBottom: 8 }}>{tasksState.error}</div>
              <button className="btn btn--secondary btn--sm" onClick={tasksState.refetch} type="button">Retry</button>
            </div>
          </div>
        )}
        {!tasksState.loading && !tasksState.error && (
          !bundle ? (
            <div className="m-section">
              <span className="m-section-title">Your tasks today</span>
              <div style={{ padding: '16px 20px', color: 'var(--ink-3)', fontSize: 13 }}>
                Your first instructions are being prepared.
              </div>
            </div>
          ) : (
            <TaskList farmId={farmId} tasks={tasks} />
          )
        )}

        {/* Data widget + chart */}
        <div className="m-section">
          <div className="m-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Zone conditions</span>
            {bundles.length > 1 && (
              <BundlePicker
                bundles={bundles}
                value={zoneSelectedCropId}
                onChange={setZoneSelectedCropId}
                defaultLabel="All zones"
              />
            )}
          </div>
          <div style={{ padding: '16px 20px 0' }}>
            {(() => {
              const zoneBundle = (zoneSelectedCropId !== null ? bundles.find(b => b.crop_id === zoneSelectedCropId) : null) ?? bundle;
              return (
                <DataWidget
                  farmId={farmId}
                  zoneName={zoneBundle ? `${zoneBundle.crop_name} zone` : 'Your zone'}
                  updatedMinutesAgo={null}
                  moisture={moisture}
                  temperature={temperature}
                  pH={soil?.pH ?? null}
                />
              );
            })()}
          </div>
          <div style={{ padding: '16px 20px 0' }}>
            <DataTrendsChart
              readings={readings}
              metric={chartMetric}
              onMetricChange={setChartMetric}
            />
          </div>
        </div>

        {/* Reading history */}
        <div className="m-section">
          {!historyOpen ? (
            /* Collapsed — same card width/padding as DataTrendsChart, shows latest 3 */
            <div style={{ padding: '16px 20px 16px' }}>
              <div className="viz-panel">
                <div
                  className="viz-panel-header"
                  style={{ cursor: 'pointer' }}
                  onClick={() => setHistoryOpen(true)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => e.key === 'Enter' && setHistoryOpen(true)}
                >
                  <span className="viz-panel-title">Reading history</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {readings.length > 0 && (
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{readings.length} entries</span>
                    )}
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" width="12" height="12">
                      <polyline points="4 6 8 10 12 6" />
                    </svg>
                  </div>
                </div>
                {readingsState.loading && (
                  <div style={{ padding: '14px 18px', color: 'var(--ink-3)', fontSize: 13 }}>Loading…</div>
                )}
                {!readingsState.loading && readings.length === 0 && (
                  <div style={{ padding: '14px 18px', color: 'var(--ink-3)', fontSize: 13 }}>No readings logged yet.</div>
                )}
                {reversedReadings.slice(0, 3).map((r, i) => {
                  const d = new Date(r.recorded_at);
                  const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const cropName = bundles.find(b => b.crop_id === r.crop_id)?.crop_name;
                  return (
                    <div key={r.id} style={{ padding: '10px 18px', borderTop: i === 0 ? 'none' : '1px solid var(--border-lt)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{dateLabel} · {timeLabel}</span>
                        {cropName && <span className="badge badge--info">{cropName}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>pH</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.pH.toFixed(1)}</span></span>
                        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Moist</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.moisture}%</span></span>
                        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Temp</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.temperature}°C</span></span>
                        <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Hum</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.humidity}%</span></span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Expanded — full width, white bg, top gap, sticky header */
            <div style={{ background: 'var(--bg-elev)', marginTop: 16 }}>
              <div style={{ position: 'sticky', top: 52, zIndex: 54, background: 'var(--bg-elev)', borderBottom: '1px solid var(--border-lt)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px' }}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Reading history</span>
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => setHistoryOpen(false)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" width="11" height="11">
                    <polyline points="4 10 8 6 12 10" />
                  </svg>
                  Collapse
                </button>
              </div>
              {readingsState.loading && (
                <div style={{ padding: '14px 20px', color: 'var(--ink-3)', fontSize: 13 }}>Loading history…</div>
              )}
              {!readingsState.loading && readings.length === 0 && (
                <div style={{ padding: '14px 20px', color: 'var(--ink-3)', fontSize: 13 }}>No readings logged yet.</div>
              )}
              {reversedReadings.map((r, i) => {
                const d = new Date(r.recorded_at);
                const dateLabel = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeLabel = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                const cropName = bundles.find(b => b.crop_id === r.crop_id)?.crop_name;
                return (
                  <div key={r.id} style={{ padding: '10px 20px', borderTop: i === 0 ? 'none' : '1px solid var(--border-lt)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink)' }}>{dateLabel} · {timeLabel}</span>
                      {cropName && <span className="badge badge--info">{cropName}</span>}
                    </div>
                    <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>pH</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.pH.toFixed(1)}</span></span>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Moist</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.moisture}%</span></span>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Temp</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.temperature}°C</span></span>
                      <span style={{ fontSize: 12, color: 'var(--ink-2)' }}><span className="overline" style={{ marginRight: 4 }}>Hum</span><span style={{ fontFamily: 'var(--fd)', fontWeight: 700 }}>{r.humidity}%</span></span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Stats */}
        {bundle && (
          <StatsRow
            totalGrownKg={totalGrownKg}
            cyclesComplete={bundle.cycle_number ?? 1}
            thisTargetKg={bundle.quantity_kg}
            dayOfCycle={dayOfCycle}
            totalDays={totalDays}
          />
        )}

        {/* Nearby hubs */}
        {nearbyHubs.length > 0 && (
          <div className="m-section">
            <span className="m-section-title">Nearby hubs</span>
            {nearbyHubs.map(hub => (
              <div key={hub.id} className="hub-row">
                <div className="hub-row-icon">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" width="14" height="14">
                    <circle cx="8" cy="7" r="3" />
                    <path d="M8 2C5.24 2 3 4.24 3 7c0 4 5 8 5 8s5-4 5-8c0-2.76-2.24-5-5-5Z" />
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="hub-row-name">{hub.name}</div>
                  <div className="hub-row-sub">
                    {hub.distKm !== null ? `${hub.distKm < 1 ? (hub.distKm * 1000).toFixed(0) + ' m' : hub.distKm.toFixed(1) + ' km'} away · ` : ''}
                    {hub.capacity_kg} kg capacity
                  </div>
                </div>
                <span className={`badge hub-badge--${hub.priority}`}>{hub.priority}</span>
              </div>
            ))}
          </div>
        )}

        </>
        )}

        <BottomTabBar
          activeTab={activeTab}
          onTabChange={setActiveTabWithUrl}
          onAddPlot={() => setCropSheetOpen(true)}
        />
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="shell d-only">
        <DesktopTopbar activeTab={activeTab} onTabChange={setActiveTabWithUrl} />
        {activeTab === 'food' ? (
          <div className="d-data-body" style={{ padding: 24 }}>
            <MyFoodContentFull nodeId={farmId} />
          </div>
        ) : bundle ? (
          <>
            <HeroSection
              bundle={bundle}
              totalGrownKg={totalGrownKg}
              monthsFarming={monthsFarming}
              dayOfCycle={dayOfCycle}
              totalDays={totalDays}
              progressPct={progressPct}
              cycleStartLabel={cycleStartLabel}
              cycleEndLabel={cycleEndLabel}
            />
            <DesktopNav
              activeView={desktopView}
              onSelect={setDesktopView}
              onOpenCropPicker={() => setCropSheetOpen(true)}
            />

            {desktopView === 'tasks' && (
              <DesktopTaskPanel
                tasks={tasks}
                selectedId={selectedTaskId}
                onSelect={setSelectedTaskId}
                onMarkDone={markDone}
                onSkip={markSkipped}
                getState={getState}
              />
            )}

            {desktopView === 'zone' && (
              <div className="d-data-body">
                <div>
                  <DataWidget
                    farmId={farmId}
                    zoneName={bundle ? `${bundle.crop_name} zone` : 'Your zone'}
                    updatedMinutesAgo={updatedMinutesAgo}
                    moisture={moisture}
                    temperature={temperature}
                    pH={soil?.pH ?? null}
                  />
                </div>
                <div>
                  <DataTrendsChart
                    readings={readings}
                    metric={chartMetric}
                    onMetricChange={setChartMetric}
                    desktop
                  />
                </div>
              </div>
            )}
          </>
        ) : null}
      </div>

      {/* ── SHEETS (rendered once, outside both shells) ── */}
      <CropPickerSheet
        open={cropSheetOpen}
        onClose={() => setCropSheetOpen(false)}
        bundles={bundles}
        loading={nodeState.loading}
        onAddPlot={() => { setCropSheetOpen(false); setAddPlotOpen(true); }}
        onLogData={(cropId) => { setLogSheetCropId(cropId); setCropSheetOpen(false); setLogSheetOpen(true); }}
      />
      <LogDataSheet
        open={logSheetOpen}
        onClose={() => setLogSheetOpen(false)}
        farmId={farmId}
        bundle={bundles.find(b => b.crop_id === logSheetCropId) ?? null}
        initialSoil={soil}
        onSuccess={() => { readingsState.refetch(); soilState.refetch(); }}
      />
      <AddPlotSheet
        open={addPlotOpen}
        onClose={() => setAddPlotOpen(false)}
      />
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        onCropSuggestions={() => { setMenuOpen(false); setAddPlotOpen(true); }}
        onRequestAssistance={() => setMenuOpen(false)}
        onRestartCycle={() => setMenuOpen(false)}
        onProfile={() => { setMenuOpen(false); navigate('/profile'); }}
        onReportProblem={() => setMenuOpen(false)}
      />
    </>
  );
}
