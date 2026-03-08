import { useState, useEffect } from 'react';
import type { UserTaskState } from '../types';

/**
 * useTaskCompletion
 *
 * Manages user-driven task completion state for a given farm, backed by
 * localStorage.  This is separate from the API's time-based task status
 * ('done' | 'upcoming' | 'future'), which reflects calendar position only.
 *
 * localStorage key pattern:  "mycelium:task:{farmId}:{taskId}"
 * value:                      "done" | "skipped"  (absent = not acted on)
 */

function storageKey(farmId: number, taskId: number): string {
  return `mycelium:task:${farmId}:${taskId}`;
}

interface TaskCompletionHook {
  /** Returns the user state for a task, or null if not acted on */
  getState: (taskId: number) => UserTaskState | null;
  /** Mark a task as done — writes to localStorage immediately */
  markDone: (taskId: number) => void;
  /** Mark a task as skipped — writes to localStorage immediately */
  markSkipped: (taskId: number) => void;
  /** Reset a task to "not acted on" — removes from localStorage */
  reset: (taskId: number) => void;
}

export function useTaskCompletion(farmId: number): TaskCompletionHook {
  // A map of taskId → UserTaskState, loaded from localStorage on mount
  const [states, setStates] = useState<Record<number, UserTaskState>>(() => {
    const prefix = `mycelium:task:${farmId}:`;
    const result: Record<number, UserTaskState> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const taskIdStr = key.slice(prefix.length);
        const taskId = Number(taskIdStr);
        if (!isNaN(taskId)) {
          const val = localStorage.getItem(key);
          if (val === 'done' || val === 'skipped') {
            result[taskId] = val;
          }
        }
      }
    }
    return result;
  });

  // Re-read from localStorage when farmId changes
  useEffect(() => {
    const prefix = `mycelium:task:${farmId}:`;
    const result: Record<number, UserTaskState> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const taskIdStr = key.slice(prefix.length);
        const taskId = Number(taskIdStr);
        if (!isNaN(taskId)) {
          const val = localStorage.getItem(key);
          if (val === 'done' || val === 'skipped') {
            result[taskId] = val;
          }
        }
      }
    }
    setStates(result);
  }, [farmId]);

  const getState = (taskId: number): UserTaskState | null => {
    return states[taskId] ?? null;
  };

  const markDone = (taskId: number): void => {
    localStorage.setItem(storageKey(farmId, taskId), 'done');
    setStates((prev) => ({ ...prev, [taskId]: 'done' }));
  };

  const markSkipped = (taskId: number): void => {
    localStorage.setItem(storageKey(farmId, taskId), 'skipped');
    setStates((prev) => ({ ...prev, [taskId]: 'skipped' }));
  };

  const reset = (taskId: number): void => {
    localStorage.removeItem(storageKey(farmId, taskId));
    setStates((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
  };

  return { getState, markDone, markSkipped, reset };
}

/**
 * Clear all task states for a farmId from localStorage.
 * Call this after a successful POST /nodes/{farmId}/cycle-end.
 */
export function clearFarmTaskStates(farmId: number): void {
  const prefix = `mycelium:task:${farmId}:`;
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(prefix)) {
      keysToRemove.push(key);
    }
  }
  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}
