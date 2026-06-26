'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchVideo } from '@/lib/api/videos';
import { PageHeader } from '@/components/layout/PageHeader';
import { VideoPlayerSection } from '@/components/video/VideoPlayerSection';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getErrorMessage } from '@/lib/api/client';

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = Number(params.videoId);

  const { data: video, isLoading, error } = useApiQuery(
    () => fetchVideo(videoId),
    [videoId],
  );

  if (isLoading) return <LoadingSpinner label="영상 불러오는 중…" />;

  if (error || !video) {
    return (
      <div className="px-4 py-6">
        <ErrorMessage message={error ? getErrorMessage(error) : '영상을 찾을 수 없습니다.'} />
        <Link href="/videos" className="mt-4 inline-block">
          <Button size="sm" variant="secondary">
            영상 목록으로
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="영상" showBack backHref="/videos" mobileOnly />
      <div className="page-container mx-auto max-w-content pb-20 lg:pb-8">
        <VideoPlayerSection youtubeVideoId={video.youtubeVideoId} title={video.title} />

        <article className="surface-card mt-6 p-5 lg:mt-8 lg:p-7">
          <div className="flex flex-wrap items-center gap-2">
            {video.isFeatured && <Badge variant="gold">추천 영상</Badge>}
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary/70">
              YouTube
            </span>
          </div>
          <h1 className="mt-3 font-display text-xl font-bold leading-snug text-ink lg:text-2xl">
            {video.title}
          </h1>
          {video.description ? (
            <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{video.description}</p>
          ) : (
            <p className="mt-4 text-sm text-muted">영상 설명이 준비 중입니다.</p>
          )}
          <div className="mt-6 flex flex-wrap gap-2 border-t border-border/60 pt-5">
            <Link href="/videos">
              <Button size="sm" variant="secondary">
                목록으로
              </Button>
            </Link>
          </div>
        </article>
      </div>
    </>
  );
}
