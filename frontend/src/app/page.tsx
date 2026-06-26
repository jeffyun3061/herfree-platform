'use client';

import { useAuth } from '@/hooks/useAuth';
import { usePostList } from '@/hooks/usePosts';
import { useJournalDashboard } from '@/hooks/useJournal';
import { useJournalCheckin } from '@/hooks/useJournalCheckin';
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
    5,
    '',
    'createdAt,desc',
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
    <div className="bg-wrtn-bg lg:pb-10">
      <div className="page-container max-lg:pb-4">
        <div className="space-y-3">
          <JournalPersonalDashboard
            dashboard={dashboard ?? null}
            isLoading={dashboardLoading}
            onRecordDaily={() => openDailyWizard()}
            onRecordRelapse={openRelapseWizard}
            onRoutineItemClick={handleRoutineItemClick}
            communityPosts={communityPosts.content}
            communityLoading={communityLoading}
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
        <LoadingSpinner label="불러오는 중…" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <GuestHomePage />;
  }

  return <LoggedInHomePage />;
}
