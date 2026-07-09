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
import { InlineTopActions } from '@/components/layout/InlineTopActions';
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
    if (category !== undefined || page !== 0) return null;
    if (contentPage.content.length === 0) return null;
    return contentPage.content.reduce((latest, content) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const contentTime = new Date(content.createdAt).getTime();
      return contentTime > latestTime ? content : latest;
    }, contentPage.content[0]).id;
  }, [category, page, contentPage.content]);
  const latestContent = useMemo(
    () => contentPage.content.find((content) => content.id === latestContentId) ?? null,
    [latestContentId, contentPage.content],
  );
  const restContents = useMemo(
    () =>
      latestContentId == null
        ? contentPage.content
        : contentPage.content.filter((content) => content.id !== latestContentId),
    [latestContentId, contentPage.content],
  );

  return (
    <>
      <div className="content-screen mx-auto max-w-app pb-24 lg:max-w-none">
        <div className="flex items-start justify-between gap-3 px-5 pt-7 lg:pt-8">
          <div className="min-w-0">
            <h1 className="hf-display text-[24px] font-semibold leading-tight text-[#15201D]">칼럼</h1>
            <p className="mt-1.5 text-[12.5px] text-[#8B9590]">경험에서 나온 이야기</p>
          </div>
          <InlineTopActions />
        </div>

        <div className="mx-5 mt-4 hidden items-start justify-end gap-3 lg:flex">
          <AdminPublishLink tab="contents" label="칼럼 올리기" />
        </div>

        <div className="mt-[18px] flex gap-2 overflow-x-auto px-5 pb-1 pr-10 scrollbar-hide">
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

        {!isLoading && !error && contentPage.content.length > 0 && (
          <p className="px-5 pt-3 text-[11.5px] text-[#9A9F94]">
            총 {contentPage.totalElements.toLocaleString('ko-KR')}개의 칼럼
          </p>
        )}

        {isLoading ? (
          <div className="mt-[18px] flex flex-col gap-3.5 px-5">
            {[1, 2, 3].map((i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 pt-5"><ErrorMessage message={error} /></div>
        ) : contentPage.content.length === 0 ? (
          <div className="px-5 pt-5">
            <EmptyState title="등록된 칼럼이 없습니다" description="곧 새로운 칼럼이 준비될 예정입니다." />
          </div>
        ) : (
          <div className="mx-auto mt-[14px] max-w-app space-y-3.5 px-5">
            {latestContent && <ContentCard content={latestContent} featured />}
            {restContents.length > 0 && (
              <div className="flex flex-col gap-3.5">
                {restContents.map((item) => (
                  <ContentCard key={item.id} content={item} />
                ))}
              </div>
            )}
          </div>
        )}

        <div className="px-5">
          <Pagination page={page} totalPages={contentPage.totalPages} onPageChange={setPage} />
        </div>
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
