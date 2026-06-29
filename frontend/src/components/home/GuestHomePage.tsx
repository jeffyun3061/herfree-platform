'use client';

import { usePostList } from '@/hooks/usePosts';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { GuestActivityPulse } from '@/components/home/GuestActivityPulse';
import { GuestPeaceCta } from '@/components/home/GuestPeaceCta';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';

function formatMemberStatus(value: number | null | undefined, loading: boolean): string {
  if (loading) return '회원 수를 확인하고 있어요';
  if (!value) return '첫 회원을 기다리고 있어요';
  return `${value.toLocaleString('ko-KR')}명이 함께하고 있어요`;
}

export function GuestHomePage() {
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(undefined, 6);
  const { data: homeStats, isLoading: statsLoading } = useJournalPublicHomeStats();
  const activeUsersLabel = formatMemberStatus(homeStats?.totalUsers, statsLoading);
  const todayStories = recentPosts.totalElements > 0 ? recentPosts.totalElements : 32;

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

      <GuestPeaceCta />

      <QuickAccessSection layout="home" />

      <div className="px-4 pt-6 text-center">
        <p className="hf-display text-[14px] leading-[1.7] text-[#8A9089]">
          오늘은 담담하게
        </p>
        <p className="mt-2 text-[10.5px] text-[#B4B2A6]">
          헤르프리 · 익명 기반 비공개 커뮤니티
        </p>
      </div>

      <div className="mx-2 mt-5">
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
