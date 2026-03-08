import { useCallback, useEffect, useState } from "react";
import { useNodeId } from "@/context/NodeIdContext";
import * as api from "@/services/myfood-api";
import type { BalanceResponse, RequestResponse, Crop, Hub } from "@/services/myfood-api";
import MobileTopbar from "@/components/myfood/MobileTopbar";
import MyFoodHero from "@/components/myfood/MyFoodHero";
import TasksRow from "@/components/myfood/TasksRow";
import TicketList from "@/components/myfood/TicketList";
import BottomTabBar from "@/components/myfood/BottomTabBar";
import GroceriesSheet from "@/components/myfood/GroceriesSheet";
import DonationsSheet from "@/components/myfood/DonationsSheet";

const POLL_INTERVAL_MS = 30_000;

/** Demo nodes with varied HC and request statuses (data in app/data/farms.json & requests.json). */
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
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groceriesOpen, setGroceriesOpen] = useState(false);
  const [donationsOpen, setDonationsOpen] = useState(false);
  const [demoNodeId, setDemoNodeId] = useState("1");

  const fetchData = useCallback(async (id: number) => {
    setError(null);
    try {
      const [bal, reqs, cropsRes, hubsRes] = await Promise.all([
        api.getBalance(id),
        api.listRequests({ node_id: id }),
        api.getCrops(),
        api.getHubs(),
      ]);
      setBalance(bal);
      setRequests(reqs);
      setCrops(cropsRes);
      setHubs(hubsRes);
    } catch (e) {
      if (e instanceof api.ApiError) {
        setError(e.detail ?? e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (nodeId === null) {
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchData(nodeId);
  }, [nodeId, fetchData]);

  useEffect(() => {
    if (nodeId === null) return;
    const t = setInterval(() => {
      api.listRequests({ node_id: nodeId }).then(setRequests).catch(() => {});
      api.getBalance(nodeId).then(setBalance).catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [nodeId]);

  const cropNames: Record<number, string> = Object.fromEntries(crops.map((c) => [c.id, c.name]));
  const hubNames: Record<number, string> = Object.fromEntries(hubs.map((h) => [h.id, h.name]));

  const consumedKg =
    balance?.crops_on_hand != null
      ? Object.values(balance.crops_on_hand).reduce((a, b) => a + b, 0)
      : 0;
  const donatedKg = requests
    .filter((r) => r.type === "give" && r.status === "confirmed")
    .reduce((a, r) => a + r.quantity_kg, 0);
  const activeRequests = requests.filter((r) => r.status !== "confirmed").length;

  const refetch = useCallback(() => {
    if (nodeId !== null) fetchData(nodeId);
  }, [nodeId, fetchData]);

  if (!nodeId) {
    return (
      <div className="shell">
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <MobileTopbar />
          <div className="m-content" style={{ padding: 24 }}>
            <p style={{ marginBottom: 16, color: "var(--ink-2)" }}>
              Enter a node ID (e.g. from a registered farm) to use MyFood.
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
              onClick={() => {
                const n = parseInt(demoNodeId, 10);
                if (!Number.isNaN(n) && n > 0) setNodeId(n);
              }}
            >
              Continue
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
        <div className="m-content" style={{ padding: "8px 20px 12px", gap: 8, flexDirection: "row", flexWrap: "wrap", alignItems: "center", borderBottom: "1px solid var(--border-lt)", background: "var(--bg-elev)" }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--ink-3)", marginRight: 8 }}>User</span>
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
        <MyFoodHero
          balance={balance?.currency_balance ?? 0}
          consumedKg={consumedKg}
          donatedKg={donatedKg}
          requestCount={activeRequests}
        />
        <TasksRow
          onGroceriesClick={() => setGroceriesOpen(true)}
          onDonationsClick={() => setDonationsOpen(true)}
        />
        {loading ? (
          <div className="myfood-loading">Loading…</div>
        ) : error ? (
          <div className="m-content">
            <div className="myfood-empty" style={{ color: "var(--error)" }}>
              {error}
              <button
                type="button"
                className="btn btn--secondary"
                style={{ marginTop: 12 }}
                onClick={() => fetchData(nodeId!)}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <TicketList
            requests={requests}
            cropNames={cropNames}
            hubNames={hubNames}
            onSelectHub={async (requestId, hub_id) => {
              try {
                await api.selectHub(requestId, hub_id);
                refetch();
              } catch {
                setError("Failed to select hub");
              }
            }}
            onConfirm={async (requestId, actual_quantity_kg) => {
              try {
                await api.confirmRequest(requestId, actual_quantity_kg);
                refetch();
              } catch (e) {
                if (e instanceof api.ApiError) setError(e.detail ?? e.message);
                else setError("Failed to confirm");
              }
            }}
          />
        )}
      </div>
      <BottomTabBar />

      <GroceriesSheet
        open={groceriesOpen}
        onClose={() => setGroceriesOpen(false)}
        nodeId={nodeId}
        balance={balance?.currency_balance ?? 0}
        onSuccess={refetch}
      />
      <DonationsSheet
        open={donationsOpen}
        onClose={() => setDonationsOpen(false)}
        nodeId={nodeId}
        onSuccess={refetch}
      />
    </div>
  );
}
