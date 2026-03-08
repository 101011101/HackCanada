"use client";

import { useEffect, useRef } from "react";
import {
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  hubs,
  getCrop,
  getEffectiveCropId,
  haversine,
  type FarmNode,
  type HubNode,
  type NetworkEdge,
} from "./data";
import { T } from "./tokens";
import type { PanelMode } from "./FarmPanel";

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
  growing: T.success,
  available: T.info,
  new: T.accent,
};

function farmIconSvg(fillColor: string, borderColor: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 36 36">
    <circle cx="18" cy="18" r="14" fill="${T.bgElev}" stroke="${T.border}" stroke-width="1.5"/>
    <circle cx="18" cy="18" r="10" fill="${fillColor}" opacity="0.9"/>
    <text x="18" y="22" text-anchor="middle" font-size="11" font-family="Inter,system-ui,sans-serif" fill="white" font-weight="700">${label}</text>
    <circle cx="28" cy="8" r="4.5" fill="${borderColor}" stroke="${T.bgElev}" stroke-width="1.5"/>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

function hubIconSvg(fillColor: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48">
    <rect x="6" y="6" width="36" height="36" rx="6" fill="${T.bgElev}" stroke="${T.border}" stroke-width="1.5"/>
    <rect x="10" y="10" width="28" height="28" rx="4" fill="${fillColor}" opacity="0.9"/>
    <text x="24" y="29" text-anchor="middle" font-size="16" font-family="Inter,system-ui,sans-serif" fill="white" font-weight="700">${label}</text>
  </svg>`;
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg);
}

// ── Info HTML builders ──────────────────────────────────────────────────────

const UNENTERED = `<span style="color:${T.ink3};font-style:italic;font-size:11px">—</span>`;

function val(v: string | number | null | undefined, suffix = ""): string {
  if (v == null || v === "") return UNENTERED;
  if (typeof v === "number") return v + suffix;
  return v + suffix;
}

function valFixed(v: number | null | undefined, decimals: number, suffix = ""): string {
  if (v == null) return UNENTERED;
  return v.toFixed(decimals) + suffix;
}

function badgeHtml(text: string, color: string): string {
  const bgMap: Record<string, string> = {
    [T.success]: "rgba(76,175,80,0.12)",
    [T.info]:    "rgba(91,141,239,0.12)",
    [T.accent]:  T.accentBg,
    [T.error]:   "rgba(217,79,79,0.12)",
  };
  const bg = bgMap[color] ?? "rgba(158,154,148,0.12)";
  return `<span style="display:inline-flex;align-items:center;font-size:10px;font-weight:600;padding:2px 7px;border-radius:${T.rXs};letter-spacing:0.02em;background:${bg};color:${color}">${text}</span>`;
}

function farmHoverHtml(farm: FarmNode): string {
  const statusColor = STATUS_COLOR[farm.status] ?? T.ink3;
  const cropId = getEffectiveCropId(farm);
  const crop = cropId != null ? getCrop(cropId) : null;
  const cropLabel = crop
    ? `<span style="display:inline-block;width:5px;height:5px;border-radius:50%;background:${crop.color};margin-right:3px;vertical-align:middle"></span>${crop.name}`
    : "";

  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:11px;line-height:1.4;white-space:nowrap;color:${T.ink}">
    <strong style="font-size:12px;letter-spacing:-0.01em">${farm.name}</strong>
    <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
      ${badgeHtml(farm.status.charAt(0).toUpperCase() + farm.status.slice(1), statusColor)}
      ${cropLabel ? `<span style="font-size:10px;color:${T.ink2}">${cropLabel}</span>` : ""}
    </div>
  </div>`;
}

function farmInfoHtml(farm: FarmNode, withActions: boolean): string {
  const cropId = getEffectiveCropId(farm);
  const crop = cropId != null ? getCrop(cropId) : null;
  const statusColor = STATUS_COLOR[farm.status] ?? T.ink3;

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
    ? `<tr><td style="color:${T.ink3};padding:2px 10px 2px 0;white-space:nowrap;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">Crop</td>
         <td style="padding:2px 0"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${crop.color};margin-right:4px;vertical-align:middle"></span>
         <strong style="color:${T.ink}">${crop.name}</strong> <span style="color:${T.ink3};font-size:10px">${crop.grow_weeks}wk · ${crop.base_yield_per_sqft}kg/sqft</span></td></tr>`
    : "";

  const harvestRow = farm.status === "growing" && farm.cycle_end_date
    ? `<tr><td style="color:${T.ink3};padding:2px 10px 2px 0;white-space:nowrap;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">Harvest</td><td style="padding:2px 0;color:${T.ink}">${farm.cycle_end_date}</td></tr>`
    : "";

  const actions = withActions
    ? `<div style="margin-top:8px;padding-top:8px;border-top:1px solid ${T.borderLt};display:flex;gap:6px">
        <button onclick="window.__mcl_edit(${farm.id})" style="flex:1;padding:5px 12px;border:1.5px solid ${T.border};background:transparent;color:${T.ink};border-radius:${T.rSm};font-size:11px;font-weight:600;cursor:pointer;font-family:Inter,system-ui,sans-serif;transition:opacity .15s">Edit</button>
        <button onclick="window.__mcl_delete(${farm.id})" style="flex:1;padding:5px 12px;border:none;background:rgba(217,79,79,0.12);color:${T.error};border-radius:${T.rSm};font-size:11px;font-weight:600;cursor:pointer;font-family:Inter,system-ui,sans-serif;transition:opacity .15s">Delete</button>
      </div>`
    : "";

  const td = `style="color:${T.ink3};padding:2px 10px 2px 0;white-space:nowrap;font-size:10px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase"`;
  const valTd = `style="padding:2px 0;color:${T.ink}"`;
  const sep = `<tr><td colspan="2" style="padding:4px 0"><div style="border-top:1px solid ${T.borderLt}"></div></td></tr>`;

  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:12px;line-height:1.5;min-width:200px;max-width:260px;color:${T.ink}">
    <div style="font-family:Space Grotesk,system-ui,sans-serif;font-weight:700;font-size:14px;color:${T.ink};letter-spacing:-0.02em;margin-bottom:2px">${farm.name}</div>
    <div style="font-size:10px;color:${T.ink3};margin-bottom:6px;font-weight:500">${farm.lat.toFixed(4)}°N, ${Math.abs(farm.lng).toFixed(4)}°W</div>
    <table style="border-collapse:collapse;width:100%">
      <tr><td ${td}>Status</td><td style="padding:2px 0">${badgeHtml(farm.status.charAt(0).toUpperCase() + farm.status.slice(1), statusColor)}</td></tr>
      <tr><td ${td}>Plot</td><td ${valTd}>${plotDisplay}</td></tr>
      <tr><td ${td}>Tools</td><td ${valTd}>${val(farm.tools)}</td></tr>
      <tr><td ${td}>Budget</td><td ${valTd}>${val(farm.budget)}</td></tr>
      ${cropSection}
      ${harvestRow}
      ${sep}
      <tr><td ${td}>pH</td><td ${valTd}>${valFixed(farm.pH, 1)}</td></tr>
      <tr><td ${td}>Moisture</td><td ${valTd}>${valFixed(farm.moisture, 0, "%")}</td></tr>
      <tr><td ${td}>Temp</td><td ${valTd}>${valFixed(farm.temperature, 0, "°C")}</td></tr>
      <tr><td ${td}>Humidity</td><td ${valTd}>${valFixed(farm.humidity, 0, "%")}</td></tr>
      ${sep}
      <tr><td ${td}>Hub</td><td ${valTd}>${nearestHubName} <span style="color:${T.ink3}">(${(nearestHubDist / 1000).toFixed(1)}km)</span></td></tr>
    </table>
    ${actions}
  </div>`;
}

function hubHoverHtml(hub: HubNode, edges: NetworkEdge[]): string {
  const connectedCount = edges.filter(e => e.hubId === hub.id).length;
  const priorityColor = hub.priority === "critical" ? T.error : T.info;

  return `<div style="font-family:Inter,system-ui,sans-serif;font-size:11px;line-height:1.4;white-space:nowrap;color:${T.ink}">
    <strong style="font-size:12px;letter-spacing:-0.01em">${hub.name}</strong>
    <div style="display:flex;align-items:center;gap:6px;margin-top:2px">
      ${badgeHtml(hub.priority.charAt(0).toUpperCase() + hub.priority.slice(1), priorityColor)}
      <span style="font-size:10px;color:${T.ink2}">${connectedCount} farms</span>
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

export interface NetworkCallbacks {
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
        strokeColor: crop?.color ?? T.ink3,
        strokeOpacity: 0.35,
        strokeWeight: 1.5,
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
        hoverInfoWindow.setContent(farmHoverHtml(farm));
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
      const color = isCritical ? T.error : T.info;
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
        hoverInfoWindow.setContent(hubHoverHtml(hub, edges));
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

export interface NetworkMapCoreProps {
  farmList: FarmNode[];
  edges: NetworkEdge[];
  callbacks: React.RefObject<NetworkCallbacks>;
  panelMode: PanelMode;
  onMapClick: (lat: number, lng: number) => void;
  onRightClick: (lat: number, lng: number) => void;
}

export default function NetworkMapCore({
  farmList, edges, callbacks, panelMode, onMapClick, onRightClick,
}: NetworkMapCoreProps) {
  const apiKey = getMapApiKey();
  const mapId = getMapId();

  if (!apiKey || apiKey.trim() === "") {
    return (
      <div style={{
        height: "100%", width: "100%", display: "flex", alignItems: "center",
        justifyContent: "center", padding: 24,
        fontFamily: T.fb, background: T.bg, color: T.ink,
      }}>
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h2 style={{
            marginBottom: 12, fontFamily: T.fd,
            letterSpacing: "-0.02em",
          }}>Google Maps API key missing</h2>
          <p style={{ color: T.ink2, marginBottom: 12 }}>
            Add this to a file named <code style={{
              background: T.bgCard, padding: "2px 6px",
              borderRadius: T.rSm, fontSize: 13,
            }}>.env</code> in the <strong>project root</strong>:
          </p>
          <pre style={{
            background: T.bgCard, padding: 16, borderRadius: T.rMd,
            overflow: "auto", textAlign: "left", marginBottom: 12,
            border: `1px solid ${T.borderLt}`, fontSize: 13,
          }}>
            VITE_GOOGLE_MAPS_API_KEY=your_actual_key_here
          </pre>
          <p style={{ color: T.ink2, fontSize: 14 }}>
            Get a key from{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer"
              style={{ color: T.accent, textDecoration: "none", fontWeight: 600 }}>
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
          {panelMode === "add-pinpoint" && <MapClickHandler onMapClick={onMapClick} />}
          <MapRightClickHandler onRightClick={onRightClick} />
          <PinpointCursor active={panelMode === "add-pinpoint"} />
        </Map>
      </div>
    </APIProvider>
  );
}
