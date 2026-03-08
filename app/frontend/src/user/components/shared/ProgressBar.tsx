import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0–100
}

export default function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="pbar">
      <motion.div
        className="pbar-fill"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}
