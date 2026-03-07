"use client";

import { useState } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import { useRateLimit } from "../utils/rateLimit";

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

export interface NodalNetworkIntroProps {
  /** Optional initial map center. Defaults to Hamburg area. */
  initialCenter?: { lat: number; lng: number };
  /** Optional initial zoom level. */
  initialZoom?: number;
}

export default function Intro({
  initialCenter = { lat: 53.54, lng: 10 },
  initialZoom = 9,
}: NodalNetworkIntroProps) {
  const position = initialCenter;
  const [open, setOpen] = useState(false);
  const applyRateLimit = useRateLimit(400);

  const apiKey = getMapApiKey();
  const mapId = getMapId();

  const handleMarkerClick = () => {
    applyRateLimit(() => setOpen(true));
  };

  if (!apiKey || apiKey.trim() === "") {
    return (
      <div
        style={{
          height: "100vh",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          background: "#f5f5f5",
        }}
      >
        <div style={{ maxWidth: 520, textAlign: "center" }}>
          <h2 style={{ marginBottom: 12 }}>Google Maps API key missing</h2>
          <p style={{ color: "#666", marginBottom: 12 }}>
            Add this to a file named <code>.env</code> in the <strong>project root</strong> (same folder as <code>package.json</code> and <code>vite.config.ts</code>):
          </p>
          <pre style={{ background: "#eee", padding: 16, borderRadius: 8, overflow: "auto", textAlign: "left", marginBottom: 12 }}>
            VITE_GOOGLE_MAPS_API_KEY=your_actual_key_here
          </pre>
          <p style={{ color: "#666", marginBottom: 8, fontSize: 14 }}>
            No quotes, no spaces around <code>=</code>. Then <strong>restart the dev server</strong> (Ctrl+C, then <code>npm run dev</code>).
          </p>
          <p style={{ color: "#666", marginTop: 16, fontSize: 14 }}>
            Get a key from{" "}
            <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener noreferrer">
              Google Cloud Console
            </a>
            , enable <strong>Maps JavaScript API</strong>, and add <code>http://localhost:5173/*</code> to HTTP referrer restrictions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <APIProvider apiKey={apiKey}>
      <div style={{ height: "100vh", width: "100%" }}>
        <Map
          zoom={initialZoom}
          center={position}
          mapId={mapId}
        >
          <AdvancedMarker position={position} onClick={handleMarkerClick}>
            <Pin
              background={"grey"}
              borderColor={"green"}
              glyphColor={"purple"}
            />
          </AdvancedMarker>

          {open && (
            <InfoWindow position={position} onCloseClick={() => setOpen(false)}>
              <p>I'm in Hamburg</p>
            </InfoWindow>
          )}
        </Map>
      </div>
    </APIProvider>
  );
}
