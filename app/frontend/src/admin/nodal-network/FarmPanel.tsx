import { useState } from 'react';
import type { FarmNode } from "./data";
import { T } from "./tokens";
import { getSuggestions, type SuggestionItem } from "../services/api";

export type PanelMode = "closed" | "add-manual" | "add-pinpoint" | "edit";

export interface FarmForm {
  name: string;
  lat: string;
  lng: string;
  plot_size_sqft: string;
  plot_type: string;
  tools: string;
  budget: string;
  pH: string;
  moisture: string;
  temperature: string;
  humidity: string;
  sunlight_hours: string;
}

export const EMPTY_FORM: FarmForm = {
  name: "", lat: "", lng: "",
  plot_size_sqft: "", plot_type: "", tools: "", budget: "",
  pH: "", moisture: "", temperature: "", humidity: "",
  sunlight_hours: "",
};

export function farmToForm(farm: FarmNode): FarmForm {
  return {
    name: farm.name,
    lat: String(farm.lat),
    lng: String(farm.lng),
    plot_size_sqft: farm.plot_size_sqft != null ? String(farm.plot_size_sqft) : "",
    plot_type: farm.plot_type ?? "",
    tools: farm.tools ?? "",
    budget: farm.budget ?? "",
    pH: farm.pH != null ? String(farm.pH) : "",
    moisture: farm.moisture != null ? String(farm.moisture) : "",
    temperature: farm.temperature != null ? String(farm.temperature) : "",
    humidity: farm.humidity != null ? String(farm.humidity) : "",
    sunlight_hours: farm.sunlight_hours != null ? String(farm.sunlight_hours) : "",
  };
}

export function FarmPanel({ mode, form, farmId, onFormChange, onModeChange, onSubmit, onDelete, onCancel, style }: {
  mode: PanelMode;
  form: FarmForm;
  farmId?: number;
  onFormChange: (f: FarmForm) => void;
  onModeChange: (m: PanelMode) => void;
  onSubmit: () => void;
  onDelete?: (farmId: number) => void;
  onCancel: () => void;
  style?: React.CSSProperties;
}) {
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);

  const handleGetSuggestions = () => {
    const plotSqft = parseFloat(form.plot_size_sqft);
    if (isNaN(plotSqft) || plotSqft <= 0) return;
    setSuggestionsLoading(true);
    getSuggestions({
      plot_size_sqft: plotSqft,
      plot_type: form.plot_type || 'balcony',
      tools: form.tools || 'basic',
      budget: form.budget || 'low',
      pH: parseFloat(form.pH) || undefined,
      moisture: parseFloat(form.moisture) || undefined,
      temperature: parseFloat(form.temperature) || undefined,
      humidity: parseFloat(form.humidity) || undefined,
    }).then(s => {
      setSuggestions(s);
      setSuggestionsLoading(false);
    }).catch(() => setSuggestionsLoading(false));
  };

  if (mode === "closed") {
    return (
      <div style={{ display: "flex", gap: 8, ...style }}>
        <PanelButton label="+ Manual Entry" onClick={() => onModeChange("add-manual")} />
        <PanelButton label="+ Click on Map" onClick={() => onModeChange("add-pinpoint")} />
      </div>
    );
  }

  const isEdit = mode === "edit";
  const isPinpoint = mode === "add-pinpoint";
  const hasCoords = form.lat !== "" && form.lng !== "";
  const canSubmit = form.name.trim() !== "" && hasCoords;

  const title = isEdit
    ? "Edit Farm"
    : isPinpoint
      ? "Click the map to place"
      : "Add Farm — Manual Entry";

  return (
    <div style={{
      background: T.bgCard, border: `1px solid ${T.borderLt}`,
      borderRadius: T.rLg, padding: "20px 22px",
      boxShadow: T.shLg,
      fontFamily: T.fb, fontSize: 13, width: 310,
      maxHeight: "calc(100vh - 100px)", overflowY: "auto",
      color: T.ink,
      ...style,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{
          margin: 0, fontSize: 17, fontWeight: 700,
          fontFamily: T.fd, letterSpacing: "-0.02em", color: T.ink,
        }}>{title}</h3>
        <button onClick={onCancel} style={closeBtnStyle}>×</button>
      </div>

      {isPinpoint && !hasCoords && (
        <div style={{
          background: T.accentBg, border: `1px solid ${T.accent}44`,
          borderRadius: T.rMd, padding: "10px 12px", marginBottom: 12,
          fontSize: 12, color: T.accent, fontWeight: 500,
        }}>
          Click anywhere on the map to place your new farm. The coordinates will auto-fill below.
        </div>
      )}

      {isPinpoint && hasCoords && (
        <div style={{
          background: "rgba(76,175,80,0.12)", border: `1px solid ${T.success}44`,
          borderRadius: T.rMd, padding: "10px 12px", marginBottom: 12,
          fontSize: 12, color: T.success, fontWeight: 500,
        }}>
          Location set: {Number(form.lat).toFixed(4)}°N, {Math.abs(Number(form.lng)).toFixed(4)}°W
        </div>
      )}

      <FormField label="Farm Name">
        <input type="text" placeholder="e.g. My Backyard Farm" value={form.name}
          onChange={e => onFormChange({ ...form, name: e.target.value })} style={inputStyle} />
      </FormField>

      {!isPinpoint && !isEdit && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <FormField label="Latitude">
            <input type="number" step="any" placeholder="43.6550" value={form.lat}
              onChange={e => onFormChange({ ...form, lat: e.target.value })} style={inputStyle} />
          </FormField>
          <FormField label="Longitude">
            <input type="number" step="any" placeholder="-79.3850" value={form.lng}
              onChange={e => onFormChange({ ...form, lng: e.target.value })} style={inputStyle} />
          </FormField>
        </div>
      )}

      {isEdit && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <FormField label="Latitude (locked)">
            <div style={{ ...inputStyle, background: T.bg, color: T.ink3 }}>{Number(form.lat).toFixed(6)}</div>
          </FormField>
          <FormField label="Longitude (locked)">
            <div style={{ ...inputStyle, background: T.bg, color: T.ink3 }}>{Number(form.lng).toFixed(6)}</div>
          </FormField>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <FormField label="Plot Size (sqft)">
          <input type="number" placeholder="" value={form.plot_size_sqft}
            onChange={e => onFormChange({ ...form, plot_size_sqft: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Plot Type">
          <select value={form.plot_type} onChange={e => onFormChange({ ...form, plot_type: e.target.value })}
            style={{ ...inputStyle, color: form.plot_type ? T.ink : T.ink3 }}>
            <option value="">—</option>
            <option value="balcony">Balcony</option>
            <option value="rooftop">Rooftop</option>
            <option value="backyard">Backyard</option>
            <option value="community">Community</option>
          </select>
        </FormField>
        <FormField label="Tools">
          <select value={form.tools} onChange={e => onFormChange({ ...form, tools: e.target.value })}
            style={{ ...inputStyle, color: form.tools ? T.ink : T.ink3 }}>
            <option value="">—</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </FormField>
        <FormField label="Budget">
          <select value={form.budget} onChange={e => onFormChange({ ...form, budget: e.target.value })}
            style={{ ...inputStyle, color: form.budget ? T.ink : T.ink3 }}>
            <option value="">—</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </FormField>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
        <FormField label="pH">
          <input type="number" step="0.1" value={form.pH}
            onChange={e => onFormChange({ ...form, pH: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Moist %">
          <input type="number" value={form.moisture}
            onChange={e => onFormChange({ ...form, moisture: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Temp °C">
          <input type="number" value={form.temperature}
            onChange={e => onFormChange({ ...form, temperature: e.target.value })} style={inputStyle} />
        </FormField>
        <FormField label="Humid %">
          <input type="number" value={form.humidity}
            onChange={e => onFormChange({ ...form, humidity: e.target.value })} style={inputStyle} />
        </FormField>
      </div>

      {isEdit && (
        <FormField label="Sunlight (hrs/day)">
          <input type="number" min={0} max={24} step={0.5} value={form.sunlight_hours}
            onChange={e => onFormChange({ ...form, sunlight_hours: e.target.value })} style={inputStyle} />
        </FormField>
      )}

      {!isEdit && (
        <div style={{ marginTop: 4, marginBottom: 4 }}>
          <button onClick={handleGetSuggestions} disabled={suggestionsLoading} style={{
            padding: "7px 14px", borderRadius: T.rSm, border: `1.5px solid ${T.border}`,
            background: "transparent", color: T.ink, fontSize: 12, fontWeight: 600,
            fontFamily: T.fb, cursor: "pointer",
          }}>
            {suggestionsLoading ? "Loading…" : "Get Crop Suggestions"}
          </button>
          {suggestions.length > 0 && (
            <div style={{ marginTop: 8 }}>
              {suggestions.slice(0, 3).map(s => (
                <div key={s.crop_id} style={{
                  display: "flex", justifyContent: "space-between",
                  padding: "4px 0", fontSize: 11, color: T.ink,
                  borderBottom: `1px solid ${T.borderLt}`,
                }}>
                  <span style={{ fontWeight: 600 }}>{s.crop_name}</span>
                  <span style={{ color: T.ink3 }}>{s.suitability_pct}% match</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        {isEdit && onDelete && farmId != null && (
          <button onClick={() => onDelete(farmId)} style={deleteBtnStyle}>Delete</button>
        )}
        <button onClick={onCancel} style={secondaryBtnStyle}>Cancel</button>
        <button onClick={onSubmit} disabled={!canSubmit}
          style={{ ...primaryBtnStyle, opacity: canSubmit ? 1 : 0.5, cursor: canSubmit ? "pointer" : "not-allowed" }}>
          {isEdit ? "Save Changes" : "Add Farm"}
        </button>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <label style={{
        display: "block", fontSize: 10, color: T.ink3,
        textTransform: "uppercase", letterSpacing: "0.14em",
        marginBottom: 4, fontWeight: 700,
      }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PanelButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "9px 18px", borderRadius: T.rSm,
      border: "none", background: T.bgCard,
      color: T.ink, fontSize: 13, fontWeight: 600,
      fontFamily: T.fb, cursor: "pointer",
      transition: "opacity .15s",
    }}>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "7px 10px", borderRadius: T.rSm,
  border: `1.5px solid ${T.border}`, fontSize: 13,
  fontFamily: T.fb, boxSizing: "border-box", outline: "none",
  background: T.bgElev, color: T.ink,
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: "9px 18px", borderRadius: T.rSm, border: "none",
  background: T.ink, color: T.inv, fontSize: 13, fontWeight: 600,
  fontFamily: T.fb, cursor: "pointer", transition: "opacity .15s",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: "9px 18px", borderRadius: T.rSm,
  border: `1.5px solid ${T.border}`, background: "transparent",
  color: T.ink, fontSize: 13, fontWeight: 600,
  fontFamily: T.fb, cursor: "pointer", transition: "opacity .15s",
};

const deleteBtnStyle: React.CSSProperties = {
  flex: 1, padding: "9px 18px", borderRadius: T.rSm, border: "none",
  background: "rgba(217,79,79,0.12)", color: T.error,
  fontSize: 13, fontWeight: 600,
  fontFamily: T.fb, cursor: "pointer", transition: "opacity .15s",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", fontSize: 20,
  cursor: "pointer", color: T.ink3, padding: "0 4px", lineHeight: 1,
};
