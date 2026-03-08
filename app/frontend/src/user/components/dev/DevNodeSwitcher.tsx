import { useState } from 'react';
import { useFarm } from '../../store/FarmContext';

const TEST_PRESETS = [
  { id: 100, label: '100 — New Onboarder', desc: 'new · tiny balcony · no crops' },
  { id: 101, label: '101 — Active Grower', desc: 'growing · cycle ends soon' },
  { id: 102, label: '102 — Community Giant', desc: 'growing · 400 sqft · 3 crops' },
  { id: 103, label: '103 — Stressed Soil', desc: 'available · pH 5.2 · risk flags' },
  { id: 104, label: '104 — Veteran Farmer', desc: 'available · $312 · 6 cycles' },
  { id: 105, label: '105 — Preference Match', desc: 'growing · all prefs matched' },
];

const S = {
  wrap: {
    position: 'fixed' as const,
    bottom: 16,
    right: 16,
    zIndex: 9999,
    fontFamily: 'monospace',
    fontSize: 11,
    userSelect: 'none' as const,
  },
  panel: {
    background: '#0f0f1a',
    border: '1px solid #3a3a5c',
    borderRadius: 8,
    minWidth: 260,
    maxWidth: 300,
    boxShadow: '0 4px 24px rgba(0,0,0,0.6)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '6px 10px',
    background: '#1e1e3a',
    cursor: 'pointer',
    borderBottom: '1px solid #3a3a5c',
    color: '#a0a8ff',
    fontWeight: 700,
    letterSpacing: '0.05em',
  },
  badge: {
    background: '#3a3a7a',
    color: '#c0c8ff',
    borderRadius: 4,
    padding: '1px 6px',
    fontSize: 10,
  },
  body: {
    padding: '8px 0',
    maxHeight: 380,
    overflowY: 'auto' as const,
  },
  section: {
    color: '#5a5a8a',
    fontSize: 10,
    padding: '4px 10px 2px',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  row: (active: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    cursor: 'pointer',
    background: active ? '#1e1e4a' : 'transparent',
    borderLeft: active ? '2px solid #6060ff' : '2px solid transparent',
    transition: 'background 0.1s',
  }),
  rowText: {
    flex: 1,
    overflow: 'hidden',
  },
  rowLabel: (active: boolean) => ({
    color: active ? '#c0c8ff' : '#8888aa',
    fontWeight: active ? 700 : 400,
    whiteSpace: 'nowrap' as const,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),
  rowDesc: {
    color: '#4a4a6a',
    fontSize: 10,
  },
  btn: {
    background: '#2a2a5a',
    border: 'none',
    borderRadius: 3,
    color: '#8888ff',
    cursor: 'pointer',
    fontSize: 10,
    padding: '2px 6px',
    flexShrink: 0,
  },
  footer: {
    borderTop: '1px solid #2a2a4a',
    padding: '8px 10px',
    display: 'flex',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    background: '#1a1a2e',
    border: '1px solid #3a3a5c',
    borderRadius: 4,
    color: '#c0c8ff',
    fontSize: 11,
    padding: '3px 6px',
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
    fontSize: 11,
    padding: '3px 8px',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  leaveBtn: {
    background: '#4a1a1a',
    border: 'none',
    borderRadius: 4,
    color: '#ff8888',
    cursor: 'pointer',
    fontSize: 11,
    padding: '3px 8px',
    fontFamily: 'monospace',
    flexShrink: 0,
  },
  activeId: {
    padding: '4px 10px 6px',
    color: '#60ff90',
    fontSize: 11,
    borderBottom: '1px solid #1e1e3a',
  },
};

export default function DevNodeSwitcher() {
  if (!import.meta.env.DEV) return null;

  const { farmId, allFarms, switchFarm, leave, join } = useFarm();
  const [open, setOpen] = useState(false);
  const [manualId, setManualId] = useState('');

  function handleSwitch(id: number) {
    // If it's in allFarms, use switchFarm; otherwise use join with dummy coords
    const existing = allFarms.find(f => f.id === id);
    if (existing) {
      switchFarm(id);
    } else {
      join(id, 43.65, -79.38, `Node #${id}`);
    }
  }

  function handleGo() {
    const id = parseInt(manualId, 10);
    if (!isNaN(id)) {
      handleSwitch(id);
      setManualId('');
    }
  }

  const knownIds = new Set(TEST_PRESETS.map(p => p.id));
  const otherFarms = allFarms.filter(f => !knownIds.has(f.id));

  return (
    <div style={S.wrap}>
      <div style={S.panel}>
        <div style={S.header} onClick={() => setOpen(o => !o)}>
          <span>DEV NODE SWITCHER</span>
          <span style={S.badge}>{open ? '▼ close' : `▲ node ${farmId ?? '—'}`}</span>
        </div>

        {open && (
          <>
            <div style={S.activeId}>
              active: <strong style={{ color: '#90ff90' }}>node {farmId ?? 'none'}</strong>
            </div>

            <div style={S.body}>
              <div style={S.section}>Test Presets</div>
              {TEST_PRESETS.map(p => (
                <div
                  key={p.id}
                  style={S.row(farmId === p.id)}
                  onClick={() => handleSwitch(p.id)}
                >
                  <div style={S.rowText}>
                    <div style={S.rowLabel(farmId === p.id)}>{p.label}</div>
                    <div style={S.rowDesc}>{p.desc}</div>
                  </div>
                  {farmId !== p.id && (
                    <button style={S.btn} onClick={e => { e.stopPropagation(); handleSwitch(p.id); }}>
                      use
                    </button>
                  )}
                </div>
              ))}

              {otherFarms.length > 0 && (
                <>
                  <div style={{ ...S.section, marginTop: 6 }}>Your Farms</div>
                  {otherFarms.map(f => (
                    <div
                      key={f.id}
                      style={S.row(farmId === f.id)}
                      onClick={() => handleSwitch(f.id)}
                    >
                      <div style={S.rowText}>
                        <div style={S.rowLabel(farmId === f.id)}>{f.id} — {f.name}</div>
                      </div>
                      {farmId !== f.id && (
                        <button style={S.btn} onClick={e => { e.stopPropagation(); handleSwitch(f.id); }}>
                          use
                        </button>
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
