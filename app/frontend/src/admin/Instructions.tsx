"use client";

import { useState, useCallback } from "react";
import type { FarmNode } from "./nodal-network/data";
import type { Crop, TaskItem } from "./services/api";
import { getFarmTasks } from "./services/api";
import { T } from "./nodal-network/tokens";

interface Props {
  farmList: FarmNode[];
  assignments: Record<string, number[]>;
  crops: Crop[];
}

const CROP_COLORS: Record<number, string> = {
  0: "#E8613A", 1: "#4CAF50", 2: "#2196F3", 3: "#9C27B0",
  4: "#FF9800", 5: "#009688", 6: "#F44336", 7: "#00BCD4",
  8: "#E91E63", 9: "#8BC34A",
};

const S = {
  page: {
    padding: "16px 20px 32px",
    fontFamily: T.fb,
  } as React.CSSProperties,

  summaryRow: {
    display: "flex", gap: 12, marginBottom: 20, alignItems: "stretch",
  } as React.CSSProperties,

  summaryCard: {
    background: T.bgCard, borderRadius: T.rMd, padding: "14px 18px", flex: 1,
  } as React.CSSProperties,

  summaryVal: {
    fontFamily: T.fd, fontSize: 24, fontWeight: 700,
    letterSpacing: "-0.02em", lineHeight: 1,
  } as React.CSSProperties,

  summaryLbl: {
    fontSize: 10, color: T.ink3, marginTop: 4, fontWeight: 500,
  } as React.CSSProperties,

  panel: {
    background: T.bgElev, borderRadius: T.rMd,
    border: `1px solid ${T.borderLt}`,
    boxShadow: T.shSm, overflow: "hidden",
  } as React.CSSProperties,

  panelHeader: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "14px 20px", borderBottom: `1px solid ${T.borderLt}`,
    background: T.bgCard,
  } as React.CSSProperties,

  panelTitle: { fontSize: 13, fontWeight: 600 } as React.CSSProperties,

  badge: (color: string, bg: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center",
    fontSize: 10, fontWeight: 600, padding: "2px 7px",
    borderRadius: T.rXs, letterSpacing: "0.02em",
    background: bg, color,
  }),

  farmRow: (expanded: boolean, hasAssignment: boolean): React.CSSProperties => ({
    borderBottom: `1px solid ${T.borderLt}`,
    background: expanded ? "rgba(232,145,58,0.04)" : T.bgElev,
    opacity: hasAssignment ? 1 : 0.5,
  }),

  farmRowHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "12px 20px", cursor: "pointer",
    userSelect: "none" as const,
  } as React.CSSProperties,

  farmName: {
    fontSize: 12, fontWeight: 600, color: T.ink, minWidth: 160,
  } as React.CSSProperties,

  farmMeta: {
    fontSize: 11, color: T.ink3,
  } as React.CSSProperties,

  cropPills: {
    display: "flex", gap: 6, flexWrap: "wrap" as const, flex: 1,
  } as React.CSSProperties,

  cropPill: (color: string): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 5,
    background: `${color}18`, color,
    border: `1px solid ${color}40`,
    borderRadius: T.rXs, padding: "2px 8px",
    fontSize: 11, fontWeight: 600,
  }),

  cropDot: (color: string): React.CSSProperties => ({
    width: 6, height: 6, borderRadius: "50%", background: color,
  }),

  chevron: (expanded: boolean): React.CSSProperties => ({
    marginLeft: "auto", fontSize: 10, color: T.ink3,
    transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
    transition: "transform 0.15s",
    flexShrink: 0,
  }),

  tasksArea: {
    padding: "0 20px 16px 48px",
    background: "rgba(232,145,58,0.03)",
    borderTop: `1px solid ${T.borderLt}`,
  } as React.CSSProperties,

  loadingText: {
    fontSize: 11, color: T.ink3, padding: "12px 0",
  } as React.CSSProperties,

  taskGroup: {
    marginTop: 12,
  } as React.CSSProperties,

  taskGroupLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
    textTransform: "uppercase" as const,
    color: T.ink3, marginBottom: 6,
  } as React.CSSProperties,

  taskCard: (status: string | null): React.CSSProperties => {
    const borderColor = status === "upcoming" ? T.accent
      : status === "done" ? T.success
      : T.borderLt;
    return {
      border: `1px solid ${borderColor}`,
      borderRadius: T.rMd, padding: "10px 14px",
      marginBottom: 6, background: T.bgElev,
      borderLeft: `3px solid ${borderColor}`,
    };
  },

  taskTitle: {
    fontSize: 12, fontWeight: 600, color: T.ink,
  } as React.CSSProperties,

  taskSubtitle: {
    fontSize: 11, color: T.ink2, marginTop: 1,
  } as React.CSSProperties,

  taskMeta: {
    fontSize: 10, color: T.ink3, marginTop: 6,
    display: "flex", gap: 16, flexWrap: "wrap" as const,
  } as React.CSSProperties,

  taskMetaItem: {
    display: "flex", flexDirection: "column" as const, gap: 1,
  } as React.CSSProperties,

  taskMetaLabel: {
    fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase" as const, color: T.ink3,
  } as React.CSSProperties,

  taskMetaVal: {
    fontSize: 11, color: T.ink,
  } as React.CSSProperties,

  statusDot: (status: string | null): React.CSSProperties => {
    const color = status === "upcoming" ? T.accent
      : status === "done" ? T.success
      : T.ink3;
    return {
      width: 6, height: 6, borderRadius: "50%", background: color,
      flexShrink: 0, marginTop: 3,
    };
  },

  noAssign: {
    fontSize: 11, color: T.ink3, fontStyle: "italic",
  } as React.CSSProperties,

  emptyState: {
    padding: "32px 20px", textAlign: "center" as const,
    fontSize: 12, color: T.ink3,
  } as React.CSSProperties,
};

function groupTasksByStatus(tasks: TaskItem[]) {
  const upcoming = tasks.filter(t => t.status === "upcoming");
  const future = tasks.filter(t => t.status === "future");
  const done = tasks.filter(t => t.status === "done");
  return { upcoming, future, done };
}

function TaskGroup({ label, tasks, color }: { label: string; tasks: TaskItem[]; color: string }) {
  if (tasks.length === 0) return null;
  return (
    <div style={S.taskGroup}>
      <div style={{ ...S.taskGroupLabel, color }}>{label} ({tasks.length})</div>
      {tasks.map(task => (
        <div key={`${task.crop_id}-${task.id}`} style={S.taskCard(task.status)}>
          <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
            <div style={S.statusDot(task.status)} />
            <div style={{ flex: 1 }}>
              <div style={S.taskTitle}>{task.title}</div>
              <div style={S.taskSubtitle}>{task.subtitle}</div>
              <div style={S.taskMeta}>
                {task.due_date && (
                  <div style={S.taskMetaItem}>
                    <span style={S.taskMetaLabel}>Due</span>
                    <span style={S.taskMetaVal}>{task.due_date}</span>
                  </div>
                )}
                <div style={S.taskMetaItem}>
                  <span style={S.taskMetaLabel}>Crop</span>
                  <span style={S.taskMetaVal}>{task.crop_name}</span>
                </div>
                <div style={S.taskMetaItem}>
                  <span style={S.taskMetaLabel}>Why</span>
                  <span style={S.taskMetaVal}>{task.why}</span>
                </div>
                {task.tools_required && (
                  <div style={S.taskMetaItem}>
                    <span style={S.taskMetaLabel}>Tools</span>
                    <span style={S.taskMetaVal}>{task.tools_required}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function FarmRow({
  farm,
  assignedCropIds,
  crops,
}: {
  farm: FarmNode;
  assignedCropIds: number[];
  crops: Crop[];
}) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[] | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const hasAssignment = assignedCropIds.length > 0;

  const handleToggle = useCallback(() => {
    if (!hasAssignment) return;
    if (!expanded && tasks === null) {
      setLoadingTasks(true);
      getFarmTasks(farm.id)
        .then(setTasks)
        .catch(() => setTasks([]))
        .finally(() => setLoadingTasks(false));
    }
    setExpanded(e => !e);
  }, [expanded, tasks, farm.id, hasAssignment]);

  const assignedCrops = assignedCropIds
    .map(id => crops.find(c => c.id === id))
    .filter(Boolean) as Crop[];

  const grouped = tasks ? groupTasksByStatus(tasks) : null;

  return (
    <div style={S.farmRow(expanded, hasAssignment)}>
      <div style={S.farmRowHeader} onClick={handleToggle}>
        <div>
          <div style={S.farmName}>{farm.name}</div>
          <div style={S.farmMeta}>{farm.plot_type} · {farm.plot_size_sqft} sqft</div>
        </div>

        <div style={S.cropPills}>
          {assignedCrops.length > 0 ? (
            assignedCrops.map(crop => {
              const color = CROP_COLORS[crop.id] ?? T.ink3;
              return (
                <span key={crop.id} style={S.cropPill(color)}>
                  <span style={S.cropDot(color)} />
                  {crop.name}
                </span>
              );
            })
          ) : (
            <span style={S.noAssign}>No assignment</span>
          )}
        </div>

        <span style={S.badge(
          farm.status === "growing" ? T.success : farm.status === "new" ? T.accent : T.info,
          farm.status === "growing" ? "rgba(76,175,80,0.12)" : farm.status === "new" ? T.accentBg : "rgba(91,141,239,0.12)",
        )}>
          {farm.status}
        </span>

        {hasAssignment && (
          <span style={S.chevron(expanded)}>▶</span>
        )}
      </div>

      {expanded && (
        <div style={S.tasksArea}>
          {loadingTasks && <div style={S.loadingText}>Loading tasks…</div>}
          {tasks !== null && tasks.length === 0 && (
            <div style={S.loadingText}>No tasks scheduled yet — cycle hasn't started.</div>
          )}
          {grouped && (
            <>
              <TaskGroup label="Due Soon" tasks={grouped.upcoming} color={T.accent} />
              <TaskGroup label="Future" tasks={grouped.future} color={T.info} />
              <TaskGroup label="Completed" tasks={grouped.done} color={T.success} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Instructions({ farmList, assignments, crops }: Props) {
  const assignedFarms = farmList.filter(f => (assignments[String(f.id)]?.length ?? 0) > 0);

  return (
    <div style={S.page}>
      {/* Summary row */}
      <div style={S.summaryRow}>
        <div style={S.summaryCard}>
          <div style={S.summaryVal}>{assignedFarms.length}</div>
          <div style={S.summaryLbl}>Farms with dispatched instructions</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryVal}>
            {assignedFarms.reduce((acc, f) => acc + (assignments[String(f.id)]?.length ?? 0), 0)}
          </div>
          <div style={S.summaryLbl}>Total crop assignments sent</div>
        </div>
        <div style={S.summaryCard}>
          <div style={S.summaryVal}>{farmList.length - assignedFarms.length}</div>
          <div style={S.summaryLbl}>Farms awaiting assignment</div>
        </div>
      </div>

      {/* Farm list */}
      <div style={S.panel}>
        <div style={S.panelHeader}>
          <div style={S.panelTitle}>Dispatched Instructions</div>
          <span style={S.badge(T.accent, T.accentBg)}>
            {assignedFarms.length} dispatched
          </span>
        </div>

        {farmList.length === 0 ? (
          <div style={S.emptyState}>
            No farms registered. Add farms via the Network Map, then run optimization.
          </div>
        ) : (
          farmList.map(farm => (
            <FarmRow
              key={farm.id}
              farm={farm}
              assignedCropIds={assignments[String(farm.id)] ?? []}
              crops={crops}
            />
          ))
        )}
      </div>
    </div>
  );
}
