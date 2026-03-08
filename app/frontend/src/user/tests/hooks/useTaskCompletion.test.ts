import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTaskCompletion, clearFarmTaskStates } from '../../hooks/useTaskCompletion';

const FARM_ID = 1;
const TASK_ID_1 = 101;
const TASK_ID_2 = 202;
const KEY = (taskId: number) => `mycelium:task:${FARM_ID}:${taskId}`;

beforeEach(() => {
  localStorage.clear();
});

describe('useTaskCompletion', () => {
  it('getState returns null for untracked task', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    expect(result.current.getState(TASK_ID_1)).toBeNull();
  });

  it('markDone sets state to "done"', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markDone(TASK_ID_1); });
    expect(result.current.getState(TASK_ID_1)).toBe('done');
  });

  it('markDone writes to localStorage', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markDone(TASK_ID_1); });
    expect(localStorage.getItem(KEY(TASK_ID_1))).toBe('done');
  });

  it('markSkipped sets state to "skipped"', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markSkipped(TASK_ID_1); });
    expect(result.current.getState(TASK_ID_1)).toBe('skipped');
  });

  it('markSkipped writes "skipped" to localStorage', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markSkipped(TASK_ID_1); });
    expect(localStorage.getItem(KEY(TASK_ID_1))).toBe('skipped');
  });

  it('reset sets state back to null', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markDone(TASK_ID_1); });
    act(() => { result.current.reset(TASK_ID_1); });
    expect(result.current.getState(TASK_ID_1)).toBeNull();
  });

  it('reset removes key from localStorage', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markDone(TASK_ID_1); });
    act(() => { result.current.reset(TASK_ID_1); });
    expect(localStorage.getItem(KEY(TASK_ID_1))).toBeNull();
  });

  it('loads pre-existing localStorage state on mount', () => {
    localStorage.setItem(KEY(TASK_ID_1), 'done');
    localStorage.setItem(KEY(TASK_ID_2), 'skipped');
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    expect(result.current.getState(TASK_ID_1)).toBe('done');
    expect(result.current.getState(TASK_ID_2)).toBe('skipped');
  });

  it('tracks multiple tasks independently', () => {
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    act(() => { result.current.markDone(TASK_ID_1); });
    act(() => { result.current.markSkipped(TASK_ID_2); });
    expect(result.current.getState(TASK_ID_1)).toBe('done');
    expect(result.current.getState(TASK_ID_2)).toBe('skipped');
  });

  it('does not bleed state across different farmIds', () => {
    localStorage.setItem(`mycelium:task:99:${TASK_ID_1}`, 'done');
    const { result } = renderHook(() => useTaskCompletion(FARM_ID));
    // farmId=1 should not see farmId=99's task
    expect(result.current.getState(TASK_ID_1)).toBeNull();
  });
});

describe('clearFarmTaskStates', () => {
  it('removes all task keys for a farmId', () => {
    localStorage.setItem(KEY(TASK_ID_1), 'done');
    localStorage.setItem(KEY(TASK_ID_2), 'skipped');
    localStorage.setItem('mycelium:farm_id', '1'); // unrelated — should survive
    clearFarmTaskStates(FARM_ID);
    expect(localStorage.getItem(KEY(TASK_ID_1))).toBeNull();
    expect(localStorage.getItem(KEY(TASK_ID_2))).toBeNull();
    expect(localStorage.getItem('mycelium:farm_id')).toBe('1');
  });

  it('does not affect other farmId task keys', () => {
    const otherKey = `mycelium:task:99:${TASK_ID_1}`;
    localStorage.setItem(KEY(TASK_ID_1), 'done');
    localStorage.setItem(otherKey, 'done');
    clearFarmTaskStates(FARM_ID);
    expect(localStorage.getItem(otherKey)).toBe('done');
  });
});
