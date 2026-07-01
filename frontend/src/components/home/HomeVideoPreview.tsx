'use client';

import Link from 'next/link';
import { useVideos } from '@/hooks/useVideos';
import { getVideoThumbnail } from '@/domain/video/types';
import { formatRelativeTimeMedia } from '@/domain/common/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type HomeVideoPreviewProps = {
  maxItems?: number;
  className?: string;
};

export function HomeVideoPreview({ maxItems = 2, className }: HomeVideoPreviewProps) {
  const { videoPage, isLoading } = useVideos(maxItems);
  const items = videoPage.content.slice(0, maxItems);

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
              <rect x="3" y="6" width="18" height="12" rx="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 9.5v5l4.5-2.5L10 9.5Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
          <h2 className="font-display text-base font-bold text-[#1E2621]">영상</h2>
        </div>
        <Link
          href="/videos"
          className="text-[11px] font-medium text-[#8A9089] transition-colors hover:text-[#0B3B36]"
        >
          더보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner label="영상 불러오는 중..." />
      ) : items.length === 0 ? (
        <p className="text-sm text-[#8A9089]">등록된 영상이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((video) => (
            <li key={video.id}>
              <Link href={`/videos/${video.id}`} className="group flex gap-3">
                <div className="relative h-[4.5rem] w-[5.5rem] shrink-0 overflow-hidden rounded-xl bg-[#04342C]">
                  <img
                    src={getVideoThumbnail(video)}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20" />
                  <span className="absolute inset-0 flex items-center justify-center text-[11px] text-white/90">
                    ▶
                  </span>
                </div>
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="line-clamp-2 text-[13.5px] font-semibold leading-snug text-[#1E2621] group-hover:text-[#0B3B36]">
                    {video.title}
                  </p>
                  <p className="mt-1.5 text-[10.5px] text-[#8A9089]">
                    YouTube · {formatRelativeTimeMedia(video.createdAt)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
