import type { RequestResponse } from "@/services/myfood-api";
import TicketItem, { type TicketStatus } from "./TicketItem";

interface TicketListProps {
  requests: RequestResponse[];
  cropNames: Record<number, string>;
  hubNames: Record<number, string>;
  onSelectHub?: (requestId: number, hub_id: number) => void;
  onConfirm?: (requestId: number, actual_quantity_kg: number) => void;
}

function mapStatus(apiStatus: string): TicketStatus {
  if (apiStatus === "confirmed") return "completed";
  if (apiStatus === "options_ready" || apiStatus === "matched") return "approved";
  return "pending";
}

function getTitle(req: RequestResponse, cropNames: Record<number, string>): string {
  const crop = cropNames[req.crop_id] ?? `Crop #${req.crop_id}`;
  if (req.type === "receive") return `Request: ${req.quantity_kg} kg ${crop}`;
  return `Donation: ${req.quantity_kg} kg ${crop}`;
}

function getSubtitle(req: RequestResponse, hubNames: Record<number, string>): string {
  if (req.status === "pending") return "Awaiting hub approval";
  if (req.status === "options_ready") return "Choose a hub";
  if (req.status === "matched") {
    const hub = req.hub_id ? hubNames[req.hub_id] : null;
    return hub ? `Approved · Drop off by ${hub}` : "Approved · Drop off at selected hub";
  }
  if (req.status === "confirmed" && req.confirmed_at) {
    const d = new Date(req.confirmed_at);
    return `Completed ${d.toLocaleDateString()}`;
  }
  return "";
}

type HubOptionItem = { id: number; name: string; distance_km?: number };

function getHubOptions(
  req: RequestResponse,
  hubs: { id: number; name: string }[],
  hubNames: Record<number, string>
): HubOptionItem[] {
  const withDistance = (o: { hub_id?: number; hub_name?: string; distance_km?: number }) => ({
    id: o.hub_id ?? 0,
    name: o.hub_name ?? hubNames[o.hub_id!] ?? `Hub #${o.hub_id}`,
    distance_km: o.distance_km,
  });
  if (req.hub_options && Array.isArray(req.hub_options) && req.hub_options.length > 0) {
    const options = req.hub_options
      .map((o: { hub_id?: number; hub_name?: string; distance_km?: number }) => withDistance(o))
      .filter((o) => o.id > 0);
    // Sort by distance (nearest first); ensure at least one option
    options.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity));
    return options;
  }
  // Fallback: all hubs so user always has at least one choice when any hub exists
  return hubs.map((h) => ({ id: h.id, name: h.name }));
}

export default function TicketList({
  requests,
  cropNames,
  hubNames,
  onSelectHub,
  onConfirm,
}: TicketListProps) {
  const hubList = Object.entries(hubNames).map(([id, name]) => ({ id: Number(id), name }));

  return (
    <div className="m-section">
      <div className="m-content">
        {requests.length === 0 ? (
          <div className="myfood-empty">
            No requests yet. Request groceries or make a donation above.
          </div>
        ) : (
          requests.map((req) => {
            const options = getHubOptions(req, hubList, hubNames);
            const instructionsContent =
              req.status === "options_ready" && options.length > 0 && onSelectHub ? (
                <div>
                  <label className="input-label" style={{ marginBottom: 4, display: "block" }}>
                    Choose nearest hub
                  </label>
                  <select
                    className="input"
                    onChange={(e) => {
                      const id = parseInt(e.target.value, 10);
                      if (!Number.isNaN(id)) onSelectHub(req.id, id);
                    }}
                  >
                    <option value="">Select hub…</option>
                    {options.map((h, i) => (
                      <option key={h.id} value={h.id}>
                        {i === 0 && h.distance_km != null ? `Nearest: ${h.name} (${h.distance_km} km)` : h.name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : req.status === "matched" && req.hub_id ? (
                `Drop off at ${hubNames[req.hub_id] ?? `Hub #${req.hub_id}`}.`
              ) : (
                ""
              );

            return (
              <div key={req.id}>
                <TicketItem
                  title={getTitle(req, cropNames)}
                  subtitle={getSubtitle(req, hubNames)}
                  instructions={instructionsContent}
                  status={mapStatus(req.status)}
                />
                {req.status === "matched" && onConfirm && (
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <input
                      type="number"
                      className="input"
                      style={{ width: 80 }}
                      defaultValue={req.quantity_kg}
                      min={0.1}
                      step={0.1}
                      id={`confirm-qty-${req.id}`}
                    />
                    <label htmlFor={`confirm-qty-${req.id}`} style={{ fontSize: 11, color: "var(--ink-3)" }}>kg</label>
                    <button
                      type="button"
                      className="btn btn--accent btn--sm"
                      onClick={() => {
                        const el = document.getElementById(`confirm-qty-${req.id}`) as HTMLInputElement;
                        const q = el ? parseFloat(el.value) : req.quantity_kg;
                        onConfirm(req.id, Number.isNaN(q) || q <= 0 ? req.quantity_kg : q);
                      }}
                    >
                      Confirm delivery
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
