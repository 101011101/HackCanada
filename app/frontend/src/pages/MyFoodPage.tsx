import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNodeId } from "@/context/NodeIdContext";
import MobileTopbar from "@/components/myfood/MobileTopbar";
import BottomTabBar from "@/components/myfood/BottomTabBar";
import MyFoodContentFull from "@/components/myfood/MyFoodContentFull";

/** Demo nodes (for standalone /myfood page when not using Dashboard). */
const DEMO_NODES = [
  { id: 0, label: "Node 0", hc: 25 },
  { id: 1, label: "Node 1", hc: 10 },
  { id: 2, label: "Node 2", hc: 50 },
  { id: 3, label: "Node 3", hc: 0 },
  { id: 4, label: "Node 4", hc: 5 },
  { id: 5, label: "Node 5", hc: 100 },
  { id: 8, label: "Node 8", hc: 30 },
] as const;

export default function MyFoodPage() {
  const { nodeId, setNodeId } = useNodeId();
  const navigate = useNavigate();
  const [demoNodeId, setDemoNodeId] = useState("1");

  if (!nodeId) {
    return (
      <div className="shell">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <MobileTopbar />
          <div className="m-content" style={{ padding: 24 }}>
            <p style={{ marginBottom: 16, color: "var(--ink-2)" }}>
              Enter a node ID (e.g. from a registered farm) to use MyFood, or go to Dashboard.
            </p>
            <input
              type="number"
              className="input"
              value={demoNodeId}
              onChange={(e) => setDemoNodeId(e.target.value)}
              placeholder="Node ID"
              min={1}
              style={{ marginBottom: 12 }}
            />
            <button
              type="button"
              className="btn btn--accent btn--full"
              style={{ marginBottom: 12 }}
              onClick={() => {
                const n = parseInt(demoNodeId, 10);
                if (!Number.isNaN(n) && n > 0) setNodeId(n);
              }}
            >
              Continue
            </button>
            <button
              type="button"
              className="btn btn--secondary btn--full"
              onClick={() => navigate("/dashboard?tab=food")}
            >
              Go to Dashboard (My Food)
            </button>
          </div>
        </div>
        <BottomTabBar />
      </div>
    );
  }

  return (
    <div className="shell">
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <MobileTopbar />
        <div
          className="m-content"
          style={{
            padding: "8px 20px 12px",
            gap: 8,
            flexDirection: "row",
            flexWrap: "wrap",
            alignItems: "center",
            borderBottom: "1px solid var(--border-lt)",
            background: "var(--bg-elev)",
          }}
        >
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginRight: 8 }}>
            User
          </span>
          {DEMO_NODES.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`btn ${nodeId === n.id ? "btn--accent" : "btn--secondary"} btn--sm`}
              onClick={() => setNodeId(n.id)}
            >
              {n.label} ({n.hc} HC)
            </button>
          ))}
        </div>
        <MyFoodContentFull nodeId={nodeId} />
      </div>
      <BottomTabBar />
    </div>
  );
}
