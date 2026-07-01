'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { BoardTabBar } from '@/components/community/BoardTabBar';
import { CommunityFab } from '@/components/community/CommunityFab';
import { CommunityPageSizeSelect, type CommunityPageSize } from '@/components/community/CommunityPageSizeSelect';
import { CommunitySortTabs, CommunityPeriodToggle, postSortToQuery, type PostListPeriod, type PostSortOption } from '@/components/community/CommunitySortTabs';
import { needsPostListPeriod, postListPeriodHint, postListPeriodQuery } from '@/domain/post/sort';
import { PostCard, PostCardSkeleton } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { CommunityGuestPostPanel } from '@/components/community/CommunityGuestPostPanel';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getWritableBoards, isStaffOnlyBoardType } from '@/domain/board/types';
import { getCommunityBoards, getCommunityBoardTabLabel, isSecretStoryBoardType, SECRET_STORY_BOARD_COPY } from '@/domain/board/privateBoard';
import { validatePostSearchKeyword } from '@/domain/post/search';
import { isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';

type CommunityFeedProps = {
  initialBoardId?: number | null;
};

export function CommunityFeed({ initialBoardId = null }: CommunityFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, isReady, user } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [sort, setSort] = useState<PostSortOption>('latest');
  const [period, setPeriod] = useState<PostListPeriod>('week');
  const [pageSize, setPageSize] = useState<CommunityPageSize>(20);

  const { postPage, page, setPage, isLoading, error } = usePostList(
    selectedBoardId,
    pageSize,
    keyword,
    postSortToQuery(sort),
    postListPeriodQuery(sort, period),
    { enabled: isReady && isLoggedIn },
  );

  const communityBoards = useMemo(() => getCommunityBoards(boards), [boards]);

  useEffect(() => {
    if (boardsLoading || communityBoards.length === 0) return;

    const isValidSelection =
      selectedBoardId !== null && communityBoards.some((board) => board.id === selectedBoardId);

    if (isValidSelection) return;

    const defaultBoard = communityBoards[0];
    setSelectedBoardId(defaultBoard.id);
    setPage(0);
    router.replace(`/community/${defaultBoard.id}`);
  }, [boardsLoading, communityBoards, selectedBoardId, router, setPage]);

  useEffect(() => {
    setSelectedBoardId(initialBoardId);
    setPage(0);
  }, [initialBoardId, setPage]);

  useEffect(() => {
    const q = searchParams.get('q')?.trim();
    if (q) {
      const hint = validatePostSearchKeyword(q);
      setSearchInput(q);
      if (hint) {
        setSearchHint(hint);
        setKeyword('');
      } else {
        setSearchHint(null);
        setKeyword(q);
        setPage(0);
      }
    }
    if (searchParams.get('focus') === 'search') {
      const timer = window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
        searchInputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }, 80);
      return () => window.clearTimeout(timer);
    }
    return undefined;
  }, [searchParams, setPage]);

  const handleBoardSelect = (boardId: number) => {
    setSelectedBoardId(boardId);
    setPage(0);
    router.push(`/community/${boardId}`);
  };

  const handleSearch = () => {
    if (!isLoggedIn) return;
    const hint = validatePostSearchKeyword(searchInput);
    if (hint) {
      setSearchHint(hint);
      return;
    }
    setSearchHint(null);
    setKeyword(searchInput.trim());
    setPage(0);
  };

  const handleSortChange = (value: PostSortOption) => {
    setSort(value);
    setPage(0);
  };

  const handlePeriodChange = (value: PostListPeriod) => {
    setPeriod(value);
    setPage(0);
  };

  const handlePageSizeChange = (size: CommunityPageSize) => {
    setPageSize(size);
    setPage(0);
  };

  const periodHint = postListPeriodHint(sort, period);

  const selectedBoard =
    selectedBoardId !== null ? boards.find((board) => board.id === selectedBoardId) : null;
  const isNoticeBoard = selectedBoard?.boardType === 'NOTICE';
  const isSecretStoryBoard = selectedBoard != null && isSecretStoryBoardType(selectedBoard.boardType);
  const staffUser = isStaff(user?.role);
  const isStaffOnlyBoard =
    selectedBoard !== null && selectedBoard !== undefined && isStaffOnlyBoardType(selectedBoard.boardType);

  const canCommunityWrite =
    isLoggedIn &&
    !isStaffOnlyBoard &&
    !(isSecretStoryBoard && staffUser) &&
    (selectedBoardId === null
      ? getWritableBoards(boards).length > 0
      : getWritableBoards(boards).some((b) => b.id === selectedBoardId));

  const writeHref =
    selectedBoardId !== null && canCommunityWrite
      ? `/community/write?boardId=${selectedBoardId}`
      : '/community/write';

  const loginHref = `/login?from=${encodeURIComponent(writeHref)}`;

  const isLoadingAll = isLoggedIn && (boardsLoading || isLoading);
  const listError = isLoggedIn ? (boardsError ?? error) : null;
  const selectedBoardLabel = selectedBoard
    ? getCommunityBoardTabLabel(selectedBoard.boardType) ?? selectedBoard.name
    : undefined;

  if (!isReady) {
    return (
      <div className="page-container community-screen mx-auto flex min-h-[40vh] max-w-app items-center justify-center lg:max-w-none">
        <LoadingSpinner label="불러오는 중…" />
      </div>
    );
  }

  return (
    <div className="page-container community-screen mx-auto max-w-app lg:max-w-none">
      <div className="mb-4 lg:hidden">
        <h2 className="text-[19px] font-semibold text-[#15201D]">커뮤니티</h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-[#8B9590]">
          같은 경험을 가진 사람들의 이야기가 모이는 곳
        </p>
      </div>

      <div className="mb-4 hidden lg:block">
        <h1 className="section-heading">커뮤니티</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted">
          같은 경험을 가진 사람들의 이야기가 모이는 곳
        </p>
      </div>

      <div className="mb-4">
        <div className="flex gap-2">
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
            ref={searchInputRef}
            type="search"
            placeholder="두 글자 이상 검색"
            aria-label="게시글 검색"
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
        {searchHint && (
          <p className="mt-1.5 text-xs text-amber-700" role="status">
            {searchHint}
          </p>
        )}
      </div>

      {!boardsLoading && communityBoards.length > 0 && selectedBoardId !== null && (
        <div className="mb-4 min-w-0 overflow-hidden">
          <BoardTabBar
            boards={communityBoards}
            selectedBoardId={selectedBoardId}
            onSelect={handleBoardSelect}
          />
        </div>
      )}

      {!isLoggedIn ? (
        <div>
          <CommunityGuestPostPanel boardLabel={selectedBoardLabel} />
        </div>
      ) : (
        <>
      {isSecretStoryBoard && (
        <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
          <p className="text-sm font-semibold text-ink">{SECRET_STORY_BOARD_COPY.bannerTitle}</p>
          <p className="mt-1.5 text-xs leading-relaxed text-wrtn-muted">
            {SECRET_STORY_BOARD_COPY.bannerDescription}
          </p>
        </div>
      )}

      {!isLoadingAll && !listError && (
        <p className="mb-3 text-xs text-[#8B9590]">총 {postPage.totalElements.toLocaleString('ko-KR')}개</p>
      )}

      <div className="mb-4">
        <CommunitySortTabs value={sort} onChange={handleSortChange} />
        {needsPostListPeriod(sort) && (
          <div className="flex flex-wrap items-center justify-between gap-2">
            {periodHint && (
              <p className="text-xs text-muted" role="status">
                {periodHint}
              </p>
            )}
            <CommunityPeriodToggle value={period} onChange={handlePeriodChange} />
          </div>
        )}
      </div>

      <div className="mb-4 hidden items-center justify-end gap-2 lg:flex">
        {isNoticeBoard ? (
          <AdminPublishLink tab="notices" label="공지 올리기" />
        ) : canCommunityWrite ? (
          <Link href={writeHref}>
            <Button size="sm">글쓰기</Button>
          </Link>
        ) : null}
      </div>

      {isLoadingAll && (
        <div className="space-y-2">
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
        <div className="py-6">
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
        <div className="community-feed-list">
          {postPage.content.map((post) => (
            <PostCard key={post.id} post={post} boardName={post.boardName} />
          ))}
        </div>
      )}

      {!isLoadingAll && !listError && postPage.totalPages > 1 && (
        <div className="mt-2">
          <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
        </div>
      )}

      {!isLoadingAll && !listError && postPage.content.length > 0 && (
        <CommunityPageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
      )}

      {canCommunityWrite && <CommunityFab href={writeHref} />}
      {isNoticeBoard && <AdminPublishFab tab="notices" label="공지 올리기" />}
        </>
      )}
    </div>
  );
}
