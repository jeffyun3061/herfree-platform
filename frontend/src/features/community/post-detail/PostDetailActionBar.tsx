'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import type { PostDetail } from '@/domain/post/types';
import { getPrivatePostWriteHref } from '@/domain/board/privateBoard';
import type { PendingPostDetailConfirmation } from '@/features/community/post-detail/types';

type PostDetailActionBarProps = {
  post: PostDetail;
  boardType?: string;
  isLoggedIn: boolean;
  isStaffUser: boolean;
  isAdminUser: boolean;
  isStaffOnlyPost: boolean;
  isMaskedPost: boolean;
  bookmarked: boolean;
  bookmarkLoading: boolean;
  bookmarkUpdating: boolean;
  onToggleBookmark: () => void;
  onOpenReport: () => void;
  onRequestConfirmation: (confirmation: PendingPostDetailConfirmation) => void;
};

export function PostDetailActionBar({
  post,
  boardType,
  isLoggedIn,
  isStaffUser,
  isAdminUser,
  isStaffOnlyPost,
  isMaskedPost,
  bookmarked,
  bookmarkLoading,
  bookmarkUpdating,
  onToggleBookmark,
  onOpenReport,
  onRequestConfirmation,
}: PostDetailActionBarProps) {
  const privateEditHref = boardType ? getPrivatePostWriteHref(boardType, post.id) : null;

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {isLoggedIn && !isMaskedPost && (
        <Button
          variant={bookmarked ? 'secondary' : 'ghost'}
          size="sm"
          disabled={bookmarkLoading || bookmarkUpdating}
          onClick={onToggleBookmark}
        >
          {bookmarked ? '스크랩 취소' : '스크랩'}
        </Button>
      )}
      {isLoggedIn && !isMaskedPost && (
        <Button variant="ghost" size="sm" onClick={onOpenReport}>
          신고
        </Button>
      )}
      {isStaffUser && isMaskedPost && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onRequestConfirmation({ type: 'hide-post' })}
        >
          숨김 처리
        </Button>
      )}
      {isStaffUser && !isStaffOnlyPost && !isMaskedPost && (
        <>
          <Link href={`/community/write?postId=${post.id}&admin=1`}>
            <Button variant="secondary" size="sm">
              수정
            </Button>
          </Link>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRequestConfirmation({ type: 'hide-post' })}
          >
            숨김 처리
          </Button>
        </>
      )}
      {post.isMyPost && isStaffOnlyPost && isAdminUser && (
        <Link href="/admin?tab=notices">
          <Button variant="secondary" size="sm">
            공지 관리
          </Button>
        </Link>
      )}
      {post.isMyPost && !isStaffOnlyPost && post.readable !== false && (
        <>
          <Link href={privateEditHref ?? `/community/write?postId=${post.id}`}>
            <Button variant="secondary" size="sm">
              수정
            </Button>
          </Link>
          <Button
            variant="danger"
            size="sm"
            onClick={() => onRequestConfirmation({ type: 'delete-post' })}
          >
            삭제
          </Button>
        </>
      )}
    </div>
  );
}
