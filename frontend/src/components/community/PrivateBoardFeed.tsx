'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useBoards } from '@/hooks/useBoards';
import { usePostList } from '@/hooks/usePosts';
import { CommunityFab } from '@/components/community/CommunityFab';
import { PostCard, PostCardSkeleton } from '@/components/community/PostCard';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { Button } from '@/components/ui/Button';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { findBoardByType } from '@/domain/board/types';
import {
  PRIVATE_BOARD_META,
  type PrivateBoardType,
} from '@/domain/board/privateBoard';
import { isStaff } from '@/domain/user/types';
import { getErrorMessage } from '@/lib/api/client';

type PrivateBoardFeedProps = {
  boardType: PrivateBoardType;
};

export function PrivateBoardFeed({ boardType }: PrivateBoardFeedProps) {
  const router = useRouter();
  const meta = PRIVATE_BOARD_META[boardType];
  const { isReady, isLoggedIn, user } = useAuth();
  const { boards, isLoading: boardsLoading, error: boardsError } = useBoards();
  const board = findBoardByType(boards, boardType);

  const { postPage, page, setPage, isLoading, error } = usePostList(
    board?.id ?? null,
    15,
    '',
    'createdAt,desc',
  );

  useEffect(() => {
    if (isReady && !isLoggedIn) {
      router.replace(`/login?from=${encodeURIComponent(meta.path)}`);
    }
  }, [isReady, isLoggedIn, meta.path, router]);

  const writeHref = meta.writePath;
  const canWrite = !isStaff(user?.role);
  const listError = boardsError ?? error;
  const isLoadingAll = !isReady || boardsLoading || isLoading;

  if (!isReady || !isLoggedIn) {
    return null;
  }

  return (
    <div className="community-screen mx-auto max-w-app hf-scroll-pad-nav-tight lg:max-w-none lg:pb-12">
      <ScreenHeader
        title={meta.title}
        subtitle="서비스 이용과 운영에 관한 문의를 남겨 주세요"
      />

      <div className="hf-page-x pt-4">
        <div className="mb-4 border-l-2 border-[#C9A24B] bg-[#F8F2E7] px-3 py-2.5">
          <p className="text-[12px] leading-[1.65] text-[#69716B]">{meta.description}</p>
        </div>

      {canWrite && (
        <div className="mb-4 flex items-center justify-end gap-2">
          <Link href={writeHref}>
            <Button size="sm">{meta.writeLabel}</Button>
          </Link>
        </div>
      )}

      {isLoadingAll && (
        <div className="community-feed-list">
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

      {!isLoadingAll && !listError && !board && (
        <EmptyState
          title="게시판을 불러올 수 없습니다"
          description="잠시 후 다시 시도해 주세요."
        />
      )}

      {!isLoadingAll && !listError && board && postPage.content.length === 0 && (
        <div className="py-8">
          <EmptyState
            title={boardType === 'INQUIRY' ? '등록된 문의가 없습니다' : '등록된 상담 글이 없습니다'}
            description={
              canWrite
                ? boardType === 'INQUIRY'
                  ? '운영팀에 전달할 문의·건의·신고를 자유롭게 남겨 주세요.'
                  : '관리자와 나눌 상담 내용을 작성해 주세요.'
                : '회원이 등록한 문의·상담 글이 여기에 표시됩니다.'
            }
            action={
              canWrite ? (
                <Link href={writeHref}>
                  <Button size="sm">{meta.writeLabel}</Button>
                </Link>
              ) : undefined
            }
          />
        </div>
      )}

      {!isLoadingAll && !listError && postPage.content.length > 0 && (
        <div className="space-y-2">
          {postPage.content.map((post) => (
            <PostCard key={post.id} post={post} boardName={meta.title} />
          ))}
        </div>
      )}

      {!isLoadingAll && !listError && postPage.totalPages > 1 && (
        <div className="mt-6">
          <Pagination page={page} totalPages={postPage.totalPages} onPageChange={setPage} />
        </div>
      )}

      </div>

      {canWrite && <CommunityFab href={writeHref} ariaLabel={meta.writeLabel} />}
    </div>
  );
}
