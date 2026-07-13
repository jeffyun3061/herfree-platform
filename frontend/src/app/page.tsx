'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePostList } from '@/hooks/usePosts';
import { useJournalDashboard } from '@/hooks/useJournal';
import { useJournalCheckin } from '@/hooks/useJournalCheckin';
import { useBoards } from '@/hooks/useBoards';
import { BrandMark } from '@/components/brand/BrandMark';
import { GuestHomePage } from '@/components/home/GuestHomePage';
import { JournalPersonalDashboard } from '@/components/journal/JournalPersonalDashboard';
import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { ScreenHeader } from '@/components/layout/ScreenHeader';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

function LoggedInHomePage() {
  const router = useRouter();
  const HOME_COMMUNITY_PREVIEW_SIZE = 4;
  const { postPage: communityPosts, isLoading: communityLoading } = usePostList(
    undefined,
    20,
    '',
    'createdAt,desc',
  );
  const { boards } = useBoards();
  const noticeBoardId = useMemo(
    () => boards.find((board) => board.boardType === 'NOTICE')?.id ?? null,
    [boards],
  );
  const { postPage: noticePosts, isLoading: noticeLoading } = usePostList(
    noticeBoardId,
    1,
    '',
    'createdAt,desc',
    undefined,
    { enabled: noticeBoardId !== null },
  );
  const homeCommunityPosts = useMemo(
    () =>
      communityPosts.content
        .filter((post) => post.boardType !== 'NOTICE')
        .slice(0, HOME_COMMUNITY_PREVIEW_SIZE),
    [communityPosts.content],
  );

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    error: dashboardError,
    refetch: refetchDashboard,
  } = useJournalDashboard(true);

  const {
    routinePulse,
    error: saveError,
    wizardProps,
    handleRoutineItemClick,
    openDailyWizard,
    openRelapseWizard,
  } = useJournalCheckin({
    isLoggedIn: true,
    todayRecord: dashboard?.todayRecord,
    timelineDays: dashboard?.timelineDays ?? [],
    loginFrom: '/',
    onAfterSave: refetchDashboard,
  });

  return (
    <div className="min-h-screen bg-[#F3EDE3] lg:pb-10">
      <div className="home-dashboard-screen mx-auto w-full max-w-app max-lg:pb-28 lg:pb-10">
        <div className="flex w-full flex-col gap-[22px]">
          <ScreenHeader
            align="center"
            inset="narrow"
            titleAs="div"
            title={<BrandMark size="md" showText={false} />}
            titleClassName="text-[0px] leading-none"
          />

          <div className="hf-dashboard-x">
          <JournalPersonalDashboard
            dashboard={dashboard ?? null}
            isLoading={dashboardLoading}
            onRecordDaily={() => router.push('/record')}
            onRecordRelapse={() => router.push('/record?type=relapse')}
            onRoutineItemClick={handleRoutineItemClick}
            noticePost={noticePosts.content[0] ?? null}
            noticeLoading={noticeLoading}
            communityPosts={homeCommunityPosts}
            communityLoading={communityLoading}
            routinePulse={routinePulse}
            afterCommunity={
              <div className="flex flex-col gap-2">
                <QuickAccessSection layout="home" onChecklistClick={() => router.push('/record')} />
                <MedicalDisclaimer
                  compact
                  className="rounded-[14px] border-0 bg-[#F5EFDF] px-4 py-3.5 text-[11.5px] leading-[1.65] text-[#8A6B2A]"
                />
              </div>
            }
          />

          {(dashboardError || saveError) && (
            <ErrorMessage message={dashboardError ?? saveError ?? ''} />
          )}
          </div>
        </div>
      </div>

      <JournalRecordSheet {...wizardProps} />
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn, isReady } = useAuth();

  if (!isReady) {
    return <GuestHomePage />;
  }

  if (!isLoggedIn) {
    return <GuestHomePage />;
  }

  return <LoggedInHomePage />;
}
