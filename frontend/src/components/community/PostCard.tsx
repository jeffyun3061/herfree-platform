import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

type PostCardProps = {
  post: Post;
  boardName?: string;
};

export function PostCard({ post, boardName }: PostCardProps) {
  return (
    <Link href={`/community/posts/${post.id}`}>
      <Card className="mb-3">
        <div className="mb-2 flex items-center gap-2">
          {boardName && <Badge variant="muted">{boardName}</Badge>}
          <span className="text-xs text-muted">{post.authorNickname}</span>
          <span className="text-xs text-muted">· {formatRelativeTime(post.createdAt)}</span>
        </div>
        <h3 className="line-clamp-2 font-medium text-cream-foreground">{post.title}</h3>
        <div className="mt-2 text-xs text-muted">조회 {post.viewCount}</div>
      </Card>
    </Link>
  );
}
