import type { Comment } from '@/domain/comment/types';
import { displayAuthorNickname } from '@/domain/comment/types';
import { formatRelativeTime } from '@/domain/common/format';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type CommentItemProps = {
  comment: Comment;
  parent?: Comment;
  isLoggedIn?: boolean;
  isStaff?: boolean;
  onDelete?: (commentId: number) => void;
  onHide?: (commentId: number) => void;
  onReport?: (commentId: number) => void;
  onReply?: (commentId: number) => void;
  activeReplyId?: number | null;
};

export function CommentItem({
  comment,
  parent,
  isLoggedIn = false,
  isStaff = false,
  onDelete,
  onHide,
  onReport,
  onReply,
  activeReplyId = null,
}: CommentItemProps) {
  const canDelete = comment.isMyComment;
  const canReport = isLoggedIn && !comment.isMyComment;
  const canHide = isStaff && onHide;
  const hasActions = (isLoggedIn && onReply) || canReport || canHide || (canDelete && onDelete);
  const isReplyTarget = activeReplyId === comment.id;

  return (
    <article
      id={`comment-${comment.id}`}
      tabIndex={-1}
      className={cn(
        'flex min-w-0 scroll-mt-20 gap-2 rounded-xl py-2.5 transition-colors focus:bg-[#EDF4F0]',
        isReplyTarget && 'bg-[#EDF4F0] ring-1 ring-inset ring-[#BFD2C8]',
      )}
    >
      <span
        className={cn(
          'flex shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[13px]',
          parent ? 'h-6 w-6' : 'h-7 w-7',
        )}
        aria-hidden
      >
        🌙
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-[7px]">
          <span className="min-w-0 break-words text-[13px] font-semibold text-[#2C342E]">
            {displayAuthorNickname(comment.authorNickname)}
          </span>
          {comment.operatorReply && (
            <span className="rounded-full bg-[#E1F5EE] px-2 py-0.5 text-[10px] font-bold text-[#0B3B36]">운영자 답변</span>
          )}
          <time dateTime={comment.createdAt} className="text-[12px] text-[#627169]">
            {formatRelativeTime(comment.createdAt)}
          </time>
        </div>
        {parent ? (
          <button
            type="button"
            className="min-h-9 max-w-full break-words rounded-sm text-left text-xs font-semibold text-primary underline decoration-[#A3B7AA] underline-offset-2"
            onClick={() => {
              const target = document.getElementById(`comment-${parent.id}`);
              target?.focus({ preventScroll: true });
              target?.scrollIntoView({ block: 'start' });
            }}
          >
            {displayAuthorNickname(parent.authorNickname)}님에게 답글
          </button>
        ) : comment.parentId !== null && (
          <p className="mt-0.5 text-xs text-[#627169]">답글 · 원댓글은 이 페이지에서 볼 수 없어요</p>
        )}
        <p className="mt-1 whitespace-pre-wrap text-[14.5px] leading-[1.7] text-[#3E4A42] [overflow-wrap:anywhere]">
          {comment.content}
        </p>
        {hasActions && (
          <div className="-ml-2 mt-0.5 flex flex-wrap items-center gap-0.5">
            {isLoggedIn && onReply && (
              <Button
                variant="ghost"
                size="sm"
                aria-pressed={isReplyTarget}
                className={cn('min-h-11', isReplyTarget && 'bg-[#DCEAE3] text-[#0B3B36]')}
                onClick={() => onReply(comment.id)}
              >
                {isReplyTarget ? '선택됨' : '답글'}
              </Button>
            )}
            {canReport && onReport && (
              <Button variant="ghost" size="sm" className="min-h-11" onClick={() => onReport(comment.id)}>
                신고
              </Button>
            )}
            {canHide && (
              <Button variant="ghost" size="sm" className="min-h-11" onClick={() => onHide(comment.id)}>
                숨김
              </Button>
            )}
            {canDelete && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="min-h-11 text-red-700"
                onClick={() => onDelete(comment.id)}
              >
                삭제
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
