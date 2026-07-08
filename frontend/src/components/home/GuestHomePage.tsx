'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { usePostList } from '@/hooks/usePosts';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';
import { useVideos } from '@/hooks/useVideos';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { Post } from '@/domain/post/types';
import type { Video } from '@/domain/video/types';
import { getVideoThumbnail } from '@/domain/video/types';
import { formatRelativeTime, formatRelativeTimeMedia } from '@/domain/common/format';

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
}: {
  activeUsersLabel: string;
  todayStories: number;
}) {
  return (
    <section className="relative z-10 mx-[18px] -mt-[22px] rounded-[18px] bg-[#062B25] px-[18px] py-[15px] text-white shadow-[0_18px_40px_-24px_rgba(3,30,25,.9)]">
      <div className="flex items-center gap-3">
        <div className="flex -space-x-2" aria-hidden>
          {['h', '+', String(Math.max(todayStories, 1)).slice(0, 2)].map((label, index) => (
            <span
              key={`${label}-${index}`}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#062B25] bg-[#1A4A40] text-[11px] font-extrabold text-[#F6E1A6]"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[12.5px] font-extrabold">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6FE0B0] shadow-[0_0_8px_rgba(111,224,176,.8)]" />
            {activeUsersLabel}
          </p>
          <p className="mt-1 text-[10.5px] text-white/58">
            오늘 올라온 이야기 {todayStories.toLocaleString('ko-KR')}개
          </p>
        </div>
      </div>
    </section>
  );
}

function GuestCommunityPreview({ posts, isLoading }: { posts: Post[]; isLoading: boolean }) {
  const previewPosts = posts.slice(0, 5);
  const fallbackPosts = [
    '재발했어요. 어제 너무 무리했...',
    '검사 결과 기다리는 동안 마음 다잡기',
    '처음 진단 후 가장 도움이 됐던 것',
  ];

  return (
    <section className="mx-5 mt-6">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="hf-display text-[21px] font-extrabold text-[#1F2723]">
            방금 올라온 이야기
          </h2>
          <p className="mt-1 text-[12px] font-medium text-[#7B837D]">로그인 후 볼 수 있어요</p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-[#DCCDAF] bg-[#F9F2E7] px-2 py-1 text-[10px] font-bold text-[#9D8556]">
          <LockIcon className="h-3 w-3" />
          회원 전용
        </span>
      </div>

      <div className="relative overflow-hidden rounded-[22px] border border-[#E5D7BE] bg-[#FFFBF4] shadow-[0_16px_34px_-30px_rgba(20,30,25,.35)]">
        <div className="space-y-0 px-4 py-4 opacity-45 blur-[4px]" aria-hidden>
          {isLoading ? (
            <div className="py-10">
              <LoadingSpinner label="이야기를 불러오는 중..." />
            </div>
          ) : previewPosts.length > 0 ? (
            previewPosts.map((post) => (
              <PreviewPostRow
                key={post.id}
                title={getPostPreview(post)}
                author={post.authorNickname || 'herfree'}
                time={formatRelativeTime(post.createdAt)}
              />
            ))
          ) : (
            fallbackPosts.map((title) => (
              <PreviewPostRow key={title} title={title} author="herfree" time="방금 전" />
            ))
          )}
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[linear-gradient(180deg,rgba(255,251,244,.25)_0%,rgba(255,251,244,.88)_42%,#FFFBF4_100%)] px-7 text-center">
          <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[#0B3B36] text-[#F0C778] shadow-[0_12px_24px_-12px_rgba(11,59,54,.75)]">
            <LockIcon className="h-5 w-5" />
          </span>
          <p className="text-[15px] font-extrabold text-[#1D2824]">회원만 이용할 수 있는 공간이에요</p>
          <p className="mt-1.5 text-[12.5px] leading-[1.65] text-[#68716B]">
            가입하면 익명으로 올라온 이야기를
            <br />
            안전하게 확인할 수 있어요
          </p>
          <Link
            href="/signup?from=/community"
            className="mt-4 rounded-[13px] bg-[#0B3B36] px-6 py-3 text-[13.5px] font-extrabold text-white shadow-[0_10px_22px_-16px_rgba(11,59,54,.9)]"
          >
            가입하고 둘러보기
          </Link>
        </div>
      </div>
    </section>
  );
}

function PreviewPostRow({ title, author, time }: { title: string; author: string; time: string }) {
  return (
    <div className="flex items-center gap-3 border-b border-[#EFE6D5] py-3 last:border-b-0">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#EDF3EC] text-[13px] font-extrabold text-[#0B3B36]">
        {author.charAt(0) || 'h'}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-[#1F2723]">{author}</p>
        <p className="mt-0.5 truncate text-[13.5px] text-[#303A35]">{title}</p>
      </div>
      <span className="shrink-0 text-[11px] text-[#9AA19C]">{time}</span>
    </div>
  );
}

function LatestVideoSection({
  video,
  isLoading,
}: {
  video: Video | null;
  isLoading: boolean;
}) {
  return (
    <section className="mx-5 mt-6 rounded-[23px] border border-[#E3D4BA] bg-[#FBF4E8] p-4 shadow-[0_16px_34px_-30px_rgba(20,30,25,.35)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-extrabold uppercase tracking-[.12em] text-[#A7864B]">
            Herfree Video
          </p>
          <h2 className="hf-display mt-1 text-[20px] font-extrabold text-[#1F2723]">최신 영상</h2>
        </div>
        <Link
          href="/videos"
          className="rounded-full bg-white px-3 py-1.5 text-[11.5px] font-extrabold text-[#0B3B36] shadow-[0_8px_16px_-14px_rgba(11,59,54,.8)]"
        >
          더보기
        </Link>
      </div>

      {isLoading ? (
        <div className="aspect-video animate-pulse rounded-[18px] bg-[#E8DFD0]" />
      ) : video ? (
        <Link href={`/videos/${video.id}`} className="block">
          <article className="overflow-hidden rounded-[18px] bg-[#052D27] text-white shadow-[0_16px_28px_-22px_rgba(5,45,39,.9)]">
            <div className="relative aspect-video overflow-hidden">
              <img
                src={getVideoThumbnail(video)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,18,15,.1)_0%,rgba(2,18,15,.14)_45%,rgba(2,18,15,.68)_100%)]" />
              <span className="absolute left-3 top-3 rounded-full bg-[#F0C778] px-2.5 py-1 text-[10.5px] font-extrabold text-[#07251F]">
                최신 영상
              </span>
              <span className="absolute left-1/2 top-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-[17px] text-[#0B3B36] shadow-[0_12px_26px_-16px_rgba(0,0,0,.85)]">
                ▶
              </span>
              <div className="absolute bottom-0 left-0 right-0 p-3.5">
                <h3 className="line-clamp-2 text-[15px] font-extrabold leading-[1.35]">
                  {video.title}
                </h3>
              </div>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-2.5 text-[11.5px] text-white/72">
              <span>YouTube</span>
              <span className="h-0.5 w-0.5 rounded-full bg-white/45" />
              <span>{formatRelativeTimeMedia(video.createdAt)}</span>
            </div>
          </article>
        </Link>
      ) : (
        <div className="rounded-[18px] bg-white px-4 py-8 text-center text-[13px] font-semibold text-[#6E766F]">
          공개된 영상이 아직 없어요.
        </div>
      )}
    </section>
  );
}

function GuestQuickLinks() {
  const links = [
    { href: '/consult', label: '1:1 비밀상담', icon: 'lock' },
    { href: '/contents', label: '칼럼', icon: 'book' },
    { href: '/qna', label: 'FAQ', icon: 'help' },
    { href: '/notice', label: '공지사항', icon: 'notice' },
  ];

  return (
    <section className="mx-6 mt-7">
      <p className="mb-4 text-[12px] font-extrabold tracking-[0.08em] text-[#9A9184]">
        바로가기
      </p>
      <div className="grid grid-cols-4 gap-2.5">
        {links.map((item) => (
          <Link key={item.href} href={item.href} className="group flex min-w-0 flex-col items-center gap-2">
            <span className="flex h-14 w-14 items-center justify-center rounded-[18px] border border-[#ECE5D8] bg-white text-[#0B3B36] shadow-[0_8px_18px_-14px_rgba(7,37,31,.4)] transition-colors group-hover:bg-[#F8F1E6]">
              <QuickLinkIcon name={item.icon} />
            </span>
            <span className="max-w-full truncate text-center text-[10.5px] font-semibold text-[#5B6864]">
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function QuickLinkIcon({ name }: { name: string }) {
  if (name === 'lock') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <rect x="5" y="11" width="14" height="9" rx="2" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </svg>
    );
  }
  if (name === 'book') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5z" />
      </svg>
    );
  }
  if (name === 'notice') {
    return (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    );
  }
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9a2.5 2.5 0 1 1 3.9 2.05c-.8.5-1.4 1.05-1.4 2.2" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function GuestQuietFooter() {
  return (
    <footer className="px-6 pb-7 pt-6 text-center">
      <p className="hf-display text-[14px] leading-[1.7] text-[#8A9089]">오늘도 편안하게</p>
      <p className="mt-2 text-[10.5px] text-[#B4B2A6]">herfree · 익명 기반 비공개 커뮤니티</p>
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

export function GuestHomePage() {
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(
    undefined,
    5,
    '',
    'createdAt,desc',
  );
  const { data: homeStats, isLoading: statsLoading } = useJournalPublicHomeStats();
  const { videoPage, isLoading: videosLoading } = useVideos(6);

  const activeUsersLabel = formatMemberStatus(homeStats?.totalUsers, statsLoading);
  const todayStories = recentPosts.totalElements || recentPosts.content.length;
  const latestVideo = useMemo(() => {
    if (videoPage.content.length === 0) return null;
    return videoPage.content.reduce((latest, video) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const videoTime = new Date(video.createdAt).getTime();
      return videoTime > latestTime ? video : latest;
    }, videoPage.content[0]);
  }, [videoPage.content]);

  return (
    <div className="min-h-screen bg-[#F3EDE3] pb-7">
      <GuestHomeHero />
      <MemberStatusStrip activeUsersLabel={activeUsersLabel} todayStories={todayStories} />
      <GuestCommunityPreview posts={recentPosts.content} isLoading={recentLoading} />
      <LatestVideoSection video={latestVideo} isLoading={videosLoading} />
      <GuestQuickLinks />
      <div className="mx-5 mt-5">
        <MedicalDisclaimer compact />
      </div>
      <GuestQuietFooter />
    </div>
  );
}
