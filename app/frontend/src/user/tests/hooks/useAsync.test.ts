import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAsync } from '../../hooks/useAsync';

describe('useAsync', () => {
  it('starts with loading=true and data=null', () => {
    const { result } = renderHook(() =>
      useAsync(() => new Promise(() => {}), [])
    );
    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('resolves data on success', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve({ value: 42 }), [])
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ value: 42 });
    expect(result.current.error).toBeNull();
  });

  it('captures error message on failure', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject(new Error('Network error')), [])
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });

  it('captures non-Error rejection as string', async () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.reject('bad request'), [])
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('bad request');
  });

  it('exposes a refetch function', () => {
    const { result } = renderHook(() =>
      useAsync(() => Promise.resolve(1), [])
    );
    expect(typeof result.current.refetch).toBe('function');
  });

  it('refetch re-runs the async function', async () => {
    let callCount = 0;
    const { result } = renderHook(() =>
      useAsync(() => { callCount++; return Promise.resolve(callCount); }, [])
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(1);

    act(() => { result.current.refetch(); });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toBe(2);
    expect(callCount).toBe(2);
  });

  it('sets loading=true while refetching', async () => {
    let resolve: (v: number) => void;
    const { result } = renderHook(() =>
      useAsync(() => new Promise<number>((r) => { resolve = r; }), [])
    );
    act(() => resolve(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    act(() => { result.current.refetch(); });
    expect(result.current.loading).toBe(true);
  });
});
