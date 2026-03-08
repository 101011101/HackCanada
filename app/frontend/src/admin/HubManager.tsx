"use client";

import { useState, useEffect, useMemo } from "react";
import type { HubNode, Crop } from "./nodal-network/data";
import { T } from "./nodal-network/tokens";
import { createHub, deleteHub, generateHubKey, getHubKeys, type NewHubRequest } from "./services/api";

const S = {
  content: { padding: "16px 20px 24px" } as React.CSSProperties,
  topbar: {
    background: T.bgElev, padding: "12px 20px", display: "flex",
    alignItems: "center", gap: 12, borderBottom: `1px solid ${T.borderLt}`, flexShrink: 0,
  } as React.CSSProperties,
  topbarTitle: { fontSize: 14, fontWeight: 600 } as React.CSSProperties,
  topbarSub: { fontSize: 11, color: T.ink3, fontWeight: 500 } as React.CSSProperties,
  topbarActions: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" } as React.CSSProperties,
  btn: (v: "primary" | "secondary" | "accent"): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      fontFamily: T.fb, fontWeight: 600, border: "none", cursor: "pointer",
      borderRadius: T.rSm, fontSize: 11, padding: "5px 12px", height: 28, transition: "opacity .15s",
    };
    if (v === "primary") return { ...base, background: T.ink, color: T.inv };
    if (v === "accent") return { ...base, background: T.accent, color: "#fff" };
    return { ...base, background: "transparent", color: T.ink, border: `1.5px solid ${T.border}` };
  },
  tablePanel: {
    background: T.bgElev, borderRadius: T.rMd, overflow: "hidden", boxShadow: T.shSm,
  } as React.CSSProperties,
  tableHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,
  tableTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  th: {
    textAlign: "left" as const, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: T.ink3, padding: "10px 20px",
    background: T.bgCard, borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,
  td: { padding: "11px 20px", fontSize: 12, color: T.ink, borderBottom: `1px solid ${T.borderLt}` } as React.CSSProperties,
  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600,
    padding: "2px 7px", borderRadius: T.rXs, letterSpacing: "0.02em", background: bg, color,
  }),
  formCard: {
    background: T.bgElev, borderRadius: T.rMd, padding: "20px 22px",
    boxShadow: T.shLg, border: `1px solid ${T.borderLt}`, marginBottom: 16,
  } as React.CSSProperties,
  formTitle: {
    fontSize: 15, fontWeight: 700, fontFamily: T.fd, letterSpacing: "-0.02em", marginBottom: 16,
  } as React.CSSProperties,
  label: {
    display: "block", fontSize: 10, color: T.ink3, textTransform: "uppercase" as const,
    letterSpacing: "0.14em", marginBottom: 4, fontWeight: 700,
  } as React.CSSProperties,
  input: {
    width: "100%", padding: "7px 10px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`,
    fontSize: 13, fontFamily: T.fb, boxSizing: "border-box" as const, outline: "none",
    background: T.bgElev, color: T.ink,
  } as React.CSSProperties,
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 } as React.CSSProperties,
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 12 } as React.CSSProperties,
  formActions: { display: "flex", gap: 8, marginTop: 16 } as React.CSSProperties,
};

interface Props {
  hubList: HubNode[];
  hubRouting: Record<string, number[]>;
  crops: Crop[];
  onRefresh: () => void;
}

export default function HubManager({ hubList, hubRouting, crops, onRefresh }: Props) {
  const [hubKeys, setHubKeys] = useState<Record<string, string>>({});
  const [revealedKeys, setRevealedKeys] = useState<Set<number>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState('');
  const [formLat, setFormLat] = useState('');
  const [formLng, setFormLng] = useState('');
  const [formPriority, setFormPriority] = useState<'critical' | 'standard'>('standard');
  const [formCapacity, setFormCapacity] = useState('');
  const [formDemand, setFormDemand] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getHubKeys().then(setHubKeys).catch(() => {});
  }, []);

  const farmsPerHub = useMemo(() => {
    const counts = new Map<number, number>();
    for (const hubIds of Object.values(hubRouting)) {
      for (const hid of hubIds) counts.set(hid, (counts.get(hid) ?? 0) + 1);
    }
    return counts;
  }, [hubRouting]);

  const handleRegenerate = (hubId: number) => {
    generateHubKey(hubId).then(({ key }) => {
      setHubKeys(prev => ({ ...prev, [String(hubId)]: key }));
      setRevealedKeys(prev => new Set([...prev, hubId]));
    }).catch(console.error);
  };

  const handleDelete = (hub: HubNode) => {
    if (!confirm(`Delete "${hub.name}"? This will remove it from all routing.`)) return;
    deleteHub(hub.id).then(onRefresh).catch(console.error);
  };

  const handleSubmit = () => {
    const lat = parseFloat(formLat);
    const lng = parseFloat(formLng);
    const capacity = parseFloat(formCapacity);
    if (!formName.trim() || isNaN(lat) || isNaN(lng) || isNaN(capacity)) return;

    const local_demand: Record<string, number> = {};
    for (const [cropId, val] of Object.entries(formDemand)) {
      const n = parseFloat(val);
      if (!isNaN(n) && n > 0) local_demand[cropId] = n;
    }

    setSubmitting(true);
    createHub({ name: formName.trim(), lat, lng, priority: formPriority, capacity_kg: capacity, local_demand })
      .then(() => {
        onRefresh();
        setShowForm(false);
        setFormName(''); setFormLat(''); setFormLng('');
        setFormPriority('standard'); setFormCapacity(''); setFormDemand({});
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
      <div style={S.topbar}>
        <div style={S.topbarTitle}>Hub Manager</div>
        <span style={S.topbarSub}>Admin Dashboard</span>
        <div style={S.topbarActions}>
          <button style={S.btn("accent")} onClick={() => setShowForm(f => !f)}>
            {showForm ? "Cancel" : "+ Add Hub"}
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px 24px" }}>
        {showForm && (
          <div style={S.formCard}>
            <div style={S.formTitle}>New Distribution Hub</div>
            <div style={S.grid2}>
              <div>
                <label style={S.label}>Hub Name</label>
                <input style={S.input} type="text" placeholder="e.g. West Side Community Hub"
                  value={formName} onChange={e => setFormName(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Priority</label>
                <select style={{ ...S.input }} value={formPriority}
                  onChange={e => setFormPriority(e.target.value as 'critical' | 'standard')}>
                  <option value="standard">Standard</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <label style={S.label}>Latitude</label>
                <input style={S.input} type="number" step="any" placeholder="43.6550"
                  value={formLat} onChange={e => setFormLat(e.target.value)} />
              </div>
              <div>
                <label style={S.label}>Longitude</label>
                <input style={S.input} type="number" step="any" placeholder="-79.3850"
                  value={formLng} onChange={e => setFormLng(e.target.value)} />
              </div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>Capacity (kg)</label>
              <input style={{ ...S.input, maxWidth: 200 }} type="number" placeholder="400"
                value={formCapacity} onChange={e => setFormCapacity(e.target.value)} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <label style={{ ...S.label, marginBottom: 8 }}>Local Demand (kg per crop)</label>
              <div style={S.grid4}>
                {crops.map(crop => (
                  <div key={crop.id}>
                    <label style={{ ...S.label, color: T.ink2 }}>
                      <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: crop.color, marginRight: 4, verticalAlign: "middle" }} />
                      {crop.name}
                    </label>
                    <input style={S.input} type="number" min="0" placeholder="0"
                      value={formDemand[crop.id] ?? ''}
                      onChange={e => setFormDemand(prev => ({ ...prev, [crop.id]: e.target.value }))} />
                  </div>
                ))}
              </div>
            </div>

            <div style={S.formActions}>
              <button style={S.btn("primary")} onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Creating…" : "Create Hub"}
              </button>
              <button style={S.btn("secondary")} onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div style={S.tablePanel}>
          <div style={S.tableHeader}>
            <div style={S.tableTitle}>Distribution Hubs</div>
            <span style={S.badge(T.accent, T.accentBg)}>{hubList.length} hubs</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={S.th}>Name</th>
                <th style={S.th}>Priority</th>
                <th style={S.th}>Capacity</th>
                <th style={S.th}>Farms Routed</th>
                <th style={S.th}>Hub Key</th>
                <th style={S.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {hubList.map(hub => {
                const key = hubKeys[String(hub.id)];
                const revealed = revealedKeys.has(hub.id);
                return (
                  <tr key={hub.id}>
                    <td style={{ ...S.td, fontWeight: 600 }}>{hub.name}</td>
                    <td style={S.td}>
                      <span style={hub.priority === "critical"
                        ? S.badge(T.error, "rgba(217,79,79,0.12)")
                        : S.badge(T.info, "rgba(91,141,239,0.12)")}>
                        {hub.priority.charAt(0).toUpperCase() + hub.priority.slice(1)}
                      </span>
                    </td>
                    <td style={S.td}>{hub.capacity_kg} kg</td>
                    <td style={S.td}>{farmsPerHub.get(hub.id) ?? 0} farms</td>
                    <td style={S.td}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: T.ink2, minWidth: 120 }}>
                          {key ? (revealed ? key : "••••••••••••") : "—"}
                        </span>
                        {key && (
                          <>
                            <button
                              onClick={() => setRevealedKeys(prev => {
                                const next = new Set(prev);
                                revealed ? next.delete(hub.id) : next.add(hub.id);
                                return next;
                              })}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.ink3 }}
                            >
                              {revealed ? "hide" : "show"}
                            </button>
                            <button
                              onClick={() => navigator.clipboard.writeText(key)}
                              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.ink3 }}
                            >
                              copy
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => handleRegenerate(hub.id)}
                          style={{ background: "none", border: "none", cursor: "pointer", fontSize: 10, color: T.accent }}
                        >
                          {key ? "regen" : "generate"}
                        </button>
                      </div>
                    </td>
                    <td style={S.td}>
                      <button
                        onClick={() => handleDelete(hub)}
                        style={{
                          background: "rgba(217,79,79,0.12)", color: T.error, border: "none",
                          borderRadius: T.rSm, fontSize: 11, fontWeight: 600, padding: "4px 10px",
                          cursor: "pointer", fontFamily: T.fb,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {hubList.length === 0 && (
            <div style={{ padding: 24, textAlign: "center", color: T.ink3 }}>No hubs yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
