'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import * as usersApi from '@/lib/api/users';

export function useMyActivity(enabled: boolean) {
  const { data, isLoading, error } = useApiQuery(
    () => usersApi.fetchMyActivity(),
    [],
    { enabled },
  );
  return { activity: data, isLoading, error };
}
