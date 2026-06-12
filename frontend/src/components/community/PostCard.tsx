import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { Badge } from '@/components/ui/Badge';

type PostCardProps = {
  post: Post;
  boardName?: string;
};

export function PostCard({ post, boardName }: PostCardProps) {
  return (
    <Link href={`/community/posts/${post.id}`} className="mb-3 block">
      <article className="rounded-2xl border border-border/80 bg-card p-4 transition-shadow hover:shadow-md">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {boardName && <Badge variant="muted">{boardName}</Badge>}
          <span className="text-xs text-muted">{post.authorNickname}</span>
          <span className="text-xs text-muted">· {formatRelativeTime(post.createdAt)}</span>
        </div>
        <h3 className="line-clamp-2 font-medium leading-snug text-cream-foreground">{post.title}</h3>
        {post.contentPreview && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">{post.contentPreview}</p>
        )}
        <p className="mt-2 text-xs text-muted">조회 {post.viewCount}</p>
      </article>
    </Link>
  );
}
