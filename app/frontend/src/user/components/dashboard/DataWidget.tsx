interface DataWidgetProps {
  farmId: number;
  zoneName: string;
  updatedMinutesAgo: number | null;
  moisture: { value: number; status: string } | null;
  temperature: { value: number; delta: string } | null;
}

/**
 * Reads sunlight hours from localStorage key "mycelium:sunlight_hours:{farmId}".
 * Returns the value as a number, or null if absent / invalid.
 */
function readSunlightHours(farmId: number): number | null {
  const raw = localStorage.getItem(`mycelium:sunlight_hours:${farmId}`);
  if (raw === null) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

export default function DataWidget({
  farmId,
  zoneName,
  updatedMinutesAgo,
  moisture,
  temperature,
}: DataWidgetProps) {
  const sunlightHours = readSunlightHours(farmId);

  const timestampLabel =
    updatedMinutesAgo !== null ? `${updatedMinutesAgo} min ago` : '—';

  const moistureStatus = moisture?.status ?? '';
  const moistureDeltaClass =
    moistureStatus === 'Optimal' ? 'delta--up' : 'delta--dn';

  return (
    <div className="data-widget">
      <div className="data-widget-header">
        <span className="data-widget-title">{zoneName}</span>
        <span className="data-widget-ts">{timestampLabel}</span>
      </div>

      <div className="data-readings">
        {/* Moisture */}
        <div className="data-reading">
          <div
            className="data-reading-icon"
            style={{ background: 'rgba(91,141,239,0.12)' }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--info)"
              strokeWidth={1.5}
              width={12}
              height={12}
            >
              <path d="M8 2C8 2 4 6 4 11a4 4 0 0 0 8 0C12 6 8 2 8 2Z" />
            </svg>
          </div>
          <div
            className="data-reading-val"
            style={{ color: 'var(--info)' }}
          >
            {moisture !== null ? `${moisture.value}%` : '—'}
          </div>
          <div className="data-reading-lbl">Moisture</div>
          {moisture !== null && (
            <div className={`data-reading-delta ${moistureDeltaClass}`}>
              {moisture.status}
            </div>
          )}
        </div>

        {/* Temperature */}
        <div className="data-reading">
          <div
            className="data-reading-icon"
            style={{ background: 'rgba(232,145,58,0.12)' }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--accent)"
              strokeWidth={1.5}
              width={12}
              height={12}
            >
              <path d="M8 9V4a1 1 0 0 0-2 0v5a3 3 0 1 0 2 0Z" />
            </svg>
          </div>
          <div
            className="data-reading-val"
            style={{ color: 'var(--accent)' }}
          >
            {temperature !== null ? `${temperature.value}°C` : '—'}
          </div>
          <div className="data-reading-lbl">Temp</div>
          {temperature !== null && (
            <div className="data-reading-delta delta--dn">
              {temperature.delta}
            </div>
          )}
        </div>

        {/* Sunlight — from localStorage, not live API */}
        <div className="data-reading">
          <div
            className="data-reading-icon"
            style={{ background: 'rgba(76,175,80,0.12)' }}
          >
            <svg
              viewBox="0 0 16 16"
              fill="none"
              stroke="var(--success)"
              strokeWidth={1.5}
              width={12}
              height={12}
            >
              <circle cx={8} cy={8} r={3} />
              <line x1={8} y1={1} x2={8} y2={3} />
              <line x1={8} y1={13} x2={8} y2={15} />
              <line x1={1} y1={8} x2={3} y2={8} />
              <line x1={13} y1={8} x2={15} y2={8} />
            </svg>
          </div>
          <div
            className="data-reading-val"
            style={{ color: 'var(--success)' }}
          >
            {sunlightHours !== null
              ? `${sunlightHours.toFixed(1)}h`
              : '—'}
          </div>
          <div className="data-reading-lbl">Sunlight</div>
          <div className="data-reading-delta" style={{ color: 'var(--ink-3)' }}>
            From setup
          </div>
        </div>
      </div>
    </div>
  );
}
