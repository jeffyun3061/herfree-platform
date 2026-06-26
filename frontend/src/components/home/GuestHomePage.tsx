'use client';



import { usePostList } from '@/hooks/usePosts';

import { useJournalPublicHomeStats } from '@/hooks/useJournal';

import { GuestHomeHero } from '@/components/home/GuestHomeHero';

import { GuestActivityPulse } from '@/components/home/GuestActivityPulse';

import { GuestPeaceCta } from '@/components/home/GuestPeaceCta';

import { QuickAccessSection } from '@/components/home/QuickAccessSection';

import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';

import { ButtonLink } from '@/components/ui/Button';



export function GuestHomePage() {

  const { postPage: recentPosts, isLoading: recentLoading } = usePostList(undefined, 6);

  const { data: homeStats, isLoading: statsLoading } = useJournalPublicHomeStats();



  return (

    <div className="bg-[#EFF1F0] lg:pb-10">

      <div className="page-container max-lg:pb-4">

        <div className="journal-home-stack mx-auto w-full max-w-app">

          <GuestHomeHero />



          <ButtonLink

            href="/community"

            fullWidth

            size="md"

            className="journal-record-cta gap-2 shadow-sm"

          >

            지금 둘러보기

          </ButtonLink>



          <ButtonLink

            href="/signup?from=/journal"

            variant="secondary"

            fullWidth

            size="md"

            className="journal-record-cta shadow-sm"

          >

            개인일지부터 시작할게요

          </ButtonLink>



          <GuestActivityPulse

            posts={recentPosts.content}

            isLoading={recentLoading}

            usersRecordingToday={homeStats?.usersRecordingToday ?? null}

            statsLoading={statsLoading}

          />



          <GuestPeaceCta />



          <QuickAccessSection layout="home" />



          <MedicalDisclaimer compact />

        </div>

      </div>

    </div>

  );

}

