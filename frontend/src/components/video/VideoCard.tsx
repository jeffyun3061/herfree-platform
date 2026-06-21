'use client';

import Link from 'next/link';
import type { Video } from '@/domain/video/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';

type VideoCardProps = {
  video: Video;
  variant?: 'grid' | 'featured';
  className?: string;
};

function PlayOverlay({ large = false }: { large?: boolean }) {
  return (
    <span
      className={cn(
        'pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/45 via-black/10 to-transparent opacity-90 transition-opacity group-hover:opacity-100',
      )}
    >
      <span
        className={cn(
          'flex items-center justify-center rounded-full bg-white/95 text-primary shadow-lg ring-4 ring-white/30',
          large ? 'h-14 w-14' : 'h-10 w-10',
        )}
      >
        <svg viewBox="0 0 24 24" className={cn('ml-0.5', large ? 'h-6 w-6' : 'h-4 w-4')} fill="currentColor">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </span>
  );
}

export function VideoCard({ video, variant = 'grid', className }: VideoCardProps) {
  const thumbnail = getVideoThumbnail(video);
  const isFeatured = variant === 'featured' || video.isFeatured;

  if (variant === 'featured') {
    return (
      <Link
        href={`/videos/${video.id}`}
        className={cn(
          'group block overflow-hidden rounded-shell border border-border/60 bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg',
          className,
        )}
      >
        <div className="flex flex-col lg:flex-row">
          <div className="relative aspect-video w-full shrink-0 overflow-hidden bg-black lg:w-[58%]">
            <img src={thumbnail} alt="" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" />
            <PlayOverlay large />
            {isFeatured && (
              <span className="absolute left-3 top-3">
                <Badge variant="gold">추천 영상</Badge>
              </span>
            )}
          </div>
          <div className="flex flex-1 flex-col justify-center p-5 lg:p-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">Featured</p>
            <h2 className="mt-2 line-clamp-2 font-display text-lg font-bold leading-snug text-ink lg:text-xl">
              {video.title}
            </h2>
            {video.description ? (
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{video.description}</p>
            ) : null}
            <p className="mt-4 text-xs font-medium text-primary">영상 보기 →</p>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/videos/${video.id}`}
      className={cn(
        'group block overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md',
        className,
      )}
    >
      <div className="relative aspect-video overflow-hidden bg-black">
        <img
          src={thumbnail}
          alt=""
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <PlayOverlay />
        {video.isFeatured && (
          <span className="absolute left-2 top-2">
            <Badge variant="gold" className="text-[10px]">
              추천
            </Badge>
          </span>
        )}
      </div>
      <div className="p-3 lg:p-3.5">
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-ink">{video.title}</p>
      </div>
    </Link>
  );
}

export function VideoCardSkeleton({ variant = 'grid' }: { variant?: 'grid' | 'featured' }) {
  if (variant === 'featured') {
    return (
      <div className="animate-pulse overflow-hidden rounded-shell border border-border/50 bg-card">
        <div className="flex flex-col lg:flex-row">
          <div className="aspect-video w-full bg-cream-dark lg:w-[58%]" />
          <div className="flex-1 space-y-3 p-5 lg:p-7">
            <div className="h-3 w-16 rounded bg-cream-dark" />
            <div className="h-6 w-full rounded bg-cream-dark" />
            <div className="h-4 w-4/5 rounded bg-cream-dark" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-pulse overflow-hidden rounded-2xl border border-border/50 bg-card">
      <div className="aspect-video bg-cream-dark" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-full rounded bg-cream-dark" />
        <div className="h-4 w-2/3 rounded bg-cream-dark" />
      </div>
    </div>
  );
}
