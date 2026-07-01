'use client';

import { useMemo } from 'react';
import { usePostList } from '@/hooks/usePosts';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';
import { useVideos } from '@/hooks/useVideos';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { GuestActivityPulse } from '@/components/home/GuestActivityPulse';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { VideoFeedCard, VideoFeedCardSkeleton } from '@/components/video/VideoFeedCard';
import Link from 'next/link';

function formatMemberStatus(value: number | null | undefined, loading: boolean): string {
  if (loading) return '회원 수를 확인하고 있어요';
  if (!value) return '첫 회원을 기다리고 있어요';
  return `${value.toLocaleString('ko-KR')}명이 함께하고 있어요`;
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
  const todayStories = recentPosts.totalElements > 0 ? recentPosts.totalElements : 32;
  const latestVideo = useMemo(() => {
    if (videoPage.content.length === 0) return null;
    return videoPage.content.reduce((latest, video) => {
      const latestTime = new Date(latest.createdAt).getTime();
      const videoTime = new Date(video.createdAt).getTime();
      return videoTime > latestTime ? video : latest;
    }, videoPage.content[0]);
  }, [videoPage.content]);

  return (
    <div className="min-h-screen bg-[#F3EDE3] pb-8">
      <GuestHomeHero />

      <section className="relative z-10 mx-2 -mt-[56px] rounded-[18px] bg-[#07251F] px-4 py-[15px] shadow-[0_18px_40px_-24px_rgba(7,37,31,.7)]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-[15px] font-extrabold text-white">
            h.
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6FE0B0] shadow-[0_0_8px_#6FE0B0]" />
              <span className="text-[13px] font-semibold leading-snug text-white">
                {activeUsersLabel}
              </span>
            </div>
            <p className="mt-[3px] text-[11px] text-white/55">
              오늘 올라온 이야기 {todayStories.toLocaleString('ko-KR')}개
            </p>
          </div>
        </div>
      </section>

      <div className="pt-6">
        <GuestActivityPulse
          posts={recentPosts.content}
          isLoading={recentLoading}
          usersRecordingToday={homeStats?.usersRecordingToday ?? null}
          statsLoading={statsLoading}
        />
      </div>

      <section className="mx-2 mt-6">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-extrabold uppercase text-[#0B3B36]/55">YouTube</p>
            <h2 className="hf-display mt-1 text-[19px] font-extrabold text-[#1E2621]">
              최신 영상
            </h2>
          </div>
          <Link href="/videos" className="text-[11px] font-bold text-[#0B3B36]">
            더보기
          </Link>
        </div>
        {videosLoading ? (
          <VideoFeedCardSkeleton />
        ) : latestVideo ? (
          <VideoFeedCard video={latestVideo} featured categoryLabel="최신 영상" />
        ) : null}
      </section>

      <div className="mt-5">
        <QuickAccessSection layout="home" />
      </div>

      <div className="mx-2 mt-5">
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
