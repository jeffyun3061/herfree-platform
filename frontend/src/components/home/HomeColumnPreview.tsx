'use client';

import Link from 'next/link';
import { useContentList } from '@/hooks/useContents';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type HomeColumnPreviewProps = {
  maxItems?: number;
  className?: string;
};

const THUMB_OVERLAYS = [
  'linear-gradient(180deg, rgba(20,40,44,.12) 0%, rgba(9,32,30,.55) 100%)',
  'linear-gradient(180deg, rgba(46,34,14,.12) 0%, rgba(74,47,16,.55) 100%)',
  'linear-gradient(180deg, rgba(50,20,14,.12) 0%, rgba(74,24,16,.55) 100%)',
] as const;

const THUMB_POSITIONS = ['50% 20%', '50% 40%', '50% 60%'] as const;

export function HomeColumnPreview({ maxItems = 3, className }: HomeColumnPreviewProps) {
  const { contentPage, isLoading } = useContentList(undefined, maxItems);
  const items = contentPage.content.slice(0, maxItems);

  return (
    <section className={cn('flex flex-col gap-3', className)}>
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#1E2621]">추천 칼럼</h2>
        <Link href="/contents" className="text-[12.5px] font-semibold text-[#15695E]">
          더보기 ›
        </Link>
      </div>

      <div className="overflow-hidden rounded-[18px] border border-[#EADFCB] bg-[#FBF6EA] shadow-[0_14px_32px_-26px_rgba(7,37,31,.4)]">
        {isLoading ? (
          <div className="px-4 py-8">
            <LoadingSpinner label="칼럼 불러오는 중..." />
          </div>
        ) : items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#8A9089]">등록된 칼럼이 없습니다.</p>
        ) : (
          items.map((item, index) => (
            <Link
              key={item.id}
              href={`/contents/${item.id}`}
              className={cn(
                'group flex items-center gap-3.5 px-4 py-3.5 transition-opacity hover:opacity-90',
                index > 0 && 'border-t border-[#EFE6D5]',
              )}
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl">
                <img
                  src={item.imageUrl ?? PUBLIC_IMAGES.journalDashboardCard}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ objectPosition: THUMB_POSITIONS[index % THUMB_POSITIONS.length] }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: THUMB_OVERLAYS[index % THUMB_OVERLAYS.length] }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[#15695E]">{item.category}</p>
                <p className="mt-1 line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1E2621] group-hover:text-[#0B3B36]">
                  {item.title}
                </p>
              </div>
              <span className="shrink-0 text-[#CBD0C7]" aria-hidden>
                ›
              </span>
            </Link>
          ))
        )}
      </div>
    </section>
  );
}
