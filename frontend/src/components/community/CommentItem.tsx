import type { Comment } from '@/domain/comment/types';
import { Button } from '@/components/ui/Button';

type CommentItemProps = {
  comment: Comment;
  canDelete?: boolean;
  onDelete?: () => void;
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

export function CommentItem({ comment, canDelete = false, onDelete }: CommentItemProps) {
  return (
    <article className="border-b border-border py-4 last:border-b-0">
      <div className="mb-1 flex items-center justify-between gap-2 text-xs text-muted">
        <div className="flex items-center gap-2">
          <span className="font-medium text-cream-foreground">{comment.authorNickname}</span>
          <span>· {formatDate(comment.createdAt)}</span>
        </div>
        {canDelete && onDelete && (
          <Button variant="ghost" size="sm" className="text-red-600" onClick={onDelete}>
            삭제
          </Button>
        )}
      </div>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-cream-foreground">
        {comment.content}
      </p>
    </article>
  );
}
