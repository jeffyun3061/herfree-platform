import type { CommentTreeNode } from '@/domain/comment/types';
import { displayAuthorNickname } from '@/domain/comment/types';
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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

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

  return (
    <article
      className={cn(
        'border-b border-border py-4 last:border-b-0',
        depth > 0 && 'ml-3 rounded-2xl bg-[#F8F4EC] px-3',
      )}
    >
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-cream-foreground">
            {displayAuthorNickname(comment.authorNickname)}
          </span>
          <span>· {formatDate(comment.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
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
            <Button variant="ghost" size="sm" className="text-red-600" onClick={() => onDelete(comment.id)}>
              삭제
            </Button>
          )}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">
        {comment.content}
      </p>
      {comment.replies.length > 0 && (
        <div className="mt-2">
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
    </article>
  );
}
