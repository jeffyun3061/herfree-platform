'use client';

import Link from 'next/link';
import { usePostList } from '@/hooks/usePosts';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';

const MEMBER_AVATARS = [
  { emoji: '🌙', bg: '#2E5A4E' },
  { emoji: '🌿', bg: '#3A6B4B' },
  { emoji: '✨', bg: '#4C5E3A' },
  { emoji: '🍃', bg: '#2C5247' },
] as const;

const FALLBACK_PREVIEW_POSTS = [
  {
    emoji: '🌙',
    name: '프리한하루',
    time: '2시간 전',
    text: '오늘 처음 90일 채웠어요, 다들 응원 감사해요 ㅎㅎ',
    warm: '12',
    replies: '4',
  },
  {
    emoji: '🌿',
    name: '조용한밤',
    time: '4시간 전',
    text: '스트레스 받으면 컨디션에 진짜 영향 있더라고요',
    warm: '8',
    replies: '2',
  },
  {
    emoji: '✨',
    name: '별빛아래',
    time: '6시간 전',
    text: '영양제 먹는 타이밍 다들 어떻게 하세요?',
    warm: '5',
    replies: '7',
  },
] as const;

function formatMemberStatus(value: number | null | undefined, loading: boolean): string {
  if (loading) return '회원 수 확인 중';
  if (!value) return '첫 회원을 기다리고 있어요';
  return `${value.toLocaleString('ko-KR')}명이 함께하고 있어요`;
}

function getPostPreview(post: Post): string {
  const preview = post.contentPreview?.trim();
  return preview || post.title;
}

function MemberStatusStrip({
  activeUsersLabel,
  todayStories,
  storiesLoading,
}: {
  activeUsersLabel: string;
  todayStories: number;
  storiesLoading: boolean;
}) {
  return (
    <section className="relative z-10 mx-5 -mt-[22px] rounded-[18px] bg-[#07251F] px-5 py-[15px] text-white shadow-[0_18px_40px_-24px_rgba(7,37,31,.7)]">
      <div className="flex items-center gap-[13px]">
        <div className="flex items-center" aria-hidden>
          {MEMBER_AVATARS.map((avatar, index) => (
            <span
              key={avatar.emoji}
              className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#07251F] text-[13px]"
              style={{
                background: avatar.bg,
                marginLeft: index === 0 ? 0 : -9,
              }}
            >
              {avatar.emoji}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[13px] font-semibold text-white">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6FE0B0] shadow-[0_0_8px_rgba(111,224,176,.8)]" />
            {activeUsersLabel}
          </p>
          <p className="mt-[3px] text-[12px] text-white/55">
            {storiesLoading ? '오늘 올라온 글 확인 중' : `오늘 올라온 글 ${todayStories.toLocaleString('ko-KR')}개`}
          </p>
        </div>
      </div>
    </section>
  );
}

type PreviewPost = {
  emoji: string;
  name: string;
  time: string;
  text: string;
  warm: string;
  replies: string;
};

function mapPostToPreview(post: Post, index: number): PreviewPost {
  const fallbackEmoji = MEMBER_AVATARS[index % MEMBER_AVATARS.length]?.emoji ?? '🌿';
  return {
    emoji: fallbackEmoji,
    name: post.authorNickname || 'herfree',
    time: formatRelativeTime(post.createdAt),
    text: getPostPreview(post),
    warm: String(post.reactionCount ?? 0),
    replies: String(post.commentCount ?? 0),
  };
}

function GuestCommunityPreview({
  posts,
  isLoading,
}: {
  posts: Post[];
  isLoading: boolean;
}) {
  const previewPosts: PreviewPost[] =
    posts.length > 0
      ? posts.slice(0, 3).map(mapPostToPreview)
      : [...FALLBACK_PREVIEW_POSTS];

  return (
    <section className="px-5 pt-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="hf-display text-[19px] font-extrabold tracking-[-0.01em] text-[#1E2621]">
          방금 올라온 이야기
        </h2>
        <span className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-[#A6ABA0]">
          <LockIcon className="h-3 w-3 stroke-[#A6ABA0]" />
          회원 전용
        </span>
      </div>

      <div className="relative">
        <div
          className="flex flex-col gap-[11px] blur-[5px] opacity-50"
          aria-hidden
        >
          {isLoading ? (
            <div className="rounded-[16px] bg-white px-4 py-10 shadow-[0_12px_28px_-24px_rgba(20,30,25,.3)]">
              <LoadingSpinner label="이야기를 불러오는 중..." />
            </div>
          ) : (
            previewPosts.map((post) => <PreviewPostCard key={`${post.name}-${post.time}`} post={post} />)
          )}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(243,237,227,.15)_0%,rgba(243,237,227,.8)_36%,#F3EDE3_70%)] px-7 text-center">
          <span className="mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-full bg-[#0B3B36] text-[#F0C778] shadow-[0_10px_22px_-10px_rgba(11,59,54,.6)]">
            <LockIcon className="h-5 w-5" />
          </span>
          <p className="text-[15px] font-bold text-[#1E2621]">회원만 볼 수 있는 공간이에요</p>
          <Link
            href="/login?from=/community"
            className="mt-[18px] rounded-[12px] bg-[#0B3B36] px-[26px] py-3 text-[13.5px] font-bold text-white"
          >
            로그인하기
          </Link>
        </div>
      </div>
    </section>
  );
}

function PreviewPostCard({ post }: { post: PreviewPost }) {
  return (
    <article className="rounded-[16px] bg-white px-4 py-[15px] shadow-[0_1px_2px_rgba(20,30,25,.04),0_12px_28px_-24px_rgba(20,30,25,.3)]">
      <div className="mb-2.5 flex items-center gap-[9px]">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#EDF2EC] text-[14px]">
          {post.emoji}
        </span>
        <span className="truncate text-[13px] font-semibold text-[#2C342E]">{post.name}</span>
        <span className="ml-auto shrink-0 text-[12px] hf-text-muted">{post.time}</span>
      </div>
      <p className="text-[13.5px] leading-[1.6] tracking-[-0.01em] text-[#2C342E]">{post.text}</p>
      <div className="mt-[11px] flex items-center gap-3.5 text-[12px] text-[#A6ABA0]">
        <span className="inline-flex items-center gap-1">
          <HeartIcon />
          {post.warm}
        </span>
        <span className="inline-flex items-center gap-1">
          <ReplyIcon />
          {post.replies}
        </span>
      </div>
    </article>
  );
}

function GuestJournalStartCard() {
  return (
    <section className="mx-[18px] mt-[26px] rounded-[20px] border border-[#DCE6DC] bg-[#EDF2EC] px-[22px] py-[22px]">
      <h2 className="hf-display text-[17px] font-bold leading-[1.5] text-[#1E2621]">
        막 알게 되셨나요?
      </h2>
      <p className="mt-2 text-[13px] leading-[1.75] text-[#54614F]">
        관리의 시작은 기록부터.
        <br />
        오늘부터 개인 일지를 작성해보세요.
      </p>
      <Link
        href="/login?from=/journal"
        className="mt-[18px] flex min-h-12 items-center justify-center rounded-[12px] bg-[#0B3B36] text-[14px] font-bold text-white"
      >
        오늘부터 시작하기
      </Link>
      <Link
        href="/community"
        className="mt-[13px] block text-center text-[12.5px] font-semibold text-[#54614F]"
      >
        먼저 둘러볼게요 ›
      </Link>
    </section>
  );
}

function GuestQuietFooter() {
  return (
    <footer className="px-6 pb-2 pt-[26px] text-center">
      <p className="hf-display text-[14px] leading-[1.7] text-[#8A9089]">오늘도, 담담하게</p>
      <p className="mt-2 text-[12px] text-[#B4B2A6]">헤르프리 · 익명 기반 비공개 커뮤니티</p>
    </footer>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#C0AE8C" strokeWidth="2" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  );
}

function ReplyIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B4B2A6" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
    </svg>
  );
}

export function GuestHomePage() {
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(
    undefined,
    5,
    '',
    'createdAt,desc',
  );
  const activeUsersLabel = formatMemberStatus(undefined, false);
  const todayStories = recentLoading ? 0 : recentPosts.totalElements || recentPosts.content.length;
  return (
    <div className="min-h-screen bg-[#F3EDE3] pb-7">
      <GuestHomeHero />
      <MemberStatusStrip activeUsersLabel={activeUsersLabel} todayStories={todayStories} storiesLoading={recentLoading} />
      <GuestCommunityPreview
        posts={recentPosts.content}
        isLoading={recentLoading}
      />
      <GuestJournalStartCard />
      <div className="hf-dashboard-x">
        <QuickAccessSection layout="home" />
      </div>
      <GuestQuietFooter />
    </div>
  );
}
