'use client';

import { CommentItem } from '@/components/community/CommentItem';
import { Pagination } from '@/components/common/Pagination';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { buildCommentTree, type Comment, type CommentTreeNode } from '@/domain/comment/types';
import type { PendingPostDetailConfirmation } from '@/features/community/post-detail/types';
import styles from './CommentThread.module.css';

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
  isConcernPost: boolean;
  canWriteComments: boolean;
  privateCommentHint: boolean;
  activeReplyId: number | null;
  onPageChange: (page: number) => void;
  onRequestConfirmation: (confirmation: PendingPostDetailConfirmation) => void;
  onReport: (commentId: number) => void;
  onReply: (commentId: number) => void;
};

function getThreadRows(root: CommentTreeNode) {
  const rows: { comment: Comment; parent?: Comment }[] = [];

  function append(comment: CommentTreeNode, parent?: Comment) {
    rows.push({ comment, parent });
    for (const reply of comment.replies) {
      append(reply, comment);
    }
  }

  append(root);
  return rows;
}

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
  isConcernPost,
  canWriteComments,
  privateCommentHint,
  activeReplyId,
  onPageChange,
  onRequestConfirmation,
  onReport,
  onReply,
}: CommentThreadProps) {
  const commentTree = buildCommentTree(comments);
  const commentActions = {
    isLoggedIn,
    isStaff: isStaffUser && (!isStaffOnlyPost || isMaskedPost),
    onDelete: (commentId: number) => onRequestConfirmation({ type: 'delete-comment', commentId }),
    onHide: (commentId: number) => onRequestConfirmation({ type: 'hide-comment', commentId }),
    onReport,
    onReply: canWriteComments ? onReply : undefined,
    activeReplyId,
  };

  return (
    <>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-[13px] font-bold text-[#15201D]">
          {isMaskedPost ? '운영자 답변' : isConcernPost ? '답변' : '댓글'}
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
          {commentTree.map((root) => (
            <ul key={root.id} role="list" className={styles.thread}>
              {getThreadRows(root).map(({ comment, parent }) => (
                <li key={comment.id} className={parent ? styles.reply : styles.root}>
                  <CommentItem comment={comment} parent={parent} {...commentActions} />
                </li>
              ))}
            </ul>
          ))}
          <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
        </>
      ) : (
        <div className="rounded-[16px] border border-[#E7DFD2] bg-[#FBF6EA] px-4 py-6 text-center">
          <p className="text-[13px] font-bold text-[#1E2621]">
            {isMaskedPost ? '아직 운영자 답변이 없어요' : isConcernPost ? '아직 답변이 없어요' : '아직 댓글이 없어요'}
          </p>
          <p className="mt-1 text-[12px] text-[#7A847C]">
            {isMaskedPost ? '답변이 등록되면 이곳에 표시됩니다.' : isConcernPost ? '첫 답변을 남겨 주세요.' : '첫 댓글로 따뜻한 마음을 남겨보세요.'}
          </p>
        </div>
      )}
    </>
  );
}
