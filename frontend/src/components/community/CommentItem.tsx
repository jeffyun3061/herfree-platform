import type { CommentTreeNode } from '@/domain/comment/types';
import { displayAuthorNickname } from '@/domain/comment/types';
import { formatRelativeTime } from '@/domain/common/format';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type CommentItemProps = {
  comment: CommentTreeNode;
  depth?: number;
  isLoggedIn?: boolean;
  isStaff?: boolean;
  onDelete?: (commentId: number) => void;
  onHide?: (commentId: number) => void;
  onReport?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
};

export function CommentItem({
  comment,
  depth = 0,
  isLoggedIn = false,
  isStaff = false,
  onDelete,
  onHide,
  onReport,
  onReply,
}: CommentItemProps) {
  const canDelete = comment.isMyComment;
  const canReport = isLoggedIn && !comment.isMyComment;
  const canHide = isStaff && onHide;
  const hasActions = (isLoggedIn && onReply) || canReport || canHide || (canDelete && onDelete);

  return (
    <article
      className={cn(
        'flex gap-2.5 border-t border-[#F2ECE1] py-3 first:border-t-0',
        depth > 0 && 'ml-3 rounded-[14px] bg-[#F8F4EC] px-3 py-3',
      )}
    >
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[13px]"
        aria-hidden
      >
        🌙
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-[7px]">
              <span className="text-[12px] font-semibold text-[#2C342E]">
                {displayAuthorNickname(comment.authorNickname)}
              </span>
              <span className="text-[10px] text-[#B4B2A6]">
                {formatRelativeTime(comment.createdAt)}
              </span>
            </div>
            <p className="mt-[3px] whitespace-pre-wrap text-[12.5px] leading-[1.6] text-[#6E766F]">
              {comment.content}
            </p>
          </div>
          {hasActions && (
            <div className="flex shrink-0 items-center gap-0.5">
              {isLoggedIn && onReply && (
                <Button variant="ghost" size="sm" onClick={() => onReply(comment.id)}>
                  답글
                </Button>
              )}
              {canReport && onReport && (
                <Button variant="ghost" size="sm" onClick={() => onReport(comment.id)}>
                  신고
                </Button>
              )}
              {canHide && (
                <Button variant="ghost" size="sm" onClick={() => onHide(comment.id)}>
                  숨김
                </Button>
              )}
              {canDelete && onDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600"
                  onClick={() => onDelete(comment.id)}
                >
                  삭제
                </Button>
              )}
            </div>
          )}
        </div>
        {comment.replies.length > 0 && (
          <div className="mt-1">
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                depth={depth + 1}
                isLoggedIn={isLoggedIn}
                isStaff={isStaff}
                onDelete={onDelete}
                onHide={onHide}
                onReport={onReport}
                onReply={onReply}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
