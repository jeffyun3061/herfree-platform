'use client';

import Link from 'next/link';
import { useContentList } from '@/hooks/useContents';
import { getContentPreview } from '@/domain/content/types';
import { formatDate } from '@/domain/common/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type HomeColumnPreviewProps = {
  maxItems?: number;
  className?: string;
};

export function HomeColumnPreview({ maxItems = 3, className }: HomeColumnPreviewProps) {
  const { contentPage, isLoading } = useContentList(undefined, maxItems);
  const items = contentPage.content.slice(0, maxItems);

  return (
    <section
      className={cn(
        'rounded-[1.25rem] border border-[#ECE5D8] bg-white px-4 py-4 shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)] sm:px-5 sm:py-5',
        className,
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[#0B3B36]" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" strokeLinecap="round" strokeLinejoin="round" />
              <path
                d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="font-display text-base font-bold text-[#1E2621]">칼럼</h2>
        </div>
        <Link
          href="/contents"
          className="text-[11px] font-medium text-[#8A9089] transition-colors hover:text-[#0B3B36]"
        >
          더보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner label="칼럼 불러오는 중..." />
      ) : items.length === 0 ? (
        <p className="text-sm text-[#8A9089]">등록된 칼럼이 없습니다.</p>
      ) : (
        <ul>
          {items.map((item, index) => (
            <li key={item.id} className={cn(index > 0 && 'border-t border-[#F2ECE1]')}>
              <Link href={`/contents/${item.id}`} className="group block py-3">
                <span className="text-[10px] font-semibold text-[#15695E]">{item.category}</span>
                <p className="mt-1 line-clamp-1 text-[13.5px] font-semibold text-[#1E2621] group-hover:text-[#0B3B36]">
                  {item.title}
                </p>
                <p className="mt-0.5 line-clamp-2 text-[12px] leading-snug text-[#5C645A]">
                  {getContentPreview(item.content, 80)}
                </p>
                <p className="mt-1 text-[10px] text-[#B4B2A6]">{formatDate(item.createdAt)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
