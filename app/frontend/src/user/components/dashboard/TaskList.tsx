import type { TaskItem as TaskItemType } from '../../types';
import TaskItem from './TaskItem';
import { useTaskCompletion } from '../../hooks/useTaskCompletion';

interface TaskListProps {
  farmId: number;
  tasks: TaskItemType[];
}

export default function TaskList({ farmId, tasks }: TaskListProps) {
  const { getState, markDone, markSkipped } = useTaskCompletion(farmId);

  if (tasks.length === 0) {
    return (
      <div className="m-section">
        <span className="m-section-title">Your tasks today</span>
        <div className="m-content">
          <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>
            No tasks yet for this cycle.
          </p>
        </div>
      </div>
    );
  }

  // Sort: user-acted tasks (done or skipped) move to the bottom
  // Within each group, sort by day_from_start ascending
  const sorted = [...tasks].sort((a, b) => {
    const aActed = getState(a.id) !== null;
    const bActed = getState(b.id) !== null;
    if (aActed && !bActed) return 1;
    if (!aActed && bActed) return -1;
    return a.day_from_start - b.day_from_start;
  });

  return (
    <div className="m-section">
      <span className="m-section-title">Your tasks today</span>
      {sorted.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          userState={getState(task.id)}
          onMarkDone={() => markDone(task.id)}
          onSkip={() => markSkipped(task.id)}
        />
      ))}
    </div>
  );
}
