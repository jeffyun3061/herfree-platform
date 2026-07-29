'use client';

import { AuthImage } from '@/components/common/AuthImage';
import { ReactionBar } from '@/components/community/ReactionBar';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { cn } from '@/lib/cn';
import { formatRelativeTime } from '@/domain/common/format';
import { formatAuthorIpLabel } from '@/domain/post/ipDisplay';
import { displayAuthorNickname, type PostDetail } from '@/domain/post/types';
import { PostDetailActionBar } from '@/features/community/post-detail/PostDetailActionBar';
import type { PendingPostDetailConfirmation } from '@/features/community/post-detail/types';

type PostDetailViewProps = {
  post: PostDetail;
  boardTagLabel: string;
  boardTagClass: string;
  isMaskedPost: boolean;
  isStaffOnlyPost: boolean;
  isLoggedIn: boolean;
  isStaffUser: boolean;
  isAdminUser: boolean;
  boardType?: string;
  commentCount: number;
  bookmarked: boolean;
  bookmarkLoading: boolean;
  bookmarkUpdating: boolean;
  bookmarkError: string | null;
  onToggleBookmark: () => void;
  onOpenReport: () => void;
  onRequestConfirmation: (confirmation: PendingPostDetailConfirmation) => void;
};

export function PostDetailView({
  post,
  boardTagLabel,
  boardTagClass,
  isMaskedPost,
  isStaffOnlyPost,
  isLoggedIn,
  isStaffUser,
  isAdminUser,
  boardType,
  commentCount,
  bookmarked,
  bookmarkLoading,
  bookmarkUpdating,
  bookmarkError,
  onToggleBookmark,
  onOpenReport,
  onRequestConfirmation,
}: PostDetailViewProps) {
  const isContentMasked = post.readable === false;

  return (
    <section className="px-5 pt-1.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn('rounded-[7px] px-[9px] py-[3px] text-[10.5px] font-bold', boardTagClass)}>
          {boardTagLabel}
        </span>
        {isMaskedPost && (
          <span
            className={cn(
              'inline-flex items-center rounded-[7px] px-2.5 py-1 text-[10.5px] font-bold',
              post.staffReplied ? 'bg-primary/15 text-primary' : 'bg-[#F3ECDD] text-[#8A7964]',
            )}
          >
            {post.staffReplied ? '답변완료' : '답변 대기'}
          </span>
        )}
      </div>

      <h1 className="hf-display mb-3 mt-[13px] break-words text-[20px] font-extrabold leading-[1.45] tracking-[-0.01em] text-[#15201D]">
        {post.title}
      </h1>

      <div className="flex items-center gap-[9px] border-b border-[#EAE3D6] pb-4">
        <span
          className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[14px]"
          aria-hidden
        >
          🌿
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-semibold text-[#2C342E]">
            {displayAuthorNickname(post.authorNickname)}
          </p>
          <p className="mt-px text-[10.5px] text-[#A6ABA0]">
            {formatRelativeTime(post.createdAt)}
            {formatAuthorIpLabel(post.authorIpMasked)
              ? ` · ${formatAuthorIpLabel(post.authorIpMasked)}`
              : ''}
          </p>
        </div>
      </div>

      {post.imageUrl && (
        <div className="mt-[18px] overflow-hidden rounded-2xl border border-[#EAE3D6] bg-[#FFFCF7]">
          <AuthImage
            src={post.imageUrl}
            alt="게시글 첨부 이미지"
            className="max-h-[480px] w-full object-contain"
          />
        </div>
      )}
      <div
        className={cn(
          'pb-1 pt-[18px]',
          isContentMasked && 'rounded-[18px] bg-[#F8F4EC] px-4 py-4 text-center',
        )}
      >
        <p
          className={cn(
            'whitespace-pre-wrap break-words text-[13.5px] leading-[1.85]',
            isContentMasked ? 'text-[#7A847C]' : 'text-[#2C342E]',
          )}
        >
          {post.content}
        </p>
      </div>

      {!isMaskedPost && !isContentMasked && (
        <div className="mt-3.5">
          <ReactionBar
            variant="detail"
            targetType="POST"
            targetId={post.id}
            commentCount={commentCount}
          />
        </div>
      )}

      <PostDetailActionBar
        post={post}
        boardType={boardType}
        isLoggedIn={isLoggedIn}
        isStaffUser={isStaffUser}
        isAdminUser={isAdminUser}
        isStaffOnlyPost={isStaffOnlyPost}
        isMaskedPost={isMaskedPost}
        bookmarked={bookmarked}
        bookmarkLoading={bookmarkLoading}
        bookmarkUpdating={bookmarkUpdating}
        onToggleBookmark={onToggleBookmark}
        onOpenReport={onOpenReport}
        onRequestConfirmation={onRequestConfirmation}
      />
      {bookmarkError && <div className="mt-3"><ErrorMessage message={bookmarkError} /></div>}
    </section>
  );
}
