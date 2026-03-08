interface ProgressBarProps {
  value: number; // 0–100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="pbar">
      <div className="pbar-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}
