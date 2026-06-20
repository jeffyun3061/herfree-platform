'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useContentList } from '@/hooks/useContents';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { CONTENT_CATEGORIES, getContentPreview, getContentTypeLabel } from '@/domain/content/types';
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
      <div className="page-container mx-auto max-w-content pb-28 lg:pb-10">
        <MedicalDisclaimer />

        <div className="mt-4 hidden justify-end lg:flex">
          <AdminPublishLink tab="contents" label="정보 올리기" />
        </div>

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={cn(
              'shrink-0 rounded-lg px-4 py-1.5 text-sm',
              category === undefined
                ? 'bg-primary text-primary-foreground'
                : 'bg-cream-dark text-muted',
            )}
          >
            전체
          </button>
          {CONTENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={cn(
                'shrink-0 rounded-lg px-4 py-1.5 text-sm',
                category === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-cream-dark text-muted',
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="mt-4 space-y-3">
            {contentPage.content.map((item) => (
              <Link key={item.id} href={`/contents/${item.id}`}>
                <Card>
                  <div className="flex items-center gap-2">
                    <Badge variant="gold">{item.category}</Badge>
                    <span className="text-xs text-muted">{getContentTypeLabel(item.contentType)}</span>
                  </div>
                  <p className="mt-2 font-medium text-cream-foreground">{item.title}</p>
                  <p className="mt-1 text-sm text-muted">{getContentPreview(item.content)}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={contentPage.totalPages} onPageChange={setPage} />
      </div>
      <AdminPublishFab tab="contents" label="정보 올리기" />
    </>
  );
}

export default function ContentsPage() {
  return (
    <Suspense fallback={<LoadingSpinner label="정보글 불러오는 중…" />}>
      <ContentsPageContent />
    </Suspense>
  );
}
