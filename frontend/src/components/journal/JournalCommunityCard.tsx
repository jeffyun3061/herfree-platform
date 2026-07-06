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
  const initial = nickname === '익명' ? '유' : nickname.trim().charAt(0) || '유';

  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#173E38] text-xs font-bold text-[#F3EAD8] ring-1 ring-white/10">
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
    <section className="rounded-[22px] border border-[#123E37] bg-[#06241F] px-4 py-4 shadow-[0_18px_42px_-30px_rgba(7,37,31,.75)] sm:px-5 sm:py-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#163D36] text-[#F2C86B] ring-1 ring-white/10" aria-hidden>
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <div>
            <h2 className="font-display text-base font-bold text-[#FFFDF8]">커뮤니티</h2>
            <p className="mt-0.5 text-[10.5px] text-[#B7C6BD]">방금 올라온 이야기</p>
          </div>
        </div>
        <Link
          href="/community"
          className="rounded-full bg-[#143A34] px-2.5 py-1 text-[11px] font-bold text-[#EDE3D0] transition-colors hover:bg-[#1B4A42]"
        >
          더보기 &gt;
        </Link>
      </div>

      {isLoading ? (
        <LoadingSpinner label="커뮤니티 불러오는 중..." />
      ) : previewPosts.length === 0 ? (
        <p className="text-sm text-[#B7C6BD]">아직 글이 없습니다. 첫 이야기를 남겨보세요.</p>
      ) : (
        <ul className="rounded-[18px] bg-[#092B25] px-3 ring-1 ring-white/[0.06]">
          {previewPosts.map((post, index) => (
            <li key={post.id} className={cn(index > 0 && 'border-t border-white/[0.09]')}>
              <Link href={`/community/posts/${post.id}`} className="group flex items-center gap-3 py-2.5">
                <PostAvatar nickname={post.authorNickname} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] font-bold text-[#FFFDF8]">{post.authorNickname}</span>
                    <span className="shrink-0 text-[10px] text-[#8AA29A]">
                      {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-[13px] leading-snug text-[#D5DED8] group-hover:text-white">
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
