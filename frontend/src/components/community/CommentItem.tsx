import type { Comment } from '@/domain/comment/types';
import { Button } from '@/components/ui/Button';

type CommentItemProps = {
  comment: Comment;
  canDelete?: boolean;
  canReport?: boolean;
  onDelete?: () => void;
  onReport?: () => void;
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
  canDelete = false,
  canReport = false,
  onDelete,
  onReport,
}: CommentItemProps) {
  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-cream-foreground">{comment.authorNickname}</span>
          <span>· {formatDate(comment.createdAt)}</span>
        </div>
        <div className="flex items-center gap-1">
          {canReport && onReport && (
            <Button variant="ghost" size="sm" onClick={onReport}>
              신고
            </Button>
          )}
          {canDelete && onDelete && (
            <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
              삭제
            </Button>
          )}
        </div>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">
        {comment.content}
      </p>
    </article>
  );
}
