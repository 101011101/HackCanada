import { useCallback, useEffect, useState } from "react";
import * as api from "@/services/myfood-api";
import type { BalanceResponse, RequestResponse, Crop, Hub } from "@/services/myfood-api";
import MyFoodHero from "@/components/myfood/MyFoodHero";
import TasksRow from "@/components/myfood/TasksRow";
import TicketList from "@/components/myfood/TicketList";
import GroceriesSheet from "@/components/myfood/GroceriesSheet";
import DonationsSheet from "@/components/myfood/DonationsSheet";

const POLL_INTERVAL_MS = 30_000;

export interface MyFoodContentFullProps {
  /** Farm/node ID; when null, shows "No farm selected" */
  nodeId: number | null;
}

/** Shared full My Food content: hero, tasks row, ticket list, sheets. Used by Dashboard (farmId) and MyFoodPage (nodeId). */
export default function MyFoodContentFull({ nodeId }: MyFoodContentFullProps) {
  const [balance, setBalance] = useState<BalanceResponse | null>(null);
  const [requests, setRequests] = useState<RequestResponse[]>([]);
  const [crops, setCrops] = useState<Crop[]>([]);
  const [hubs, setHubs] = useState<Hub[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groceriesOpen, setGroceriesOpen] = useState(false);
  const [donationsOpen, setDonationsOpen] = useState(false);

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

  if (nodeId == null) {
    return (
      <div className="m-section">
        <div style={{ padding: "20px 24px", color: "var(--ink-3)", fontSize: 14 }}>
          No farm selected. Set up or join a farm to use My Food.
        </div>
      </div>
    );
  }

  return (
    <>
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
            } catch (e) {
              if (e instanceof api.ApiError) setError(e.detail ?? e.message ?? "Failed to select hub");
              else setError("Failed to select hub");
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
    </>
  );
}
