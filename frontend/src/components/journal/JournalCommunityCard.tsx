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

const AVATAR_EMOJIS = ['🌙', '🌿', '✨', '🍃', '💬', '🌸'] as const;

function postEmoji(nickname: string, postId: number): string {
  const seed = nickname.charCodeAt(0) + postId;
  return AVATAR_EMOJIS[seed % AVATAR_EMOJIS.length] ?? '🌿';
}

function postSnippet(post: Post): string {
  const preview = post.contentPreview?.trim();
  if (preview) return preview;
  return post.title;
}

export function JournalCommunityCard({ posts, isLoading, maxPosts = 5 }: JournalCommunityCardProps) {
  const previewPosts = posts.slice(0, maxPosts);

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-[16px] font-bold tracking-[-0.01em] text-[#1E2621]">커뮤니티</h2>
        <Link href="/community" className="text-[12.5px] font-semibold text-[#15695E]">
          더보기 ›
        </Link>
      </div>

      {isLoading ? (
        <div className="rounded-[20px] bg-[#07251F] px-5 py-8">
          <LoadingSpinner label="커뮤니티 불러오는 중..." />
        </div>
      ) : previewPosts.length === 0 ? (
        <div className="rounded-[20px] bg-[#07251F] px-5 py-8 text-center text-sm text-white/70">
          아직 글이 없습니다. 첫 이야기를 남겨보세요.
        </div>
      ) : (
        <div className="rounded-[20px] bg-[#07251F] px-5 py-1.5 shadow-[0_16px_36px_-26px_rgba(7,37,31,.7)]">
          {previewPosts.map((post, index) => (
            <Link
              key={post.id}
              href={`/community/posts/${post.id}`}
              className={cn(
                'group flex items-start gap-2.5 py-[13px] transition-opacity hover:opacity-90',
                index > 0 && 'border-t border-white/[0.08]',
              )}
            >
              <span
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] text-[13px]"
                aria-hidden
              >
                {postEmoji(post.authorNickname, post.id)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12.5px] font-semibold text-white">
                    {post.authorNickname}
                  </span>
                  <span className="shrink-0 text-[10.5px] text-white/40">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] text-white/62 group-hover:text-white/80">
                  {postSnippet(post)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
