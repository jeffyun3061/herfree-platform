'use client';

import { useMemo } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useBoards } from '@/hooks/useBoards';
import { VideoFeedCard, VideoFeedCardSkeleton } from '@/components/video/VideoFeedCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { InlineTopActions } from '@/components/layout/InlineTopActions';
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
      <div className="media-screen mx-auto max-w-app pb-24 lg:max-w-none">
        <div className="flex items-start justify-between gap-3 px-5 pt-7 lg:pt-8">
          <div className="min-w-0">
            <h1 className="hf-display text-[25px] font-extrabold leading-tight text-[#15201D]">헤르프리 영상</h1>
            <p className="mt-1.5 text-[12.5px] text-[#8B9590]">
              유튜브 채널에서 다뤄온 이야기들
            </p>
          </div>
          <InlineTopActions />
        </div>

        <div className="mx-5 mt-4 hidden items-start justify-end gap-3 lg:flex">
          <div className="shrink-0">
            <AdminPublishLink tab="videos" label="영상 등록" />
          </div>
        </div>

        {isLoading ? (
          <div className="mt-[18px] flex flex-col gap-3.5 px-5">
            {[1, 2, 3].map((i) => (
              <VideoFeedCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 pt-5"><ErrorMessage message={getErrorMessage(error)} /></div>
        ) : videoPage.content.length === 0 ? (
          <div className="px-5 pt-5">
            <EmptyState
              title="등록된 영상이 없습니다"
              description="곧 마음을 덜어주는 영상이 준비될 예정입니다."
            />
          </div>
        ) : (
          <div className="mt-[18px] space-y-4 px-5">
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
