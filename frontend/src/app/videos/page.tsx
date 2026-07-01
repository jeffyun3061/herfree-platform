'use client';

import { useMemo } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useBoards } from '@/hooks/useBoards';
import { VideoFeedCard, VideoFeedCardSkeleton } from '@/components/video/VideoFeedCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getErrorMessage } from '@/lib/api/client';

export default function VideosPage() {
  const { videoPage, isLoading, error } = useVideos(30);
  const { boards } = useBoards();

  const boardNameById = useMemo(() => {
    const map = new Map<number, string>();
    boards.forEach((board) => map.set(board.id, board.name.replace(/게시판/, '')));
    return map;
  }, [boards]);
  const latestVideoId = useMemo(() => {
    if (videoPage.content.length === 0) return null;
    return videoPage.content.reduce((latest, video) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const videoTime = new Date(video.createdAt).getTime();
      return videoTime > latestTime ? video : latest;
    }, videoPage.content[0]).id;
  }, [videoPage.content]);
  const latestVideo = useMemo(() => {
    if (latestVideoId == null) return null;
    return videoPage.content.find((video) => video.id === latestVideoId) ?? null;
  }, [latestVideoId, videoPage.content]);
  const restVideos = useMemo(
    () => videoPage.content.filter((video) => video.id !== latestVideoId),
    [latestVideoId, videoPage.content],
  );

  return (
    <>
      <div className="page-container media-screen mx-auto max-w-app lg:max-w-none">
        <div className="mb-1 lg:hidden">
          <p className="text-[19px] font-semibold text-[#15201D]">헤르프리 영상</p>
          <p className="mt-1 text-[12.5px] text-[#8B9590]">
            유튜브 채널에서 다뤄온 이야기들
          </p>
        </div>

        <div className="mb-6 hidden items-start justify-between gap-3 lg:flex">
          <div>
            <h1 className="section-heading">헤르프리 영상</h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              유튜브 채널에서 다뤄온 이야기들
            </p>
          </div>
          <div className="shrink-0">
            <AdminPublishLink tab="videos" label="영상 등록" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3.5">
            {[1, 2, 3].map((i) => (
              <VideoFeedCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <ErrorMessage message={getErrorMessage(error)} />
        ) : videoPage.content.length === 0 ? (
          <EmptyState
            title="등록된 영상이 없습니다"
            description="곧 마음을 덜어주는 영상이 준비될 예정입니다."
          />
        ) : (
          <div className="space-y-4">
            {latestVideo && (
              <VideoFeedCard
                video={latestVideo}
                featured
                categoryLabel={
                  latestVideo.relatedBoardId != null
                    ? boardNameById.get(latestVideo.relatedBoardId) ?? null
                    : null
                }
              />
            )}

            {restVideos.length > 0 && (
              <div className="grid gap-3.5 sm:grid-cols-2">
                {restVideos.map((video) => (
                  <VideoFeedCard
                    key={video.id}
                    video={video}
                    categoryLabel={
                      video.relatedBoardId != null
                        ? boardNameById.get(video.relatedBoardId) ?? null
                        : null
                    }
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      <AdminPublishFab tab="videos" label="영상 등록" />
    </>
  );
}
