'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useContentList } from '@/hooks/useContents';
import { ContentCard, ContentCardSkeleton } from '@/components/content/ContentCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { CONTENT_CATEGORIES } from '@/domain/content/types';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { cn } from '@/lib/cn';

function ContentsPageContent() {
  const searchParams = useSearchParams();
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { contentPage, page, setPage, isLoading } = useContentList(category);

  useEffect(() => {
    const fromQuery = searchParams.get('category');
    if (fromQuery) setCategory(fromQuery);
  }, [searchParams]);

  return (
    <>
      <div className="page-container content-screen mx-auto max-w-app pb-36 lg:max-w-content lg:pb-12">
        <div className="mb-4 lg:hidden">
          <p className="text-[22px] font-bold text-[#15201D]">칼럼</p>
          <p className="mt-1 text-[12.5px] text-[#8B9590]">경험과 전문가 정보에서 고른 이야기</p>
        </div>

        <div className="mb-4 hidden items-start justify-between gap-3 lg:flex">
          <div>
            <h1 className="section-heading">칼럼</h1>
            <p className="mt-2 text-sm text-muted">경험과 전문가 정보에서 고른 이야기</p>
          </div>
          <AdminPublishLink tab="contents" label="칼럼 올리기" />
        </div>

        <div className="relative -mx-1 mb-5">
          <div className="hf-chip-rail gap-2 px-1 pb-1 pr-8">
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
            <span className="w-4 shrink-0" aria-hidden />
          </div>
          <div
            className="pointer-events-none absolute bottom-1 right-0 top-0 w-10 bg-gradient-to-l from-[#F3EDE3] via-[#F3EDE3]/88 to-transparent"
            aria-hidden
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <ContentCardSkeleton key={i} />
            ))}
          </div>
        ) : contentPage.content.length === 0 ? (
          <EmptyState title="등록된 칼럼이 없습니다" description="곧 새로운 칼럼이 준비될 예정입니다." />
        ) : (
          <div className="mx-auto flex max-w-app flex-col gap-3 lg:max-w-3xl">
            {contentPage.content.map((item) => (
              <ContentCard key={item.id} content={item} />
            ))}
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
    <Suspense fallback={<LoadingSpinner label="칼럼 불러오는 중..." />}>
      <ContentsPageContent />
    </Suspense>
  );
}
