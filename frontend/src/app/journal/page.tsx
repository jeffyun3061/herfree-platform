'use client';



import { Suspense, useEffect, useRef, useState } from 'react';

import Link from 'next/link';

import { JournalHomeTab } from '@/components/journal/JournalHomeTab';

import { JournalRecordFromQuery } from '@/components/journal/JournalRecordFromQuery';

import { JournalReviewDashboard } from '@/components/journal/JournalReviewDashboard';

import { JournalRecordSheet } from '@/components/journal/JournalRecordSheet';

import { JournalTimeline14Days } from '@/components/journal/JournalTimeline14Days';

import { JournalPatternLine } from '@/components/journal/JournalPatternLine';

import { JournalRecentRelapses } from '@/components/journal/JournalRecentRelapses';

import { JournalInsightLines } from '@/components/journal/JournalInsightLines';

import { JournalTabBar, type JournalTabId } from '@/components/journal/JournalTabBar';

import { JournalHistoryList } from '@/components/journal/JournalHistoryList';

import { ErrorMessage } from '@/components/ui/ErrorMessage';

import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';

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

  useJournalRecords,

  useJournalReviewSummary,

} from '@/hooks/useJournal';



export default function JournalPage() {

  const { isLoggedIn, isReady } = useAuth();

  const homeRef = useRef<HTMLDivElement>(null);



  const [activeTab, setActiveTab] = useState<JournalTabId>('home');

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [historyPage, setHistoryPage] = useState(0);

  const [historyFilter, setHistoryFilter] = useState<'relapse' | 'all'>('all');

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

  const { data: insights } = useJournalInsights();

  const { data: historyPageData, isLoading: historyLoading, refetch: refetchHistory } =

    useJournalRecords(historyPage, 10, isLoggedIn && isReady, historyHadSymptoms);

  const { remove, isDeleting, error: deleteError } = useJournalDelete();



  const refreshAll = async () => {

    await Promise.all([refetchDashboard(), refetchHistory(), refetchReviewSummary()]);

  };



  const {

    routinePulse,

    error,

    wizardProps,

    handleRoutineItemClick,

    openDailyWizard,

    openRelapseWizard,

    openWizard,

  } = useJournalCheckin({

    isLoggedIn,

    todayRecord: dashboard?.todayRecord,

    timelineDays: dashboard?.timelineDays ?? [],

    loginFrom: '/journal',

    onAfterSave: async () => {

      await refreshAll();

      setActiveTab('home');

      setSaveMessage('오늘 기록이 저장됐어요.');

      setTimeout(() => setSaveMessage(null), 3000);

      homeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    },

  });



  const displayHistory = historyPageData?.content ?? [];

  const hasTodayRecord = Boolean(dashboard?.todayRecord);



  useEffect(() => {

    setHistoryPage(0);

  }, [historyFilter]);



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



  return (

    <div className="bg-[#e9ebea] pb-10 lg:pb-14">

      <div className="page-container space-y-4">

        {!isReady ? (

          <div className="flex min-h-[40vh] items-center justify-center">

            <LoadingSpinner label="불러오는 중…" />

          </div>

        ) : isLoggedIn ? (

          <>

            <Suspense fallback={null}>

              <JournalRecordFromQuery

                isReady={isReady}

                isLoggedIn={isLoggedIn}

                dashboardLoading={dashboardLoading}

                onOpenDaily={openDailyWizard}

                onOpenRelapse={openRelapseWizard}

              />

            </Suspense>



            <JournalTabBar active={activeTab} onChange={setActiveTab} />



            {saveMessage && activeTab === 'home' && (

              <p className="mx-auto max-w-app rounded-xl bg-journal-success/15 px-4 py-2.5 text-[12px] font-medium text-journal-success">

                {saveMessage}

              </p>

            )}



            {activeTab === 'home' && (

              <div ref={homeRef}>

                <JournalHomeTab

                  dashboard={dashboard ?? null}

                  isLoading={dashboardLoading}

                  onRecordDaily={() => openDailyWizard()}

                  onRecordRelapse={openRelapseWizard}

                  onRoutineItemClick={handleRoutineItemClick}

                  routinePulse={routinePulse}

                  hasTodayRecord={hasTodayRecord}

                />

              </div>

            )}



            {activeTab === 'records' && (

              <JournalHistoryList

                records={displayHistory}

                isLoading={historyLoading}

                filter={historyFilter}

                page={historyPage}

                totalPages={historyPageData?.totalPages ?? 1}

                onFilterChange={setHistoryFilter}

                onPageChange={setHistoryPage}

                onEdit={handleEditRecord}

                onDelete={setDeleteTargetId}

              />

            )}



            {activeTab === 'insights' && (

              <div className="mx-auto max-w-app space-y-4">

                <JournalTimeline14Days

                  days={dashboard?.timelineDays ?? []}

                  isLoading={dashboardLoading}

                  onDaySelect={(date) => void handleTimelineDaySelect(date)}

                />

                <JournalPatternLine

                  line={dashboard?.personalPatternLine}

                  isLoading={dashboardLoading}

                />

                <JournalReviewDashboard

                  summary={reviewSummary}

                  isLoading={reviewSummaryLoading}

                />

                <JournalRecentRelapses

                  relapses={dashboard?.recentRelapses ?? []}

                  isLoading={dashboardLoading}

                />

                {insights && insights.insightLines.length > 0 && (

                  <JournalInsightLines

                    lines={insights.insightLines}

                    sufficientData={insights.sufficientData}

                    insightMessage={insights.insightMessage}

                  />

                )}

              </div>

            )}



            <JournalRecordSheet {...wizardProps} />

          </>

        ) : (

          <div className="mx-auto max-w-app space-y-5">

            <div className="rounded-[1.25rem] border border-border/50 bg-white p-6 text-center shadow-card">

              <p className="text-[15px] font-bold text-ink">개인 일지</p>

              <p className="mt-2 text-sm text-muted">

                재발·수면·루틴을 비공개로 기록하고 패턴을 확인해 보세요.

              </p>

              <Link

                href="/login?from=%2Fjournal"

                className="mt-4 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"

              >

                로그인하고 기록 시작

              </Link>

            </div>

          </div>

        )}



        {(error || deleteError) && <ErrorMessage message={error ?? deleteError ?? ''} />}



        <MedicalDisclaimer />

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

