import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatDate } from '@/domain/common/format';
import { cn } from '@/lib/cn';

type PostListRowProps = {
  post: Post;
  rowNumber: number;
};

export function PostListRow({ post, rowNumber }: PostListRowProps) {
  const isNotice = post.boardType === 'NOTICE';

  return (
    <Link
      href={`/community/posts/${post.id}`}
      className={cn(
        'block border-b border-border/60 transition-colors hover:bg-cream/60',
        isNotice && 'bg-primary/5',
      )}
    >
      <div className="grid grid-cols-[2rem_1fr_2.5rem] items-center gap-2 px-3 py-3 sm:grid-cols-[2.5rem_1fr_3rem_3.5rem_2.5rem]">
        <span className="text-center text-xs text-muted">
          {isNotice ? (
            <span className="rounded bg-primary/10 px-1 py-0.5 text-[10px] font-medium text-primary">
              공지
            </span>
          ) : (
            rowNumber
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-cream-foreground">{post.title}</p>
          {post.contentPreview && (
            <p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{post.contentPreview}</p>
          )}
          <p className="mt-0.5 truncate text-[11px] text-muted sm:hidden">
            {post.authorNickname} · {formatDate(post.createdAt)} · 조회 {post.viewCount}
          </p>
          <p className="mt-0.5 hidden truncate text-[11px] text-muted sm:block">
            {post.boardName} · {post.authorNickname}
          </p>
        </div>
        <span className="hidden truncate text-xs text-muted sm:block">{post.authorNickname}</span>
        <span className="hidden text-xs text-muted sm:block">{formatDate(post.createdAt)}</span>
        <span className="text-right text-xs text-muted">{post.viewCount}</span>
      </div>
    </Link>
  );
}

export function PostListHeader() {
  return (
    <div className="grid grid-cols-[2rem_1fr_2.5rem] gap-2 border-b border-border bg-cream/80 px-3 py-2 text-[11px] font-medium text-muted sm:grid-cols-[2.5rem_1fr_3rem_3.5rem_2.5rem]">
      <span className="text-center">번호</span>
      <span>제목</span>
      <span className="hidden sm:block">작성자</span>
      <span className="hidden sm:block">작성일</span>
      <span className="text-right">조회</span>
    </div>
  );
}
