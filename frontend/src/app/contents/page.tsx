'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useContentList } from '@/hooks/useContents';
import { ContentCard, ContentCardSkeleton } from '@/components/content/ContentCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { CONTENT_CATEGORIES } from '@/domain/content/types';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { cn } from '@/lib/cn';

function ContentsPageContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { contentPage, page, setPage, isLoading, error } = useContentList(category);

  useEffect(() => {
    const fromQuery = searchParams.get('category');
    if (fromQuery) setCategory(fromQuery);
  }, [searchParams]);

  const latestContentId = useMemo(() => {
    if (contentPage.content.length === 0) return null;
    return contentPage.content.reduce((latest, content) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const contentTime = new Date(content.createdAt).getTime();
      return contentTime > latestTime ? content : latest;
    }, contentPage.content[0]).id;
  }, [contentPage.content]);
  const latestContent = useMemo(
    () => contentPage.content.find((content) => content.id === latestContentId) ?? null,
    [latestContentId, contentPage.content],
  );
  const restContents = useMemo(
    () => contentPage.content.filter((content) => content.id !== latestContentId),
    [latestContentId, contentPage.content],
  );

  return (
    <>
      <div className="page-container content-screen mx-auto max-w-app lg:max-w-none">
        <div className="mb-4 lg:hidden">
          <p className="text-[19px] font-semibold text-[#15201D]">칼럼</p>
          <p className="mt-1 text-[12.5px] text-[#8B9590]">경험과 전문가 정보에서 고른 이야기</p>
        </div>

        <div className="mb-4 hidden items-start justify-between gap-3 lg:flex">
          <div>
            <h1 className="section-heading">칼럼</h1>
            <p className="mt-2 text-sm text-muted">경험과 전문가 정보에서 고른 이야기</p>
          </div>
          <AdminPublishLink tab="contents" label="칼럼 올리기" />
        </div>

        <div className="mb-4 flex gap-2 overflow-x-auto pb-1 pr-6 scrollbar-hide">
          <button
            type="button"
            onClick={() => {
              setCategory(undefined);
              setPage(0);
            }}
            className={cn(
              'community-chip',
              category === undefined ? 'community-chip-active' : 'community-chip-inactive',
            )}
          >
            전체
          </button>
          {CONTENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setPage(0);
              }}
              className={cn(
                'community-chip',
                category === cat ? 'community-chip-active' : 'community-chip-inactive',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={error} />
        ) : contentPage.content.length === 0 ? (
          <EmptyState title="등록된 칼럼이 없습니다" description="곧 새로운 칼럼이 준비될 예정입니다." />
        ) : (
          <div className="mx-auto max-w-app space-y-4">
            {latestContent && <ContentCard content={latestContent} featured />}
            {restContents.length > 0 && (
              <div className="flex flex-col gap-3">
                {restContents.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={contentPage.totalPages} onPageChange={setPage} />
      </div>
      <AdminPublishFab tab="contents" label="칼럼 올리기" />
    </>
  );
}

export default function ContentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="칼럼 불러오는 중…" />}>
      <ContentsPageContent />
    </Suspense>
  );
}
