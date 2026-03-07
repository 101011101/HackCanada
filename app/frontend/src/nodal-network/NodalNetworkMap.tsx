"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import {
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  farms as initialFarms,
  hubs,
  crops,
  getCrop,
  getEffectiveCropId,
  buildNetworkEdges,
  haversine,
  type FarmNode,
  type HubNode,
  type NetworkEdge,
} from "./data";

declare const process: { env: Record<string, string | undefined> };

function getMapApiKey(): string {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY) {
    return (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY as string;
  }
  return process?.env?.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
}

function getMapId(): string | undefined {
  if (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_MAP_ID) {
    const v = (import.meta as any).env.VITE_MAP_ID;
    return v === "" ? undefined : (v as string);
  }
  const v = process?.env?.NEXT_PUBLIC_MAP_ID;
  return v === "" || v == null ? undefined : v;
}

// ── SVG icon builders ───────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  growing: "#4caf50",
  available: "#2196f3",
  new: "#ff9800",
};

function farmIconSvg(fillColor: string, borderColor: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="15" fill="${fillColor}" stroke="${borderColor}" stroke-width="3"/>
    <text x="18" y="23" text-anchor="middle" font-size="14" font-family="sans-serif" fill="white" font-weight="bold">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function hubIconSvg(fillColor: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect x="4" y="4" width="40" height="40" rx="8" fill="${fillColor}" stroke="white" stroke-width="3"/>
    <text x="24" y="30" text-anchor="middle" font-size="20" font-family="sans-serif" fill="white">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// ── Info HTML builders ──────────────────────────────────────────────────────

const UNENTERED = `<span style="color:#ccc;font-style:italic">Unentered data</span>`;

function val(v: string | number | null | undefined, suffix = ""): string {
  if (v == null || v === "") return UNENTERED;
  if (typeof v === "number") return v + suffix;
  return v + suffix;
}

function valFixed(v: number | null | undefined, decimals: number, suffix = ""): string {
  if (v == null) return UNENTERED;
  return v.toFixed(decimals) + suffix;
}

function farmInfoHtml(farm: FarmNode, withActions: boolean): string {
  const cropId = getEffectiveCropId(farm);
  const crop = cropId != null ? getCrop(cropId) : null;
  const statusColor = STATUS_COLOR[farm.status] ?? "#999";

  let nearestHubName = "";
  let nearestHubDist = 0;
  let bestD = Infinity;
  for (const h of hubs) {
    const d = haversine(farm.lat, farm.lng, h.lat, h.lng);
    if (d < bestD) { bestD = d; nearestHubName = h.name; nearestHubDist = d; }
  }

  const plotDisplay = farm.plot_type != null && farm.plot_size_sqft != null
    ? `${farm.plot_type} · ${farm.plot_size_sqft} sqft`
    : farm.plot_type != null
      ? farm.plot_type
      : farm.plot_size_sqft != null
        ? `${farm.plot_size_sqft} sqft`
        : UNENTERED;

  const cropSection = crop
    ? `<tr><td style="color:#999;padding:1px 8px 1px 0;white-space:nowrap">Crop</td>
         <td><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${crop.color};margin-right:3px;vertical-align:middle"></span>
         <strong>${crop.name}</strong> <span style="color:#999">${crop.grow_weeks}wk · ${crop.base_yield_per_sqft}kg/sqft</span></td></tr>`
    : "";

  const harvestRow = farm.status === "growing" && farm.cycle_end_date
    ? `<tr><td style="color:#999;padding:1px 8px 1px 0;white-space:nowrap">Harvest</td><td>${farm.cycle_end_date}</td></tr>`
    : "";

  const actions = withActions
    ? `<div style="margin-top:6px;padding-top:5px;border-top:1px solid #eee;display:flex;gap:6px">
        <button onclick="window.__mcl_edit(${farm.id})" style="flex:1;padding:3px 0;border:1px solid #2196f3;background:#fff;color:#2196f3;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit">Edit</button>
        <button onclick="window.__mcl_delete(${farm.id})" style="flex:1;padding:3px 0;border:1px solid #e53935;background:#fff;color:#e53935;border-radius:4px;font-size:10px;font-weight:600;cursor:pointer;font-family:inherit">Delete</button>
      </div>`
    : "";

  const td = `style="color:#999;padding:1px 8px 1px 0;white-space:nowrap"`;
  const sep = `<tr><td colspan="2" style="padding:2px 0;border-top:1px solid #f0f0f0"></td></tr>`;

  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:11px;line-height:1.45;min-width:190px;max-width:250px">
    <div style="font-weight:700;font-size:12px;margin-bottom:2px">${farm.name}</div>
    <div style="font-size:9px;color:#999;margin-bottom:4px">${farm.lat.toFixed(4)}°N, ${Math.abs(farm.lng).toFixed(4)}°W</div>
    <table style="border-collapse:collapse;width:100%">
      <tr><td ${td}>Status</td><td><strong style="color:${statusColor}">${farm.status.charAt(0).toUpperCase() + farm.status.slice(1)}</strong></td></tr>
      <tr><td ${td}>Plot</td><td>${plotDisplay}</td></tr>
      <tr><td ${td}>Tools</td><td>${val(farm.tools)}</td></tr>
      <tr><td ${td}>Budget</td><td>${val(farm.budget)}</td></tr>
      ${cropSection}
      ${harvestRow}
      ${sep}
      <tr><td ${td}>pH</td><td>${valFixed(farm.pH, 1)}</td></tr>
      <tr><td ${td}>Moisture</td><td>${valFixed(farm.moisture, 0, "%")}</td></tr>
      <tr><td ${td}>Temp</td><td>${valFixed(farm.temperature, 0, "°C")}</td></tr>
      <tr><td ${td}>Humidity</td><td>${valFixed(farm.humidity, 0, "%")}</td></tr>
      ${sep}
      <tr><td ${td}>Hub</td><td>${nearestHubName} <span style="color:#999">(${(nearestHubDist / 1000).toFixed(1)}km)</span></td></tr>
    </table>
    ${actions}
  </div>`;
}

function hubInfoHtml(hub: HubNode, edges: NetworkEdge[]): string {
  const connectedCount = edges.filter(e => e.hubId === hub.id).length;
  const priorityColor = hub.priority === "critical" ? "#ff5722" : "#3f51b5";

  const demandChips = Object.entries(hub.local_demand)
    .map(([cropId, kg]) => {
      const crop = getCrop(Number(cropId));
      if (!crop) return "";
      return `<span style="display:inline-block;background:${crop.color}18;border:1px solid ${crop.color}88;border-radius:3px;padding:0 4px;margin:1px;font-size:9px;line-height:1.6">${crop.name}: ${kg}kg</span>`;
    })
    .join("");

  const td = `style="color:#999;padding:1px 8px 1px 0;white-space:nowrap"`;

  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:11px;line-height:1.45;min-width:200px;max-width:260px">
    <div style="font-weight:700;font-size:12px;margin-bottom:2px">${hub.name}</div>
    <div style="font-size:9px;color:#999;margin-bottom:4px">${hub.lat.toFixed(4)}°N, ${Math.abs(hub.lng).toFixed(4)}°W</div>
    <table style="border-collapse:collapse;width:100%">
      <tr><td ${td}>Priority</td><td><strong style="color:${priorityColor}">${hub.priority.charAt(0).toUpperCase() + hub.priority.slice(1)}</strong></td></tr>
      <tr><td ${td}>Capacity</td><td>${hub.capacity_kg} kg</td></tr>
      <tr><td ${td}>Connected</td><td>${connectedCount} farms</td></tr>
    </table>
    <div style="margin-top:4px;padding-top:4px;border-top:1px solid #f0f0f0">
      <div style="font-size:9px;color:#999;font-weight:600;margin-bottom:2px;text-transform:uppercase;letter-spacing:0.3px">Demand by Crop</div>
      <div style="display:flex;flex-wrap:wrap">${demandChips}</div>
    </div>
  </div>`;
}

// ── Plot type short labels ──────────────────────────────────────────────────

const PLOT_LETTER: Record<string, string> = {
  balcony: "B",
  rooftop: "R",
  backyard: "Y",
  community: "C",
};

// ── Callbacks interface for marker actions ──────────────────────────────────

interface NetworkCallbacks {
  onEditFarm: (id: number) => void;
  onDeleteFarm: (id: number) => void;
}

// ── Imperative layer ────────────────────────────────────────────────────────

function NetworkLayer({ farmList, edges, callbacks }: {
  farmList: FarmNode[];
  edges: NetworkEdge[];
  callbacks: React.RefObject<NetworkCallbacks>;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    // Register global callbacks for InfoWindow button onclick
    (window as any).__mcl_edit = (id: number) => callbacks.current?.onEditFarm(id);
    (window as any).__mcl_delete = (id: number) => callbacks.current?.onDeleteFarm(id);

    const farmById = new globalThis.Map(farmList.map(f => [f.id, f]));
    const hubById = new globalThis.Map(hubs.map(h => [h.id, h]));

    const hoverInfoWindow = new google.maps.InfoWindow({ disableAutoPan: true });
    const clickInfoWindow = new google.maps.InfoWindow();
    let clickedOpen = false;

    const allMarkers: google.maps.Marker[] = [];
    const allPolylines: google.maps.Polyline[] = [];

    for (const edge of edges) {
      const farm = farmById.get(edge.farmId);
      const hub = hubById.get(edge.hubId);
      if (!farm || !hub) continue;
      const cropId = getEffectiveCropId(farm);
      const crop = cropId != null ? getCrop(cropId) : null;

      allPolylines.push(new google.maps.Polyline({
        path: [
          { lat: farm.lat, lng: farm.lng },
          { lat: hub.lat, lng: hub.lng },
        ],
        strokeColor: crop?.color ?? "#999",
        strokeOpacity: 0.45,
        strokeWeight: 2,
        map,
      }));
    }

    for (const farm of farmList) {
      const cropId = getEffectiveCropId(farm);
      const crop = cropId != null ? getCrop(cropId) : null;
      const fillColor = crop?.color ?? "#aaa";
      const borderColor = STATUS_COLOR[farm.status] ?? "#999";
      const letter = (farm.plot_type && PLOT_LETTER[farm.plot_type]) ?? "F";

      const marker = new google.maps.Marker({
        position: { lat: farm.lat, lng: farm.lng },
        map,
        icon: {
          url: farmIconSvg(fillColor, borderColor, letter),
          scaledSize: new google.maps.Size(32, 32),
          anchor: new google.maps.Point(16, 16),
        },
        zIndex: farm.status === "growing" ? 10 : 5,
        title: farm.name,
      });

      marker.addListener("mouseover", () => {
        if (clickedOpen) return;
        hoverInfoWindow.setContent(farmInfoHtml(farm, false));
        hoverInfoWindow.open(map, marker);
      });
      marker.addListener("mouseout", () => {
        if (clickedOpen) return;
        hoverInfoWindow.close();
      });
      marker.addListener("click", () => {
        hoverInfoWindow.close();
        clickInfoWindow.setContent(farmInfoHtml(farm, true));
        clickInfoWindow.open(map, marker);
        clickedOpen = true;
      });

      allMarkers.push(marker);
    }

    clickInfoWindow.addListener("closeclick", () => { clickedOpen = false; });

    for (const hub of hubs) {
      const isCritical = hub.priority === "critical";
      const color = isCritical ? "#ff5722" : "#3f51b5";
      const label = isCritical ? "!" : "H";

      const marker = new google.maps.Marker({
        position: { lat: hub.lat, lng: hub.lng },
        map,
        icon: {
          url: hubIconSvg(color, label),
          scaledSize: new google.maps.Size(44, 44),
          anchor: new google.maps.Point(22, 22),
        },
        zIndex: 50,
        title: hub.name,
      });

      marker.addListener("mouseover", () => {
        if (clickedOpen) return;
        hoverInfoWindow.setContent(hubInfoHtml(hub, edges));
        hoverInfoWindow.open(map, marker);
      });
      marker.addListener("mouseout", () => {
        if (clickedOpen) return;
        hoverInfoWindow.close();
      });
      allMarkers.push(marker);
    }

    return () => {
      hoverInfoWindow.close();
      clickInfoWindow.close();
      clickedOpen = false;
      allMarkers.forEach(m => m.setMap(null));
      allPolylines.forEach(p => p.setMap(null));
      delete (window as any).__mcl_edit;
      delete (window as any).__mcl_delete;
    };
  }, [map, farmList, edges, callbacks]);

  return null;
}

// ── Map event listeners ─────────────────────────────────────────────────────

function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  const cbRef = useRef(onMapClick);
  cbRef.current = onMapClick;

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        cbRef.current(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  return null;
}

function MapRightClickHandler({ onRightClick }: { onRightClick: (lat: number, lng: number) => void }) {
  const map = useMap();
  const cbRef = useRef(onRightClick);
  cbRef.current = onRightClick;

  useEffect(() => {
    if (!map) return;
    const listener = map.addListener("rightclick", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        cbRef.current(e.latLng.lat(), e.latLng.lng());
      }
    });
    return () => google.maps.event.removeListener(listener);
  }, [map]);

  return null;
}

// ── Legend (collapsible) ────────────────────────────────────────────────────

function Legend({ farmList, edges }: { farmList: FarmNode[]; edges: NetworkEdge[] }) {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      position: "absolute",
      bottom: 16,
      left: 16,
      background: "rgba(255,255,255,0.95)",
      backdropFilter: "blur(8px)",
      borderRadius: 10,
      boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
      fontSize: 12,
      maxWidth: 210,
      zIndex: 10,
      fontFamily: "Inter, system-ui, sans-serif",
      overflow: "hidden",
    }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "10px 16px",
          background: "none",
          border: "none",
          cursor: "pointer",
          fontWeight: 700,
          fontSize: 13,
          fontFamily: "inherit",
          color: "#333",
        }}
      >
        <span>Legend</span>
        <span style={{
          fontSize: 16, lineHeight: 1,
          transition: "transform 0.2s",
          transform: open ? "rotate(0deg)" : "rotate(-90deg)",
        }}>▾</span>
      </button>

      {open && (
        <div style={{ padding: "0 16px 14px", lineHeight: 1.7 }}>
          <LegendSection title="Hubs (squares)">
            <LegendItem color="#ff5722" shape="square" label="Critical hub (!)" />
            <LegendItem color="#3f51b5" shape="square" label="Standard hub (H)" />
          </LegendSection>
          <LegendSection title="Farm border = status">
            <LegendItem color="#4caf50" label="Growing" />
            <LegendItem color="#2196f3" label="Available" />
            <LegendItem color="#ff9800" label="New" />
          </LegendSection>
          <LegendSection title="Farm fill = crop">
            {crops.map(c => <LegendItem key={c.id} color={c.color} label={c.name} />)}
          </LegendSection>
          <LegendSection title="Lines = farm → hub route">
            <div style={{ fontSize: 11, color: "#888" }}>
              Each line connects a farm to its nearest distribution hub, colored by crop.
            </div>
          </LegendSection>
          <div style={{ marginTop: 6, fontSize: 11, color: "#aaa", borderTop: "1px solid #eee", paddingTop: 6 }}>
            {farmList.length} farms · {hubs.length} hubs · {edges.length} links
          </div>
        </div>
      )}
    </div>
  );
}

function LegendSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ fontSize: 10, color: "#999", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2, fontWeight: 600 }}>{title}</div>
      {children}
    </div>
  );
}

function LegendItem({ color, label, shape = "circle" }: { color: string; label: string; shape?: "circle" | "square" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div style={{ width: 10, height: 10, borderRadius: shape === "circle" ? "50%" : 2, background: color, flexShrink: 0 }} />
      <span>{label}</span>
    </div>
  );
}

// ── Farm form panel (add + edit) ────────────────────────────────────────────

type PanelMode = "closed" | "add-manual" | "add-pinpoint" | "edit";

interface FarmForm {
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
}

const EMPTY_FORM: FarmForm = {
  name: "", lat: "", lng: "",
  plot_size_sqft: "", plot_type: "", tools: "", budget: "",
  pH: "", moisture: "", temperature: "", humidity: "",
};

function farmToForm(farm: FarmNode): FarmForm {
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
  };
}

function FarmPanel({ mode, form, onFormChange, onModeChange, onSubmit, onDelete, onCancel }: {
  mode: PanelMode;
  form: FarmForm;
  onFormChange: (f: FarmForm) => void;
  onModeChange: (m: PanelMode) => void;
  onSubmit: () => void;
  onDelete?: () => void;
  onCancel: () => void;
}) {
  if (mode === "closed") {
    return (
      <div style={{ position: "absolute", top: 16, right: 16, zIndex: 10, display: "flex", gap: 8 }}>
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
      position: "absolute", top: 16, right: 16, zIndex: 10,
      background: "rgba(255,255,255,0.97)", backdropFilter: "blur(8px)",
      borderRadius: 12, padding: "18px 20px",
      boxShadow: "0 4px 24px rgba(0,0,0,0.2)",
      fontFamily: "Inter, system-ui, sans-serif", fontSize: 13, width: 300,
      maxHeight: "calc(100vh - 100px)", overflowY: "auto",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{title}</h3>
        <button onClick={onCancel} style={closeBtnStyle}>×</button>
      </div>

      {isPinpoint && !hasCoords && (
        <div style={{ background: "#fff3e0", border: "1px solid #ffcc80", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#e65100" }}>
          Click anywhere on the map to place your new farm. The coordinates will auto-fill below.
        </div>
      )}

      {isPinpoint && hasCoords && (
        <div style={{ background: "#e8f5e9", border: "1px solid #a5d6a7", borderRadius: 8, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#2e7d32" }}>
          Location set: {Number(form.lat).toFixed(4)}°N, {Math.abs(Number(form.lng)).toFixed(4)}°W
        </div>
      )}

      <FormField label="Farm Name">
        <input type="text" placeholder="e.g. My Backyard Farm" value={form.name}
          onChange={e => onFormChange({ ...form, name: e.target.value })} style={inputStyle} />
      </FormField>

      {/* Coordinates: editable for manual add, read-only for edit and pinpoint */}
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
            <div style={{ ...inputStyle, background: "#f5f5f5", color: "#999" }}>{Number(form.lat).toFixed(6)}</div>
          </FormField>
          <FormField label="Longitude (locked)">
            <div style={{ ...inputStyle, background: "#f5f5f5", color: "#999" }}>{Number(form.lng).toFixed(6)}</div>
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
            style={{ ...inputStyle, color: form.plot_type ? undefined : "#999" }}>
            <option value="">—</option>
            <option value="balcony">Balcony</option>
            <option value="rooftop">Rooftop</option>
            <option value="backyard">Backyard</option>
            <option value="community">Community</option>
          </select>
        </FormField>
        <FormField label="Tools">
          <select value={form.tools} onChange={e => onFormChange({ ...form, tools: e.target.value })}
            style={{ ...inputStyle, color: form.tools ? undefined : "#999" }}>
            <option value="">—</option>
            <option value="basic">Basic</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </FormField>
        <FormField label="Budget">
          <select value={form.budget} onChange={e => onFormChange({ ...form, budget: e.target.value })}
            style={{ ...inputStyle, color: form.budget ? undefined : "#999" }}>
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

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        {isEdit && onDelete && (
          <button onClick={onDelete} style={{ ...secondaryBtnStyle, color: "#e53935", borderColor: "#e53935" }}>
            Delete
          </button>
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
    <div style={{ marginBottom: 8 }}>
      <label style={{ display: "block", fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: 0.4, marginBottom: 3, fontWeight: 600 }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function PanelButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      padding: "8px 16px", borderRadius: 8, border: "none",
      background: "rgba(255,255,255,0.95)", color: "#333",
      fontSize: 13, fontWeight: 600, fontFamily: "Inter, system-ui, sans-serif",
      cursor: "pointer", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", backdropFilter: "blur(8px)",
    }}>
      {label}
    </button>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "6px 8px", borderRadius: 6,
  border: "1px solid #ddd", fontSize: 13, fontFamily: "inherit",
  boxSizing: "border-box", outline: "none",
};

const primaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: "9px 16px", borderRadius: 8, border: "none",
  background: "#4caf50", color: "#fff", fontSize: 13, fontWeight: 600,
  fontFamily: "inherit", cursor: "pointer",
};

const secondaryBtnStyle: React.CSSProperties = {
  flex: 1, padding: "9px 16px", borderRadius: 8,
  border: "1px solid #ddd", background: "#fff", color: "#666",
  fontSize: 13, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
};

const closeBtnStyle: React.CSSProperties = {
  background: "none", border: "none", fontSize: 20,
  cursor: "pointer", color: "#999", padding: "0 4px", lineHeight: 1,
};

// ── Pinpoint mode crosshair cursor ──────────────────────────────────────────

function PinpointCursor({ active }: { active: boolean }) {
  useEffect(() => {
    if (!active) return;
    const mapDiv = document.querySelector<HTMLElement>(".gm-style");
    if (mapDiv) mapDiv.style.cursor = "crosshair";
    return () => { if (mapDiv) mapDiv.style.cursor = ""; };
  }, [active]);
  return null;
}

// ── Main component ──────────────────────────────────────────────────────────

export default function NodalNetworkMap() {
  const [farmList, setFarmList] = useState<FarmNode[]>(() => [...initialFarms]);
  const [panelMode, setPanelMode] = useState<PanelMode>("closed");
  const [form, setForm] = useState<FarmForm>({ ...EMPTY_FORM });
  const [editFarmId, setEditFarmId] = useState<number | null>(null);
  const nextId = useRef(Math.max(...initialFarms.map(f => f.id)) + 1);

  const edges = useMemo(() => buildNetworkEdges(farmList), [farmList]);
  const apiKey = getMapApiKey();
  const mapId = getMapId();

  const parseOrNull = (v: string): number | null => {
    if (v.trim() === "") return null;
    const n = parseFloat(v);
    return isNaN(n) ? null : n;
  };

  // ── Callbacks for marker actions ──
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
    if (!confirm(`Delete this farm?`)) return;
    setFarmList(prev => prev.filter(f => f.id !== id));
    setPanelMode("closed");
    setEditFarmId(null);
    setForm({ ...EMPTY_FORM });
  }, []);

  // ── Map click (left = pinpoint add, right = new farm) ──
  const handleMapClick = useCallback((lat: number, lng: number) => {
    if (panelMode !== "add-pinpoint") return;
    setForm(f => ({ ...f, lat: lat.toFixed(6), lng: lng.toFixed(6) }));
  }, [panelMode]);

  const handleRightClick = useCallback((lat: number, lng: number) => {
    setForm({ ...EMPTY_FORM, lat: lat.toFixed(6), lng: lng.toFixed(6) });
    setPanelMode("add-pinpoint");
  }, []);

  // ── Submit (add or edit) ──
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

  if (!apiKey || apiKey.trim() === "") {
    return (
      <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#f5f5f5" }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12 }}>Google Maps API key missing</h2>
          <p style={{ color: "#666", marginBottom: 12 }}>
            Add this to a file named <code>.env</code> in the <strong>project root</strong>:
          </p>
          <pre style={{ background: "#eee", padding: 16, borderRadius: 8, overflow: "auto", textAlign: "left", marginBottom: 12 }}>
            VITE_GOOGLE_MAPS_API_KEY=your_actual_key_here
          </pre>
          <p style={{ color: "#666", fontSize: 14 }}>
            Get a key from{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
              Google Cloud Console
            </a>
            , enable <strong>Maps JavaScript API</strong>, then restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ height: "100%", width: "100%", position: "relative" }}>
        <Map
          defaultZoom={14}
          defaultCenter={{ lat: 43.655, lng: -79.385 }}
          mapId={mapId}
          gestureHandling="greedy"
          disableDefaultUI={false}
        >
          <NetworkLayer farmList={farmList} edges={edges} callbacks={callbacks} />
          {panelMode === "add-pinpoint" && <MapClickHandler onMapClick={handleMapClick} />}
          <MapRightClickHandler onRightClick={handleRightClick} />
          <PinpointCursor active={panelMode === "add-pinpoint"} />
        </Map>

        <Legend farmList={farmList} edges={edges} />

        <FarmPanel
          mode={panelMode}
          form={form}
          onFormChange={setForm}
          onModeChange={setPanelMode}
          onSubmit={handleSubmit}
          onDelete={panelMode === "edit" ? handleDeleteFromPanel : undefined}
          onCancel={handleCancel}
        />
      </div>
    </APIProvider>
  );
}
