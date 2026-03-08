"use client";

import { useState, useEffect, useCallback } from "react";
import type { FarmNode, HubNode } from "./nodal-network/data";
import { T } from "./nodal-network/tokens";
import {
  getFarms, getHubs, getHubKeys, getNodeKeys,
  generateHubKey, generateNodeKey, generateInvite,
} from "./services/api";

const LS_SERVER_IP = "mycelium_server_ip";

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const S = {
  wrap: {
    padding: "20px 24px 32px",
    fontFamily: T.fb,
  } as React.CSSProperties,

  section: {
    marginBottom: 28,
  } as React.CSSProperties,

  sectionTitle: {
    fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const, color: T.ink3,
    marginBottom: 12,
  } as React.CSSProperties,

  serverRow: {
    display: "flex", alignItems: "center", gap: 10, marginBottom: 24,
    background: T.bgElev, borderRadius: T.rMd, padding: "14px 16px",
    border: `1px solid ${T.borderLt}`, boxShadow: T.shSm,
  } as React.CSSProperties,

  serverLabel: {
    fontSize: 11, fontWeight: 700, color: T.ink3,
    textTransform: "uppercase" as const, letterSpacing: "0.12em",
    minWidth: 80,
  } as React.CSSProperties,

  ipInput: {
    flex: 1, padding: "6px 10px", borderRadius: T.rSm,
    border: `1.5px solid ${T.border}`, fontSize: 13, fontFamily: T.fb,
    outline: "none", background: T.bgCard, color: T.ink,
  } as React.CSSProperties,

  hint: {
    fontSize: 11, color: T.ink3,
  } as React.CSSProperties,

  table: {
    background: T.bgElev, borderRadius: T.rMd, overflow: "hidden",
    boxShadow: T.shSm, border: `1px solid ${T.borderLt}`, width: "100%",
    borderCollapse: "collapse" as const,
  } as React.CSSProperties,

  th: {
    textAlign: "left" as const, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase" as const,
    color: T.ink3, padding: "10px 16px",
    background: T.bgCard, borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  td: {
    padding: "11px 16px", fontSize: 12, color: T.ink,
    borderBottom: `1px solid ${T.borderLt}`,
    verticalAlign: "middle" as const,
  } as React.CSSProperties,

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", fontSize: 10,
    fontWeight: 600, padding: "2px 7px", borderRadius: T.rXs,
    letterSpacing: "0.02em", background: bg, color,
  }),

  keyBlock: {
    fontFamily: "monospace", fontSize: 11, background: T.bgCard,
    border: `1px solid ${T.borderLt}`, borderRadius: T.rXs,
    padding: "3px 8px", color: T.ink2, userSelect: "all" as const,
  } as React.CSSProperties,

  btn: (variant: "primary" | "secondary" | "ghost"): React.CSSProperties => {
    const base: React.CSSProperties = {
      display: "inline-flex", alignItems: "center", gap: 5,
      fontFamily: T.fb, fontWeight: 600, border: "none", cursor: "pointer",
      borderRadius: T.rSm, fontSize: 11, padding: "5px 10px", height: 26,
      transition: "opacity .15s", whiteSpace: "nowrap" as const,
    };
    if (variant === "primary") return { ...base, background: T.accent, color: "#fff" };
    if (variant === "ghost")   return { ...base, background: "transparent", color: T.accent, border: `1.5px solid ${T.accent}` };
    return { ...base, background: "transparent", color: T.ink, border: `1.5px solid ${T.border}` };
  },

  actions: {
    display: "flex", gap: 6, alignItems: "center",
  } as React.CSSProperties,

  toast: {
    position: "fixed" as const, bottom: 24, right: 24, zIndex: 999,
    background: T.ink, color: T.inv, borderRadius: T.rMd,
    padding: "10px 18px", fontSize: 12, fontWeight: 600,
    boxShadow: T.shLg, pointerEvents: "none" as const,
  } as React.CSSProperties,

  inviteModal: {
    position: "fixed" as const, inset: 0, zIndex: 500,
    background: "rgba(0,0,0,0.45)", display: "flex",
    alignItems: "center", justifyContent: "center",
  } as React.CSSProperties,

  inviteCard: {
    background: T.bgElev, borderRadius: T.rLg, padding: "24px 28px",
    width: 440, boxShadow: T.shLg, border: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  inviteTitle: {
    fontSize: 15, fontWeight: 700, fontFamily: "'Space Grotesk', system-ui, sans-serif",
    letterSpacing: "-0.02em", marginBottom: 4,
  } as React.CSSProperties,

  inviteSub: {
    fontSize: 11, color: T.ink3, marginBottom: 18,
  } as React.CSSProperties,

  inviteBlock: {
    background: T.bgCard, border: `1px solid ${T.borderLt}`,
    borderRadius: T.rMd, padding: "14px 16px", fontFamily: "monospace",
    fontSize: 12, lineHeight: 1.7, color: T.ink, whiteSpace: "pre" as const,
    overflowX: "auto" as const, marginBottom: 16,
  } as React.CSSProperties,

  inviteActions: {
    display: "flex", justifyContent: "flex-end", gap: 8,
  } as React.CSSProperties,
};

// ---------------------------------------------------------------------------
// Invite modal
// ---------------------------------------------------------------------------
interface InviteInfo {
  type: "node" | "hub";
  id: number;
  name: string;
  key: string;
  serverUrl: string;
  joinUrl?: string;
}

function InviteModal({ info, onClose }: { info: InviteInfo; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const frontendUrl = info.serverUrl.replace(":8000", ":5173");
  const joinUrl = info.joinUrl ?? `${frontendUrl}/join?type=${info.type}&id=${info.id}&key=${encodeURIComponent(info.key)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(joinUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div style={S.inviteModal} onClick={onClose}>
      <div style={S.inviteCard} onClick={e => e.stopPropagation()}>
        <div style={S.inviteTitle}>
          {info.id === 0 ? "Blank Invite Link" : `Invite — ${info.name}`}
        </div>
        <div style={S.inviteSub}>
          {info.id === 0
            ? "Send this link to your friend. They'll fill out their farm details and join automatically."
            : `Send this link to your friend. When they open it, they're automatically connected as a ${info.type === "node" ? "farm node" : "hub"}.`}
        </div>
        <div style={S.inviteBlock}>{joinUrl}</div>
        <div style={{ fontSize: 11, color: T.ink3, marginBottom: 16 }}>
          This link contains the access key — keep it private.
        </div>
        <div style={S.inviteActions}>
          <button style={S.btn("secondary")} onClick={onClose}>Close</button>
          <button style={S.btn("primary")} onClick={handleCopy}>
            {copied ? "Copied!" : "Copy Link"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function NetworkInfoView() {
  const [farms, setFarms] = useState<FarmNode[]>([]);
  const [hubs, setHubs] = useState<HubNode[]>([]);
  const [hubKeys, setHubKeys] = useState<Record<string, string>>({});
  const [nodeKeys, setNodeKeys] = useState<Record<string, string>>({});
  const [serverIp, setServerIp] = useState<string>(
    () => localStorage.getItem(LS_SERVER_IP) ?? "100.x.x.x"
  );
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [generatingInvite, setGeneratingInvite] = useState(false);

  const serverUrl = `http://${serverIp}:8000`;

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const loadAll = useCallback(async () => {
    try {
      const [f, h, hk, nk] = await Promise.all([
        getFarms(), getHubs(), getHubKeys(), getNodeKeys(),
      ]);
      console.log("[NetworkInfo] farms:", f, "hubs:", h);
      setFarms(f);
      setHubs(h);
      setHubKeys(hk);
      setNodeKeys(nk);
    } catch (err) {
      console.error("[NetworkInfo] loadAll failed:", err);
    }
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);

  const handleServerIpChange = (v: string) => {
    setServerIp(v);
    localStorage.setItem(LS_SERVER_IP, v);
  };

  const handleGenerateHubKey = async (hubId: number, hubName: string) => {
    setLoading(l => ({ ...l, [`hub-${hubId}`]: true }));
    try {
      const res = await generateHubKey(hubId);
      setHubKeys(prev => ({ ...prev, [String(hubId)]: res.key }));
      setInvite({ type: "hub", id: hubId, name: hubName, key: res.key, serverUrl });
    } catch {
      showToast("Failed to generate hub key");
    } finally {
      setLoading(l => ({ ...l, [`hub-${hubId}`]: false }));
    }
  };

  const handleGenerateNodeKey = async (farmId: number, farmName: string) => {
    setLoading(l => ({ ...l, [`node-${farmId}`]: true }));
    try {
      const res = await generateNodeKey(farmId);
      setNodeKeys(prev => ({ ...prev, [String(farmId)]: res.key }));
      setInvite({ type: "node", id: farmId, name: farmName, key: res.key, serverUrl });
    } catch {
      showToast("Failed to generate node key");
    } finally {
      setLoading(l => ({ ...l, [`node-${farmId}`]: false }));
    }
  };

  const handleGenerateBlankInvite = async () => {
    setGeneratingInvite(true);
    try {
      const { token } = await generateInvite();
      const frontendUrl = serverUrl.replace(":8000", ":5173");
      const joinUrl = `${frontendUrl}/join?type=invite&token=${encodeURIComponent(token)}`;
      setInvite({ type: "node", id: 0, name: "New Farmer", key: token, serverUrl, joinUrl });
    } catch {
      showToast("Failed to generate invite");
    } finally {
      setGeneratingInvite(false);
    }
  };

  const openInvite = (type: "node" | "hub", id: number, name: string) => {
    const key = type === "hub" ? hubKeys[String(id)] : nodeKeys[String(id)];
    if (!key) { showToast("Generate a key first"); return; }
    setInvite({ type, id, name, key, serverUrl });
  };

  return (
    <div style={S.wrap}>
      {/* Server IP config */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Server Address</div>
        <div style={S.serverRow}>
          <span style={S.serverLabel}>Tailscale IP</span>
          <input
            style={S.ipInput}
            value={serverIp}
            onChange={e => handleServerIpChange(e.target.value)}
            placeholder="100.x.x.x"
            spellCheck={false}
          />
          <span style={S.hint}>Friends connect to <strong>http://{serverIp}:5173</strong></span>
        </div>
      </div>

      {/* Blank invite */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Invite New Farmer</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            style={S.btn("primary")}
            onClick={handleGenerateBlankInvite}
            disabled={generatingInvite}
          >
            {generatingInvite ? "Generating…" : "+ Generate Invite Link"}
          </button>
          <span style={S.hint}>Friend opens the link, fills out their farm details, and joins automatically.</span>
        </div>
      </div>

      {/* Hubs */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Hubs — {hubs.length} registered</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>ID</th>
              <th style={S.th}>Priority</th>
              <th style={S.th}>Access Key</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {hubs.map(hub => {
              const key = hubKeys[String(hub.id)];
              const busy = loading[`hub-${hub.id}`];
              return (
                <tr key={hub.id}>
                  <td style={S.td}>{hub.name}</td>
                  <td style={S.td}><span style={S.keyBlock}>{hub.id}</span></td>
                  <td style={S.td}>
                    <span style={S.badge(
                      hub.priority === "critical" ? T.error : T.ink2,
                      hub.priority === "critical" ? "rgba(217,79,79,0.1)" : "rgba(107,103,98,0.1)"
                    )}>
                      {hub.priority}
                    </span>
                  </td>
                  <td style={S.td}>
                    {key
                      ? <span style={S.keyBlock}>{key}</span>
                      : <span style={{ ...S.hint, fontStyle: "italic" }}>no key yet</span>
                    }
                  </td>
                  <td style={S.td}>
                    <div style={S.actions}>
                      <button
                        style={S.btn("secondary")}
                        onClick={() => handleGenerateHubKey(hub.id, hub.name)}
                        disabled={busy}
                      >
                        {busy ? "..." : key ? "Regenerate" : "Generate Key"}
                      </button>
                      {key && (
                        <button
                          style={S.btn("ghost")}
                          onClick={() => openInvite("hub", hub.id, hub.name)}
                        >
                          Share Invite
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Nodes */}
      <div style={S.section}>
        <div style={S.sectionTitle}>Farm Nodes — {farms.length} registered</div>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>Name</th>
              <th style={S.th}>ID</th>
              <th style={S.th}>Type</th>
              <th style={S.th}>Status</th>
              <th style={S.th}>Access Key</th>
              <th style={S.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {farms.map(farm => {
              const key = nodeKeys[String(farm.id)];
              const busy = loading[`node-${farm.id}`];
              return (
                <tr key={farm.id}>
                  <td style={S.td}>{farm.name}</td>
                  <td style={S.td}><span style={S.keyBlock}>{farm.id}</span></td>
                  <td style={S.td}>{farm.plot_type}</td>
                  <td style={S.td}>
                    <span style={S.badge(
                      farm.status === "growing" ? T.success
                        : farm.status === "available" ? T.info : T.ink3,
                      farm.status === "growing" ? "rgba(76,175,80,0.1)"
                        : farm.status === "available" ? "rgba(91,141,239,0.1)" : "rgba(158,154,148,0.1)"
                    )}>
                      {farm.status}
                    </span>
                  </td>
                  <td style={S.td}>
                    {key
                      ? <span style={S.keyBlock}>{key}</span>
                      : <span style={{ ...S.hint, fontStyle: "italic" }}>no key yet</span>
                    }
                  </td>
                  <td style={S.td}>
                    <div style={S.actions}>
                      <button
                        style={S.btn("secondary")}
                        onClick={() => handleGenerateNodeKey(farm.id, farm.name)}
                        disabled={busy}
                      >
                        {busy ? "..." : key ? "Regenerate" : "Generate Key"}
                      </button>
                      {key && (
                        <button
                          style={S.btn("ghost")}
                          onClick={() => openInvite("node", farm.id, farm.name)}
                        >
                          Share Invite
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invite modal */}
      {invite && <InviteModal info={invite} onClose={() => setInvite(null)} />}

      {/* Toast */}
      {toast && <div style={S.toast}>{toast}</div>}
    </div>
  );
}
