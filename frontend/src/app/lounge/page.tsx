'use client';

import Link from 'next/link';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useVideos } from '@/hooks/useVideos';
import { TopBar } from '@/components/layout/TopBar';
import { PostListHeader, PostListRow } from '@/components/community/PostListRow';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import { findBoardByType } from '@/domain/board/types';
import { getVideoThumbnail } from '@/domain/video/types';

export default function LoungePage() {
  const { boards, isLoading: boardsLoading } = useBoards();
  const supportBoard = findBoardByType(boards, 'SUPPORT');
  const { postPage, isLoading: postsLoading } = usePostList(supportBoard?.id ?? null, 5);
  const { videoPage, isLoading: videosLoading } = useVideos(6);

  return (
    <>
      <TopBar title="평온라운지" className="lg:hidden" />
      <div className="page-container pb-8">
        <p className="mb-6 text-sm leading-relaxed text-muted">
          잠시 숨을 고르고, 위로와 응원을 나누는 공간입니다.
        </p>

        <section>
          <div className="mb-3 flex items-end justify-between">
            <h3 className="text-base font-semibold text-cream-foreground">위로·응원 이야기</h3>
            {supportBoard && (
              <Link href={`/community/${supportBoard.id}`} className="text-xs font-medium text-primary">
                전체 보기
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-2xl border border-border/80 bg-card">
            <PostListHeader />
            {boardsLoading || postsLoading ? (
              <div className="py-6">
                <LoadingSpinner />
              </div>
            ) : !supportBoard ? (
              <div className="p-4">
                <EmptyState title="위로 게시판을 찾을 수 없습니다" />
              </div>
            ) : postPage.content.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="아직 글이 없습니다"
                  description="첫 위로의 말을 남겨 보세요."
                  action={
                    <Link href={`/community/write?boardId=${supportBoard.id}`}>
                      <Button size="sm">글쓰기</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              postPage.content.map((post, index) => (
                <PostListRow
                  key={post.id}
                  post={post}
                  rowNumber={postPage.content.length - index}
                />
              ))
            )}
          </div>
        </section>

        <section className="mt-8">
          <h3 className="mb-3 text-base font-semibold text-cream-foreground">마음을 다스리는 영상</h3>
          {videosLoading ? (
            <LoadingSpinner label="영상 불러오는 중…" />
          ) : videoPage.content.length === 0 ? (
            <p className="text-sm text-muted">등록된 영상이 없습니다.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {videoPage.content.map((video) => (
                <a
                  key={video.id}
                  href={video.youtubeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden rounded-2xl border border-border/80 bg-card transition-shadow hover:shadow-md"
                >
                  <img
                    src={getVideoThumbnail(video)}
                    alt={video.title}
                    className="aspect-video w-full object-cover"
                  />
                  <p className="line-clamp-2 p-2.5 text-xs font-medium text-cream-foreground">
                    {video.title}
                  </p>
                </a>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
