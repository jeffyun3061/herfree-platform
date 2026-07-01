'use client';

import Link from 'next/link';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

type GuestActivityPulseProps = {
  posts: Post[];
  isLoading: boolean;
  usersRecordingToday: number | null;
  statsLoading: boolean;
};

function postSnippet(post: Post): string {
  const preview = post.contentPreview?.trim();
  if (preview) return preview;
  return post.title;
}

export function GuestActivityPulse({ posts, isLoading }: GuestActivityPulseProps) {
  const previewPosts = posts.slice(0, 5);
  const fallbackPosts = [
    '초기 진단 후 마음이 너무 힘들어요',
    '재발 간격을 기록해보니 보이는 게 있어요',
    '혼자 검색하다 지쳤을 때',
    '검사 결과 기다리는 동안 마음 다잡기',
    '생활 패턴 바꾸고 좋아진 점',
  ];

  return (
    <section className="px-2">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="hf-display text-[19px] font-extrabold text-[#1E2621]">
          방금 올라온 이야기
        </h2>
        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#A6ABA0]">
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden
          >
            <rect x="5" y="11" width="14" height="9" rx="2" />
            <path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
          회원 전용
        </span>
      </div>

      <div className="relative min-h-[318px] overflow-hidden rounded-[22px]">
        <div className="flex select-none flex-col gap-[10px] opacity-50 blur-[5px]" aria-hidden>
          {isLoading ? (
            <div className="rounded-[16px] bg-white px-4 py-8 shadow-[0_12px_28px_-24px_rgba(20,30,25,.3)]">
              <LoadingSpinner label="이야기를 불러오는 중..." />
            </div>
          ) : previewPosts.length > 0 ? (
            previewPosts.map((post) => (
              <article
                key={post.id}
                className="rounded-[16px] bg-white px-4 py-[13px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_12px_28px_-24px_rgba(20,30,25,.3)]"
              >
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[13px] font-semibold text-[#0B3B36]">
                    {post.authorNickname?.charAt(0) || 'h'}
                  </span>
                  <span className="truncate text-[12.5px] font-semibold text-[#2C342E]">
                    {post.authorNickname || 'herfree'}
                  </span>
                  <span className="ml-auto shrink-0 text-[10.5px] text-[#B4B2A6]">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>
                <p className="line-clamp-2 text-[13.5px] leading-[1.55] text-[#2C342E]">
                  {postSnippet(post)}
                </p>
              </article>
            ))
          ) : (
            fallbackPosts.map((title) => (
              <article
                key={title}
                className="rounded-[16px] bg-white px-4 py-[13px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_12px_28px_-24px_rgba(20,30,25,.3)]"
              >
                <div className="mb-1.5 flex items-center gap-2.5">
                  <span className="h-7 w-7 rounded-full bg-[#EDF2EC]" />
                  <span className="text-[12.5px] font-semibold text-[#2C342E]">herfree</span>
                </div>
                <p className="text-[13.5px] leading-[1.55] text-[#2C342E]">{title}</p>
              </article>
            ))
          )}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(243,237,227,.15)_0%,rgba(243,237,227,.82)_36%,#F3EDE3_72%)] px-7 text-center">
          <div className="mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#0B3B36] shadow-[0_10px_22px_-10px_rgba(11,59,54,.6)]">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F0C778"
              strokeWidth="2"
              aria-hidden
            >
              <rect x="5" y="11" width="14" height="9" rx="2" />
              <path d="M8 11V7a4 4 0 0 1 8 0v4" />
            </svg>
          </div>
          <p className="mb-1.5 text-[15px] font-bold text-[#1E2621]">
            회원만 이용할 수 있는 공간이에요
          </p>
          <p className="mb-[18px] text-[12.5px] leading-[1.6] text-[#5C645A]">
            가입하면 익명으로 올라온 이야기를
            <br />
            안전하게 확인할 수 있어요
          </p>
          <Link
            href="/signup?from=/community"
            className="rounded-[12px] bg-[#0B3B36] px-6 py-3 text-[13.5px] font-bold text-white"
          >
            가입하고 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}
