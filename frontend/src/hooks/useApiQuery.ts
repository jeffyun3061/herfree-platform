'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/lib/api/client';

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

// 조회 API 호출의 공통 패턴(로딩·에러·재조회)을 한곳에 모은 범용 훅.
// 도메인 훅들이 이 훅을 감싸므로 페이지마다 useEffect 보일러플레이트가 반복되지 않는다.
export function useApiQuery<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  // 의존성이 바뀌어 새 요청이 나간 뒤 이전 응답이 늦게 도착하는 경합을 방지한다
  const requestIdRef = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const execute = useCallback(async () => {
    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (requestId === requestIdRef.current) {
        setState({ data, isLoading: false, error: null });
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setState({ data: null, isLoading: false, error: getErrorMessage(error) });
      }
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void execute();
    // deps는 호출부에서 결정하므로 spread로 전달받는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, execute, ...deps]);

  return { ...state, refetch: execute };
}
