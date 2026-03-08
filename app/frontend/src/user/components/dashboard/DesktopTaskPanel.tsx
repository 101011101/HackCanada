import type { TaskItem, UserTaskState } from '../../types';

interface DesktopTaskPanelProps {
  tasks: TaskItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onMarkDone: (id: number) => void;
  onSkip: (id: number) => void;
  getState: (id: number) => UserTaskState | null;
}

export default function DesktopTaskPanel({
  tasks,
  selectedId,
  onSelect,
  onMarkDone,
  onSkip,
  getState,
}: DesktopTaskPanelProps) {
  const selectedTask = tasks.find(t => t.id === selectedId) ?? null;
  const selectedState = selectedTask ? getState(selectedTask.id) : null;

  // Sort: acted tasks to bottom
  const sorted = [...tasks].sort((a, b) => {
    const aActed = getState(a.id) !== null;
    const bActed = getState(b.id) !== null;
    if (aActed && !bActed) return 1;
    if (!aActed && bActed) return -1;
    return a.day_from_start - b.day_from_start;
  });

  return (
    <div className="d-task-panel">
      {/* Left: task list */}
      <div className="d-task-list">
        {sorted.map(task => {
          const state = getState(task.id);
          const isDone = state === 'done';
          const isActive = task.id === selectedId;
          return (
            <div
              key={`${task.crop_id}-${task.id}`}
              className={`d-task-row${isActive ? ' active' : ''}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(task.id)}
              onKeyDown={(e) => { if (e.key === 'Enter') onSelect(task.id); }}
            >
              <div
                className="d-task-row-title"
                style={isDone ? { textDecoration: 'line-through', color: 'var(--ink-3)' } : undefined}
              >
                {task.title}
                {state === null && task.status === 'upcoming' && (
                  <span className="badge badge--error" style={{ fontSize: 9, padding: '2px 5px', marginLeft: 4, verticalAlign: 'middle' }}>
                    Urgent
                  </span>
                )}
              </div>
              <div className="d-task-row-sub">
                {isDone ? 'Done · ' : ''}{task.subtitle}
              </div>
            </div>
          );
        })}
        {tasks.length === 0 && (
          <div style={{ padding: '24px 18px', color: 'var(--ink-3)', fontSize: 13 }}>
            No tasks for this cycle yet.
          </div>
        )}
      </div>

      {/* Right: task detail */}
      <div className="d-task-detail">
        {!selectedTask ? (
          <div style={{ margin: 'auto', color: 'var(--ink-3)', fontSize: 13, textAlign: 'center' }}>
            Select a task to see details
          </div>
        ) : (
          <>
            <div className="d-task-detail-label">Task detail</div>
            <div className="d-task-detail-title">{selectedTask.title}</div>
            <div className="d-task-detail-sub">{selectedTask.subtitle}</div>

            <div className="d-task-detail-rows">
              {selectedTask.why && (
                <div className="d-task-detail-row">
                  <span className="d-task-detail-lbl">Why</span>
                  <span className="d-task-detail-val">{selectedTask.why}</span>
                </div>
              )}
              {selectedTask.how && (
                <div className="d-task-detail-row">
                  <span className="d-task-detail-lbl">How</span>
                  <span className="d-task-detail-val">{selectedTask.how}</span>
                </div>
              )}
              {selectedTask.target && (
                <div className="d-task-detail-row">
                  <span className="d-task-detail-lbl">Target</span>
                  <span className="d-task-detail-val">{selectedTask.target}</span>
                </div>
              )}
              {selectedTask.tools_required && (
                <div className="d-task-detail-row">
                  <span className="d-task-detail-lbl">Tools</span>
                  <span className="d-task-detail-val">{selectedTask.tools_required}</span>
                </div>
              )}
            </div>

            {selectedState === null ? (
              <div className="d-task-detail-actions">
                <button
                  className="btn btn--accent btn--sm"
                  type="button"
                  onClick={() => onMarkDone(selectedTask.id)}
                >
                  Mark done
                </button>
                <button
                  className="btn btn--secondary btn--sm"
                  type="button"
                  onClick={() => onSkip(selectedTask.id)}
                >
                  Skip
                </button>
              </div>
            ) : (
              <div style={{ fontSize: 12, fontWeight: 600, marginTop: 'auto', color: selectedState === 'done' ? 'var(--success)' : 'var(--ink-3)' }}>
                {selectedState === 'done' ? 'Completed' : 'Skipped'}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
