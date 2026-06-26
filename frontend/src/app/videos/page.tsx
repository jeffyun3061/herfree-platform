'use client';

import { useMemo } from 'react';
import { useVideos } from '@/hooks/useVideos';
import { useBoards } from '@/hooks/useBoards';
import { VideoFeedCard, VideoFeedCardSkeleton } from '@/components/video/VideoFeedCard';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getErrorMessage } from '@/lib/api/client';

export default function VideosPage() {
  const { videoPage, page, setPage, isLoading, error } = useVideos(10);
  const { boards } = useBoards();

  const boardNameById = useMemo(() => {
    const map = new Map<number, string>();
    boards.forEach((board) => map.set(board.id, board.name.replace(/방$/, '')));
    return map;
  }, [boards]);

  return (
    <>
      <div className="page-container mx-auto max-w-app pb-36 lg:max-w-content lg:pb-12">
        <div className="mb-4 lg:hidden">
          <p className="text-[22px] font-bold text-[#15201D]">영상</p>
          <p className="mt-1 text-[12.5px] text-[#8B9590]">헤르프리 채널에서 엄선한 이야기</p>
        </div>

        <div className="mb-6 hidden items-start justify-between gap-3 lg:flex">
          <div>
            <h1 className="section-heading">영상</h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
              헤르프리 채널에서 엄선한 이야기
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
          <>
            <div className="flex flex-col gap-3.5">
              {videoPage.content.map((video) => (
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
            <Pagination page={page} totalPages={videoPage.totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
      <AdminPublishFab tab="videos" label="영상 등록" />
    </>
  );
}
