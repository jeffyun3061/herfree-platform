'use client';

import Link from 'next/link';
import { useVideos } from '@/hooks/useVideos';
import { VIDEO_PUBLIC_LIST_SIZE, getVideoThumbnail } from '@/domain/video/types';
import { TopBar } from '@/components/layout/TopBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { AdminPublishLink } from '@/components/admin/AdminPublishLink';

export default function VideosPage() {
  const { videoPage, isLoading } = useVideos(VIDEO_PUBLIC_LIST_SIZE);

  return (
    <>
      <TopBar title="영상" className="lg:hidden" />
      <div className="page-container pb-8">
        <div className="mb-6 flex items-start justify-between gap-3">
          <p className="text-sm leading-relaxed text-muted">
            마음을 다스리고 위로를 받을 수 있는 영상을 모았습니다.
          </p>
          <AdminPublishLink tab="videos" label="영상 등록" />
        </div>

        {isLoading ? (
          <LoadingSpinner label="영상 불러오는 중…" />
        ) : videoPage.content.length === 0 ? (
          <EmptyState title="등록된 영상이 없습니다" />
        ) : (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
            {videoPage.content.map((video) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md"
              >
                <img
                  src={getVideoThumbnail(video)}
                  alt={video.title}
                  className="aspect-video w-full object-cover"
                />
                <p className="line-clamp-2 p-2.5 text-xs font-medium text-cream-foreground lg:text-sm">
                  {video.title}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
