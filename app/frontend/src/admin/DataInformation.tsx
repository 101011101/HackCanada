import { useMemo, useState, useEffect, useCallback } from "react";
import {
  type FarmNode,
  type HubNode,
  type NetworkEdge,
} from "./nodal-network/data";
import type { Crop, ReportResponse } from "./services/api";
import { T } from "./nodal-network/tokens";

// ── Style constants ─────────────────────────────────────────────────────────

const warn = "#F5A623";

const D = {
  content: { padding: "20px 24px 24px" } as React.CSSProperties,

  overline: {
    fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
    textTransform: "uppercase", color: T.ink3, marginBottom: 12,
  } as React.CSSProperties,

  kpiRow4: {
    display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 20,
  } as React.CSSProperties,

  kpiCard: {
    background: T.bgElev, borderRadius: T.rMd, padding: 16, boxShadow: T.shSm,
  } as React.CSSProperties,

  kpiVal: {
    fontFamily: T.fd, fontSize: 26, fontWeight: 700,
    letterSpacing: "-0.02em", lineHeight: 1,
  } as React.CSSProperties,

  kpiLbl: {
    fontSize: 10, color: T.ink3, marginTop: 4, fontWeight: 500,
  } as React.CSSProperties,

  pbar: {
    width: "100%", height: 3, background: T.borderLt,
    borderRadius: "999px", overflow: "hidden", marginTop: 6,
  } as React.CSSProperties,

  pbarFill: (width: number, color: string): React.CSSProperties => ({
    height: "100%", borderRadius: "999px", background: color,
    width: `${Math.min(100, Math.max(0, width))}%`,
  }),

  kpiDelta: {
    fontSize: 10, fontWeight: 600, marginTop: 6, color: T.ink3,
  } as React.CSSProperties,

  grid3: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 20,
  } as React.CSSProperties,

  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20,
  } as React.CSSProperties,

  detailCard: {
    background: T.bgElev, borderRadius: T.rMd, padding: "18px 20px", boxShadow: T.shSm,
  } as React.CSSProperties,

  detailCardTitle: {
    fontSize: 13, fontWeight: 600, marginBottom: 10,
  } as React.CSSProperties,

  detailRow: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "5px 0", fontSize: 12, borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  detailRowLast: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "5px 0", fontSize: 12,
  } as React.CSSProperties,

  detailLabel: {
    color: T.ink3, fontSize: 10, fontWeight: 600,
    letterSpacing: "0.04em", textTransform: "uppercase",
  } as React.CSSProperties,

  detailValue: { fontWeight: 600 } as React.CSSProperties,

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    borderRadius: T.rXs, letterSpacing: "0.02em",
    background: bg, color,
  }),

  cropChip: (color: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    background: `${color}1a`, borderRadius: T.rXs,
    padding: "1px 6px", fontSize: 10, fontWeight: 600,
    color, marginRight: 2,
  }),

  tablePanel: {
    background: T.bgElev, borderRadius: T.rMd,
    overflow: "hidden", boxShadow: T.shSm,
  } as React.CSSProperties,

  tableHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  tableTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,

  th: {
    textAlign: "left" as const, fontSize: 9, fontWeight: 700,
    letterSpacing: "0.1em", textTransform: "uppercase" as const,
    color: T.ink3, padding: "10px 20px", background: T.bgCard,
    borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  td: {
    padding: "11px 20px", fontSize: 12, color: T.ink,
    borderBottom: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  statusDot: (color: string): React.CSSProperties => ({
    width: 8, height: 8, borderRadius: "50%",
    display: "inline-block", verticalAlign: "middle",
    marginRight: 6, background: color,
  }),
};

// ── Weather types ───────────────────────────────────────────────────────────

interface WeatherData {
  forecast: string;
  temperature: number;
  precipitation: number;
  windSpeed: number;
  windDir: string;
  uvIndex: number;
  uvLabel: string;
  frostFreeDays: number;
  fetchedAt: number;
}

function degToCompass(deg: number): string {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"] as const;
  return dirs[Math.round(deg / 45) % 8] ?? "N";
}

function uvLabel(uv: number): string {
  if (uv <= 2) return "Low";
  if (uv <= 5) return "Moderate";
  if (uv <= 7) return "High";
  if (uv <= 10) return "Very High";
  return "Extreme";
}

const STATIC_WEATHER: WeatherData = {
  forecast: "Partly Cloudy, 18°C",
  temperature: 18,
  precipitation: 12,
  windSpeed: 12,
  windDir: "NW",
  uvIndex: 4,
  uvLabel: "Moderate",
  frostFreeDays: 142,
  fetchedAt: Date.now(),
};

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  farmList: FarmNode[];
  edges: NetworkEdge[];
  hubs: HubNode[];
  crops: Crop[];
  assignments: Record<string, number[]>;
  report: ReportResponse | null;
}

export default function DataInformation({ farmList, edges, hubs, crops, assignments, report }: Props) {
  // ── Single-pass farm aggregates ──
  const farmStats = useMemo(() => {
    const plotTypeCounts: Record<string, number> = { balcony: 0, rooftop: 0, backyard: 0, community: 0 };
    const toolCounts: Record<string, number> = { basic: 0, intermediate: 0, advanced: 0 };
    const budgetCounts: Record<string, number> = { low: 0, medium: 0, high: 0 };

    let sumPH = 0, countPH = 0, minPH = Infinity, maxPH = -Infinity;
    let sumMoist = 0, countMoist = 0, minMoist = Infinity, maxMoist = -Infinity;
    let sumTemp = 0, countTemp = 0, minTemp = Infinity, maxTemp = -Infinity;
    let sumHumid = 0, countHumid = 0, minHumid = Infinity, maxHumid = -Infinity;

    for (const f of farmList) {
      if (f.plot_type) plotTypeCounts[f.plot_type] = (plotTypeCounts[f.plot_type] ?? 0) + 1;
      if (f.tools) toolCounts[f.tools] = (toolCounts[f.tools] ?? 0) + 1;
      if (f.budget) budgetCounts[f.budget] = (budgetCounts[f.budget] ?? 0) + 1;

      if (f.pH != null) { sumPH += f.pH; countPH++; minPH = Math.min(minPH, f.pH); maxPH = Math.max(maxPH, f.pH); }
      if (f.moisture != null) { sumMoist += f.moisture; countMoist++; minMoist = Math.min(minMoist, f.moisture); maxMoist = Math.max(maxMoist, f.moisture); }
      if (f.temperature != null) { sumTemp += f.temperature; countTemp++; minTemp = Math.min(minTemp, f.temperature); maxTemp = Math.max(maxTemp, f.temperature); }
      if (f.humidity != null) { sumHumid += f.humidity; countHumid++; minHumid = Math.min(minHumid, f.humidity); maxHumid = Math.max(maxHumid, f.humidity); }
    }

    return {
      avgPH: countPH ? +(sumPH / countPH).toFixed(1) : 0,
      minPH: countPH ? +minPH.toFixed(1) : 0,
      maxPH: countPH ? +maxPH.toFixed(1) : 0,
      avgMoisture: countMoist ? Math.round(sumMoist / countMoist) : 0,
      minMoisture: countMoist ? minMoist : 0,
      maxMoisture: countMoist ? maxMoist : 0,
      avgTemp: countTemp ? +(sumTemp / countTemp).toFixed(1) : 0,
      minTemp: countTemp ? minTemp : 0,
      maxTemp: countTemp ? maxTemp : 0,
      avgHumidity: countHumid ? Math.round(sumHumid / countHumid) : 0,
      minHumidity: countHumid ? minHumid : 0,
      maxHumidity: countHumid ? maxHumid : 0,
      plotTypeCounts,
      toolCounts,
      budgetCounts,
    };
  }, [farmList]);

  // ── Hub table data ──
  const hubRows = useMemo(() => {
    const farmMap = new Map(farmList.map(f => [f.id, f]));
    const cropMap = new Map(crops.map(c => [c.id, c]));
    const connectedPerHub = new Map<number, number>();
    const supplyPerHub = new Map<number, number>();

    for (const e of edges) {
      connectedPerHub.set(e.hubId, (connectedPerHub.get(e.hubId) ?? 0) + 1);

      const farm = farmMap.get(e.farmId);
      if (!farm) continue;
      const cropIds = assignments[String(farm.id)] ?? [];
      const n = cropIds.length || 1;
      const sqftPer = (farm.plot_size_sqft ?? 0) / n;
      for (const cropId of cropIds) {
        const crop = cropMap.get(cropId);
        if (crop) {
          supplyPerHub.set(e.hubId, (supplyPerHub.get(e.hubId) ?? 0) + crop.base_yield_per_sqft * sqftPer);
        }
      }
    }

    return hubs.map(hub => {
      const connected = connectedPerHub.get(hub.id) ?? 0;
      const totalSupply = supplyPerHub.get(hub.id) ?? 0;
      const localDemand = (hub as unknown as { local_demand: Record<string, number> }).local_demand ?? {};
      const totalDemand = Object.values(localDemand).reduce((a, b) => a + b, 0);
      const fillRate = totalDemand > 0 ? Math.round((totalSupply / totalDemand) * 100) : 0;

      const topDemand = Object.entries(localDemand)
        .map(([cropIdStr, qty]) => ({ crop: cropMap.get(Number(cropIdStr)), qty }))
        .filter((d): d is { crop: Crop; qty: number } => d.crop != null)
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 2);

      return { hub, connected, fillRate: Math.min(fillRate, 100), topDemand };
    });
  }, [farmList, edges, hubs, crops, assignments]);

  // ── Optimization engine stats ──
  const optimStats = useMemo(() => {
    const cropMap = new Map(crops.map(c => [c.id, c]));
    const assignmentCount = Object.keys(assignments).length;
    const assignedCropIds = new Set<number>();

    for (const cropIds of Object.values(assignments)) {
      for (const id of cropIds) assignedCropIds.add(id);
    }
    for (const farm of farmList) {
      if (farm.status === "growing" && farm.current_crop_id != null) {
        assignedCropIds.add(farm.current_crop_id);
      }
    }

    const supplyGaps = crops.filter(c => !assignedCropIds.has(c.id)).map(c => c.name);

    return {
      assignmentCount,
      uniqueCrops: assignedCropIds.size,
      supplyGaps,
      totalCrops: crops.length,
      cropMap,
    };
  }, [farmList, crops, assignments]);

  // ── Weather API ──
  const [weather, setWeather] = useState<WeatherData>(STATIC_WEATHER);
  const [weatherStatus, setWeatherStatus] = useState<"loading" | "connected" | "error">("loading");

  const fetchWeather = useCallback(async () => {
    try {
      setWeatherStatus("loading");
      const res = await fetch(
        "https://api.open-meteo.com/v1/forecast?latitude=43.65&longitude=-79.38" +
        "&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,uv_index" +
        "&daily=precipitation_probability_max&timezone=America/Toronto&forecast_days=1"
      );
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      const cur = data.current;

      const wmoDescriptions: Record<number, string> = {
        0: "Clear Sky", 1: "Mainly Clear", 2: "Partly Cloudy", 3: "Overcast",
        45: "Foggy", 48: "Depositing Rime Fog",
        51: "Light Drizzle", 53: "Moderate Drizzle", 55: "Dense Drizzle",
        61: "Slight Rain", 63: "Moderate Rain", 65: "Heavy Rain",
        71: "Slight Snow", 73: "Moderate Snow", 75: "Heavy Snow",
        80: "Slight Showers", 81: "Moderate Showers", 82: "Violent Showers",
        95: "Thunderstorm",
      };
      const weatherDesc = wmoDescriptions[cur.weather_code] ?? "Unknown";
      const temp = Math.round(cur.temperature_2m);

      setWeather({
        forecast: `${weatherDesc}, ${temp}°C`,
        temperature: temp,
        precipitation: data.daily?.precipitation_probability_max?.[0] ?? 0,
        windSpeed: Math.round(cur.wind_speed_10m),
        windDir: degToCompass(cur.wind_direction_10m),
        uvIndex: Math.round(cur.uv_index),
        uvLabel: uvLabel(cur.uv_index),
        frostFreeDays: 142,
        fetchedAt: Date.now(),
      });
      setWeatherStatus("connected");
    } catch {
      setWeather(STATIC_WEATHER);
      setWeatherStatus("error");
    }
  }, []);

  useEffect(() => { fetchWeather(); }, [fetchWeather]);

  // ── "Last sync" timer ──
  const [syncAgo, setSyncAgo] = useState("just now");

  useEffect(() => {
    const id = setInterval(() => {
      const secs = Math.round((Date.now() - weather.fetchedAt) / 1000);
      if (secs < 5) setSyncAgo("just now");
      else if (secs < 60) setSyncAgo(`${secs}s ago`);
      else setSyncAgo(`${Math.floor(secs / 60)}m ago`);
    }, 1000);
    return () => clearInterval(id);
  }, [weather.fetchedAt]);

  // pH progress: 0–14 scale, so bar width = (avgPH / 14) * 100
  const phBarWidth = (farmStats.avgPH / 14) * 100;
  // temperature bar: normalize 0–40°C range
  const tempBarWidth = (farmStats.avgTemp / 40) * 100;

  const priorityBadge = (p: "critical" | "standard") =>
    p === "critical"
      ? D.badge(T.error, "rgba(217,79,79,0.12)")
      : D.badge(T.info, "rgba(91,141,239,0.12)");

  const fillBarColor = (rate: number) =>
    rate >= 70 ? T.accent : rate >= 50 ? T.success : T.info;

  return (
    <div style={D.content}>
      {/* ── Section 1: Network-Wide Averages ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={D.overline}>Network-Wide Averages</div>
        <div style={D.kpiRow4}>
          <div style={D.kpiCard}>
            <div style={D.kpiVal}>{farmStats.avgPH}</div>
            <div style={D.kpiLbl}>Avg Soil pH</div>
            <div style={D.pbar}><div style={D.pbarFill(phBarWidth, T.success)} /></div>
            <div style={D.kpiDelta}>Range: {farmStats.minPH} – {farmStats.maxPH}</div>
          </div>
          <div style={D.kpiCard}>
            <div style={D.kpiVal}>{farmStats.avgMoisture}%</div>
            <div style={D.kpiLbl}>Avg Moisture</div>
            <div style={D.pbar}><div style={D.pbarFill(farmStats.avgMoisture, T.info)} /></div>
            <div style={D.kpiDelta}>Range: {farmStats.minMoisture}% – {farmStats.maxMoisture}%</div>
          </div>
          <div style={D.kpiCard}>
            <div style={D.kpiVal}>{farmStats.avgTemp}°C</div>
            <div style={D.kpiLbl}>Avg Temperature</div>
            <div style={D.pbar}><div style={D.pbarFill(tempBarWidth, T.accent)} /></div>
            <div style={D.kpiDelta}>Range: {farmStats.minTemp}°C – {farmStats.maxTemp}°C</div>
          </div>
          <div style={D.kpiCard}>
            <div style={D.kpiVal}>{farmStats.avgHumidity}%</div>
            <div style={D.kpiLbl}>Avg Humidity</div>
            <div style={D.pbar}><div style={D.pbarFill(farmStats.avgHumidity, T.info)} /></div>
            <div style={D.kpiDelta}>Range: {farmStats.minHumidity}% – {farmStats.maxHumidity}%</div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Plot & Resource Breakdown ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={D.overline}>Plot & Resource Breakdown</div>
        <div style={D.grid3}>
          <div style={D.detailCard}>
            <div style={D.detailCardTitle}>Plot Type Distribution</div>
            {(["balcony", "rooftop", "backyard", "community"] as const).map((type, i, arr) => (
              <div key={type} style={i === arr.length - 1 ? D.detailRowLast : D.detailRow}>
                <span style={D.detailLabel}>{type.charAt(0).toUpperCase() + type.slice(1)}</span>
                <span style={D.detailValue}>{farmStats.plotTypeCounts[type]} farms</span>
              </div>
            ))}
          </div>
          <div style={D.detailCard}>
            <div style={D.detailCardTitle}>Tool Level</div>
            {(["basic", "intermediate", "advanced"] as const).map((level, i, arr) => (
              <div key={level} style={i === arr.length - 1 ? D.detailRowLast : D.detailRow}>
                <span style={D.detailLabel}>{level.charAt(0).toUpperCase() + level.slice(1)}</span>
                <span style={D.detailValue}>{farmStats.toolCounts[level]} farms</span>
              </div>
            ))}
          </div>
          <div style={D.detailCard}>
            <div style={D.detailCardTitle}>Budget Tier</div>
            {(["low", "medium", "high"] as const).map((tier, i, arr) => (
              <div key={tier} style={i === arr.length - 1 ? D.detailRowLast : D.detailRow}>
                <span style={D.detailLabel}>{tier.charAt(0).toUpperCase() + tier.slice(1)}</span>
                <span style={D.detailValue}>{farmStats.budgetCounts[tier]} farms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Section 3: API-Sourced Information ── */}
      <div style={{ marginBottom: 20 }}>
        <div style={D.overline}>API-Sourced Information</div>
        <div style={D.grid2}>
          {/* Weather API */}
          <div style={D.detailCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...D.detailCardTitle, marginBottom: 0 }}>Weather API</div>
              <span style={D.badge(
                weatherStatus === "connected" ? T.success : weatherStatus === "loading" ? T.info : T.error,
                weatherStatus === "connected" ? "rgba(76,175,80,0.12)" : weatherStatus === "loading" ? "rgba(91,141,239,0.12)" : "rgba(217,79,79,0.12)"
              )}>
                {weatherStatus === "connected" ? "Connected" : weatherStatus === "loading" ? "Loading…" : "Fallback"}
              </span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Forecast</span>
              <span style={D.detailValue}>{weather.forecast}</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Precipitation</span>
              <span style={D.detailValue}>{weather.precipitation}% chance</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Wind</span>
              <span style={D.detailValue}>{weather.windDir} {weather.windSpeed} km/h</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>UV Index</span>
              <span style={D.detailValue}>{weather.uvIndex} ({weather.uvLabel})</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Growing Season</span>
              <span style={D.detailValue}>{weather.frostFreeDays} frost-free days</span>
            </div>
            <div style={D.detailRowLast}>
              <span style={D.detailLabel}>Last Updated</span>
              <span style={{ ...D.detailValue, color: T.ink3 }}>{syncAgo}</span>
            </div>
          </div>

          {/* Optimization Engine */}
          <div style={D.detailCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ ...D.detailCardTitle, marginBottom: 0 }}>Optimization Engine</div>
              <span style={D.badge(T.accent, T.accentBg)}>
                {report ? "Live" : "Loading…"}
              </span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Status</span>
              <span style={D.detailValue}>
                <span style={D.badge(report ? T.success : T.info, report ? "rgba(76,175,80,0.12)" : "rgba(91,141,239,0.12)")}>
                  {report ? "Converged" : "Loading"}
                </span>
              </span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Assignments</span>
              <span style={D.detailValue}>{optimStats.assignmentCount} farms assigned</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Network Health</span>
              <span style={D.detailValue}>{report ? `${report.network_health_pct.toFixed(1)}%` : "—"}</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Crops in Rotation</span>
              <span style={D.detailValue}>{optimStats.uniqueCrops} of {optimStats.totalCrops}</span>
            </div>
            <div style={D.detailRow}>
              <span style={D.detailLabel}>Supply Gaps</span>
              <span style={D.detailValue}>
                {optimStats.supplyGaps.length > 0 ? (
                  <span style={D.badge(warn, "rgba(245,166,35,0.12)")}>{optimStats.supplyGaps.join(", ")}</span>
                ) : (
                  <span style={D.badge(T.success, "rgba(76,175,80,0.12)")}>None</span>
                )}
              </span>
            </div>
            <div style={D.detailRowLast}>
              <span style={D.detailLabel}>Total Yield</span>
              <span style={{ ...D.detailValue, color: T.ink3 }}>{report ? `${Math.round(report.total_yield_kg)} kg` : "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 4: Hub Capacity & Demand ── */}
      <div>
        <div style={D.overline}>Hub Capacity & Demand</div>
        <div style={D.tablePanel}>
          <div style={D.tableHeader}>
            <div style={D.tableTitle}>Distribution Hub Overview</div>
            <span style={D.badge(T.accent, T.accentBg)}>Live</span>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={D.th}>Hub</th>
                <th style={D.th}>Priority</th>
                <th style={D.th}>Capacity</th>
                <th style={D.th}>Connected</th>
                <th style={D.th}>Top Demand</th>
                <th style={D.th}>Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {hubRows.map(({ hub, connected, fillRate, topDemand }) => (
                <tr key={hub.id}>
                  <td style={{ ...D.td, fontWeight: 600 }}>{hub.name}</td>
                  <td style={D.td}>
                    <span style={priorityBadge(hub.priority)}>
                      {hub.priority.charAt(0).toUpperCase() + hub.priority.slice(1)}
                    </span>
                  </td>
                  <td style={D.td}>{hub.capacity_kg} kg</td>
                  <td style={D.td}>{connected} farms</td>
                  <td style={D.td}>
                    {topDemand.map(d => (
                      <span key={d.crop.id} style={D.cropChip(d.crop.color)}>
                        {d.crop.name} {d.qty}kg
                      </span>
                    ))}
                  </td>
                  <td style={D.td}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ ...D.pbar, width: 80 }}>
                        <div style={D.pbarFill(fillRate, fillBarColor(fillRate))} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600 }}>{fillRate}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
