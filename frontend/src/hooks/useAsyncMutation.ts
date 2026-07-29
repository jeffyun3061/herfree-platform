'use client';

import { useCallback, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/api/client';

/**
 * Shared, low-level mutation state for feature hooks.
 *
 * It deliberately knows nothing about a resource or its API. Feature hooks keep
 * their existing public method names and decide whether a failed operation should
 * be represented as `null`, `false`, or a thrown error.
 */
export function useAsyncMutation() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const run = useCallback(async <T,>(action: () => Promise<T>): Promise<T | null> => {
    if (inFlightRef.current) return null;

    inFlightRef.current = true;
    setIsPending(true);
    setError(null);

    try {
      return await action();
    } catch (cause) {
      setError(getErrorMessage(cause));
      return null;
    } finally {
      inFlightRef.current = false;
      setIsPending(false);
    }
  }, []);

  const reset = useCallback(() => setError(null), []);

  return { run, isPending, error, reset };
}
