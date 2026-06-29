'use client';

import Link from 'next/link';
import type { Video } from '@/domain/video/types';
import { getVideoThumbnail, getVideoThumbGradient } from '@/domain/video/types';
import { formatRelativeTimeMedia } from '@/domain/common/format';
import { cn } from '@/lib/cn';

type VideoFeedCardProps = {
  video: Video;
  categoryLabel?: string | null;
};

function MetaDot() {
  return <span className="h-0.5 w-0.5 shrink-0 rounded-full bg-[#C7CECB]" aria-hidden />;
}

export function VideoFeedCard({ video, categoryLabel }: VideoFeedCardProps) {
  const thumbnail = getVideoThumbnail(video);
  const gradient = getVideoThumbGradient(video.id);

  return (
    <Link href={`/videos/${video.id}`} className="block">
      <article className="video-feed-card">
        <div className={cn('video-feed-card__thumb relative overflow-hidden', gradient)}>
          <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/25" />
          <span className="video-feed-card__play" aria-hidden>
            ▶
          </span>
        </div>
        <div className="video-feed-card__body">
          {categoryLabel ? (
            <span className="video-feed-card__tag">{categoryLabel}</span>
          ) : null}
          <h2 className="video-feed-card__title">{video.title}</h2>
          <div className="video-feed-card__meta">
            <span className="text-[#8B9590]">▶ YouTube</span>
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
    <div className="video-feed-card animate-pulse">
      <div className="aspect-[16/9] bg-[#E3E6E4]" />
      <div className="space-y-2 px-3.5 pb-3.5 pt-3">
        <div className="h-4 w-16 rounded-md bg-[#E3E6E4]" />
        <div className="h-4 w-full rounded bg-[#E3E6E4]" />
        <div className="h-3 w-32 rounded bg-[#E3E6E4]" />
      </div>
    </div>
  );
}
