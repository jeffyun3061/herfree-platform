'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatTimeClock } from '@/domain/common/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { cn } from '@/lib/cn';

type PrivateCommunitySectionProps = {
  posts: Post[];
  isLoading: boolean;
};

const AVATAR_GRADIENTS = [
  'from-slate-500 to-slate-700',
  'from-stone-500 to-stone-700',
  'from-zinc-500 to-zinc-700',
] as const;

function PostAvatar({ nickname, index }: { nickname: string; index: number }) {
  const initial = nickname === '익명' ? '?' : nickname.trim().charAt(0) || '?';

  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-sm font-medium text-white',
        AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
      )}
    >
      {initial}
    </span>
  );
}

function HexBadge({ count }: { count: number }) {
  return <span className="hex-badge">{count > 99 ? '99+' : count}</span>;
}

export function PrivateCommunitySection({ posts, isLoading }: PrivateCommunitySectionProps) {
  const previewPosts = posts.slice(0, 4);

  return (
    <section>
      <div className="community-dark-panel">
        <div className="mb-1 flex items-end justify-between">
          <h2 className="section-heading-light">Private Community</h2>
          <Link href="/community" className="section-link-light">
            더보기 &gt;
          </Link>
        </div>

        {isLoading ? (
          <LoadingSpinner label="커뮤니티 불러오는 중…" />
        ) : previewPosts.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">아직 글이 없습니다. 첫 이야기를 남겨 보세요.</p>
        ) : (
          <ul>
            {previewPosts.map((post, index) => (
              <li key={post.id} className={cn(index > 0 && 'community-post-divider')}>
                <Link href={`/community/posts/${post.id}`} className="community-post-row group">
                  <PostAvatar nickname={post.authorNickname} index={index} />
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-[13px] font-medium text-white group-hover:text-white/90 lg:text-base">
                      {post.title}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                      <span>{formatTimeClock(post.createdAt)}</span>
                      <span className="inline-flex items-center gap-0.5 opacity-70">
                        <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                          <circle cx="12" cy="12" r="2.5" />
                        </svg>
                        {post.viewCount}
                      </span>
                    </div>
                  </div>
                  <HexBadge count={post.viewCount} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
