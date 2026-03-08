import { motion } from 'framer-motion';

interface ToggleProps {
  on: boolean;
  onChange: (on: boolean) => void;
}

export default function Toggle({ on, onChange }: ToggleProps) {
  return (
    <motion.button
      role="switch"
      aria-checked={on}
      className={`toggle${on ? ' toggle--on' : ''}`}
      onClick={() => onChange(!on)}
      type="button"
      animate={{ backgroundColor: on ? 'var(--success, #4CAF50)' : 'var(--border, #D5D1CB)' }}
      transition={{ duration: 0.25 }}
    >
      <motion.span
        className="toggle__k"
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.button>
  );
}
