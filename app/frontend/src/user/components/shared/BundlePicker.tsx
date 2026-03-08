import { useState, useRef, useEffect } from 'react';
import type { BundleResponse } from '../../types';

interface BundlePickerProps {
  bundles: BundleResponse[];
  value: number | null;
  onChange: (id: number | null) => void;
  defaultLabel?: string;
}

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
      {open && (
        <div className="zone-pick-menu">
          <button
            type="button"
            className={`zone-pick-opt${value === null ? ' zone-pick-opt--on' : ''}`}
            onClick={() => { onChange(null); setOpen(false); }}
          >{defaultLabel}</button>
          {bundles.map(b => (
            <button
              key={b.crop_id}
              type="button"
              className={`zone-pick-opt${value === b.crop_id ? ' zone-pick-opt--on' : ''}`}
              onClick={() => { onChange(b.crop_id); setOpen(false); }}
            >{b.crop_name}</button>
          ))}
        </div>
      )}
    </div>
  );
}
