'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { JournalPersonalDashboard } from '@/components/journal/JournalPersonalDashboard';
import { JournalReviewDashboard } from '@/components/journal/JournalReviewDashboard';
import { JournalRecordWizard } from '@/components/journal/JournalRecordWizard';
import { JournalPrivacyBanner } from '@/components/journal/JournalPrivacyBanner';
import { JournalTimeline14Days } from '@/components/journal/JournalTimeline14Days';
import { JournalPatternLine } from '@/components/journal/JournalPatternLine';
import { JournalRecentRelapses } from '@/components/journal/JournalRecentRelapses';
import { JournalInsightLines } from '@/components/journal/JournalInsightLines';
import { JournalTabBar, type JournalTabId } from '@/components/journal/JournalTabBar';
import { JournalHistoryList } from '@/components/journal/JournalHistoryList';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { toDateInputValue, type JournalRecord } from '@/domain/journal/types';
import type { RoutineItemId } from '@/domain/journal/routine';
import {
  routineItemToWizardStep,
  type WizardEntryMode,
  type WizardStepId,
} from '@/domain/journal/wizard';
import { fetchJournalRecordByDate } from '@/lib/api/journal';
import { useAuth } from '@/hooks/useAuth';
import { usePostList } from '@/hooks/usePosts';
import {
  useJournalDashboard,
  useJournalDelete,
  useJournalInsights,
  useJournalMutation,
  useJournalRecords,
  useJournalReviewSummary,
} from '@/hooks/useJournal';

export default function JournalPage() {
  const { isLoggedIn, isReady } = useAuth();
  const homeRef = useRef<HTMLDivElement>(null);

  const [activeTab, setActiveTab] = useState<JournalTabId>('home');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [routinePulse, setRoutinePulse] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<'relapse' | 'all'>('all');
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [wizardTargetDate, setWizardTargetDate] = useState(toDateInputValue());
  const [wizardInitialRecord, setWizardInitialRecord] = useState<JournalRecord | null>(null);
  const [wizardEntryMode, setWizardEntryMode] = useState<WizardEntryMode>('daily');
  const [wizardInitialStepId, setWizardInitialStepId] = useState<WizardStepId | undefined>();
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
  const { save, isSubmitting, error } = useJournalMutation();
  const { remove, isDeleting, error: deleteError } = useJournalDelete();
  const { postPage: communityPosts, isLoading: communityLoading } = usePostList(
    undefined,
    5,
    '',
    'createdAt,desc',
  );

  const displayHistory = historyPageData?.content ?? [];
  const hasTodayRecord = Boolean(dashboard?.todayRecord);

  useEffect(() => {
    setHistoryPage(0);
  }, [historyFilter]);

  const refreshAll = async () => {
    await Promise.all([refetchDashboard(), refetchHistory(), refetchReviewSummary()]);
  };

  const openWizard = (
    date: string,
    record: JournalRecord | null,
    mode: WizardEntryMode,
    stepId?: WizardStepId,
  ) => {
    setWizardTargetDate(date);
    setWizardInitialRecord(record);
    setWizardEntryMode(mode);
    setWizardInitialStepId(stepId);
    setCheckinOpen(true);
  };

  const openDailyWizard = (stepId?: WizardStepId) => {
    const today = toDateInputValue();
    openWizard(today, dashboard?.todayRecord ?? null, 'daily', stepId);
  };

  const openRelapseWizard = () => {
    const today = toDateInputValue();
    openWizard(today, dashboard?.todayRecord ?? null, 'relapse');
  };

  const handleRoutineItemClick = (itemId: RoutineItemId) => {
    openDailyWizard(routineItemToWizardStep(itemId));
  };

  const handleSave = async (input: Parameters<typeof save>[0]) => {
    await save(input);
    await refreshAll();
    setCheckinOpen(false);
    setActiveTab('home');
    setSaveMessage('오늘 기록이 저장됐어요. 루틴을 확인해 보세요.');
    setRoutinePulse(true);
    setTimeout(() => setRoutinePulse(false), 2000);
    setTimeout(() => setSaveMessage(null), 3000);
    homeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

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
    <div className="bg-[#F2EFE9] pb-10 lg:pb-14">
      <div className="page-container space-y-4 lg:space-y-5">
        {!isReady ? (
          <JournalPersonalDashboard
            dashboard={null}
            isLoading
            onRecordDaily={() => {}}
            onRecordRelapse={() => {}}
            communityPosts={[]}
            communityLoading
          />
        ) : isLoggedIn ? (
          <>
            <JournalTabBar active={activeTab} onChange={setActiveTab} />

            {saveMessage && activeTab === 'home' && (
              <p className="mx-auto max-w-app rounded-xl bg-journal-success/15 px-4 py-3 text-sm font-medium text-journal-success">
                {saveMessage}
              </p>
            )}

            {activeTab === 'home' && (
              <div ref={homeRef}>
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
                />
                <div className="mx-auto mt-4 max-w-app">
                  <JournalPrivacyBanner />
                </div>
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
              <div className="mx-auto max-w-app space-y-6">
                <JournalTimeline14Days
                  days={dashboard?.timelineDays ?? []}
                  isLoading={dashboardLoading}
                  onDaySelect={(date) => void handleTimelineDaySelect(date)}
                />
                <JournalPatternLine
                  line={dashboard?.personalPatternLine}
                  isLoading={dashboardLoading}
                />
                <JournalRecentRelapses
                  relapses={dashboard?.recentRelapses ?? []}
                  isLoading={dashboardLoading}
                />
                <JournalReviewDashboard
                  summary={reviewSummary}
                  isLoading={reviewSummaryLoading}
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

            <JournalRecordWizard
              open={checkinOpen}
              targetDate={wizardTargetDate}
              initialRecord={wizardInitialRecord}
              entryMode={wizardEntryMode}
              initialStepId={wizardInitialStepId}
              isSubmitting={isSubmitting}
              onClose={() => setCheckinOpen(false)}
              onSave={handleSave}
            />
          </>
        ) : (
          <div className="mx-auto max-w-app space-y-5">
            <JournalPersonalDashboard
              dashboard={null}
              isLoading={false}
              onRecordDaily={() => {}}
              onRecordRelapse={() => {}}
              communityPosts={communityPosts.content}
              communityLoading={communityLoading}
            />
            <div className="rounded-[1.25rem] border border-border/50 bg-white p-5 text-center shadow-card">
              <p className="text-sm text-wrtn-muted">로그인 후 나만의 건강 기록을 남길 수 있어요.</p>
              <Link
                href="/login?from=%2Fjournal"
                className="mt-3 inline-block rounded-pill bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
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
