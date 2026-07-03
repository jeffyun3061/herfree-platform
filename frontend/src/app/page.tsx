'use client';

import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePostList } from '@/hooks/usePosts';
import { useJournalDashboard } from '@/hooks/useJournal';
import { useJournalCheckin } from '@/hooks/useJournalCheckin';
import { useBoards } from '@/hooks/useBoards';
import { useVideos } from '@/hooks/useVideos';
import { GuestHomePage } from '@/components/home/GuestHomePage';
import { JournalPersonalDashboard } from '@/components/journal/JournalPersonalDashboard';
import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';
import { QuickAccessSection } from '@/components/home/QuickAccessSection';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

function LoggedInHomePage() {
  const { postPage: communityPosts, isLoading: communityLoading } = usePostList(
    undefined,
    6,
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
  const { videoPage, isLoading: videoLoading } = useVideos(1);
  const homeCommunityPosts = useMemo(
    () => communityPosts.content.filter((post) => post.boardType !== 'NOTICE').slice(0, 5),
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

  const hasTodayRecord = Boolean(dashboard?.todayRecord);

  return (
    <div className="min-h-screen bg-[#F3EDE3] lg:pb-10">
      <div className="page-container home-dashboard-screen max-lg:pb-28">
        <div className="space-y-3">
          <JournalPersonalDashboard
            dashboard={dashboard ?? null}
            isLoading={dashboardLoading}
            onRecordDaily={() => openDailyWizard()}
            onRecordRelapse={openRelapseWizard}
            onRoutineItemClick={handleRoutineItemClick}
            noticePost={noticePosts.content[0] ?? null}
            noticeLoading={noticeLoading}
            communityPosts={homeCommunityPosts}
            communityLoading={communityLoading}
            latestVideo={videoPage.content[0] ?? null}
            videoLoading={videoLoading}
            routinePulse={routinePulse}
            hasTodayRecord={hasTodayRecord}
            afterCommunity={
              <div className="flex flex-col gap-2">
                <QuickAccessSection layout="home" onChecklistClick={() => openDailyWizard()} />
                <MedicalDisclaimer compact />
              </div>
            }
          />

          {(dashboardError || saveError) && (
            <ErrorMessage message={dashboardError ?? saveError ?? ''} />
          )}
        </div>
      </div>

      <JournalRecordSheet {...wizardProps} />
    </div>
  );
}

export default function HomePage() {
  const { isLoggedIn, isReady } = useAuth();

  if (!isReady) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-canvas">
        <LoadingSpinner label="불러오는 중..." />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <GuestHomePage />;
  }

  return <LoggedInHomePage />;
}
