import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useAsyncMutation } from '@/hooks/useAsyncMutation';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe('useAsyncMutation', () => {
  it('tracks an in-flight request and prevents duplicate submissions', async () => {
    const pending = deferred<number>();
    const action = vi.fn(() => pending.promise);
    const { result } = renderHook(() => useAsyncMutation());

    const firstRun = result.current.run(action);
    await waitFor(() => expect(result.current.isPending).toBe(true));

    await expect(result.current.run(action)).resolves.toBeNull();
    expect(action).toHaveBeenCalledTimes(1);

    await act(async () => {
      pending.resolve(42);
      await firstRun;
    });

    expect(await firstRun).toBe(42);
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('converts a rejected action to a presentable error and can reset it', async () => {
    const { result } = renderHook(() => useAsyncMutation());

    await act(async () => {
      await expect(result.current.run(async () => {
        throw new Error('저장에 실패했습니다.');
      })).resolves.toBeNull();
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBe('저장에 실패했습니다.');

    act(() => result.current.reset());
    expect(result.current.error).toBeNull();
  });
});
