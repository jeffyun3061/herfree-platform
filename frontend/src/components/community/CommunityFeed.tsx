'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { BoardTabBar } from '@/components/community/BoardTabBar';
import { PostCard } from '@/components/community/PostCard';
import { PostListHeader, PostListRow } from '@/components/community/PostListRow';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getWritableBoards } from '@/domain/board/types';
import { getErrorMessage } from '@/lib/api/client';

type CommunityFeedProps = {
  initialBoardId?: number | null;
};

export function CommunityFeed({ initialBoardId = null }: CommunityFeedProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const { postPage, page, setPage, isLoading, error } = usePostList(
    selectedBoardId,
    15,
    keyword,
  );

  useEffect(() => {
    setSelectedBoardId(initialBoardId);
    setPage(0);
  }, [initialBoardId, setPage]);

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
    setPage(0);
    router.push(boardId === null ? '/community' : `/community/${boardId}`);
  };

  const handleSearch = () => {
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const canWrite =
    isLoggedIn &&
    (selectedBoardId === null
      ? getWritableBoards(boards).length > 0
      : getWritableBoards(boards).some((b) => b.id === selectedBoardId));

  const writeHref =
    selectedBoardId !== null
      ? `/community/write?boardId=${selectedBoardId}`
      : '/community/write';

  const loginHref = `/login?from=${encodeURIComponent(writeHref)}`;

  const isLoadingAll = boardsLoading || isLoading;
  const listError = boardsError ?? error;

  return (
    <div className="page-container pb-24 lg:pb-10">
      <div className="mb-6 hidden lg:block">
        <h1 className="section-heading">커뮤니티</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          자유롭게 소통하고 정보를 나누는 공간입니다. 익명으로 안전하게 이야기를 나눠 보세요.
        </p>
      </div>
      <p className="mb-4 text-sm text-muted lg:hidden">
        자유롭게 소통하고 정보를 나누는 공간입니다.
      </p>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="제목으로 검색"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSearch();
          }}
          className="flex-1"
        />
        <Button variant="secondary" size="sm" onClick={handleSearch}>
          검색
        </Button>
      </div>

      {!boardsLoading && boards.length > 0 && (
        <BoardTabBar
          boards={boards}
          selectedBoardId={selectedBoardId}
          onSelect={handleBoardSelect}
        />
      )}

      <div className="mt-4 flex justify-end">
        {canWrite ? (
          <Link href={writeHref}>
            <Button size="sm">글쓰기</Button>
          </Link>
        ) : (
          <Link href={loginHref}>
            <Button size="sm" variant="secondary">
              로그인 후 글쓰기
            </Button>
          </Link>
        )}
      </div>

      {isLoadingAll && (
        <div className="mt-3 py-8">
          <LoadingSpinner label="글 목록 불러오는 중…" />
        </div>
      )}
      {listError && (
        <div className="mt-3 p-4">
          <ErrorMessage message={getErrorMessage(listError)} />
        </div>
      )}
      {!isLoadingAll && !listError && postPage.content.length === 0 && (
        <div className="mt-3 p-6">
          <EmptyState
            title="글이 없습니다"
            description="첫 이야기를 남겨 보세요."
            action={
              canWrite ? (
                <Link href={writeHref}>
                  <Button size="sm">글쓰기</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {!isLoadingAll && !listError && postPage.content.length > 0 && (
        <>
          <div className="mt-3 space-y-0 lg:hidden">
            {postPage.content.map((post) => (
              <PostCard key={post.id} post={post} boardName={post.boardName} />
            ))}
          </div>

          <div className="mt-3 hidden overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm lg:block">
            <PostListHeader />
            {postPage.content.map((post, index) => (
              <PostListRow
                key={post.id}
                post={post}
                rowNumber={postPage.totalElements - page * postPage.size - index}
              />
            ))}
          </div>
        </>
      )}

      {!isLoadingAll && !listError && postPage.totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
