'use client';

import Link from 'next/link';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useVideos } from '@/hooks/useVideos';
import { TopBar } from '@/components/layout/TopBar';
import { PostCard } from '@/components/community/PostCard';
import { Card } from '@/components/ui/Card';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { findBoardByType } from '@/domain/board/types';
import { getVideoThumbnail } from '@/domain/video/types';

export default function LoungePage() {
  const { boards, isLoading: boardsLoading } = useBoards();
  const supportBoard = findBoardByType(boards, 'SUPPORT');
  const { postPage, isLoading: postsLoading } = usePostList(supportBoard?.id ?? null, 5);
  const { videoPage, isLoading: videosLoading } = useVideos(6);

  return (
    <>
      <TopBar title="평온라운지" />
      <div className="px-4 py-5">
        <section className="mb-8 rounded-3xl bg-cream px-5 py-6">
          <h2 className="text-lg font-semibold text-cream-foreground">오늘의 위로</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            서로의 이야기에 공감하고, 잠시 숨을 고를 수 있는 공간입니다.
            부담 없이 마음을 나눠 보세요.
          </p>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-semibold text-cream-foreground">위로/응원 이야기</h3>
            {supportBoard && (
              <Link href={`/community/${supportBoard.id}`} className="text-sm text-primary">
                더 보기
              </Link>
            )}
          </div>
          {boardsLoading || postsLoading ? (
            <LoadingSpinner />
          ) : !supportBoard ? (
            <EmptyState title="위로 게시판을 찾을 수 없습니다" />
          ) : postPage.content.length === 0 ? (
            <EmptyState title="아직 글이 없습니다" description="첫 위로의 말을 남겨 보세요." />
          ) : (
            postPage.content.map((post) => <PostCard key={post.id} post={post} />)
          )}
        </section>

        <section className="mt-8">
          <h3 className="mb-3 font-semibold text-cream-foreground">마음을 다스리는 영상</h3>
          {videosLoading ? (
            <LoadingSpinner label="영상 불러오는 중…" />
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videoPage.content.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Card className="p-2">
                    <img
                      src={getVideoThumbnail(video)}
                      alt={video.title}
                      className="aspect-video w-full rounded-xl object-cover"
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-medium text-cream-foreground">
                      {video.title}
                    </p>
                  </Card>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
