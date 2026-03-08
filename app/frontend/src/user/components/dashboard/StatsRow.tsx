interface StatsRowProps {
  totalGrownKg: number;
  cyclesComplete: number;
  thisTargetKg: number;
  dayOfCycle: number;
  totalDays: number;
}

export default function StatsRow({
  totalGrownKg,
  cyclesComplete,
  thisTargetKg,
  dayOfCycle,
  totalDays,
}: StatsRowProps) {
  return (
    <div className="m-stat-row">
      <div className="m-stat-card">
        <div className="overline" style={{ marginBottom: 6 }}>Total grown</div>
        <div className="m-stat-val">{totalGrownKg.toFixed(1)} kg</div>
        <div className="m-stat-lbl">Across {cyclesComplete} cycles</div>
      </div>
      <div className="m-stat-card">
        <div className="overline" style={{ marginBottom: 6 }}>This cycle</div>
        <div className="m-stat-val">{thisTargetKg} kg</div>
        <div className="m-stat-lbl">Expected · Day {dayOfCycle} of {totalDays}</div>
      </div>
    </div>
  );
}
