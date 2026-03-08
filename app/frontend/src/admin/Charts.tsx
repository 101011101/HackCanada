import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
  LineChart, Line,
  ScatterChart, Scatter, ZAxis,
} from "recharts";
import {
  type FarmNode,
  type HubNode,
  type NetworkEdge,
} from "./nodal-network/data";
import type { Crop } from "./services/api";
import { T } from "./nodal-network/tokens";

// ── Style constants ─────────────────────────────────────────────────────────

const C = {
  content: { padding: "20px 24px 24px" } as React.CSSProperties,

  grid2: {
    display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16,
  } as React.CSSProperties,

  chartCard: {
    background: T.bgCard, borderRadius: T.rMd,
    border: `1px solid ${T.borderLt}`, padding: 20,
    display: "flex", flexDirection: "column", gap: 12,
  } as React.CSSProperties,

  chartCardElev: {
    background: T.bgElev, borderRadius: T.rMd,
    boxShadow: T.shSm, padding: 20,
    display: "flex", flexDirection: "column", gap: 12,
  } as React.CSSProperties,

  chartHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
  } as React.CSSProperties,

  chartTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    borderRadius: T.rXs, letterSpacing: "0.02em",
    background: bg, color,
  }),

  btnGhost: {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    gap: 6, fontFamily: T.fb, fontWeight: 600, border: "none",
    cursor: "pointer", borderRadius: T.rSm, whiteSpace: "nowrap",
    fontSize: 11, padding: "5px 12px", height: 28,
    background: "transparent", color: T.ink2,
    transition: "opacity .15s",
  } as React.CSSProperties,

  tooltip: {
    background: T.bgElev, borderRadius: T.rMd,
    boxShadow: T.shLg, border: `1px solid ${T.borderLt}`,
    padding: "10px 14px", fontSize: 12, lineHeight: 1.5,
  } as React.CSSProperties,

  tooltipLabel: {
    fontFamily: T.fd, fontWeight: 700, fontSize: 13,
    letterSpacing: "-0.02em", marginBottom: 4,
  } as React.CSSProperties,

  tooltipRow: {
    display: "flex", alignItems: "center", gap: 6, fontSize: 11,
    color: T.ink2,
  } as React.CSSProperties,

  tooltipDot: (color: string): React.CSSProperties => ({
    width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0,
  }),

  tooltipVal: { fontWeight: 600, color: T.ink } as React.CSSProperties,
};

const AXIS_STYLE = {
  fontSize: 10, fontFamily: T.fb, fill: T.ink3,
};

// ── Custom tooltip components ───────────────────────────────────────────────

function CropTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; count: number; color: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div style={C.tooltip}>
      <div style={C.tooltipLabel}>{d.name}</div>
      <div style={C.tooltipRow}>
        <span style={C.tooltipDot(d.color)} />
        <span>{d.count} farm{d.count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function PhTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { bin: string; count: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div style={C.tooltip}>
      <div style={C.tooltipLabel}>pH {d.bin}</div>
      <div style={C.tooltipRow}>
        <span style={C.tooltipDot(T.accent)} />
        <span>{d.count} farm{d.count !== 1 ? "s" : ""}</span>
      </div>
    </div>
  );
}

function TempTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; temp: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div style={C.tooltip}>
      <div style={C.tooltipLabel}>{d.name}</div>
      <div style={C.tooltipRow}>
        <span style={C.tooltipDot(T.accent)} />
        <span style={C.tooltipVal}>{d.temp}°C</span>
      </div>
    </div>
  );
}

function ScatterTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; moisture: number; humidity: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0]!.payload;
  return (
    <div style={C.tooltip}>
      <div style={C.tooltipLabel}>{d.name}</div>
      <div style={C.tooltipRow}>
        <span style={C.tooltipDot(T.info)} />
        <span>Moisture: <span style={C.tooltipVal}>{d.moisture}%</span></span>
      </div>
      <div style={C.tooltipRow}>
        <span style={C.tooltipDot(T.accent)} />
        <span>Humidity: <span style={C.tooltipVal}>{d.humidity}%</span></span>
      </div>
    </div>
  );
}

function SupplyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ dataKey: string; value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={C.tooltip}>
      <div style={C.tooltipLabel}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={C.tooltipRow}>
          <span style={C.tooltipDot(p.dataKey === "supply" ? T.success : T.error)} />
          <span>{p.dataKey === "supply" ? "Supply" : "Demand Gap"}: <span style={C.tooltipVal}>{Math.round(p.value)} kg</span></span>
        </div>
      ))}
    </div>
  );
}

// ── Component ───────────────────────────────────────────────────────────────

interface Props {
  farmList: FarmNode[];
  edges: NetworkEdge[];
  crops: Crop[];
  assignments: Record<string, number[]>;
  hubs: HubNode[];
}

export default function Charts({ farmList, crops, assignments, hubs }: Props) {
  const chartData = useMemo(() => {
    const cropMap = new Map(crops.map(c => [c.id, c]));

    // -- Crop distribution (count each crop slot across all farms) --
    const cropCounts = new Map<number, number>();
    // -- pH histogram bins --
    const phBins: Record<string, number> = {
      "5.5–6.0": 0, "6.0–6.5": 0, "6.5–7.0": 0, "7.0–7.5": 0,
    };
    // -- Temperature line data --
    const tempData: { name: string; temp: number }[] = [];
    // -- Scatter data --
    const scatterData: { moisture: number; humidity: number; name: string }[] = [];
    // -- Supply per crop (divide sqft across multi-crop farms) --
    const supplyPerCrop = new Map<number, number>();

    for (const f of farmList) {
      const cropIds = assignments[String(f.id)] ?? [];
      const n = cropIds.length || 1;
      const sqftPer = (f.plot_size_sqft ?? 0) / n;

      for (const cropId of cropIds) {
        cropCounts.set(cropId, (cropCounts.get(cropId) ?? 0) + 1);
        const crop = cropMap.get(cropId);
        if (crop) {
          supplyPerCrop.set(cropId, (supplyPerCrop.get(cropId) ?? 0) + crop.base_yield_per_sqft * sqftPer);
        }
      }

      if (f.pH != null) {
        if (f.pH < 6.0) phBins["5.5–6.0"] = (phBins["5.5–6.0"] ?? 0) + 1;
        else if (f.pH < 6.5) phBins["6.0–6.5"] = (phBins["6.0–6.5"] ?? 0) + 1;
        else if (f.pH < 7.0) phBins["6.5–7.0"] = (phBins["6.5–7.0"] ?? 0) + 1;
        else phBins["7.0–7.5"] = (phBins["7.0–7.5"] ?? 0) + 1;
      }

      if (f.temperature != null) {
        const short = f.name.replace(/Farm #/, "#").replace(/ — .*/, "");
        tempData.push({ name: short, temp: f.temperature });
      }

      if (f.moisture != null && f.humidity != null) {
        scatterData.push({ moisture: f.moisture, humidity: f.humidity, name: f.name.replace(/ — .*/, "") });
      }
    }

    tempData.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

    const cropDistribution = crops
      .map(c => ({ name: c.name, count: cropCounts.get(c.id) ?? 0, color: c.color }))
      .filter(d => d.count > 0)
      .sort((a, b) => b.count - a.count);

    const phHistogram = Object.entries(phBins).map(([bin, count]) => ({ bin, count }));

    // -- Supply vs Demand (use live hubs prop) --
    const totalDemandPerCrop = new Map<number, number>();
    for (const hub of hubs) {
      const demand = (hub as { local_demand?: Record<string, number> }).local_demand ?? {};
      for (const [cropIdStr, qty] of Object.entries(demand)) {
        const cid = Number(cropIdStr);
        totalDemandPerCrop.set(cid, (totalDemandPerCrop.get(cid) ?? 0) + qty);
      }
    }

    const supplyDemand = crops.map(c => {
      const supply = supplyPerCrop.get(c.id) ?? 0;
      const demand = totalDemandPerCrop.get(c.id) ?? 0;
      const gap = Math.max(0, demand - supply);
      return { name: c.name, supply: Math.round(supply), gap: Math.round(gap), color: c.color };
    });

    return { cropDistribution, phHistogram, tempData, scatterData, supplyDemand };
  }, [farmList, crops, assignments, hubs]);

  return (
    <div style={C.content}>
      {/* ── Row 1: Crop Distribution + pH Histogram ── */}
      <div style={C.grid2}>
        {/* Crop Distribution by Farm */}
        <div style={C.chartCardElev}>
          <div style={C.chartHeader}>
            <div style={C.chartTitle}>Crop Distribution by Farm</div>
            <span style={C.badge(T.accent, T.accentBg)}>Live</span>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData.cropDistribution} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: T.borderLt }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<CropTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="count" radius={[3, 3, 0, 0]} maxBarSize={32}>
                {chartData.cropDistribution.map((d) => (
                  <Cell key={d.name} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Soil pH Across Network */}
        <div style={C.chartCardElev}>
          <div style={C.chartHeader}>
            <div style={C.chartTitle}>Soil pH Across Network</div>
            <button style={C.btnGhost}>Filter</button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData.phHistogram} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} vertical={false} />
              <XAxis dataKey="bin" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: T.borderLt }} />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip content={<PhTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
              <Bar dataKey="count" fill={T.accent} radius={[3, 3, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 2: Temperature + Moisture vs Humidity ── */}
      <div style={C.grid2}>
        {/* Temperature Over Time */}
        <div style={C.chartCard}>
          <div style={C.chartTitle}>Temperature by Farm</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData.tempData} margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} vertical={false} />
              <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: T.borderLt }} interval="preserveStartEnd" />
              <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} domain={["dataMin - 2", "dataMax + 2"]} unit="°C" />
              <Tooltip content={<TempTooltip />} />
              <Line
                type="monotone" dataKey="temp" stroke={T.accent} strokeWidth={2}
                dot={{ r: 3, fill: T.accent, stroke: T.bgElev, strokeWidth: 2 }}
                activeDot={{ r: 5, fill: T.accent, stroke: T.bgElev, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Moisture vs Humidity Correlation */}
        <div style={C.chartCard}>
          <div style={C.chartTitle}>Moisture vs Humidity Correlation</div>
          <ResponsiveContainer width="100%" height={180}>
            <ScatterChart margin={{ top: 4, right: 8, bottom: 0, left: -12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} />
              <XAxis type="number" dataKey="moisture" name="Moisture" unit="%" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: T.borderLt }} domain={["dataMin - 5", "dataMax + 5"]} />
              <YAxis type="number" dataKey="humidity" name="Humidity" unit="%" tick={AXIS_STYLE} tickLine={false} axisLine={false} domain={["dataMin - 5", "dataMax + 5"]} />
              <ZAxis range={[40, 40]} />
              <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: "3 3", stroke: T.border }} />
              <Scatter data={chartData.scatterData} fill={T.info} fillOpacity={0.7} />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Row 3: Supply vs Demand (full width, elevated) ── */}
      <div style={C.chartCardElev}>
        <div style={C.chartHeader}>
          <div style={C.chartTitle}>Supply vs Demand by Crop</div>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={C.badge(T.success, "rgba(76,175,80,0.12)")}>Supply</span>
            <span style={C.badge(T.error, "rgba(217,79,79,0.12)")}>Demand Gap</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData.supplyDemand} margin={{ top: 4, right: 8, bottom: 0, left: -4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={T.borderLt} vertical={false} />
            <XAxis dataKey="name" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: T.borderLt }} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} unit=" kg" />
            <Tooltip content={<SupplyTooltip />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
            <Bar dataKey="supply" stackId="a" fill={T.success} radius={[0, 0, 0, 0]} maxBarSize={28} />
            <Bar dataKey="gap" stackId="a" fill={T.error} fillOpacity={0.7} radius={[3, 3, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
