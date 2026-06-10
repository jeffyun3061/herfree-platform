'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import * as boardsApi from '@/lib/api/boards';

export function useBoards() {
  const { data, isLoading, error } = useApiQuery(() => boardsApi.fetchBoards(), []);
  return { boards: data ?? [], isLoading, error };
}
