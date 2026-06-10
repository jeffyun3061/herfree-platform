'use client';

import { useState } from 'react';
import { emptyPage } from '@/domain/common/types';
import type { Content } from '@/domain/content/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import * as contentsApi from '@/lib/api/contents';

export function useContentList(category?: string, size = 10) {
  const [page, setPage] = useState(0);
  const { data, isLoading, error } = useApiQuery(
    () => contentsApi.fetchContents({ category, page, size }),
    [category, page, size],
  );
  return { contentPage: data ?? emptyPage<Content>(), page, setPage, isLoading, error };
}

export function useContentDetail(contentId: number) {
  const { data, isLoading, error } = useApiQuery(
    () => contentsApi.fetchContent(contentId),
    [contentId],
  );
  return { content: data, isLoading, error };
}
