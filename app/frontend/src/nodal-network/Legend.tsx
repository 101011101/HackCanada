import { useState } from "react";
import { crops, hubs, type FarmNode, type NetworkEdge } from "./data";
import { T } from "./tokens";

export function Legend({ farmList, edges, style }: {
  farmList: FarmNode[];
  edges: NetworkEdge[];
  style?: React.CSSProperties;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: T.bgCard,
      borderRadius: T.rMd,
      boxShadow: T.shMd,
      border: `1px solid ${T.borderLt}`,
      fontSize: 11,
      width: open ? 280 : "auto",
      fontFamily: T.fb,
      overflow: "hidden",
      color: T.ink,
      ...style,
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 11,
          fontFamily: T.fd,
          color: T.ink,
          letterSpacing: "-0.02em",
        }}
      >
        <span>Legend</span>
        <span style={{
          fontSize: 12, lineHeight: 1,
          transition: "transform 0.2s",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
          color: T.ink3,
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 12px 10px", lineHeight: 1.5 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 12px" }}>
            <LegendSection title="Hubs">
              <LegendItem color={T.error} shape="square" label="Critical (!)" />
              <LegendItem color={T.info} shape="square" label="Standard (H)" />
            </LegendSection>
            <LegendSection title="Farm status">
              <LegendItem color={T.success} label="Growing" />
              <LegendItem color={T.info} label="Available" />
              <LegendItem color={T.accent} label="New" />
            </LegendSection>
            <LegendSection title="Farm fill = crop">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1px 8px" }}>
                {crops.map(c => <LegendItem key={c.id} color={c.color} label={c.name} />)}
              </div>
            </LegendSection>
            <LegendSection title="Lines">
              <div style={{ fontSize: 10, color: T.ink3 }}>
                Farm → nearest hub, colored by crop.
              </div>
            </LegendSection>
          </div>
          <div style={{ marginTop: 6, fontSize: 10, color: T.ink3, borderTop: `1px solid ${T.borderLt}`, paddingTop: 6 }}>
            {farmList.length} farms · {hubs.length} hubs · {edges.length} links
          </div>
        </div>
      )}
    </div>
  );
}

function LegendSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 8, color: T.ink3, textTransform: "uppercase",
        letterSpacing: "0.14em", marginBottom: 2, fontWeight: 700,
      }}>{title}</div>
      {children}
    </div>
  );
}

function LegendItem({ color, label, shape = "circle" }: { color: string; label: string; shape?: "circle" | "square" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <div style={{
        width: 8, height: 8,
        borderRadius: shape === "circle" ? "50%" : "2px",
        background: color, flexShrink: 0, opacity: 0.9,
      }} />
      <span style={{ color: T.ink2, fontSize: 10 }}>{label}</span>
    </div>
  );
}
