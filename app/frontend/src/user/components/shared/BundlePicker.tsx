import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BundleResponse } from '../../types';

interface BundlePickerProps {
  bundles: BundleResponse[];
  value: number | null;
  onChange: (id: number | null) => void;
  defaultLabel?: string;
}

const menuItemVariants = {
  hidden: { opacity: 0, x: -4 },
  visible: { opacity: 1, x: 0 },
};

const menuContainerVariants = {
  visible: { transition: { staggerChildren: 0.04 } },
};

export default function BundlePicker({ bundles, value, onChange, defaultLabel = 'All' }: BundlePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const label = value === null
    ? defaultLabel
    : bundles.find(b => b.crop_id === value)?.crop_name ?? defaultLabel;

  return (
    <div ref={ref} className="zone-pick-wrap">
      <button type="button" className="zone-pick-trigger" onClick={() => setOpen(o => !o)}>
        {label}
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" width="9" height="9"
          style={{ transition: 'transform .15s', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            className="zone-pick-menu"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            <motion.div variants={menuContainerVariants} initial="hidden" animate="visible">
              <motion.button
                type="button"
                className={`zone-pick-opt${value === null ? ' zone-pick-opt--on' : ''}`}
                onClick={() => { onChange(null); setOpen(false); }}
                variants={menuItemVariants}
              >{defaultLabel}</motion.button>
              {bundles.map(b => (
                <motion.button
                  key={`${b.farm_id}-${b.crop_id}`}
                  type="button"
                  className={`zone-pick-opt${value === b.crop_id ? ' zone-pick-opt--on' : ''}`}
                  onClick={() => { onChange(b.crop_id); setOpen(false); }}
                  variants={menuItemVariants}
                >{b.crop_name}</motion.button>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
