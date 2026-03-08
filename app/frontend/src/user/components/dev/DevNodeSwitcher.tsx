import { useState, useRef, useEffect } from 'react';
import { useFarm } from '../../store/FarmContext';

const TEST_PRESETS = [
  { id: 100, label: '100 — New Onboarder', desc: 'new · tiny balcony · no crops' },
  { id: 101, label: '101 — Active Grower', desc: 'growing · cycle ends soon' },
  { id: 102, label: '102 — Community Giant', desc: 'growing · 400 sqft · 3 crops' },
  { id: 103, label: '103 — Stressed Soil', desc: 'available · pH 5.2 · risk flags' },
  { id: 104, label: '104 — Veteran Farmer', desc: 'available · $312 · 6 cycles' },
  { id: 105, label: '105 — Preference Match', desc: 'growing · all prefs matched' },
];

const STORAGE_KEY = 'dev:node-switcher-pos';

function loadPos(): { x: number; y: number } {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { x: window.innerWidth - 220, y: window.innerHeight - 60 };
}

const S = {
  panel: {
    background: '#0f0f1a',
    border: '1px solid #3a3a5c',
    borderRadius: 8,
    width: 210,
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    overflow: 'hidden',
    fontFamily: 'monospace',
    fontSize: 11,
    userSelect: 'none' as const,
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '5px 8px',
    background: '#1e1e3a',
    borderBottom: '1px solid #3a3a5c',
    color: '#a0a8ff',
    fontWeight: 700,
    letterSpacing: '0.05em',
    fontSize: 10,
    gap: 6,
  },
  dragHandle: {
    cursor: 'grab',
    color: '#4a4a6a',
    fontSize: 12,
    lineHeight: 1,
    flexShrink: 0,
  },
  toggleBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#a0a8ff',
    fontFamily: 'monospace',
    fontWeight: 700,
    fontSize: 10,
    padding: 0,
    flex: 1,
    textAlign: 'left' as const,
  },
  badge: {
    background: '#3a3a7a',
    color: '#c0c8ff',
    borderRadius: 4,
    padding: '1px 5px',
    fontSize: 9,
    flexShrink: 0,
  },
  body: {
    padding: '6px 0',
    maxHeight: 280,
    overflowY: 'auto' as const,
  },
  section: {
    color: '#5a5a8a',
    fontSize: 9,
    padding: '3px 8px 2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  row: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    padding: '3px 8px',
    cursor: 'pointer',
    background: active ? '#1e1e4a' : 'transparent',
    borderLeft: active ? '2px solid #6060ff' : '2px solid transparent',
  }),
  rowText: { flex: 1, overflow: 'hidden' },
  rowLabel: (active: boolean) => ({
    color: active ? '#c0c8ff' : '#8888aa',
    fontWeight: active ? 700 : 400,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    fontSize: 10,
  }),
  rowDesc: { color: '#4a4a6a', fontSize: 9 },
  btn: {
    background: '#2a2a5a',
    border: 'none',
    borderRadius: 3,
    color: '#8888ff',
    cursor: 'pointer',
    fontSize: 9,
    padding: '1px 5px',
    flexShrink: 0,
  },
  activeId: {
    padding: '3px 8px 5px',
    color: '#60ff90',
    fontSize: 10,
    borderBottom: '1px solid #1e1e3a',
  },
  footer: {
    borderTop: '1px solid #2a2a4a',
    padding: '6px 8px',
    display: 'flex',
    gap: 5,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    background: '#1a1a2e',
    border: '1px solid #3a3a5c',
    borderRadius: 4,
    color: '#c0c8ff',
    fontSize: 10,
    padding: '2px 5px',
    fontFamily: 'monospace',
    outline: 'none',
    width: 0,
  },
  goBtn: {
    background: '#3a3aaa',
    border: 'none',
    borderRadius: 4,
    color: '#fff',
    cursor: 'pointer',
    fontSize: 10,
    padding: '2px 7px',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  leaveBtn: {
    background: '#4a1a1a',
    border: 'none',
    borderRadius: 4,
    color: '#ff8888',
    cursor: 'pointer',
    fontSize: 10,
    padding: '2px 7px',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
};

export default function DevNodeSwitcher() {
  if (!import.meta.env.DEV) return null;

  const { farmId, allFarms, switchFarm, leave, join } = useFarm();
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState('');
  const [pos, setPos] = useState(loadPos);
  const dragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      const x = Math.max(0, Math.min(window.innerWidth - 210, e.clientX - dragOffset.current.x));
      const y = Math.max(0, Math.min(window.innerHeight - 36, e.clientY - dragOffset.current.y));
      setPos({ x, y });
    };
    const onUp = () => {
      if (!dragging.current) return;
      dragging.current = false;
      setPos(p => {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(p));
        return p;
      });
      document.body.style.cursor = '';
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  function onDragStart(e: React.MouseEvent) {
    e.preventDefault();
    const rect = panelRef.current!.getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragging.current = true;
    document.body.style.cursor = 'grabbing';
  }

  function handleSwitch(id: number) {
    const existing = allFarms.find(f => f.id === id);
    if (existing) switchFarm(id);
    else join(id, 43.65, -79.38, `Node #${id}`);
  }

  function handleGo() {
    const id = parseInt(manualId, 10);
    if (!isNaN(id)) { handleSwitch(id); setManualId(''); }
  }

  const knownIds = new Set(TEST_PRESETS.map(p => p.id));
  const otherFarms = allFarms.filter(f => !knownIds.has(f.id));

  return (
    <div
      ref={panelRef}
      style={{ position: 'fixed', left: pos.x, top: pos.y, zIndex: 9999 }}
    >
      <div style={S.panel}>
        <div style={S.header}>
          <span style={S.dragHandle} onMouseDown={onDragStart}>⠿</span>
          <button style={S.toggleBtn} onClick={() => setOpen(o => !o)}>
            DEV NODE
          </button>
          <span style={S.badge}>{open ? '▼' : `node ${farmId ?? '—'}`}</span>
        </div>

        {open && (
          <>
            <div style={S.activeId}>
              active: <strong style={{ color: '#90ff90' }}>node {farmId ?? 'none'}</strong>
            </div>

            <div style={S.body}>
              <div style={S.section}>Test Presets</div>
              {TEST_PRESETS.map(p => (
                <div key={p.id} style={S.row(farmId === p.id)} onClick={() => handleSwitch(p.id)}>
                  <div style={S.rowText}>
                    <div style={S.rowLabel(farmId === p.id)}>{p.label}</div>
                    <div style={S.rowDesc}>{p.desc}</div>
                  </div>
                  {farmId !== p.id && (
                    <button style={S.btn} onClick={e => { e.stopPropagation(); handleSwitch(p.id); }}>use</button>
                  )}
                </div>
              ))}

              {otherFarms.length > 0 && (
                <>
                  <div style={{ ...S.section, marginTop: 4 }}>Your Farms</div>
                  {otherFarms.map(f => (
                    <div key={f.id} style={S.row(farmId === f.id)} onClick={() => handleSwitch(f.id)}>
                      <div style={S.rowText}>
                        <div style={S.rowLabel(farmId === f.id)}>{f.id} — {f.name}</div>
                      </div>
                      {farmId !== f.id && (
                        <button style={S.btn} onClick={e => { e.stopPropagation(); handleSwitch(f.id); }}>use</button>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>

            <div style={S.footer}>
              <input
                style={S.input}
                type="number"
                placeholder="any node id…"
                value={manualId}
                onChange={e => setManualId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleGo()}
              />
              <button style={S.goBtn} onClick={handleGo}>go</button>
              <button style={S.leaveBtn} onClick={leave}>leave</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
