import { useState } from 'react';
import type { TaskItem as TaskItemType, UserTaskState } from '../../types';
import TaskItem from './TaskItem';
import { useTaskCompletion } from '../../hooks/useTaskCompletion';

interface TaskListProps {
  farmId: number;
  tasks: TaskItemType[];
}

// Chevron rotates down when open, right when collapsed
const Chevron = ({ collapsed }: { collapsed: boolean }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    width={12}
    height={12}
    style={{
      flexShrink: 0,
      transition: 'transform 0.2s ease',
      transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
    }}
  >
    <polyline points="4 6 8 10 12 6" />
  </svg>
);

// Unique ID combining crop and task so same task number across different crops don't collide
const uid = (t: TaskItemType) => t.crop_id * 1000 + t.id;

export default function TaskList({ farmId, tasks }: TaskListProps) {
  const { getState, markDone, markSkipped } = useTaskCompletion(farmId);
  const [collapsed, setCollapsed] = useState(false);

  // Cache state per task once per render to avoid repeated localStorage reads
  const stateMap: Record<number, UserTaskState | null> =
    Object.fromEntries(tasks.map(t => [uid(t), getState(uid(t))]));

  const pendingCount = tasks.filter(t => stateMap[uid(t)] === null).length;

  const header = (
    <button
      type="button"
      className="m-section-title m-section-title--sticky"
      onClick={() => setCollapsed(c => !c)}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', border: 'none' }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        Your tasks today
        {pendingCount > 0 && (
          <span className="badge badge--info">{pendingCount}</span>
        )}
      </span>
      <Chevron collapsed={collapsed} />
    </button>
  );

  if (tasks.length === 0) {
    return (
      <div className="m-section">
        {header}
        {!collapsed && (
          <div className="m-content">
            <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No tasks yet for this cycle.</p>
          </div>
        )}
      </div>
    );
  }

  // Pending tasks first, sorted by day; done/skipped tasks at bottom
  const sorted = [...tasks].sort((a, b) => {
    const aActed = stateMap[uid(a)] !== null;
    const bActed = stateMap[uid(b)] !== null;
    if (aActed && !bActed) return 1;
    if (!aActed && bActed) return -1;
    return a.day_from_start - b.day_from_start;
  });

  return (
    <div className="m-section">
      {header}
      {!collapsed && sorted.map((task) => (
        <TaskItem
          key={`${task.crop_id}-${task.id}`}
          task={task}
          userState={stateMap[uid(task)] ?? null}
          onMarkDone={() => markDone(uid(task))}
          onSkip={() => markSkipped(uid(task))}
        />
      ))}
    </div>
  );
}
