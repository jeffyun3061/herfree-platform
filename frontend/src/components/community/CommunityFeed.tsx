'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';
import { usePostList } from '@/hooks/usePosts';
import { BoardTabBar } from '@/components/community/BoardTabBar';
import { CommunityFab } from '@/components/community/CommunityFab';
import { CommunityPageSizeSelect, type CommunityPageSize } from '@/components/community/CommunityPageSizeSelect';
import { CommunitySortTabs, CommunityPeriodToggle, postSortToQuery, type PostListPeriod, type PostSortOption } from '@/components/community/CommunitySortTabs';
import { needsPostListPeriod, postListPeriodHint, postListPeriodQuery } from '@/domain/post/sort';
import { PostCard, PostCardSkeleton } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { getWritableBoards, isStaffOnlyBoardType } from '@/domain/board/types';
import { getCommunityBoards, isSecretStoryBoardType } from '@/domain/board/privateBoard';
import { SecretStoryBoardBanner } from '@/components/community/SecretStoryBoardBanner';
import { validatePostSearchKeyword } from '@/domain/post/search';
import { isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';

type CommunityFeedProps = {
  initialBoardId?: number | null;
};

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function CommunityLockedPreview({
  memberCount,
}: {
  memberCount: number | null | undefined;
}) {
  const memberLine =
    memberCount && memberCount > 0
      ? `${memberCount.toLocaleString('ko-KR')}명의 회원과 함께하는`
      : '회원과 함께하는';

  return (
    <div className="hf-page-x pb-10">
      <section className="mt-[18px] overflow-hidden rounded-[18px] bg-white px-[18px] pt-[18px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_16px_34px_-24px_rgba(20,30,25,.22)]">
        <p className="mb-2 text-[12px] font-semibold text-[#15695E]">질문 · FAQ ›</p>
        <h3 className="mb-3 text-[16.5px] font-bold leading-[1.45] tracking-[-0.01em] text-[#1E2621]">
          오늘 받은 결과, 다들 어떻게 받아들이셨어요?
        </h3>
        <div className="flex items-center gap-[9px] border-b border-[#F0EADF] pb-3.5">
          <div className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[14px]">
            🌙
          </div>
          <div className="min-w-0">
            <p className="text-[12.5px] font-semibold text-[#2C342E]">새벽두시</p>
            <p className="mt-0.5 text-[12px] hf-text-muted">2026.06.26 13:03 · 조회 61</p>
          </div>
          <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-[12px] hf-text-muted">
            <ReplyIcon />
            댓글 0
          </span>
        </div>
        <div className="relative py-5 pb-[34px]">
          <div aria-hidden className="pointer-events-none select-none opacity-55 blur-[5px]">
            <div className="mb-[11px] h-[11px] w-[96%] rounded-md bg-[#E5DECF]" />
            <div className="mb-[11px] h-[11px] w-[88%] rounded-md bg-[#E5DECF]" />
            <div className="mb-[11px] h-[11px] w-[92%] rounded-md bg-[#E5DECF]" />
            <div className="h-[11px] w-[60%] rounded-md bg-[#E5DECF]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#5C645A]">
              <LockIcon />
              로그인하면 바로 글을 볼 수 있어요
            </span>
          </div>
        </div>
      </section>

      <section className="mx-5 mt-[26px] px-1.5 text-center">
        <p className="text-[16px] font-bold leading-[1.6] text-[#1E2621]">
          {memberLine}
          <br />
          <span className="text-[#15695E]">헤르프리 비공개 커뮤니티</span>에
          <br />
          함께해 보세요.
        </p>
        <p className="mt-[13px] text-[13px] leading-[1.75] hf-text-subtle">
          같은 경험을 가진 사람들이 일상과 고민을
          <br />
          나누는 익명 공간이에요.
        </p>
        <Link
          href="/login?from=/community"
          className="mt-4 flex h-[52px] items-center justify-center rounded-[14px] bg-[#0B3B36] text-[14.5px] font-bold text-white shadow-[0_14px_30px_-14px_rgba(11,59,54,.6)]"
        >
          로그인하기
        </Link>
        <Link href="/" className="mt-4 block text-[13px] hf-text-muted">
          ← 처음으로
        </Link>
      </section>
    </div>
  );
}

function ReplyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4B2A6" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

export function CommunityFeed({ initialBoardId = null }: CommunityFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, isReady, user } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId);
  const [keyword, setKeyword] = useState('');
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
  const { data: homeStats } = useJournalPublicHomeStats();

  const communityBoards = useMemo(() => getCommunityBoards(boards), [boards]);

  useEffect(() => {
    if (boardsLoading || communityBoards.length === 0) return;

    if (selectedBoardId === null) return;

    const isValidSelection = communityBoards.some((board) => board.id === selectedBoardId);
    if (isValidSelection) return;

    setSelectedBoardId(null);
    setPage(0);
    router.replace('/community');
  }, [boardsLoading, communityBoards, selectedBoardId, router, setPage]);

  useEffect(() => {
    setSelectedBoardId(initialBoardId);
    setPage(0);
  }, [initialBoardId, setPage]);

  useEffect(() => {
    const q = searchParams.get('q')?.trim() ?? '';
    if (!q) {
      setKeyword('');
      return;
    }
    const hint = validatePostSearchKeyword(q);
    if (hint) {
      setKeyword('');
      return;
    }
    setKeyword(q);
    setPage(0);
  }, [searchParams, setPage]);

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
    setPage(0);
    router.push(boardId === null ? '/community' : `/community/${boardId}`);
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

  useEffect(() => {
    if (isNoticeBoard && sort !== 'latest') {
      setSort('latest');
      setPage(0);
    }
  }, [isNoticeBoard, sort, setPage]);

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


  const isLoadingAll = isLoggedIn && (boardsLoading || isLoading);
  const listError = isLoggedIn ? (boardsError ?? error) : null;

  return (
    <div className="community-screen mx-auto max-w-app pb-24 lg:max-w-none">
      <ScreenHeader
        titleAs="h2"
        title="커뮤니티"
        subtitle="같은 경험을 가진 사람들의 이야기가 모이는 곳"
      />

      {isLoggedIn && !boardsLoading && communityBoards.length > 0 && (
        <div className="hf-page-x min-w-0 pt-4 pb-1">
          <BoardTabBar
            boards={communityBoards}
            selectedBoardId={selectedBoardId}
            onSelect={handleBoardSelect}
            showAllTab
          />
        </div>
      )}

      {!isReady || !isLoggedIn ? (
        <CommunityLockedPreview
          memberCount={homeStats?.totalUsers}
        />
      ) : (
        <div className="hf-page-x">
          {isSecretStoryBoard && <SecretStoryBoardBanner className="mt-4" />}

          {!isLoadingAll && !listError && (
            <div className="pt-2">
              <p className="text-[12px] hf-text-subtle">
                총 {postPage.totalElements.toLocaleString('ko-KR')}개의 이야기
              </p>
            </div>
          )}

          {!isNoticeBoard && (
            <div className="mt-3 hidden flex-wrap items-center justify-between gap-2 lg:flex">
              <CommunitySortTabs value={sort} onChange={handleSortChange} />
              {needsPostListPeriod(sort) && (
                <CommunityPeriodToggle value={period} onChange={handlePeriodChange} />
              )}
              {periodHint && (
                <p className="basis-full text-xs text-muted" role="status">
                  {periodHint}
                </p>
              )}
            </div>
          )}

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
            <div className="mt-3 space-y-0">
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
                title={keyword ? '검색 결과가 없습니다' : '아직 글이 없습니다'}
                description={
                  keyword
                    ? '다른 검색어로 다시 시도해 보세요.'
                    : isNoticeBoard
                      ? '등록된 공지가 없습니다.'
                      : '첫 이야기를 함께 남겨 보세요.'
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
            <div className="community-feed-list pt-1">
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
            <div className="hidden lg:block">
              <CommunityPageSizeSelect value={pageSize} onChange={handlePageSizeChange} />
            </div>
          )}

          {canCommunityWrite && <CommunityFab href={writeHref} ariaLabel="커뮤니티 글쓰기" />}
          {isNoticeBoard && <AdminPublishFab tab="notices" label="공지 올리기" />}
        </div>
      )}
    </div>
  );
}
