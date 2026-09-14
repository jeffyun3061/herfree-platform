'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePostList } from '@/hooks/usePosts';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import type { Post } from '@/domain/post/types';
import { formatRelativeTime } from '@/domain/common/format';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';

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

function getPostPreview(post: Post): string {
  const preview = post.contentPreview?.trim();
  return preview || post.title;
}

function MemberStatusStrip({
  activeMemberCount,
  statsError,
  statsLoading,
  todayStories,
  storiesLoading,
}: {
  activeMemberCount: number;
  statsError: string | null;
  statsLoading: boolean;
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
            {statsLoading
              ? '함께하는 회원 수를 확인하고 있어요'
              : statsError
                ? '함께하는 공간이에요'
                : `${activeMemberCount.toLocaleString('ko-KR')}명이 함께하고 있어요`}
          </p>
          <p className="mt-[3px] text-[12px] text-white/55">
            {storiesLoading ? '최근 올라온 이야기 확인 중' : `최근 올라온 이야기 ${todayStories.toLocaleString('ko-KR')}개`}
          </p>
        </div>
      </div>
    </section>
  );
}

function InfoIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[#A08E6A]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5M12 8h.01" />
    </svg>
  );
}

function GuestJournalTryCard() {
  const [sleep, setSleep] = useState(7);
  const [supplement, setSupplement] = useState<string | null>(null);
  const [stress, setStress] = useState<string | null>(null);
  const sleepPercent = ((sleep - 3) / 9) * 100;

  return (
    <section className="px-5 pt-7">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="hf-display text-[19px] font-extrabold tracking-[-0.01em] text-[#1E2621]">지금 눌러보세요</h2>
        <span className="text-[11.5px] text-[#7C8279]">실제 기록 화면</span>
      </div>
      <div className="rounded-[20px] border border-[#EADFCB] bg-[#FBF6EA] p-5 shadow-[0_14px_32px_-26px_rgba(7,37,31,.4)]">
        <p className="text-[14px] font-bold text-[#1E2621]">오늘 기본 컨디션</p>
        <p className="mt-1 text-[11.5px] text-[#7C8279]">수면 · 영양제 · 스트레스</p>

        <div className="mt-[18px]">
          <p className="mb-2.5 text-[13px] text-[#5C645A]">😴 수면 시간 — <b className="text-[#1E2621]">{sleep}시간</b></p>
          <input aria-label="수면 시간" type="range" min="3" max="12" value={sleep} onChange={(event) => setSleep(Number(event.target.value))} className="h-1.5 w-full accent-[#15695E]" style={{ background: `linear-gradient(to right, #15695E ${sleepPercent}%, #EDE7DA ${sleepPercent}%)` }} />
        </div>

        <div className="mt-[18px]">
          <p className="mb-2.5 text-[13px] text-[#5C645A]">💊 영양제 복용</p>
          <div className="flex gap-2">
            {['복용', '빠뜨림'].map((item) => <button type="button" key={item} onClick={() => setSupplement(item)} className={`flex-1 rounded-[11px] border px-2 py-2.5 text-[12.5px] ${supplement === item ? 'border-[#1D9E75] bg-[#E3F1EA] font-bold text-[#04342C]' : 'border-[#E5D9C2] bg-[#F3ECDD] text-[#5C645A]'}`}>{item}</button>)}
          </div>
        </div>

        <div className="mt-[18px]">
          <p className="mb-2.5 text-[13px] text-[#5C645A]">🧠 스트레스</p>
          <div className="flex gap-2">
            {['낮음', '보통', '높음'].map((item) => <button type="button" key={item} onClick={() => setStress(item)} className={`flex-1 rounded-[11px] border px-2 py-2.5 text-[12.5px] ${stress === item ? 'border-[#1D9E75] bg-[#E3F1EA] font-bold text-[#04342C]' : 'border-[#E5D9C2] bg-[#F3ECDD] text-[#5C645A]'}`}>{item}</button>)}
          </div>
        </div>

        <div className="mt-[18px] flex items-start gap-2 border-t border-[#EFE6D5] pt-[18px] text-[12px] leading-[1.65] text-[#7C8279]"><InfoIcon /> <span>전조증상·증상 기록은 가입 후에 할 수 있어요.</span></div>
        {supplement && stress && <div className="mt-[18px] rounded-xl bg-[#E3F1EA] px-3.5 py-3 text-[12.5px] leading-[1.6] text-[#04342C]">🌿 이렇게 하루 10초예요. 가입하면 지금 기록이 저장되고, 14일 뒤엔 나만의 흐름이 보여요.</div>}
      </div>
      <Link href="/signup" className="mt-3 flex items-center justify-center rounded-[13px] bg-[#0B3B36] px-4 py-[15px] text-[14.5px] font-bold text-white">무료로 기록 시작하기</Link>
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
  const { data: homeStats, isLoading: statsLoading, error: statsError } = useJournalPublicHomeStats();
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(
    undefined,
    5,
    '',
    'createdAt,desc',
  );
  const todayStories = homeStats?.postsToday ?? (recentLoading ? 0 : recentPosts.content.length);
  return (
    <div className="min-h-screen bg-[#F3EDE3] pb-7">
      <GuestHomeHero />
      <MemberStatusStrip
        activeMemberCount={homeStats?.activeMemberCount ?? 0}
        statsError={statsError}
        statsLoading={statsLoading}
        todayStories={todayStories}
        storiesLoading={recentLoading || statsLoading}
      />
      <section className="px-5 pt-7">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="hf-display text-[19px] font-extrabold tracking-[-0.01em] text-[#1E2621]">무료 개인 건강일지</h2>
          <span className="text-[11.5px] text-[#7C8279]">예시 화면</span>
        </div>
        <p className="mb-3.5 text-[12.5px] leading-[1.65] text-[#5C645A]">매일의 컨디션을 기록하면 나만의 흐름이 보여요.</p>
        <div className="overflow-hidden rounded-[20px] shadow-[0_22px_46px_-30px_rgba(7,37,31,.6)]">
          <div className="relative h-[158px] bg-cover bg-center" style={{ backgroundImage: `linear-gradient(180deg, rgba(20,40,44,.1), rgba(9,32,30,.7)), url(${PUBLIC_IMAGES.journalDashboardCard})` }}>
            <div className="absolute inset-x-[18px] bottom-[15px] text-white"><p className="text-[12px]">● 오늘 상태</p><p className="hf-display mt-1 text-[25px] font-bold">증상 없음</p><p className="mt-1 text-[12px]">마지막 증상 이후 6일째 · 수면 7h</p></div>
          </div>
          <div className="grid grid-cols-4 gap-2 bg-[#07251F] px-[18px] py-3.5 text-center text-white"><div><b className="text-[18px]">28<span className="text-[11px] font-normal">일</span></b><p className="text-[10.5px] text-white/60">재발 간격</p></div><div><b className="text-[18px]">82<span className="text-[11px] font-normal">%</span></b><p className="text-[10.5px] text-white/60">영양제</p></div><div><b className="text-[18px]">6.8<span className="text-[11px] font-normal">h</span></b><p className="text-[10.5px] text-white/60">평균 수면</p></div><div><b className="text-[18px]">3<span className="text-[11px] font-normal">회</span></b><p className="text-[10.5px] text-white/60">올해 재발</p></div></div>
        </div>
      </section>
      <GuestJournalTryCard />
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
