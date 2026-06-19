'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type JournalCommunityCardProps = {
  posts: Post[];
  isLoading: boolean;
  maxPosts?: number;
};

function PostAvatar({ nickname }: { nickname: string }) {
  const initial = nickname === '익명' ? '?' : nickname.trim().charAt(0) || '?';

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-sm font-medium text-white/80">
      {initial}
    </span>
  );
}

function postSnippet(post: Post): string {
  const preview = post.contentPreview?.trim();
  if (preview) return preview;
  return post.title;
}

export function JournalCommunityCard({ posts, isLoading, maxPosts = 5 }: JournalCommunityCardProps) {
  const previewPosts = posts.slice(0, maxPosts);

  return (
    <section className="journal-community-panel">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-white" aria-hidden>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h2 className="font-display text-base font-bold text-white">커뮤니티</h2>
        </div>
        <Link
          href="/community"
          className="text-[11px] font-medium text-white/50 transition-colors hover:text-white/70"
        >
          더보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner label="커뮤니티 불러오는 중…" />
      ) : previewPosts.length === 0 ? (
        <p className="text-sm text-white/50">아직 글이 없습니다. 첫 이야기를 남겨 보세요.</p>
      ) : (
        <ul>
          {previewPosts.map((post, index) => (
            <li key={post.id} className={cn(index > 0 && 'border-t border-white/[0.08]')}>
              <Link href={`/community/posts/${post.id}`} className="flex items-center gap-3 py-3 group">
                <PostAvatar nickname={post.authorNickname} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-white">{post.authorNickname}</span>
                    <span className="text-[10px] text-white/40">{formatRelativeTime(post.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/[0.65] group-hover:text-white/80">
                    {postSnippet(post)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
