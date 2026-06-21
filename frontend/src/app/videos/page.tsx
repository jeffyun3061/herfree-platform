'use client';

import { useMemo } from 'react';
import type { Video } from '@/domain/video/types';
import { useVideos } from '@/hooks/useVideos';
import { VIDEO_PUBLIC_LIST_SIZE } from '@/domain/video/types';
import { VideoCard, VideoCardSkeleton } from '@/components/video/VideoCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getErrorMessage } from '@/lib/api/client';

/** 2열·3열 그리드 모두 마지막 줄이 비지 않도록 같은 영상으로 채운다 */
function padGridVideos(videos: Video[]): Video[] {
  if (videos.length === 0) return videos;
  const filler = videos[0];
  const padded = [...videos];
  while (padded.length % 2 !== 0 || padded.length % 3 !== 0) {
    padded.push(filler);
  }
  return padded;
}

export default function VideosPage() {
  const { videoPage, isLoading, error } = useVideos(VIDEO_PUBLIC_LIST_SIZE);

  const { heroVideo, gridVideos, displayGridVideos } = useMemo(() => {
    const videos = videoPage.content;
    if (videos.length === 0) {
      return { heroVideo: null, gridVideos: [] as Video[], displayGridVideos: [] as Video[] };
    }
    const featured = videos.find((video) => video.isFeatured);
    const hero = featured ?? videos[0];
    const rest = videos.filter((video) => video.id !== hero.id);
    return {
      heroVideo: hero,
      gridVideos: rest,
      displayGridVideos: padGridVideos(rest),
    };
  }, [videoPage.content]);

  return (
    <>
      <div className="page-container mx-auto max-w-content pb-28 lg:pb-10">
        <div className="mb-6 flex items-start justify-between gap-3">
          <div>
            <h1 className="section-heading">헤르프리 영상</h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              마음을 다스리고 위로를 받을 수 있는 영상을 모았습니다.
            </p>
          </div>
          <div className="hidden shrink-0 lg:block">
            <AdminPublishLink tab="videos" label="영상 등록" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-5">
            <VideoCardSkeleton variant="featured" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
              {[1, 2, 3].map((i) => (
                <VideoCardSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : error ? (
          <ErrorMessage message={getErrorMessage(error)} />
        ) : videoPage.content.length === 0 ? (
          <EmptyState
            title="등록된 영상이 없습니다"
            description="곧 마음을 위로하는 영상이 준비될 예정입니다."
          />
        ) : (
          <div className="space-y-6">
            {heroVideo ? <VideoCard video={heroVideo} variant="featured" /> : null}

            {gridVideos.length > 0 && (
              <section>
                <div className="mb-4">
                  <h2 className="font-display text-base font-bold text-ink lg:text-lg">더 보기</h2>
                  <p className="mt-1 text-xs text-muted">큐레이션된 영상을 이어서 만나보세요.</p>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-4">
                  {displayGridVideos.map((video, index) => (
                    <VideoCard key={`${video.id}-${index}`} video={video} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
      <AdminPublishFab tab="videos" label="영상 등록" />
    </>
  );
}
