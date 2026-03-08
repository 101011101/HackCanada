"use client";

import { useState, useMemo, useRef, useCallback } from "react";
import {
  farms as initialFarms,
  hubs,
  getCrop,
  getEffectiveCropId,
  getNearestHub,
  buildNetworkEdges,
  type FarmNode,
} from "./nodal-network/data";
import { T } from "./nodal-network/tokens";
import NetworkMapCore, { type NetworkCallbacks } from "./nodal-network/NetworkMapCore";
import { Legend } from "./nodal-network/Legend";
import { FarmPanel, EMPTY_FORM, farmToForm, type PanelMode, type FarmForm } from "./nodal-network/FarmPanel";
import DataInformation from "./DataInformation";
import Charts from "./Charts";
import MyHubAdminView from "./admin/MyHubAdminView";

type ActivePage = "network-map" | "data-info" | "charts" | "myhub";

// ── Sidebar nav icons (inline SVG as JSX) ───────────────────────────────────

const IconMap = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="8" cy="8" r="5"/><line x1="12" y1="12" x2="15" y2="15"/></svg>
);
const IconChart = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><rect x="2" y="8" width="2.5" height="6"/><rect x="6.5" y="5" width="2.5" height="9"/><rect x="11" y="2" width="2.5" height="12"/></svg>
);
const IconData = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><rect x="2" y="2" width="12" height="12" rx="2"/><line x1="2" y1="6" x2="14" y2="6"/><line x1="6" y1="6" x2="6" y2="14"/></svg>
);
const IconNetwork = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="8" cy="8" r="3"/><path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.4 1.4M11.1 11.1l1.4 1.4M3.5 12.5l1.4-1.4M11.1 4.9l1.4-1.4"/></svg>
);
const IconAlerts = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M2 4h12v2L8 10 2 6V4z"/><path d="M2 6v6h12V6"/></svg>
);
const IconProfile = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><circle cx="8" cy="6" r="3"/><path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/></svg>
);
const IconHub = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="14" height="14"><path d="M2 6l6-4 6 4v7a1 1 0 01-1 1H3a1 1 0 01-1-1V6z"/><path d="M6 14V9h4v5"/></svg>
);

// ── Style constants ─────────────────────────────────────────────────────────

const S = {
  layout: {
    display: "grid",
    gridTemplateColumns: "220px 1fr",
    height: "100vh",
    fontFamily: T.fb,
    color: T.ink,
  } as React.CSSProperties,

  sidebar: {
    background: T.ink,
    padding: "20px 0",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  sidebarLogo: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: "0 20px 20px",
    borderBottom: "1px solid #2a2a2a",
    marginBottom: 8,
  } as React.CSSProperties,

  sidebarName: {
    fontFamily: T.fd,
    fontSize: 14,
    fontWeight: 700,
    color: "#fff",
  } as React.CSSProperties,

  sidebarDot: {
    width: 6, height: 6, borderRadius: "50%",
    background: T.accent, display: "inline-block",
    marginLeft: 3, verticalAlign: "middle",
  } as React.CSSProperties,

  sectionLabel: {
    fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", color: "#333",
    padding: "12px 20px 4px",
  } as React.CSSProperties,

  navItem: (active: boolean): React.CSSProperties => ({
    display: "flex", alignItems: "center", gap: 10,
    padding: "9px 20px", fontSize: 12, fontWeight: 500,
    color: active ? "#fff" : "#555", cursor: "pointer",
    background: active ? "rgba(255,255,255,0.06)" : "transparent",
    transition: "background .15s",
    border: "none", width: "100%", textAlign: "left",
    fontFamily: T.fb,
  }),

  navDot: (active: boolean): React.CSSProperties => ({
    width: 3, height: 3, borderRadius: "50%",
    background: active ? T.accent : "transparent",
    marginLeft: "auto",
  }),

  contentArea: {
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  } as React.CSSProperties,

  topbar: {
    background: T.bgElev,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: `1px solid ${T.borderLt}`,
    flexShrink: 0,
  } as React.CSSProperties,

  topbarTitle: {
    fontSize: 14, fontWeight: 600,
  } as React.CSSProperties,

  topbarSub: {
    fontSize: 11, color: T.ink3, fontWeight: 500,
  } as React.CSSProperties,

  topbarActions: {
    marginLeft: "auto", display: "flex", gap: 8, alignItems: "center",
  } as React.CSSProperties,

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    borderRadius: T.rXs, letterSpacing: "0.02em",
    background: bg, color,
  }),

  btn: (variant: "primary" | "secondary" | "accent"): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      gap: 6, fontFamily: T.fb, fontWeight: 600, border: "none",
      cursor: "pointer", borderRadius: T.rSm, whiteSpace: "nowrap",
      fontSize: 11, padding: "5px 12px", height: 28,
      transition: "opacity .15s",
    };
    if (variant === "primary") return { ...base, background: T.ink, color: T.inv };
    if (variant === "accent") return { ...base, background: T.accent, color: "#fff" };
    return { ...base, background: "transparent", color: T.ink, border: `1.5px solid ${T.border}` };
  },

  scrollContent: {
    flex: 1, overflow: "auto", position: "relative",
  } as React.CSSProperties,

  contentPad: {
    padding: "16px 20px 24px",
  } as React.CSSProperties,

  kpiRow: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
    gap: 12, marginBottom: 16,
  } as React.CSSProperties,

  kpiCard: {
    background: T.bgCard, borderRadius: T.rMd, padding: 16,
  } as React.CSSProperties,

  kpiVal: {
    fontFamily: T.fd, fontSize: 26, fontWeight: 700,
    letterSpacing: "-0.02em", lineHeight: 1,
  } as React.CSSProperties,

  kpiLbl: {
    fontSize: 10, color: T.ink3, marginTop: 4, fontWeight: 500,
  } as React.CSSProperties,

  kpiDelta: (color: string): React.CSSProperties => ({
    fontSize: 10, fontWeight: 600, marginTop: 6, color,
  }),

  mapContainer: {
    width: "100%", height: 400,
    borderRadius: T.rMd, overflow: "hidden",
    border: `1px solid ${T.borderLt}`,
    position: "relative",
  } as React.CSSProperties,

  tablePanel: {
    background: T.bgElev, borderRadius: T.rMd,
    overflow: "hidden", boxShadow: T.shSm, marginTop: 16,
  } as React.CSSProperties,

  tableHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  tableTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,

  th: {
    textAlign: "left" as const, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase" as const,
    color: T.ink3, padding: "10px 20px", background: T.bgCard,
    borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  td: {
    padding: "11px 20px", fontSize: 12, color: T.ink,
    borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  cropDot: (color: string): React.CSSProperties => ({
    display: "inline-block", width: 6, height: 6,
    borderRadius: "50%", background: color,
    verticalAlign: "middle", marginRight: 4,
  }),

  statusBadge: (status: string): React.CSSProperties => {
    const colors: Record<string, [string, string]> = {
      growing:   [T.success, "rgba(76,175,80,0.12)"],
      available: [T.info,    "rgba(91,141,239,0.12)"],
      new:       [T.accent,  T.accentBg],
    };
    const [c, bg] = colors[status] ?? [T.ink3, "rgba(158,154,148,0.12)"];
    return {
      display: "inline-flex", alignItems: "center",
      fontSize: 10, fontWeight: 600, padding: "2px 7px",
      borderRadius: T.rXs, letterSpacing: "0.02em",
      background: bg, color: c,
    };
  },
};

// ── Main dashboard component ────────────────────────────────────────────────

export default function AdminDashboard() {
  const [farmList, setFarmList] = useState<FarmNode[]>(() => [...initialFarms]);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [form, setForm] = useState<FarmForm>({ ...EMPTY_FORM });
  const [editFarmId, setEditFarmId] = useState<number | null>(null);
  const [activePage, setActivePage] = useState<ActivePage>("network-map");
  const nextId = useRef(Math.max(...initialFarms.map(f => f.id)) + 1);

  const edges = useMemo(() => buildNetworkEdges(farmList), [farmList]);

  const parseOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // ── Callbacks for marker info-window Edit / Delete buttons ──
  const callbacks = useRef<NetworkCallbacks>({
    onEditFarm: () => {},
    onDeleteFarm: () => {},
  });

  callbacks.current.onEditFarm = useCallback((id: number) => {
    const farm = farmList.find(f => f.id === id);
    if (!farm) return;
    setEditFarmId(id);
    setForm(farmToForm(farm));
    setPanelMode("edit");
  }, [farmList]);

  callbacks.current.onDeleteFarm = useCallback((id: number) => {
    if (!confirm("Delete this farm?")) return;
    setFarmList(prev => prev.filter(f => f.id !== id));
    setPanelMode("closed");
    setEditFarmId(null);
    setForm({ ...EMPTY_FORM });
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (panelMode !== "add-pinpoint") return;
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
  }, [panelMode]);

  const handleRightClick = useCallback((lat: number, lng: number) => {
    setForm({ ...EMPTY_FORM, lat: lat.toFixed(6), lng: lng.toFixed(6) });
    setPanelMode("add-pinpoint");
  }, []);

  const handleSubmit = useCallback(() => {
    const lat = parseFloat(form.lat);
    const lng = parseFloat(form.lng);
    if (isNaN(lat) || isNaN(lng) || !form.name.trim()) return;

    if (panelMode === "edit" && editFarmId != null) {
      setFarmList(prev => prev.map(f => {
        if (f.id !== editFarmId) return f;
        return {
          ...f,
          name: form.name.trim(),
          plot_size_sqft: parseOrNull(form.plot_size_sqft),
          plot_type: (form.plot_type || null) as FarmNode["plot_type"],
          tools: (form.tools || null) as FarmNode["tools"],
          budget: (form.budget || null) as FarmNode["budget"],
          pH: parseOrNull(form.pH),
          moisture: parseOrNull(form.moisture),
          temperature: parseOrNull(form.temperature),
          humidity: parseOrNull(form.humidity),
        };
      }));
    } else {
      const newFarm: FarmNode = {
        id: nextId.current++,
        name: form.name.trim(),
        lat, lng,
        plot_size_sqft: parseOrNull(form.plot_size_sqft),
        plot_type: (form.plot_type || null) as FarmNode["plot_type"],
        tools: (form.tools || null) as FarmNode["tools"],
        budget: (form.budget || null) as FarmNode["budget"],
        pH: parseOrNull(form.pH),
        moisture: parseOrNull(form.moisture),
        temperature: parseOrNull(form.temperature),
        humidity: parseOrNull(form.humidity),
        status: "new",
        current_crop_id: null,
        cycle_end_date: null,
      };
      setFarmList(prev => [...prev, newFarm]);
    }

    setForm({ ...EMPTY_FORM });
    setPanelMode("closed");
    setEditFarmId(null);
  }, [form, panelMode, editFarmId]);

  const handleDeleteFromPanel = useCallback(() => {
    if (editFarmId == null) return;
    callbacks.current.onDeleteFarm(editFarmId);
  }, [editFarmId]);

  const handleCancel = useCallback(() => {
    setForm({ ...EMPTY_FORM });
    setPanelMode("closed");
    setEditFarmId(null);
  }, []);

  // ── Computed KPIs ──
  const growingCount = farmList.filter(f => f.status === "growing").length;
  const connectedCount = edges.length;
  const coveragePct = farmList.length > 0
    ? Math.round((connectedCount / farmList.length) * 100)
    : 0;

  return (
    <div style={S.layout}>
      {/* ── Sidebar ── */}
      <div style={S.sidebar}>
        <div style={S.sidebarLogo}>
          <svg viewBox="0 0 32 32" fill="#fff" width="18" height="18"><path d="M6 8l8-4 8 4v8l-8 12-8-12z"/></svg>
          <div style={S.sidebarName}>MyCelium<span style={S.sidebarDot} /></div>
        </div>

        <div style={S.sectionLabel}>Visualization</div>
        <button style={S.navItem(activePage === "network-map")} onClick={() => setActivePage("network-map")}>
          <IconMap /> Network Map <span style={S.navDot(activePage === "network-map")} />
        </button>
        <button style={S.navItem(activePage === "charts")} onClick={() => setActivePage("charts")}>
          <IconChart /> Charts <span style={S.navDot(activePage === "charts")} />
        </button>

        <div style={S.sectionLabel}>Data</div>
        <button style={S.navItem(activePage === "data-info")} onClick={() => setActivePage("data-info")}>
          <IconData /> Data Information <span style={S.navDot(activePage === "data-info")} />
        </button>

        <div style={S.sectionLabel}>Hub</div>
        <button style={S.navItem(activePage === "myhub")} onClick={() => setActivePage("myhub")}>
          <IconHub /> MyHub <span style={S.navDot(activePage === "myhub")} />
        </button>

        <div style={S.sectionLabel}>Infrastructure</div>
        <button style={S.navItem(false)}>
          <IconNetwork /> Network Info <span style={S.navDot(false)} />
        </button>
        <button style={S.navItem(false)}>
          <IconAlerts /> Alerts <span style={S.navDot(false)} />
        </button>

        <div style={{ marginTop: "auto" }} />

        <button style={{ ...S.navItem(false), marginTop: 8 }}>
          <IconProfile /> Profile <span style={S.navDot(false)} />
        </button>
      </div>

      {/* ── Content area ── */}
      <div style={S.contentArea}>
        {/* Topbar — hide for MyHub (it has its own) */}
        {activePage !== "myhub" && (
          <div style={S.topbar}>
            <div style={S.topbarTitle}>
              {activePage === "data-info" ? "Data Information" : "Data Visualization"}
            </div>
            <span style={S.topbarSub}>Admin Dashboard</span>
            <div style={S.topbarActions}>
              {activePage === "data-info" ? (
                <>
                  <span style={S.badge(T.info, "rgba(91,141,239,0.12)")}>Live Data</span>
                  <button style={S.btn("secondary")}>Export CSV</button>
                </>
              ) : activePage === "charts" ? (
                <>
                  <button style={S.btn("secondary")}>Export Charts</button>
                </>
              ) : (
                <>
                  <span style={S.badge(T.success, "rgba(76,175,80,0.12)")}>All Systems Online</span>
                  <button style={S.btn("secondary")}>Export</button>
                  <button style={S.btn("accent")}>Run Optimization</button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Scrollable content */}
        <div style={S.scrollContent}>
          {activePage === "myhub" ? (
            <MyHubAdminView />
          ) : activePage === "data-info" ? (
            <DataInformation farmList={farmList} edges={edges} />
          ) : activePage === "charts" ? (
            <Charts farmList={farmList} edges={edges} />
          ) : (
            <div style={S.contentPad}>
              {/* KPI Row */}
              <div style={S.kpiRow}>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{farmList.length}</div>
                  <div style={S.kpiLbl}>Total Farms</div>
                  <div style={S.kpiDelta(T.success)}>
                    {hubs.length} hubs · {edges.length} links
                  </div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{coveragePct}%</div>
                  <div style={S.kpiLbl}>Network Coverage</div>
                  <div style={S.kpiDelta(T.success)}>
                    {connectedCount} of {farmList.length} connected
                  </div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{growingCount}</div>
                  <div style={S.kpiLbl}>Growing Active</div>
                  <div style={S.kpiDelta(T.info)}>
                    {farmList.filter(f => f.status === "new").length} new · {farmList.filter(f => f.status === "available").length} available
                  </div>
                </div>
              </div>

              {/* Map with overlays (Legend, FarmPanel) */}
              <div style={S.mapContainer}>
                <NetworkMapCore
                  farmList={farmList}
                  edges={edges}
                  callbacks={callbacks}
                  panelMode={panelMode}
                  onMapClick={handleMapClick}
                  onRightClick={handleRightClick}
                />

                <Legend
                  farmList={farmList}
                  edges={edges}
                  style={{ position: "absolute", bottom: 12, left: 12, zIndex: 10 }}
                />

                <FarmPanel
                  mode={panelMode}
                  form={form}
                  onFormChange={setForm}
                  onModeChange={setPanelMode}
                  onSubmit={handleSubmit}
                  onDelete={panelMode === "edit" ? handleDeleteFromPanel : undefined}
                  onCancel={handleCancel}
                  style={{ position: "absolute", top: 12, right: 52, zIndex: 10 }}
                />
              </div>

              {/* Node Status Table */}
              <div style={S.tablePanel}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Node Status</div>
                  <span style={S.badge(T.accent, T.accentBg)}>Live</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Node</th>
                      <th style={S.th}>Type</th>
                      <th style={S.th}>Crop</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Hub</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmList.map(farm => {
                      const cropId = getEffectiveCropId(farm);
                      const crop = cropId != null ? getCrop(cropId) : null;
                      const hub = getNearestHub(farm);
                      return (
                        <tr key={farm.id}>
                          <td style={{ ...S.td, fontWeight: 600 }}>{farm.name}</td>
                          <td style={S.td}>{farm.plot_type ?? "—"}</td>
                          <td style={S.td}>
                            {crop ? (
                              <><span style={S.cropDot(crop.color)} />{crop.name}</>
                            ) : "—"}
                          </td>
                          <td style={S.td}>
                            <span style={S.statusBadge(farm.status)}>
                              {farm.status.charAt(0).toUpperCase() + farm.status.slice(1)}
                            </span>
                          </td>
                          <td style={S.td}>{hub?.name ?? "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
