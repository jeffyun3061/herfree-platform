'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Post } from '@/domain/post/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as usersApi from '@/lib/api/users';

export function useMyPosts(enabled: boolean, size = 10) {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useApiQuery(
    () => usersApi.fetchMyPosts(page, size),
    [page, size],
    { enabled },
  );
  return { postPage: data ?? emptyPage<Post>(), page, setPage, isLoading, error };
}
