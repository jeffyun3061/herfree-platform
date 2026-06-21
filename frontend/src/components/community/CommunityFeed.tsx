'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { BoardTabBar } from '@/components/community/BoardTabBar';
import { CommunityFab } from '@/components/community/CommunityFab';
import { CommunitySortTabs, postSortToQuery, type PostSortOption } from '@/components/community/CommunitySortTabs';
import { PostCard, PostCardSkeleton } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getWritableBoards, findBoardByType, isStaffOnlyBoardType } from '@/domain/board/types';
import { getCommunityBoards } from '@/domain/board/privateBoard';
import { getErrorMessage } from '@/lib/api/client';
import { FlowGuideBanner } from '@/components/ui/FlowGuideBanner';

type CommunityFeedProps = {
  initialBoardId?: number | null;
};

export function CommunityFeed({ initialBoardId = null }: CommunityFeedProps) {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState<PostSortOption>('latest');

  const { postPage, page, setPage, isLoading, error } = usePostList(
    selectedBoardId,
    15,
    keyword,
    postSortToQuery(sort),
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

  const handleSortChange = (value: PostSortOption) => {
    setSort(value);
    setPage(0);
  };

  const selectedBoard =
    selectedBoardId !== null ? boards.find((board) => board.id === selectedBoardId) : null;
  const isNoticeBoard = selectedBoard?.boardType === 'NOTICE';
  const isStaffOnlyBoard =
    selectedBoard !== null && selectedBoard !== undefined && isStaffOnlyBoardType(selectedBoard.boardType);

  const canCommunityWrite =
    isLoggedIn &&
    !isStaffOnlyBoard &&
    (selectedBoardId === null
      ? getWritableBoards(boards).length > 0
      : getWritableBoards(boards).some((b) => b.id === selectedBoardId));

  const writeHref =
    selectedBoardId !== null && canCommunityWrite
      ? `/community/write?boardId=${selectedBoardId}`
      : '/community/write';

  const loginHref = `/login?from=${encodeURIComponent(writeHref)}`;

  const symptomBoard = findBoardByType(boards, 'SYMPTOM');
  const isSymptomBoard = symptomBoard != null && selectedBoardId === symptomBoard.id;

  const isLoadingAll = boardsLoading || isLoading;
  const listError = boardsError ?? error;

  return (
    <div className="page-container pb-28 lg:pb-10">
      <div className="mb-6 hidden lg:block">
        <h1 className="section-heading">커뮤니티</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          자유롭게 소통하고 정보를 나누는 공간입니다. 익명으로 안전하게 이야기를 나눠 보세요.
        </p>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <svg
            viewBox="0 0 24 24"
            className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="M20 20l-3-3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            placeholder="제목, 내용으로 검색"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSearch();
            }}
            className="community-search"
          />
        </div>
        <Button type="button" size="sm" onClick={handleSearch} className="shrink-0">
          검색
        </Button>
      </div>

      {!isNoticeBoard && (
        <FlowGuideBanner
          className="mb-4"
          title="익명으로 이야기 나누는 공간"
          description="글과 댓글은 커뮤니티에 공개됩니다. 나만 보는 재발·루틴 기록은 개인 일지를 이용해 주세요."
          link={{ href: '/journal', label: '개인 일지로 비공개 기록하기' }}
        />
      )}

      {isSymptomBoard && (
        <FlowGuideBanner
          className="mb-4"
          variant="accent"
          title="증상 기록방 — 공개 게시판"
          description="다른 회원과 경험을 나누는 공간입니다. 매일의 루틴·재발 패턴을 혼자 관리하려면 개인 일지가 더 적합합니다."
          link={{ href: '/journal', label: '개인 일지 열기' }}
        />
      )}

      {!boardsLoading && boards.length > 0 && (
        <div className="mb-4">
          <BoardTabBar
            boards={getCommunityBoards(boards)}
            selectedBoardId={selectedBoardId}
            onSelect={handleBoardSelect}
          />
        </div>
      )}

      <div className="mb-4">
        <CommunitySortTabs value={sort} onChange={handleSortChange} />
        {sort === 'comments' && (
          <p className="mt-2 text-[11px] text-muted">
            댓글 수 정렬은 준비 중입니다. 현재는 최신순으로 표시됩니다.
          </p>
        )}
      </div>

      <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">
        {isNoticeBoard ? (
          <AdminPublishLink tab="notices" label="공지 올리기" />
        ) : canCommunityWrite ? (
          <Link href={writeHref}>
            <Button size="sm">글쓰기</Button>
          </Link>
        ) : !isLoggedIn ? (
          <Link href={loginHref}>
            <Button size="sm" variant="secondary">
              로그인 후 글쓰기
            </Button>
          </Link>
        ) : null}
      </div>

      {isLoadingAll && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <PostCardSkeleton key={i} />
          ))}
        </div>
      )}

      {listError && (
        <div className="py-4">
          <ErrorMessage message={getErrorMessage(listError)} />
        </div>
      )}

      {!isLoadingAll && !listError && postPage.content.length === 0 && (
        <div className="py-8">
          <EmptyState
            title={keyword ? '검색 결과가 없습니다' : '글이 없습니다'}
            description={
              keyword
                ? '다른 검색어로 다시 시도해 보세요.'
                : isNoticeBoard
                  ? '등록된 공지가 없습니다.'
                  : '첫 이야기를 남겨 보세요.'
            }
            action={
              !isNoticeBoard && canCommunityWrite ? (
                <Link href={writeHref}>
                  <Button size="sm">글쓰기</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {!isLoadingAll && !listError && postPage.content.length > 0 && (
        <div className="space-y-3">
          {postPage.content.map((post) => (
            <PostCard key={post.id} post={post} boardName={post.boardName} />
          ))}
        </div>
      )}

      {!isLoadingAll && !listError && postPage.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
        </div>
      )}

      {canCommunityWrite && <CommunityFab href={writeHref} />}
      {!canCommunityWrite && !isLoggedIn && !isStaffOnlyBoard && (
        <CommunityFab href={loginHref} className="opacity-90" />
      )}
      {isNoticeBoard && <AdminPublishFab tab="notices" label="공지 올리기" />}
    </div>
  );
}
