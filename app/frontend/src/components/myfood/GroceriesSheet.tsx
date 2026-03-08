import { useState, useEffect, useCallback } from "react";
import * as api from "@/services/myfood-api";
import type { Crop } from "@/services/myfood-api";
import BottomSheet from "./BottomSheet";

interface GroceriesSheetProps {
  open: boolean;
  onClose: () => void;
  nodeId: number;
  balance: number;
  onSuccess: () => void;
}

export default function GroceriesSheet({
  open,
  onClose,
  nodeId,
  balance,
  onSuccess,
}: GroceriesSheetProps) {
  const [crops, setCrops] = useState<Crop[]>([]);
  const [cropsLoading, setCropsLoading] = useState(false);
  const [cropsError, setCropsError] = useState<string | null>(null);
  const [cropId, setCropId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [cost, setCost] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCrops = useCallback(() => {
    if (!open) return;
    setCropsError(null);
    setCropsLoading(true);
    api
      .getCrops()
      .then((list) => {
        setCrops(list);
        setCropsLoading(false);
      })
      .catch(() => {
        setCropsError("Could not load crops. Check your connection and try again.");
        setCrops([]);
        setCropsLoading(false);
      });
  }, [open]);

  useEffect(() => {
    if (open) loadCrops();
  }, [open, loadCrops]);

  useEffect(() => {
    if (!open) return;
    setCropId("");
    setQuantity("");
    setCost(null);
    setError(null);
    setCropsError(null);
  }, [open]);

  useEffect(() => {
    if (cropId === "" || !quantity) {
      setCost(null);
      return;
    }
    const q = parseFloat(quantity);
    if (Number.isNaN(q) || q <= 0) {
      setCost(null);
      return;
    }
    api
      .getDeliveryCost(Number(cropId), q, "receive")
      .then((r) => setCost(r.cost ?? null))
      .catch(() => setCost(null));
  }, [cropId, quantity]);

  const handleSubmit = async () => {
    if (cropId === "" || !quantity) return;
    const q = parseFloat(quantity);
    if (Number.isNaN(q) || q <= 0) return;
    if (cost != null && balance < cost) {
      setError(`Insufficient balance. Cost: ${cost} HC, balance: ${balance} HC`);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await api.submitRequest({
        type: "receive",
        node_id: nodeId,
        crop_id: Number(cropId),
        quantity_kg: q,
      });
      onSuccess();
      onClose();
    } catch (e) {
      if (e instanceof api.ApiError) {
        setError(e.detail ?? e.message);
      } else {
        setError(String(e));
      }
    } finally {
      setSubmitting(false);
    }
  };

  const q = parseFloat(quantity);
  const validQty = !Number.isNaN(q) && q > 0;
  const insufficient = cost != null && balance < cost;
  const canSubmit = validQty && cropId !== "" && !submitting;

  return (
    <BottomSheet open={open} onClose={onClose} title="My Groceries">
      <p style={{ fontSize: 12, color: "var(--ink-3)", marginBottom: 16 }}>
        What would you like to receive?
      </p>
      {cropsError && (
        <p style={{ fontSize: 12, color: "var(--error)", marginBottom: 12 }}>
          {cropsError}
          <button type="button" className="btn btn--secondary btn--sm" style={{ marginLeft: 8 }} onClick={loadCrops}>
            Retry
          </button>
        </p>
      )}
      <div className="input-group">
        <label className="input-label">What do you want?</label>
        <select
          disabled={cropsLoading}
          className="input"
          value={cropId === "" ? "" : String(cropId)}
          onChange={(e) => {
            const v = e.target.value;
            setCropId(v === "" ? "" : Number(v));
          }}
        >
          <option value="">{cropsLoading ? "Loading crops…" : "Select a crop…"}</option>
          {crops.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label className="input-label">Quantity (kg)</label>
        <input
          type="number"
          className="input"
          placeholder="e.g. 2.5"
          min={0.1}
          step={0.1}
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      {cost != null && (
        <div className="sheet-currency">
          <div className="sheet-currency-lbl">Estimated cost</div>
          <div className="sheet-currency-val sheet-currency-val--cost">{cost} HC</div>
        </div>
      )}
      {insufficient && canSubmit && (
        <p style={{ fontSize: 12, color: "var(--error)", marginBottom: 12 }}>
          Your balance ({balance} HC) is less than the estimated cost ({cost} HC). Reduce quantity or add balance.
        </p>
      )}
      {error && (
        <p style={{ fontSize: 12, color: "var(--error)", marginBottom: 12 }}>{error}</p>
      )}
      <div style={{ display: "flex", gap: 10 }}>
        <button type="button" className="btn btn--secondary btn--lg btn--full" onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className="btn btn--groceries btn--lg btn--full"
          onClick={handleSubmit}
          disabled={!canSubmit}
          title={!canSubmit ? "Select a crop and enter a quantity (e.g. 2.5) to request" : undefined}
        >
          {submitting ? "Submitting…" : "Request Groceries"}
        </button>
      </div>
      {!canSubmit && !submitting && (
        <p style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 8 }}>
          Select a crop and enter quantity (kg) to enable the button.
        </p>
      )}
    </BottomSheet>
  );
}
