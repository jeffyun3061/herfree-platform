'use client';

import Link from 'next/link';
import { useContentList } from '@/hooks/useContents';
import { estimateReadMinutes, getContentPreview } from '@/domain/content/types';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type HomeColumnPreviewProps = {
  maxItems?: number;
  className?: string;
};

export function HomeColumnPreview({ maxItems = 3, className }: HomeColumnPreviewProps) {
  const { contentPage, isLoading, error, refetch } = useContentList(undefined, maxItems);
  const items = contentPage.content.slice(0, maxItems);

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#1E2621]">추천 칼럼</h2>
        <Link href="/contents" className="inline-flex min-h-11 items-center gap-1 rounded-lg px-2 text-[13px] font-semibold text-primary hover:bg-primary/5">
          전체 칼럼 <span aria-hidden>›</span>
        </Link>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#E6DFD2] bg-[#FFFEFA]">
        {isLoading ? (
          <div className="px-4 py-8">
            <LoadingSpinner label="칼럼 불러오는 중..." />
          </div>
        ) : error ? (
          <div className="px-4 py-5 text-center text-sm text-muted">
            <p>칼럼을 불러오지 못했어요.</p>
            <button type="button" onClick={() => void refetch()} className="mt-1 min-h-11 rounded-lg px-3 font-semibold text-primary">다시 시도</button>
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted">등록된 칼럼이 없습니다.</p>
        ) : (
          items.map((item, index) => (
            <Link
              key={item.id}
              href={`/contents/${item.id}`}
              className={cn(
                'group flex items-start gap-3 px-4 py-4 transition-colors hover:bg-[#F0F5EF] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary',
                index > 0 && 'border-t border-[#E6DFD2]',
              )}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                  <span className="rounded-md bg-[#EDF4F0] px-2 py-0.5 font-bold text-primary">{item.category || '칼럼'}</span>
                  <span>약 {estimateReadMinutes(item.content)}분 읽기</span>
                </div>
                <h3 className="mt-1.5 break-words text-[15px] font-bold leading-snug text-ink group-hover:text-primary">
                  {item.title}
                </h3>
                <p className="mt-1 line-clamp-2 break-words text-[13px] leading-relaxed text-muted">{getContentPreview(item.content, 110)}</p>
              </div>
              {item.imageUrl && <img src={item.imageUrl} alt="" loading="lazy" className="mt-1 h-[64px] w-[64px] shrink-0 rounded-xl object-cover" />}
              <span className="self-center text-lg text-primary" aria-hidden>›</span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
