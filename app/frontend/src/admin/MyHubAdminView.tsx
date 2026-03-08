"use client";

import { useState, useEffect, useMemo } from "react";
import * as api from "@/services/myfood-api";
import { T } from "./nodal-network/tokens";

type MyHubTab = "transactions" | "ledger";

const S = {
  topbar: {
    background: T.bgElev,
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    gap: 12,
    borderBottom: `1px solid ${T.borderLt}`,
    flexShrink: 0,
  } as React.CSSProperties,
  topbarTitle: { fontSize: 14, fontWeight: 600 } as React.CSSProperties,
  topbarSub: { fontSize: 11, color: T.ink3, fontWeight: 500 } as React.CSSProperties,
  topbarActions: { marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" } as React.CSSProperties,
  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600,
    padding: "2px 7px", borderRadius: T.rXs, letterSpacing: "0.02em", background: bg, color,
  }),
  btn: (v: "primary" | "secondary" | "accent" | "ghost"): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      fontFamily: T.fb, fontWeight: 600, border: "none", cursor: "pointer", borderRadius: T.rSm,
      whiteSpace: "nowrap", fontSize: 11, padding: "5px 12px", height: 28, transition: "opacity .15s",
    };
    if (v === "primary") return { ...base, background: T.ink, color: T.inv };
    if (v === "accent") return { ...base, background: T.accent, color: "#fff" };
    if (v === "ghost") return { ...base, background: "transparent", color: T.ink2 };
    return { ...base, background: "transparent", color: T.ink, border: `1.5px solid ${T.border}` };
  },
  primaryTabs: {
    display: "flex", borderBottom: `1px solid ${T.borderLt}`,
    padding: "0 24px", background: T.bgCard,
  } as React.CSSProperties,
  primaryTab: (on: boolean): React.CSSProperties => ({
    padding: "12px 20px", fontSize: 13, fontWeight: 600, color: on ? T.ink : T.ink3,
    cursor: "pointer", border: "none", background: "none", fontFamily: T.fb,
    position: "relative" as const,
    ...(on ? { borderBottom: `2px solid ${T.accent}`, marginBottom: -1 } : {}),
  }),
  content: { padding: "16px 24px 24px", flex: 1, overflow: "auto" } as React.CSSProperties,
  hubSelect: {
    marginBottom: 16, display: "flex", alignItems: "center", gap: 8,
  } as React.CSSProperties,
  hubSelectLabel: { fontSize: 12, fontWeight: 600, color: T.ink3 } as React.CSSProperties,
  hubSelectSelect: {
    fontFamily: T.fb, fontSize: 13, padding: "6px 10px", borderRadius: T.rSm,
    border: `1px solid ${T.border}`, minWidth: 200,
  } as React.CSSProperties,
  kpiRow: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 } as React.CSSProperties,
  kpiCard: { background: T.bgCard, borderRadius: T.rMd, padding: 16 } as React.CSSProperties,
  kpiCardDark: { background: T.ink, borderRadius: T.rMd, padding: 16 } as React.CSSProperties,
  kpiCardAccent: { background: T.accent, borderRadius: T.rMd, padding: 16 } as React.CSSProperties,
  kpiVal: { fontFamily: T.fd, fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1 } as React.CSSProperties,
  kpiLbl: { fontSize: 10, color: T.ink3, marginTop: 4, fontWeight: 500 } as React.CSSProperties,
  kpiDelta: { fontSize: 10, fontWeight: 600, marginTop: 6 } as React.CSSProperties,
  tablePanel: { background: T.bgElev, borderRadius: T.rMd, overflow: "hidden", boxShadow: T.shSm } as React.CSSProperties,
  tableHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,
  tableTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,
  th: {
    textAlign: "left" as const, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: T.ink3, padding: "10px 20px", background: T.bgCard,
    borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,
  td: { padding: "11px 20px", fontSize: 12, color: T.ink, borderBottom: `1px solid ${T.borderLt}` } as React.CSSProperties,
  statusBadge: (status: string): React.CSSProperties => {
    const map: Record<string, [string, string]> = {
      pending: [T.accent, T.accentBg],
      options_ready: [T.info, "rgba(91,141,239,0.12)"],
      matched: [T.accent, T.accentBg],
      confirmed: [T.success, "rgba(76,175,80,0.12)"],
      cancelled: [T.ink3, "rgba(158,154,148,0.12)"],
    };
    const [c, bg] = map[status] ?? [T.ink3, "rgba(158,154,148,0.12)"];
    return { display: "inline-flex", alignItems: "center", fontSize: 10, fontWeight: 600, padding: "2px 7px", borderRadius: T.rXs, background: bg, color: c };
  },
  modalOverlay: {
    position: "fixed" as const, inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
  } as React.CSSProperties,
  modal: {
    background: T.bgElev, borderRadius: T.rMd, padding: 24, minWidth: 320, boxShadow: T.shLg,
  } as React.CSSProperties,
  modalTitle: { fontFamily: T.fd, fontSize: 16, fontWeight: 700, marginBottom: 16 } as React.CSSProperties,
  modalRow: { marginBottom: 12 } as React.CSSProperties,
  modalLabel: { fontSize: 11, fontWeight: 600, color: T.ink3, marginBottom: 4, display: "block" } as React.CSSProperties,
  modalInput: { width: "100%", padding: "8px 10px", fontSize: 13, border: `1px solid ${T.border}`, borderRadius: T.rSm, fontFamily: T.fb } as React.CSSProperties,
  modalActions: { display: "flex", gap: 8, marginTop: 20 } as React.CSSProperties,
  actionsCell: { display: "flex", gap: 6, flexWrap: "wrap" as const } as React.CSSProperties,
  cropDot: (color: string): React.CSSProperties => ({
    display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: color || T.ink3, verticalAlign: "middle", marginRight: 4,
  }),
};

export default function MyHubAdminView() {
  const [tab, setTab] = useState<MyHubTab>("transactions");
  const [hubs, setHubs] = useState<api.Hub[]>([]);
  const [farms, setFarms] = useState<api.FarmBasic[]>([]);
  const [crops, setCrops] = useState<api.Crop[]>([]);
  const [requests, setRequests] = useState<api.RequestResponse[]>([]);
  const [ledger, setLedger] = useState<api.LedgerEntryResponse[]>([]);
  const [selectedHubId, setSelectedHubId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [approveModal, setApproveModal] = useState<{ requestId: number; quantity_kg: number } | null>(null);
  const [approveQty, setApproveQty] = useState("");
  const [approveSubmitting, setApproveSubmitting] = useState(false);
  const [rejectConfirm, setRejectConfirm] = useState<number | null>(null);
  const [authState, setAuthState] = useState<{ hub_id: number; hub_name: string } | null>(null);
  const [keyInput, setKeyInput] = useState('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [keyLoading, setKeyLoading] = useState(false);
  const [demoMode, setDemoMode] = useState(false);

  useEffect(() => {
    const storedKey  = localStorage.getItem('hub_key');
    const storedId   = localStorage.getItem('hub_id');
    const storedName = localStorage.getItem('hub_name');
    if (storedKey && storedId && storedName) {
      setAuthState({ hub_id: Number(storedId), hub_name: storedName });
      setSelectedHubId(Number(storedId));
    }
  }, []);

  useEffect(() => {
    Promise.all([api.getHubs(), api.getFarms(), api.getCrops()])
      .then(([h, f, c]) => {
        setHubs(h);
        setFarms(f);
        setCrops(c);
        const firstHub = h[0];
        if (firstHub && selectedHubId === null) setSelectedHubId(firstHub.id);
      })
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedHubId == null) return;
    setLoading(true);
    setError(null);
    Promise.all([
      api.listRequests({ hub_id: selectedHubId }),
      api.getLedger(),
    ])
      .then(([reqs, entries]) => {
        setRequests(reqs);
        setLedger(entries);
      })
      .catch((e) => setError(e?.message ?? "Failed to load"))
      .finally(() => setLoading(false));
  }, [selectedHubId]);

  const hubName = useMemo(() => hubs.find((h) => h.id === selectedHubId)?.name ?? "Select hub", [hubs, selectedHubId]);
  const farmMap = useMemo(() => new Map(farms.map((f) => [f.id, f.name])), [farms]);
  const cropMap = useMemo(() => new Map(crops.map((c) => [c.id, c])), [crops]);

  const ledgerByRequest = useMemo(() => {
    const m = new Map<number, api.LedgerEntryResponse>();
    ledger.forEach((e) => m.set(e.request_id, e));
    return m;
  }, [ledger]);

  const nodeBalances = useMemo(() => {
    const byNode = new Map<number, { balance_after: number; totalEarned: number; totalSpent: number }>();
    ledger.forEach((e) => {
      const cur = byNode.get(e.node_id) ?? { balance_after: 0, totalEarned: 0, totalSpent: 0 };
      cur.balance_after = e.balance_after;
      if (e.amount > 0) cur.totalEarned += e.amount;
      else cur.totalSpent += Math.abs(e.amount);
      byNode.set(e.node_id, cur);
    });
    return byNode;
  }, [ledger]);

  const handleApproveOpen = (req: api.RequestResponse) => {
    setApproveModal({ requestId: req.id, quantity_kg: req.quantity_kg });
    setApproveQty(String(req.quantity_kg));
  };

  const handleApproveSubmit = () => {
    if (!approveModal) return;
    const qty = parseFloat(approveQty);
    if (isNaN(qty) || qty <= 0) return;
    setApproveSubmitting(true);
    api
      .confirmRequest(approveModal.requestId, qty)
      .then(() => {
        setApproveModal(null);
        if (selectedHubId != null) {
          api.listRequests({ hub_id: selectedHubId }).then(setRequests);
          api.getLedger().then(setLedger);
        }
      })
      .catch((e) => setError(e?.message ?? "Approve failed"))
      .finally(() => setApproveSubmitting(false));
  };

  const handleKeySubmit = async () => {
    if (!keyInput.trim()) return;
    setKeyLoading(true);
    setKeyError(null);
    try {
      const result = await api.authHub(keyInput.trim());
      localStorage.setItem('hub_key', keyInput.trim());
      localStorage.setItem('hub_id', String(result.hub_id));
      localStorage.setItem('hub_name', result.hub_name);
      setAuthState({ hub_id: result.hub_id, hub_name: result.hub_name });
      setSelectedHubId(result.hub_id);
    } catch {
      setKeyError('Invalid key. Please try again.');
    } finally {
      setKeyLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('hub_key');
    localStorage.removeItem('hub_id');
    localStorage.removeItem('hub_name');
    setAuthState(null);
    setKeyInput('');
    setKeyError(null);
  };

  const handleReject = (requestId: number) => {
    api
      .cancelRequest(requestId)
      .then(() => {
        setRejectConfirm(null);
        if (selectedHubId != null) {
          api.listRequests({ hub_id: selectedHubId }).then(setRequests);
          api.getLedger().then(setLedger);
        }
      })
      .catch((e) => setError(e?.message ?? "Reject failed"));
  };

  const handleAccept = (req: api.RequestResponse) => {
    if (selectedHubId == null) return;
    api
      .acceptRequest(req.id, selectedHubId)
      .then(() => {
        if (selectedHubId != null) {
          api.listRequests({ hub_id: selectedHubId }).then(setRequests);
        }
      })
      .catch((e) => setError(e?.message ?? "Accept failed"));
  };

  const pendingCount = requests.filter((r) => r.status === "matched" || r.status === "options_ready").length;
  const matchedCount = requests.filter((r) => r.status === "matched").length;
  const confirmedCount = requests.filter((r) => r.status === "confirmed").length;
  const totalHC = useMemo(() => {
    let sum = 0;
    nodeBalances.forEach((v) => { sum += v.balance_after; });
    return sum;
  }, [nodeBalances]);

  const demoToggle = (
    <button
      onClick={() => setDemoMode(d => !d)}
      style={{
        position: "fixed", bottom: 20, left: 20, zIndex: 999,
        background: demoMode ? T.accent : T.bgElev,
        color: demoMode ? "#fff" : T.ink3,
        border: `1.5px solid ${demoMode ? T.accent : T.border}`,
        borderRadius: T.rSm, fontFamily: T.fb, fontSize: 11, fontWeight: 600,
        padding: "6px 14px", cursor: "pointer", transition: "all .15s",
        boxShadow: T.shSm,
      }}
    >
      {demoMode ? "Demo ON" : "Demo OFF"}
    </button>
  );

  if (!authState && !demoMode) {
    return (
      <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", background: T.bg }}>
        <div style={S.modal}>
          <div style={S.modalTitle}>Hub Access</div>
          <p style={{ fontSize: 13, color: T.ink2, marginBottom: 16 }}>Enter your hub key to access your hub's data.</p>
          <div style={S.modalRow}>
            <label style={S.modalLabel}>Hub Key</label>
            <input
              type="text"
              placeholder="hub-key-..."
              style={S.modalInput}
              value={keyInput}
              onChange={e => setKeyInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleKeySubmit()}
            />
          </div>
          {keyError && <p style={{ fontSize: 12, color: T.error, marginBottom: 8, marginTop: -4 }}>{keyError}</p>}
          <div style={S.modalActions}>
            <button style={S.btn("accent")} onClick={handleKeySubmit} disabled={keyLoading}>
              {keyLoading ? 'Verifying…' : 'Access Hub'}
            </button>
          </div>
        </div>
      </div>
      {demoToggle}
      </>
    );
  }

  if (error) {
    return (
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={S.topbar}>
          <div style={S.topbarTitle}>MyHub</div>
          <span style={S.topbarSub}>·</span>
          <select
            style={{ ...S.hubSelectSelect, fontSize: 12, height: 26, padding: "3px 8px" }}
            value={selectedHubId ?? ""}
            onChange={(e) => setSelectedHubId(Number(e.target.value))}
          >
            {hubs.map((h) => (
              <option key={h.id} value={h.id}>{h.name}</option>
            ))}
          </select>
        </div>
        <div style={S.content}>
          <p style={{ color: T.error }}>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
        <div style={S.topbar}>
          <div style={S.topbarTitle}>MyHub</div>
          <span style={S.topbarSub}>·</span>
          {demoMode ? (
            <select
              style={{ ...S.hubSelectSelect, fontSize: 12, height: 26, padding: "3px 8px" }}
              value={selectedHubId ?? ""}
              onChange={e => setSelectedHubId(Number(e.target.value))}
            >
              {hubs.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          ) : (
            <span style={{ fontSize: 13, fontWeight: 600, color: T.ink }}>{authState.hub_name}</span>
          )}
          <div style={S.topbarActions}>
            <span style={S.badge(T.success, "rgba(76,175,80,0.12)")}>Ledger Synced</span>
            <button style={S.btn("secondary")}>Export CSV</button>
            <button style={S.btn("ghost")} onClick={handleSignOut}>Sign out</button>
          </div>
        </div>

        <div style={S.primaryTabs}>
          <button style={S.primaryTab(tab === "transactions")} onClick={() => setTab("transactions")}>
            Transactions
          </button>
          <button style={S.primaryTab(tab === "ledger")} onClick={() => setTab("ledger")}>
            Currency Ledger
          </button>
        </div>

        <div style={S.content}>
          {loading ? (
            <p style={{ color: T.ink3 }}>Loading…</p>
          ) : tab === "transactions" ? (
            <>
              <div style={S.kpiRow}>
                <div style={S.kpiCardDark}>
                  <div style={{ ...S.kpiVal, color: "#fff" }}>{requests.length}</div>
                  <div style={{ ...S.kpiLbl, color: "#888" }}>Total (this hub)</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{pendingCount}</div>
                  <div style={S.kpiLbl}>Pending acceptance</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{confirmedCount}</div>
                  <div style={S.kpiLbl}>Settled</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{requests.filter((r) => r.status === "cancelled").length}</div>
                  <div style={S.kpiLbl}>Cancelled</div>
                </div>
              </div>

              <div style={S.tablePanel}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Transaction History</div>
                  <span style={S.badge(T.accent, T.accentBg)}>Live</span>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={S.th}>ID</th>
                      <th style={S.th}>Node</th>
                      <th style={S.th}>Type</th>
                      <th style={S.th}>Crop</th>
                      <th style={S.th}>Qty (kg)</th>
                      <th style={S.th}>Value (HC)</th>
                      <th style={S.th}>Status</th>
                      <th style={S.th}>Date</th>
                      <th style={S.th}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((req) => {
                      const crop = cropMap.get(req.crop_id);
                      const entry = ledgerByRequest.get(req.id);
                      const amount = entry?.amount ?? 0;
                      const nodeName = farmMap.get(req.node_id) ?? `Node #${req.node_id}`;
                      const isMatched = req.status === "matched";
                      const isOptionsReady = req.status === "options_ready";
                      return (
                        <tr key={req.id}>
                          <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11, color: T.ink3 }}>#{req.id}</td>
                          <td style={S.td}>{nodeName}</td>
                          <td style={S.td}>{req.type === "give" ? "Give" : "Receive"}</td>
                          <td style={S.td}>
                            {crop ? <><span style={S.cropDot(crop.color ?? T.ink3)} />{crop.name}</> : req.crop_id}
                          </td>
                          <td style={S.td}>{req.quantity_kg}</td>
                          <td style={S.td}>
                            {amount !== 0 ? (
                              <span style={{ color: amount > 0 ? T.success : T.error, fontWeight: 700 }}>
                                {amount > 0 ? "+" : ""}{amount} HC
                              </span>
                            ) : "—"}
                          </td>
                          <td style={S.td}>
                            <span style={S.statusBadge(req.status)}>
                              {req.status === "matched"
                                ? "Accepted"
                                : req.status === "options_ready"
                                  ? "Pending acceptance"
                                  : req.status}
                            </span>
                          </td>
                          <td style={{ ...S.td, color: T.ink3 }}>{req.created_at?.slice(0, 10) ?? "—"}</td>
                          <td style={S.td}>
                            {isOptionsReady ? (
                              <div style={S.actionsCell}>
                                <button style={S.btn("accent")} onClick={() => handleAccept(req)}>Accept</button>
                                <button style={S.btn("ghost")} onClick={() => setRejectConfirm(req.id)}>Reject</button>
                              </div>
                            ) : isMatched ? (
                              <div style={S.actionsCell}>
                                <button style={S.btn("accent")} onClick={() => handleApproveOpen(req)}>Approve</button>
                                <button style={S.btn("ghost")} onClick={() => setRejectConfirm(req.id)}>Reject</button>
                              </div>
                            ) : (
                              <span style={{ color: T.ink3, fontSize: 11 }}>—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {requests.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: T.ink3 }}>No transactions at this hub.</div>
                )}
              </div>
            </>
          ) : (
            <>
              <div style={S.kpiRow}>
                <div style={S.kpiCardDark}>
                  <div style={{ ...S.kpiVal, color: "#fff" }}>{Math.round(totalHC)}</div>
                  <div style={{ ...S.kpiLbl, color: "#888" }}>Total HC in circulation</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{nodeBalances.size}</div>
                  <div style={S.kpiLbl}>Nodes with balance</div>
                </div>
                <div style={S.kpiCard}>
                  <div style={S.kpiVal}>{ledger.length}</div>
                  <div style={S.kpiLbl}>Ledger entries</div>
                </div>
                <div style={S.kpiCard} />
              </div>

              <div style={{ ...S.tablePanel, marginBottom: 16 }}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Node Balances</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Node</th>
                      <th style={S.th}>Balance</th>
                      <th style={S.th}>Earned</th>
                      <th style={S.th}>Spent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from(nodeBalances.entries()).map(([nodeId, v]) => (
                      <tr key={nodeId}>
                        <td style={S.td}>{farmMap.get(nodeId) ?? `Node #${nodeId}`}</td>
                        <td style={S.td}>{v.balance_after.toFixed(1)} HC</td>
                        <td style={{ ...S.td, color: T.success }}>{v.totalEarned.toFixed(1)}</td>
                        <td style={{ ...S.td, color: T.error }}>{v.totalSpent.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {nodeBalances.size === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: T.ink3 }}>No ledger entries yet.</div>
                )}
              </div>

              <div style={S.tablePanel}>
                <div style={S.tableHeader}>
                  <div style={S.tableTitle}>Recent Ledger Entries</div>
                </div>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={S.th}>Time</th>
                      <th style={S.th}>Node</th>
                      <th style={S.th}>Type</th>
                      <th style={S.th}>Amount</th>
                      <th style={S.th}>Balance after</th>
                      <th style={S.th}>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.slice(0, 20).map((e) => (
                      <tr key={e.id}>
                        <td style={{ ...S.td, color: T.ink3, fontSize: 11 }}>{e.created_at?.slice(0, 16)}</td>
                        <td style={S.td}>{farmMap.get(e.node_id) ?? `#${e.node_id}`}</td>
                        <td style={S.td}>
                          <span style={S.statusBadge(e.type === "credit" ? "confirmed" : "cancelled")}>
                            {e.type === "credit" ? "Earned" : "Spent"}
                          </span>
                        </td>
                        <td style={{ ...S.td, color: e.amount >= 0 ? T.success : T.error, fontWeight: 700 }}>
                          {e.amount >= 0 ? "+" : ""}{e.amount} HC
                        </td>
                        <td style={S.td}>{e.balance_after} HC</td>
                        <td style={{ ...S.td, fontFamily: "monospace", fontSize: 11 }}>#{e.request_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {ledger.length === 0 && (
                  <div style={{ padding: 24, textAlign: "center", color: T.ink3 }}>No ledger entries.</div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {approveModal && (
        <div style={S.modalOverlay} onClick={() => !approveSubmitting && setApproveModal(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Approve transaction #{approveModal.requestId}</div>
            <div style={S.modalRow}>
              <label style={S.modalLabel}>Actual quantity (kg)</label>
              <input
                type="number"
                step="0.1"
                min="0"
                style={S.modalInput}
                value={approveQty}
                onChange={(e) => setApproveQty(e.target.value)}
              />
            </div>
            <div style={S.modalActions}>
              <button style={S.btn("accent")} onClick={handleApproveSubmit} disabled={approveSubmitting}>
                {approveSubmitting ? "Confirming…" : "Confirm"}
              </button>
              <button style={S.btn("secondary")} onClick={() => setApproveModal(null)} disabled={approveSubmitting}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {rejectConfirm != null && (
        <div style={S.modalOverlay} onClick={() => setRejectConfirm(null)}>
          <div style={S.modal} onClick={(e) => e.stopPropagation()}>
            <div style={S.modalTitle}>Reject transaction #{rejectConfirm}?</div>
            <p style={{ fontSize: 13, color: T.ink2, marginBottom: 16 }}>
              This will cancel the request at your hub. The user can try another hub.
            </p>
            <div style={S.modalActions}>
              <button style={S.btn("primary")} onClick={() => handleReject(rejectConfirm)}>
                Reject
              </button>
              <button style={S.btn("secondary")} onClick={() => setRejectConfirm(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {demoToggle}
    </>
  );
}
