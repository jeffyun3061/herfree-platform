'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { useAuth } from '@/hooks/useAuth';
import { TopBar } from '@/components/layout/TopBar';
import { BoardBanner } from '@/components/community/BoardListItem';
import { PostCard } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { getWritableBoards } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';

export default function BoardPostsPage() {
  const params = useParams();
  const boardId = Number(params.boardId);
  const { boards } = useBoards();
  const { isLoggedIn } = useAuth();
  const { postPage, page, setPage, isLoading, error } = usePostList(boardId);

  const board = boards.find((b) => b.id === boardId);
  const canWrite =
    isLoggedIn && board && getWritableBoards(boards).some((b) => b.id === boardId);

  return (
    <>
      <TopBar
        title={board?.name ?? '게시판'}
        showBack
        rightSlot={
          canWrite ? (
            <Link href={`/community/write?boardId=${boardId}`}>
              <Button size="sm">글쓰기</Button>
            </Link>
          ) : undefined
        }
      />
      <div className="page-container">
        {board && <BoardBanner board={board} />}
        {isLoading && <LoadingSpinner />}
        {error && <ErrorMessage message={getErrorMessage(error)} />}
        {!isLoading && !error && postPage.content.length === 0 && (
          <EmptyState
            title="아직 글이 없습니다"
            description="첫 번째 이야기를 남겨 보세요."
            action={
              canWrite ? (
                <Link href={`/community/write?boardId=${boardId}`}>
                  <Button>글쓰기</Button>
                </Link>
              ) : undefined
            }
          />
        )}
        {postPage.content.map((post) => (
          <PostCard key={post.id} post={post} boardName={post.boardName} />
        ))}
        <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}
