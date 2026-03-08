import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface BottomTabBarProps {
  activeTab: 'farm' | 'food';
  onTabChange: (tab: 'farm' | 'food') => void;
  onAddPlot: () => void;
}

export default function BottomTabBar({ activeTab, onTabChange, onAddPlot }: BottomTabBarProps) {
  const farmRef = useRef<HTMLButtonElement>(null);
  const foodRef = useRef<HTMLButtonElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });

  useEffect(() => {
    const activeRef = activeTab === 'farm' ? farmRef : foodRef;
    const el = activeRef.current;
    if (el) {
      setIndicatorStyle({ left: el.offsetLeft, width: el.offsetWidth });
    }
  }, [activeTab]);

  return (
    <div className="m-tabbar" style={{ position: 'fixed' }}>
      <motion.div
        animate={{ left: indicatorStyle.left, width: indicatorStyle.width }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
        style={{
          position: 'absolute',
          bottom: 0,
          height: 3,
          background: 'var(--accent, #E8913A)',
          borderRadius: 999,
          pointerEvents: 'none',
        }}
      />
      <button
        ref={farmRef}
        className={`m-tab${activeTab === 'farm' ? ' m-tab--on' : ''}`}
        onClick={() => onTabChange('farm')}
        type="button"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <path d="M10 18V10"/>
          <path d="M10 12C8 11 5 9 6 6c1.5 3 3 4 4 5"/>
          <path d="M10 10C10 8 12 5 15 6c-2.5 0.5-4 2.5-5 4"/>
          <ellipse cx="10" cy="18" rx="4" ry="1.5"/>
        </svg>
        <span className="m-tab-lbl">My Farm</span>
        <span className="m-tab-dot"></span>
      </button>
      <button
        className="m-tab-add"
        onClick={onAddPlot}
        aria-label="Add new plot"
        type="button"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <line x1="10" y1="4" x2="10" y2="16"/>
          <line x1="4" y1="10" x2="16" y2="10"/>
        </svg>
      </button>
      <button
        ref={foodRef}
        className={`m-tab${activeTab === 'food' ? ' m-tab--on' : ''}`}
        onClick={() => onTabChange('food')}
        type="button"
      >
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" width="18" height="18">
          <path d="M4 8h12l-1.5 7H5.5L4 8z"/>
          <path d="M2 8h16"/>
          <path d="M8 8V5a2 2 0 0 1 4 0v3"/>
        </svg>
        <span className="m-tab-lbl">My Food</span>
        <span className="m-tab-dot"></span>
      </button>
    </div>
  );
}
