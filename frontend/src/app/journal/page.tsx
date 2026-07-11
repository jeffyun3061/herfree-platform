'use client';



import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { LoggedOutFeaturePrompt } from '@/components/auth/LoggedOutFeaturePrompt';
import { InlineTopActions } from '@/components/layout/InlineTopActions';

import { JournalRecordFromQuery } from '@/components/journal/JournalRecordFromQuery';

import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';
import { JournalInsightsPanel } from '@/components/journal/JournalInsightsCarousel';
import { JournalInlineRecordForm } from '@/components/journal/JournalInlineRecordForm';

import { JournalTabBar, type JournalTabId } from '@/components/journal/JournalTabBar';

import { JournalHistoryList } from '@/components/journal/JournalHistoryList';

import { ErrorMessage } from '@/components/ui/ErrorMessage';

import { ConfirmModal } from '@/components/ui/ConfirmModal';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { type JournalRecord } from '@/domain/journal/types';

import { fetchJournalRecordByDate } from '@/lib/api/journal';

import { useAuth } from '@/hooks/useAuth';

import { useJournalCheckin } from '@/hooks/useJournalCheckin';

import {

  useJournalDashboard,

  useJournalDelete,

  useJournalInsights,

  useJournalMutation,

  useJournalMonthlyRecords,

  useJournalRecords,

  useJournalReviewSummary,

} from '@/hooks/useJournal';

function JournalPageContent() {

  const { isLoggedIn, isReady } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<JournalTabId>('today');

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [historyPage, setHistoryPage] = useState(0);

  const [historyFilter, setHistoryFilter] = useState<'relapse' | 'all'>('all');

  const [calendarMonth, setCalendarMonth] = useState(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}-01`;
  });

  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);



  const historyHadSymptoms = historyFilter === 'relapse' ? true : undefined;



  const {

    data: dashboard,

    isLoading: dashboardLoading,

    refetch: refetchDashboard,

  } = useJournalDashboard(isLoggedIn && isReady);

  const {

    data: reviewSummary,

    isLoading: reviewSummaryLoading,

    refetch: refetchReviewSummary,

  } = useJournalReviewSummary(isLoggedIn && isReady);

  const { data: insights } = useJournalInsights(isLoggedIn && isReady);

  const { data: historyPageData, isLoading: historyLoading, refetch: refetchHistory } =

    useJournalRecords(historyPage, 10, isLoggedIn && isReady, historyHadSymptoms);

  const calendarDate = new Date(`${calendarMonth}T00:00:00`);
  const calendarYear = calendarDate.getFullYear();
  const calendarMonthNumber = calendarDate.getMonth() + 1;
  const { data: monthlyRecordsRaw, refetch: refetchMonthlyRecords } = useJournalMonthlyRecords(
    calendarYear,
    calendarMonthNumber,
    isLoggedIn && isReady,
    historyHadSymptoms,
  );
  const monthlyRecords = monthlyRecordsRaw ?? [];

  const { remove, isDeleting, error: deleteError } = useJournalDelete();
  const {
    save: saveInlineRecord,
    isSubmitting: isInlineSubmitting,
    error: inlineSaveError,
  } = useJournalMutation();



  const refreshAll = async () => {

    await Promise.all([refetchDashboard(), refetchHistory(), refetchReviewSummary(), refetchMonthlyRecords()]);

  };



  const {

    error,

    wizardProps,

    openWizard,

  } = useJournalCheckin({

      isLoggedIn,

    todayRecord: dashboard?.todayRecord,

    timelineDays: dashboard?.timelineDays ?? [],

    loginFrom: '/journal',

    onAfterSave: async () => {

      await refreshAll();

      setActiveTab('records');

      setSaveMessage('기록이 저장됐어요.');

      setTimeout(() => setSaveMessage(null), 3000);

    },

  });



  const displayHistory = historyPageData?.content ?? [];

  useEffect(() => {

    setHistoryPage(0);

  }, [historyFilter]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'today' || tab === 'records' || tab === 'insights') {
      setActiveTab(tab);
    }
  }, [searchParams]);



  const handleDelete = async () => {

    if (deleteTargetId == null) return;

    await remove(deleteTargetId);

    setDeleteTargetId(null);

    await refreshAll();

  };



  const handleTimelineDaySelect = async (date: string) => {

    if (!isLoggedIn) return;

    try {

      const record = await fetchJournalRecordByDate(date);

      openWizard(date, record, 'edit');

    } catch {

      openWizard(date, null, 'daily');

    }

  };



  const handleEditRecord = (record: JournalRecord) => {

    openWizard(record.recordDate, record, 'edit');

  };

  const handleInlineSave = async (input: import('@/domain/journal/types').JournalRecordInput) => {
    await saveInlineRecord(input);
    await refreshAll();
    setActiveTab('records');
    setSaveMessage('기록이 저장됐어요.');
    setTimeout(() => setSaveMessage(null), 3000);
  };



  return (

    <div className="bg-[#F3EDE3] pb-6 lg:pb-10">

      <div className="page-container space-y-3">

        {!isReady ? (

          <div className="flex min-h-[40vh] items-center justify-center">

            <LoadingSpinner label="불러오는 중…" />

          </div>

        ) : isLoggedIn ? (

          <>
            <div className="hf-screen-header mx-auto w-full max-w-app !px-1">
              <div>
                <h1 className="hf-display text-[23px] font-extrabold tracking-[-0.01em] text-[#1E2621]">
                  개인일지
                </h1>
                <p className="mt-1 text-[12.5px] font-medium text-[#9A9F94]">
                  매일의 컨디션을 기록하고 흐름을 살펴봐요
                </p>
              </div>
              <InlineTopActions />
            </div>

            <Suspense fallback={null}>

              <JournalRecordFromQuery

                isReady={isReady}

                isLoggedIn={isLoggedIn}

                dashboardLoading={dashboardLoading}

                onOpenDaily={() => router.push('/record')}

                onOpenRelapse={() => router.push('/record?type=relapse')}

              />

            </Suspense>



            <JournalTabBar active={activeTab} onChange={setActiveTab} />



            {saveMessage && (

              <p className="mx-auto max-w-app rounded-xl bg-journal-success/15 px-4 py-2.5 text-[12px] font-medium text-journal-success">

                {saveMessage}

              </p>

            )}



            {activeTab === 'today' && (

              <JournalInlineRecordForm
                initialRecord={dashboard?.todayRecord ?? null}
                isSubmitting={isInlineSubmitting || dashboardLoading}
                onSave={handleInlineSave}
              />

            )}



            {activeTab === 'records' && (

              <JournalHistoryList

                records={displayHistory}
                calendarRecords={monthlyRecords}
                calendarMonth={calendarMonth}
                onCalendarMonthChange={setCalendarMonth}

                isLoading={historyLoading}

                filter={historyFilter}

                page={historyPage}

                totalPages={historyPageData?.totalPages ?? 1}
                totalElements={historyPageData?.totalElements ?? displayHistory.length}

                onFilterChange={setHistoryFilter}

                onPageChange={setHistoryPage}

                onCreate={() => router.push('/record')}

                onCreateForDate={(date) => router.push(`/record?date=${date}`)}

                onEdit={handleEditRecord}

                onDelete={setDeleteTargetId}

              />

            )}



            {activeTab === 'insights' && (
              <JournalInsightsPanel
                dashboard={dashboard}
                dashboardLoading={dashboardLoading}
                reviewSummary={reviewSummary}
                reviewSummaryLoading={reviewSummaryLoading}
                insights={insights}
                onDaySelect={(date) => void handleTimelineDaySelect(date)}
              />
            )}



            <JournalRecordSheet {...wizardProps} />

          </>

        ) : (
          <LoggedOutFeaturePrompt
            title="개인일지"
            subtitle="날짜별로 기록을 모아봐요"
            body="가입하면 매일의 컨디션을 기록하고 흐름을 볼 수 있어요"
            signupFrom="/journal"
          />
        )}



        {(error || deleteError || inlineSaveError) && <ErrorMessage message={error ?? deleteError ?? inlineSaveError ?? ''} />}

      </div>



      <ConfirmModal

        open={deleteTargetId !== null}

        title="기록 영구 삭제"

        message="이 날짜의 건강 기록을 서버에서 완전히 삭제할까요? 메모·증상 내용은 복구할 수 없으며, 본인 계정에서만 삭제됩니다."

        confirmLabel="삭제"

        variant="danger"

        isLoading={isDeleting}

        onConfirm={() => void handleDelete()}

        onClose={() => setDeleteTargetId(null)}

      />

    </div>

  );

}

export default function JournalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center bg-[#F3EDE3]">
          <LoadingSpinner label="개인일지를 준비하는 중..." />
        </div>
      }
    >
      <JournalPageContent />
    </Suspense>
  );
}

