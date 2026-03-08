"use client";

import { useState, useEffect, useCallback } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from "@vis.gl/react-google-maps";
import {
  farms,
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

// ── Polyline renderer (draws edges on the google.maps.Map instance) ─────────

function NetworkEdges({ edges }: { edges: NetworkEdge[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const farmById = new globalThis.Map(farms.map(f => [f.id, f]));
    const hubById = new globalThis.Map(hubs.map(h => [h.id, h]));

    const polylines: google.maps.Polyline[] = edges.map(edge => {
      const farm = farmById.get(edge.farmId)!;
      const hub = hubById.get(edge.hubId)!;
      const cropId = getEffectiveCropId(farm);
      const crop = cropId != null ? getCrop(cropId) : null;

      return new google.maps.Polyline({
        path: [
          { lat: farm.lat, lng: farm.lng },
          { lat: hub.lat, lng: hub.lng },
        ],
        strokeColor: crop?.color ?? "#999",
        strokeOpacity: 0.45,
        strokeWeight: 2,
        map,
      });
    });

    return () => polylines.forEach(p => p.setMap(null));
  }, [map, edges]);

  return null;
}

// ── Styles ──────────────────────────────────────────────────────────────────

const STATUS_BORDER: Record<string, string> = {
  growing: "#4caf50",
  available: "#2196f3",
  new: "#ff9800",
};

const panelStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  left: 16,
  background: "rgba(255,255,255,0.95)",
  borderRadius: 10,
  padding: "14px 18px",
  boxShadow: "0 2px 12px rgba(0,0,0,0.18)",
  fontSize: 13,
  maxWidth: 220,
  zIndex: 10,
  lineHeight: 1.6,
};

const dotStyle = (color: string): React.CSSProperties => ({
  display: "inline-block",
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: color,
  marginRight: 6,
  verticalAlign: "middle",
});

// ── Main component ──────────────────────────────────────────────────────────

export interface NodalNetworkIntroProps {
  initialCenter?: { lat: number; lng: number };
  initialZoom?: number;
}

export default function Intro({
  initialCenter = { lat: 43.655, lng: -79.385 },
  initialZoom = 14,
}: NodalNetworkIntroProps) {
  const [selectedFarm, setSelectedFarm] = useState<FarmNode | null>(null);
  const [selectedHub, setSelectedHub] = useState<HubNode | null>(null);
  const [edges] = useState<NetworkEdge[]>(() => buildNetworkEdges());

  const apiKey = getMapApiKey();
  const mapId = getMapId();

  const closeAll = useCallback(() => {
    setSelectedFarm(null);
    setSelectedHub(null);
  }, []);

  if (!apiKey || apiKey.trim() === "") {
    return (
      <div style={{ height: "100vh", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "system-ui, sans-serif", background: "#f5f5f5" }}>
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
      <div style={{ height: "100vh", width: "100%", position: "relative" }}>
        <Map zoom={initialZoom} center={initialCenter} mapId={mapId}>
          {/* Network edges */}
          <NetworkEdges edges={edges} />

          {/* Farm markers */}
          {farms.map(farm => {
            const cropId = getEffectiveCropId(farm);
            const crop = cropId != null ? getCrop(cropId) : null;
            const borderColor = STATUS_BORDER[farm.status] ?? "#999";

            return (
              <AdvancedMarker
                key={`farm-${farm.id}`}
                position={{ lat: farm.lat, lng: farm.lng }}
                onClick={() => { closeAll(); setSelectedFarm(farm); }}
                title={farm.name}
              >
                <Pin
                  background={crop?.color ?? "#bbb"}
                  borderColor={borderColor}
                  glyphColor="#fff"
                  scale={0.85}
                />
              </AdvancedMarker>
            );
          })}

          {/* Hub markers */}
          {hubs.map(hub => (
            <AdvancedMarker
              key={`hub-${hub.id}`}
              position={{ lat: hub.lat, lng: hub.lng }}
              onClick={() => { closeAll(); setSelectedHub(hub); }}
              title={hub.name}
            >
              <Pin
                background={hub.priority === "critical" ? "#ff5722" : "#3f51b5"}
                borderColor="#fff"
                glyphColor="#fff"
                scale={1.3}
              />
            </AdvancedMarker>
          ))}

          {/* Farm info window */}
          {selectedFarm && (
            <InfoWindow
              position={{ lat: selectedFarm.lat, lng: selectedFarm.lng }}
              onCloseClick={() => setSelectedFarm(null)}
            >
              <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 240 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>{selectedFarm.name}</h3>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                  <div><strong>Lat/Lng:</strong> {selectedFarm.lat.toFixed(4)}, {selectedFarm.lng.toFixed(4)}</div>
                  <div><strong>Type:</strong> {selectedFarm.plot_type} ({selectedFarm.plot_size_sqft} sqft)</div>
                  <div><strong>Status:</strong>{" "}
                    <span style={{ color: STATUS_BORDER[selectedFarm.status], fontWeight: 600 }}>
                      {selectedFarm.status}
                    </span>
                  </div>
                  {(() => {
                    const cropId = getEffectiveCropId(selectedFarm);
                    const crop = cropId != null ? getCrop(cropId) : null;
                    if (!crop) return null;
                    return (
                      <div>
                        <strong>Crop:</strong>{" "}
                        <span style={dotStyle(crop.color)} />
                        {crop.name}
                        {selectedFarm.status === "growing" && selectedFarm.cycle_end_date && (
                          <span style={{ color: "#888" }}> (until {selectedFarm.cycle_end_date})</span>
                        )}
                      </div>
                    );
                  })()}
                  {(() => {
                    const hub = (() => {
                      let best: HubNode | null = null;
                      let bestD = Infinity;
                      for (const h of hubs) {
                        const d = haversine(selectedFarm.lat, selectedFarm.lng, h.lat, h.lng);
                        if (d < bestD) { bestD = d; best = h; }
                      }
                      return best ? { hub: best, dist: bestD } : null;
                    })();
                    if (!hub) return null;
                    return (
                      <div><strong>Nearest hub:</strong> {hub.hub.name} ({(hub.dist / 1000).toFixed(1)} km)</div>
                    );
                  })()}
                  <div><strong>Soil:</strong> pH {selectedFarm.pH}, moisture {selectedFarm.moisture}%</div>
                </div>
              </div>
            </InfoWindow>
          )}

          {/* Hub info window */}
          {selectedHub && (
            <InfoWindow
              position={{ lat: selectedHub.lat, lng: selectedHub.lng }}
              onCloseClick={() => setSelectedHub(null)}
            >
              <div style={{ fontFamily: "system-ui, sans-serif", maxWidth: 260 }}>
                <h3 style={{ margin: "0 0 6px", fontSize: 15 }}>
                  {selectedHub.priority === "critical" ? "⚠ " : ""}{selectedHub.name}
                </h3>
                <div style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>
                  <div><strong>Lat/Lng:</strong> {selectedHub.lat.toFixed(4)}, {selectedHub.lng.toFixed(4)}</div>
                  <div><strong>Priority:</strong>{" "}
                    <span style={{ color: selectedHub.priority === "critical" ? "#ff5722" : "#3f51b5", fontWeight: 600 }}>
                      {selectedHub.priority}
                    </span>
                  </div>
                  <div><strong>Capacity:</strong> {selectedHub.capacity_kg} kg</div>
                  <div style={{ marginTop: 6 }}>
                    <strong>Connected farms:</strong>{" "}
                    {edges.filter(e => e.hubId === selectedHub.id).length}
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <strong>Demand:</strong>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 2 }}>
                      {Object.entries(selectedHub.local_demand).map(([cropId, kg]) => {
                        const crop = getCrop(Number(cropId));
                        if (!crop) return null;
                        return (
                          <span key={cropId} style={{ background: crop.color + "22", border: `1px solid ${crop.color}`, borderRadius: 4, padding: "1px 6px", fontSize: 11 }}>
                            {crop.name}: {kg}kg
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Legend panel */}
        <div style={panelStyle}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>MyCelium Network</div>

          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Hubs</div>
          <div><span style={dotStyle("#ff5722")} /> Critical hub</div>
          <div style={{ marginBottom: 8 }}><span style={dotStyle("#3f51b5")} /> Standard hub</div>

          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Farm status</div>
          <div><span style={dotStyle("#4caf50")} /> Growing</div>
          <div><span style={dotStyle("#2196f3")} /> Available</div>
          <div style={{ marginBottom: 8 }}><span style={dotStyle("#ff9800")} /> New</div>

          <div style={{ fontWeight: 600, marginBottom: 4, fontSize: 12, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>Crops</div>
          {crops.map(c => (
            <div key={c.id}><span style={dotStyle(c.color)} /> {c.name}</div>
          ))}

          <div style={{ marginTop: 10, fontSize: 11, color: "#aaa" }}>
            {farms.length} farms · {hubs.length} hubs · {edges.length} links
          </div>
        </div>
      </div>
    </APIProvider>
  );
}
