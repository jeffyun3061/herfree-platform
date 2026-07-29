'use client';

import { CommentItem } from '@/components/community/CommentItem';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { buildCommentTree, type Comment } from '@/domain/comment/types';
import type { PendingPostDetailConfirmation } from '@/features/community/post-detail/types';

type CommentThreadProps = {
  comments: Comment[];
  page: number;
  totalPages: number;
  totalElements: number;
  isLoading: boolean;
  isLoggedIn: boolean;
  isStaffUser: boolean;
  isStaffOnlyPost: boolean;
  isMaskedPost: boolean;
  canWriteComments: boolean;
  privateCommentHint: boolean;
  activeReplyId: number | null;
  onPageChange: (page: number) => void;
  onRequestConfirmation: (confirmation: PendingPostDetailConfirmation) => void;
  onReport: (commentId: number) => void;
  onReply: (commentId: number) => void;
};

export function CommentThread({
  comments,
  page,
  totalPages,
  totalElements,
  isLoading,
  isLoggedIn,
  isStaffUser,
  isStaffOnlyPost,
  isMaskedPost,
  canWriteComments,
  privateCommentHint,
  activeReplyId,
  onPageChange,
  onRequestConfirmation,
  onReport,
  onReply,
}: CommentThreadProps) {
  const commentTree = buildCommentTree(comments);

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold text-[#15201D]">
          {isMaskedPost ? '운영자 답변' : '댓글'}
          {isMaskedPost ? ` ${totalElements}` : ''}
        </h2>
        {totalPages > 1 && (
          <span className="text-[11px] font-medium text-[#A6ABA0]">
            {page + 1}/{totalPages}페이지
          </span>
        )}
      </div>
      {privateCommentHint && (
        <p className="mb-4 text-xs leading-relaxed text-muted">
          운영자 답변이 등록되면 여기에 표시됩니다. 답글은 운영자만 작성할 수 있습니다.
        </p>
      )}
      {isLoading ? (
        <LoadingSpinner label="댓글 불러오는 중…" />
      ) : commentTree.length > 0 ? (
        <>
          {commentTree.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isLoggedIn={isLoggedIn}
              isStaff={isStaffUser && (!isStaffOnlyPost || isMaskedPost)}
              onDelete={(commentId) => onRequestConfirmation({ type: 'delete-comment', commentId })}
              onHide={(commentId) => onRequestConfirmation({ type: 'hide-comment', commentId })}
              onReport={onReport}
              onReply={canWriteComments ? onReply : undefined}
              activeReplyId={activeReplyId}
            />
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      ) : (
        <div className="rounded-[16px] border border-[#E7DFD2] bg-[#FBF6EA] px-4 py-6 text-center">
          <p className="text-[13px] font-bold text-[#1E2621]">
            {isMaskedPost ? '아직 운영자 답변이 없어요' : '아직 댓글이 없어요'}
          </p>
          <p className="mt-1 text-[12px] text-[#7A847C]">
            {isMaskedPost ? '답변이 등록되면 이곳에 표시됩니다.' : '첫 댓글로 따뜻한 마음을 남겨보세요.'}
          </p>
        </div>
      )}
    </>
  );
}
