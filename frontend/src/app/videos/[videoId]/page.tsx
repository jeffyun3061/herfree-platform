'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApiQuery';
import { fetchVideo } from '@/lib/api/videos';
import { TopBar } from '@/components/layout/TopBar';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
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
      <TopBar title="영상" showBack backHref="/videos" />
      <div className="page-container pb-8">
        <div className="overflow-hidden rounded-2xl border border-border/80 bg-black">
          <div className="relative aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${video.youtubeVideoId}`}
              title={video.title}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>
        <h1 className="mt-4 text-lg font-semibold text-cream-foreground">{video.title}</h1>
        {video.description && (
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">
            {video.description}
          </p>
        )}
      </div>
    </>
  );
}
