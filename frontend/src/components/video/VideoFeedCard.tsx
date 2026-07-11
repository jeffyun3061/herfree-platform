'use client';

import Link from 'next/link';
import type { Video } from '@/domain/video/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { formatRelativeTimeMedia } from '@/domain/common/format';
import { cn } from '@/lib/cn';

type VideoFeedCardProps = {
  video: Video;
  categoryLabel?: string | null;
  featured?: boolean;
};

function MetaDot() {
  return <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#CBD0C7]" aria-hidden />;
}

function PlayBadge({ large = false }: { large?: boolean }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(7,37,31,.08)_0%,rgba(7,37,31,.42)_100%)]',
      )}
      aria-hidden
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-white/92 text-[#0B3B36] shadow-[0_8px_18px_-12px_rgba(0,0,0,.55)]',
          large ? 'h-[46px] w-[46px]' : 'h-10 w-10',
        )}
      >
        <svg
          viewBox="0 0 24 24"
          className={cn('ml-0.5', large ? 'h-5 w-5' : 'h-4 w-4')}
          fill="currentColor"
          aria-hidden
        >
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

export function VideoFeedCard({ video, categoryLabel, featured }: VideoFeedCardProps) {
  const thumbnail = getVideoThumbnail(video);
  const tagLabel = categoryLabel ?? 'YouTube';

  return (
    <Link href={`/videos/${video.id}`} className="block" aria-label={`${video.title} 영상 보기`}>
      <article
        className={cn(
          'overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_16px_34px_-24px_rgba(20,30,25,.24)]',
          featured && 'rounded-[20px] shadow-[0_1px_2px_rgba(20,30,25,.05),0_18px_38px_-24px_rgba(20,30,25,.28)]',
        )}
      >
        <div className={cn('relative overflow-hidden bg-[#0B3B36]', featured ? 'aspect-video' : 'aspect-video')}>
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading={featured ? 'eager' : 'lazy'}
          />
          <PlayBadge large={featured} />
          {featured && (
            <span className="absolute right-3 top-3 rounded-full bg-[#F0C778] px-2.5 py-1 text-[12px] font-extrabold text-[#07251F]">
              {video.isFeatured ? '추천 영상' : '최신 영상'}
            </span>
          )}
          {!featured && (
            <span className="absolute bottom-3 left-3 rounded-[7px] bg-white/90 px-2.5 py-1 text-[12px] font-extrabold text-[#04342C]">
              {tagLabel}
            </span>
          )}
        </div>
        <div className={cn('px-4 pb-4 pt-3.5', featured && 'px-4 pb-4 pt-3.5')}>
          {featured && (
            <span className="mb-1.5 inline-block rounded-[7px] bg-[#E1F5EE] px-2 py-0.5 text-[12px] font-semibold text-[#04342C]">
              {tagLabel}
            </span>
          )}
          <h2
            className={cn(
              'line-clamp-2 font-semibold leading-[1.45] tracking-[-0.01em] text-[#15201D]',
              featured ? 'text-[17px] font-extrabold' : 'text-[14.5px]',
            )}
          >
            {video.title}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px] hf-text-muted">
            <span>YouTube</span>
            <MetaDot />
            <span>{formatRelativeTimeMedia(video.createdAt)}</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export function VideoFeedCardSkeleton() {
  return (
    <div className="animate-pulse overflow-hidden rounded-[18px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_16px_34px_-24px_rgba(20,30,25,.24)]">
      <div className="aspect-video bg-[#E3E6E4]" />
      <div className="space-y-2 px-4 pb-4 pt-3.5">
        <div className="h-4 w-16 rounded-md bg-[#E3E6E4]" />
        <div className="h-4 w-full rounded bg-[#E3E6E4]" />
        <div className="h-3 w-32 rounded bg-[#E3E6E4]" />
      </div>
    </div>
  );
}
