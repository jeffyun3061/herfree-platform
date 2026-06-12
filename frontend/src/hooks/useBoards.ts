'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import * as boardsApi from '@/lib/api/boards';

export function useBoards() {
  const { data, isLoading, error, refetch } = useApiQuery(() => boardsApi.fetchBoards(), []);
  return { boards: data ?? [], isLoading, error, refetch };
}
