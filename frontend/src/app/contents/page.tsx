'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useContentList } from '@/hooks/useContents';
import { TopBar } from '@/components/layout/TopBar';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { CONTENT_CATEGORIES, getContentPreview, getContentTypeLabel } from '@/domain/content/types';
import { cn } from '@/lib/cn';

export default function ContentsPage() {
  const [category, setCategory] = useState<string | undefined>(undefined);
  const { contentPage, page, setPage, isLoading } = useContentList(category);

  return (
    <>
      <TopBar title="정보글" showBack />
      <div className="px-4 py-4">
        <MedicalDisclaimer />

        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            type="button"
            onClick={() => setCategory(undefined)}
            className={cn(
              'shrink-0 rounded-full px-4 py-1.5 text-sm',
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
                'shrink-0 rounded-full px-4 py-1.5 text-sm',
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
    </>
  );
}
