'use client';

import { useEffect, useRef, useState } from 'react';
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
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { AdminPublishFab, AdminPublishLink } from '@/components/admin/AdminPublishLink';
import { getWritableBoards, isStaffOnlyBoardType } from '@/domain/board/types';
import { getCommunityBoards, isSecretStoryBoardType } from '@/domain/board/privateBoard';
import { validatePostSearchKeyword } from '@/domain/post/search';
import { isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';

type CommunityFeedProps = {
  initialBoardId?: number | null;
};

function LockedCommunityFeed() {
  const samples = [
    ['정진초기', '처음 진단받고 마음이 너무 복잡해요', '방금 전'],
    ['정보공유', '재발 간격 기록해본 분들 계신가요?', '12분 전'],
    ['자유·응원', '오늘은 조금 담담하게 지나갔어요', '28분 전'],
  ];

  return (
    <div className="page-container community-screen mx-auto max-w-app pb-36 lg:max-w-content lg:pb-12">
      <div className="mb-5">
        <h1 className="hf-display text-[24px] font-extrabold text-[#15201D]">커뮤니티</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-[#8B9590]">
          같은 경험을 가진 사람들의 이야기가 모이는 곳
        </p>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-[#ECE5D8] bg-white p-4 shadow-card">
        <div className="space-y-3 blur-[5px] opacity-50" aria-hidden>
          {samples.map(([tag, title, time]) => (
            <article key={title} className="border-b border-[#EEF0EC] pb-3 last:border-b-0 last:pb-0">
              <span className="rounded-md bg-[#E1F5EE] px-2 py-0.5 text-[10.5px] font-semibold text-[#04342C]">
                {tag}
              </span>
              <h2 className="mt-2 text-[14px] font-semibold text-[#15201D]">{title}</h2>
              <p className="mt-1 text-[11px] text-[#A6ABA3]">익명 회원 · {time} · 공감 4 · 댓글 2</p>
              <p className="mt-2 line-clamp-2 text-[12.5px] leading-5 text-[#5C645A]">
                혼자 검색하다 지쳐서 들어왔는데 비슷한 경험이 있는 사람들의 이야기가 도움이 됐어요.
              </p>
            </article>
          ))}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(255,255,255,.2)_0%,rgba(255,255,255,.9)_42%,#fff_100%)] px-7 text-center">
          <div className="mb-3 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#0B3B36] text-[#F0C778] shadow-[0_10px_22px_-10px_rgba(11,59,54,.6)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <p className="text-[15px] font-bold text-[#1E2621]">가입하면 바로 글을 볼 수 있어요</p>
          <p className="mt-2 text-[12.5px] leading-5 text-[#5C645A]">
            1,532명의 회원과 함께하는
            <br />
            헤르프리 비공개 커뮤니티에 들어오세요.
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] bg-[#07251F] p-4 text-white shadow-[0_18px_40px_-24px_rgba(7,37,31,.7)]">
        <p className="text-[13px] font-semibold">헤르프리 비공개 커뮤니티</p>
        <p className="mt-1.5 text-[12px] leading-5 text-white/64">
          닉네임 기반으로 안전하게 가입하고, 같은 고민을 가진 사람들의 이야기를 확인하세요.
        </p>
        <Link
          href="/signup?from=/community"
          className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-[#F0C778] text-[13px] font-extrabold text-[#07251F]"
        >
          30초 만에 가입하기
        </Link>
        <Link href="/" className="mt-3 block text-center text-[12px] text-white/55">
          처음으로
        </Link>
      </div>
    </div>
  );
}

export function CommunityFeed({ initialBoardId = null }: CommunityFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isLoggedIn, user } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const [selectedBoardId, setSelectedBoardId] = useState<number | null>(initialBoardId);
  const [keyword, setKeyword] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [sort, setSort] = useState<PostSortOption>('latest');
  const [period, setPeriod] = useState<PostListPeriod>('week');
  const [pageSize, setPageSize] = useState<CommunityPageSize>(10);

  const { postPage, page, setPage, isLoading, error } = usePostList(
    selectedBoardId,
    pageSize,
    keyword,
    postSortToQuery(sort),
    postListPeriodQuery(sort, period),
  );

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

  const handleBoardSelect = (boardId: number | null) => {
    setSelectedBoardId(boardId);
    setPage(0);
    router.push(boardId === null ? '/community' : `/community/${boardId}`);
  };

  const handleSearch = () => {
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

  const isLoadingAll = boardsLoading || isLoading;
  const listError = boardsError ?? error;

  if (!isLoggedIn) {
    return <LockedCommunityFeed />;
  }

  return (
    <div className="page-container community-screen mx-auto max-w-app pb-36 lg:max-w-content lg:pb-12">
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

      <div className="mb-4 hidden lg:block">
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

      {!boardsLoading && boards.length > 0 && (
        <div className="mb-4">
          <BoardTabBar
            boards={getCommunityBoards(boards)}
            selectedBoardId={selectedBoardId}
            onSelect={handleBoardSelect}
          />
        </div>
      )}

      {!isLoadingAll && !listError && (
        <p className="mb-3 text-xs text-[#8B9590]">총 {postPage.totalElements.toLocaleString('ko-KR')}개</p>
      )}

      <div className="mb-4 hidden lg:block">
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
        ) : !isLoggedIn ? (
          <Link href={loginHref}>
            <Button size="sm" variant="secondary">
              로그인 후 글쓰기
            </Button>
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
      {!canCommunityWrite && !isLoggedIn && !isStaffOnlyBoard && (
        <CommunityFab href={loginHref} className="opacity-90" />
      )}
      {isNoticeBoard && <AdminPublishFab tab="notices" label="공지 올리기" />}
    </div>
  );
}
