import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { ReadingEntryResponse } from '../../types';
import { tokens } from '../../tokens';

type Metric = 'moisture' | 'temperature' | 'pH' | 'humidity';

interface DataTrendsChartProps {
  readings: ReadingEntryResponse[];
  metric: Metric;
  onMetricChange: (m: Metric) => void;
  desktop?: boolean;
}

const TABS: { label: string; key: Metric }[] = [
  { label: 'Moisture', key: 'moisture' },
  { label: 'Temp', key: 'temperature' },
  { label: 'pH', key: 'pH' },
];

function metricColor(metric: Metric): string {
  switch (metric) {
    case 'moisture': return tokens.info;
    case 'temperature': return tokens.accent;
    case 'pH': return tokens.success;
    case 'humidity': return tokens.info;
  }
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// Custom tick renderers for recharts — avoids CSSProperties vs SVGProps conflict
function CustomXTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: string } }) {
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={0} y={0} dy={10} textAnchor="middle" fill="#9E9A94" fontSize={8}>
        {payload?.value ?? ''}
      </text>
    </g>
  );
}

function CustomYTick({ x, y, payload }: { x?: number; y?: number; payload?: { value: number } }) {
  return (
    <g transform={`translate(${x ?? 0},${y ?? 0})`}>
      <text x={0} y={0} dy={3} textAnchor="end" fill="#9E9A94" fontSize={8}>
        {payload?.value ?? ''}
      </text>
    </g>
  );
}

interface AreaChartBlockProps {
  readings: ReadingEntryResponse[];
  metric: Metric;
  height: number;
  gradientId: string;
}

function AreaChartBlock({ readings, metric, height, gradientId }: AreaChartBlockProps) {
  const color = metricColor(metric);
  const data = readings.map(r => ({ date: formatDate(r.recorded_at), value: r[metric] }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.18} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <XAxis
          dataKey="date"
          tick={<CustomXTick />}
          tickLine={false}
          axisLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={<CustomYTick />}
          tickLine={false}
          axisLine={false}
          width={36}
        />
        <Tooltip
          contentStyle={{ fontSize: 11, borderRadius: 4, border: '1px solid var(--border-lt)', background: 'var(--bg-elev)' }}
          labelStyle={{ color: 'var(--ink-2)' }}
          itemStyle={{ color }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          dot={false}
          activeDot={{ r: 4, fill: color }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

const EmptyState = () => (
  <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--ink-3)', fontSize: 13 }}>
    Log readings to see trends here
  </div>
);

export default function DataTrendsChart({
  readings,
  metric,
  onMetricChange,
  desktop = false,
}: DataTrendsChartProps) {
  if (desktop) {
    return (
      <div className="viz-panel">
        <div className="viz-panel-header">
          <span className="viz-panel-title">Zone data trends</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {TABS.map(t => (
              <button
                key={t.key}
                className={`chart-tab${metric === t.key ? ' chart-tab--on' : ''}`}
                type="button"
                style={{ padding: '5px 8px' }}
                onClick={() => onMetricChange(t.key)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="viz-panel-body">
          {readings.length < 1 ? (
            <EmptyState />
          ) : (
            <AreaChartBlock
              readings={readings}
              metric={metric}
              height={200}
              gradientId={`fill-d-${metric}`}
            />
          )}
        </div>
      </div>
    );
  }

  // Mobile: always-visible panel (matches desktop viz-panel style)
  return (
    <div className="viz-panel">
      <div className="viz-panel-header">
        <span className="viz-panel-title">Zone data trends</span>
        <div style={{ display: 'flex', gap: 6 }}>
          {TABS.map(t => (
            <button
              key={t.key}
              className={`chart-tab${metric === t.key ? ' chart-tab--on' : ''}`}
              type="button"
              style={{ padding: '4px 8px' }}
              onClick={() => onMetricChange(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="viz-panel-body">
        {readings.length < 1 ? (
          <EmptyState />
        ) : (
          <AreaChartBlock
            readings={readings}
            metric={metric}
            height={140}
            gradientId={`fill-m-${metric}`}
          />
        )}
      </div>
    </div>
  );
}
