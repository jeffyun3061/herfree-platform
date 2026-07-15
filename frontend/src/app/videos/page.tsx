'use client';

import { useMemo } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useBoards } from '@/hooks/useBoards';
import { VideoFeedCard, VideoFeedCardSkeleton } from '@/components/video/VideoFeedCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { getErrorMessage } from '@/lib/api/client';
import { Pagination } from '@/components/common/Pagination';

export default function VideosPage() {
  const { videoPage, page, setPage, isLoading, error } = useVideos(12);
  const { boards } = useBoards();

  const boardNameById = useMemo(() => {
    const map = new Map<number, string>();
    boards.forEach((board) => map.set(board.id, board.name.replace(/게시판/, '')));
    return map;
  }, [boards]);

  const featuredVideoId = useMemo(() => {
    if (page !== 0) return null;
    if (videoPage.content.length === 0) return null;
    const featured = videoPage.content.find((video) => video.isFeatured);
    if (featured) return featured.id;
    return videoPage.content.reduce((latest, video) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const videoTime = new Date(video.createdAt).getTime();
      return videoTime > latestTime ? video : latest;
    }, videoPage.content[0]).id;
  }, [page, videoPage.content]);

  const featuredVideo = useMemo(() => {
    if (featuredVideoId == null) return null;
    return videoPage.content.find((video) => video.id === featuredVideoId) ?? null;
  }, [featuredVideoId, videoPage.content]);

  const restVideos = useMemo(
    () => videoPage.content.filter((video) => video.id !== featuredVideoId),
    [featuredVideoId, videoPage.content],
  );

  return (
    <>
      <div className="media-screen mx-auto max-w-app pb-24 lg:max-w-none">
        <ScreenHeader
          title="헤르프리 영상"
          subtitle="유튜브 채널에서 다뤄온 이야기들"
          titleClassName="font-semibold text-[#15201D]"
        />

        <div className="mx-5 mt-4 hidden items-start justify-end gap-3 lg:flex">
          <AdminPublishLink tab="videos" label="영상 등록" />
        </div>

        {!isLoading && !error && videoPage.content.length > 0 && (
          <p className="px-5 pt-[18px] text-[11.5px] text-[#9A9F94]">
            총 {videoPage.totalElements.toLocaleString('ko-KR')}개의 영상
          </p>
        )}

        {isLoading ? (
          <div className="mt-[14px] flex flex-col gap-3.5 px-5">
            {[1, 2, 3].map((i) => (
              <VideoFeedCardSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="px-5 pt-5">
            <ErrorMessage message={getErrorMessage(error)} />
          </div>
        ) : videoPage.content.length === 0 ? (
          <div className="px-5 pt-5">
            <EmptyState
              title="등록된 영상이 없습니다"
              description="곧 마음을 덜어주는 영상이 준비될 예정입니다."
            />
          </div>
        ) : (
          <div className="mx-auto mt-[14px] max-w-app space-y-3.5 px-5">
            {featuredVideo && (
              <VideoFeedCard
                video={featuredVideo}
                featured
                categoryLabel={
                  featuredVideo.relatedBoardId != null
                    ? boardNameById.get(featuredVideo.relatedBoardId) ?? null
                    : null
                }
              />
            )}
            {restVideos.length > 0 && (
              <div className="flex flex-col gap-3.5">
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

        <div className="px-5">
          <Pagination page={page} totalPages={videoPage.totalPages} onPageChange={setPage} />
        </div>
      </div>
      <AdminPublishFab tab="videos" label="영상 등록" />
    </>
  );
}
