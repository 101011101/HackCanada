import { useState, useEffect, useRef } from 'react';

interface StatsRowProps {
  totalGrownKg: number;
  cyclesComplete: number;
  thisTargetKg: number;
  dayOfCycle: number;
  totalDays: number;
}

function AnimatedNumber({ value, decimals = 1 }: { value: number; decimals?: number }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);

  useEffect(() => {
    const start = prev.current;
    const end = value;
    const duration = 700;
    const startTime = Date.now();

    const tick = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + (end - start) * eased);
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = end;
    };

    requestAnimationFrame(tick);
  }, [value]);

  return <>{display.toFixed(decimals)}</>;
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
        <div className="m-stat-val"><AnimatedNumber value={totalGrownKg} decimals={1} /> kg</div>
        <div className="m-stat-lbl">Across {cyclesComplete} cycles</div>
      </div>
      <div className="m-stat-card">
        <div className="overline" style={{ marginBottom: 6 }}>This cycle</div>
        <div className="m-stat-val"><AnimatedNumber value={thisTargetKg} decimals={1} /> kg</div>
        <div className="m-stat-lbl">Expected · Day {dayOfCycle} of {totalDays}</div>
      </div>
    </div>
  );
}
