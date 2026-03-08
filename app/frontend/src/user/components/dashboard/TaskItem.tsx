import type { TaskItem as TaskItemType } from '../../types';
import type { UserTaskState } from '../../types';

interface TaskItemProps {
  task: TaskItemType;
  userState: UserTaskState | null;
  onMarkDone: () => void;
  onSkip: () => void;
}

export default function TaskItem({
  task,
  userState,
  onMarkDone,
  onSkip,
}: TaskItemProps) {
  const isDone = userState === 'done';
  const isSkipped = userState === 'skipped';
  // Show API time-based status badge only when user has NOT acted
  const showApiStatus = userState === null;

  return (
    <details className="task-item">
      <summary>
        {/* Toggle — ON + strikethrough when user-done */}
        <button
          className={`toggle${isDone ? ' toggle--on' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            if (!isDone) {
              onMarkDone();
            }
          }}
          aria-label={isDone ? 'Marked done' : 'Mark done'}
          type="button"
        >
          <span className="toggle__k" />
        </button>

        <div className="task-main">
          <div
            className="task-title"
            style={
              isDone
                ? { textDecoration: 'line-through', color: 'var(--ink-3)' }
                : undefined
            }
          >
            {task.title}
            {/* Urgent badge — only shown when no user action taken and API says upcoming */}
            {showApiStatus && task.status === 'upcoming' && (
              <span
                className="badge badge--error"
                style={{ marginLeft: 6, verticalAlign: 'middle' }}
              >
                Upcoming
              </span>
            )}
          </div>
          <div className="task-sub">{task.subtitle}</div>
        </div>

        {/* Status badges (right side) */}
        {isDone && (
          <span className="badge badge--success" style={{ flexShrink: 0 }}>
            Done
          </span>
        )}
        {isSkipped && (
          <span className="badge badge--info" style={{ flexShrink: 0 }}>
            Skipped
          </span>
        )}
        {showApiStatus && task.status === 'future' && (
          <span className="badge badge--info" style={{ flexShrink: 0 }}>
            Future
          </span>
        )}

        {/* Chevron */}
        <svg
          className="task-chevron"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          width={14}
          height={14}
        >
          <polyline points="4 6 8 10 12 6" />
        </svg>
      </summary>

      <div className="task-expand">
        {task.why && (
          <div className="task-row">
            <span className="task-lbl">Why</span>
            <span className="task-val">{task.why}</span>
          </div>
        )}
        {task.how && (
          <div className="task-row">
            <span className="task-lbl">How</span>
            <span className="task-val">{task.how}</span>
          </div>
        )}
        {task.target && (
          <div className="task-row">
            <span className="task-lbl">Target</span>
            <span className="task-val">{task.target}</span>
          </div>
        )}
        {task.tools_required && (
          <div className="task-row">
            <span className="task-lbl">Tools</span>
            <span className="task-val">{task.tools_required}</span>
          </div>
        )}
        {task.due_date && (
          <div className="task-row">
            <span className="task-lbl">Due</span>
            <span className="task-val">{task.due_date}</span>
          </div>
        )}

        {/* Action buttons — shown only when not yet acted on */}
        {!isDone && !isSkipped && (
          <div className="task-btns">
            <button
              className="btn btn--accent btn--sm"
              onClick={onMarkDone}
              type="button"
            >
              Mark done
            </button>
            <button
              className="btn btn--secondary btn--sm"
              onClick={onSkip}
              type="button"
            >
              Skip
            </button>
          </div>
        )}
      </div>
    </details>
  );
}
