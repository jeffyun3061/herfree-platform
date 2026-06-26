'use client';

import { usePostList } from '@/hooks/usePosts';
import { useJournalPublicHomeStats } from '@/hooks/useJournal';
import { GuestHomeHero } from '@/components/home/GuestHomeHero';
import { GuestActivityPulse } from '@/components/home/GuestActivityPulse';
import { GuestPeaceCta } from '@/components/home/GuestPeaceCta';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';

export function GuestHomePage() {
  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(undefined, 6);
  const { data: homeStats, isLoading: statsLoading } = useJournalPublicHomeStats();

  return (
    <div className="min-h-screen bg-[#F3EDE3] pb-8">
      <GuestHomeHero />

      <div className="relative z-10 mx-[18px] -mt-[22px] rounded-[18px] bg-[#07251F] px-[18px] py-[15px] shadow-[0_18px_40px_-24px_rgba(7,37,31,.7)]">
        <div className="flex items-center gap-[13px]">
          <div className="flex items-center">
            {['h', '+', '3', ''].map((label, index) => (
              <span
                key={index}
                className="flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 border-[#07251F] text-[12px] font-bold text-white first:ml-0"
                style={{
                  marginLeft: index === 0 ? 0 : -9,
                  background: ['#2E5A4E', '#3A6B4B', '#4C5E3A', '#2C5247'][index],
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#6FE0B0] shadow-[0_0_8px_#6FE0B0]" />
              <span className="truncate text-[13px] font-semibold text-white">
                {statsLoading || !homeStats?.usersRecordingToday
                  ? '함께하고 있어요'
                  : `${homeStats.usersRecordingToday.toLocaleString('ko-KR')}명이 함께하고 있어요`}
              </span>
            </div>
            <p className="mt-[3px] text-[11px] text-white/55">
              오늘 올라온 이야기를 조용히 둘러보세요
            </p>
          </div>
        </div>
      </div>

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

      <div className="px-6 pt-6 text-center">
        <p className="hf-display text-[14px] leading-[1.7] text-[#8A9089]">오늘은 담담하게</p>
        <p className="mt-2 text-[10.5px] text-[#B4B2A6]">헤르프리 · 익명 기반 비공개 커뮤니티</p>
      </div>

      <div className="mx-[18px] mt-5">
        <MedicalDisclaimer compact />
      </div>
    </div>
  );
}
