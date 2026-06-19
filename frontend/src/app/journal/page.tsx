'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { JournalPersonalDashboard } from '@/components/journal/JournalPersonalDashboard';
import { JournalReviewDashboard } from '@/components/journal/JournalReviewDashboard';
import { JournalRecordWizard } from '@/components/journal/JournalRecordWizard';
import { JournalPrivacyBanner } from '@/components/journal/JournalPrivacyBanner';
import { JournalTimeline14Days } from '@/components/journal/JournalTimeline14Days';
import { JournalPatternLine } from '@/components/journal/JournalPatternLine';
import { JournalRecentRelapses } from '@/components/journal/JournalRecentRelapses';
import { JournalInsightLines } from '@/components/journal/JournalInsightLines';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  formatTriggerLabels,
  formatJournalDateLabel,
  toDateInputValue,
  type JournalRecord,
} from '@/domain/journal/types';
import { formatConditionSummary, formatSleepLabel } from '@/domain/journal/routine';
import { cn } from '@/lib/cn';
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
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyFilter, setHistoryFilter] = useState<'relapse' | 'all'>('relapse');
  const [checkinOpen, setCheckinOpen] = useState(false);
  const [wizardTargetDate, setWizardTargetDate] = useState(toDateInputValue());
  const [wizardInitialRecord, setWizardInitialRecord] = useState<JournalRecord | null>(null);
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

  useEffect(() => {
    setHistoryPage(0);
  }, [historyFilter]);

  const refreshAll = async () => {
    await Promise.all([refetchDashboard(), refetchHistory(), refetchReviewSummary()]);
  };

  const openWizard = (date: string, record: JournalRecord | null) => {
    setWizardTargetDate(date);
    setWizardInitialRecord(record);
    setCheckinOpen(true);
  };

  const openTodayWizard = () => {
    const today = toDateInputValue();
    openWizard(today, dashboard?.todayRecord ?? null);
  };

  const handleSave = async (input: Parameters<typeof save>[0]) => {
    await save(input);
    setSaveMessage('기록이 저장되었습니다.');
    await refreshAll();
    setTimeout(() => setSaveMessage(null), 2500);
  };

  const handleDelete = async () => {
    if (deleteTargetId == null) return;
    await remove(deleteTargetId);
    setDeleteTargetId(null);
    await refreshAll();
  };

  const handleHistoryFilter = (filter: 'relapse' | 'all') => {
    setHistoryFilter(filter);
  };

  const handleTimelineDaySelect = async (date: string) => {
    if (!isLoggedIn) return;
    try {
      const record = await fetchJournalRecordByDate(date);
      openWizard(date, record);
    } catch {
      openWizard(date, null);
    }
  };

  return (
    <div className="bg-wrtn-bg pb-10 lg:pb-14">
      <div className="page-container space-y-8 lg:space-y-10">
        {!isReady ? (
          <JournalPersonalDashboard
            dashboard={null}
            isLoading
            onRecord={() => {}}
            communityPosts={[]}
            communityLoading
          />
        ) : isLoggedIn ? (
          <>
            <JournalPersonalDashboard
              dashboard={dashboard ?? null}
              isLoading={dashboardLoading}
              onRecord={openTodayWizard}
              communityPosts={communityPosts.content}
              communityLoading={communityLoading}
            />

            <JournalRecordWizard
              open={checkinOpen}
              targetDate={wizardTargetDate}
              initialRecord={wizardInitialRecord}
              isSubmitting={isSubmitting}
              onClose={() => setCheckinOpen(false)}
              onSave={handleSave}
            />

            <JournalPrivacyBanner />

            <details className="group rounded-[1.25rem] border border-border/50 bg-white shadow-card">
              <summary className="cursor-pointer list-none px-5 py-4 text-sm font-semibold text-ink marker:content-none">
                <span className="flex items-center justify-between">
                  상세 기록 · 패턴 · 리포트
                  <span className="text-xs font-medium text-primary group-open:hidden">펼치기</span>
                  <span className="hidden text-xs font-medium text-primary group-open:inline">접기</span>
                </span>
              </summary>
              <div className="space-y-6 border-t border-border/40 px-5 py-5">
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
            </details>
          </>
        ) : (
          <div className="mx-auto max-w-app space-y-5">
            <JournalPersonalDashboard
              dashboard={null}
              isLoading={false}
              onRecord={() => {}}
              communityPosts={communityPosts.content}
              communityLoading={communityLoading}
            />
            <div className="rounded-[1.25rem] border border-border/50 bg-white p-5 text-center shadow-card">
              <p className="text-sm text-wrtn-muted">로그인 후 나만의 건강 기록을 남길 수 있어요.</p>
              <Link
                href="/login?from=%2Fjournal"
                className="mt-3 inline-block text-sm font-semibold text-primary"
              >
                로그인하기
              </Link>
            </div>
          </div>
        )}

        {(error || deleteError) && <ErrorMessage message={error ?? deleteError ?? ''} />}
        {saveMessage && (
          <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            {saveMessage}
          </p>
        )}

        {isLoggedIn && isReady && (
          <section id="history" className="scroll-mt-24">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="section-heading">기록 히스토리</h2>
                <p className="mt-1 text-xs text-muted">
                  날짜별 기록을 확인하고 수정·삭제할 수 있어요. 삭제는 복구할 수 없습니다.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleHistoryFilter('relapse')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    historyFilter === 'relapse'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted',
                  )}
                >
                  재발 기록
                </button>
                <button
                  type="button"
                  onClick={() => handleHistoryFilter('all')}
                  className={cn(
                    'rounded-full border px-3 py-1.5 text-xs transition-colors',
                    historyFilter === 'all'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted',
                  )}
                >
                  전체 기록
                </button>
              </div>
            </div>
            {historyLoading ? (
              <div className="animate-pulse space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-white" />
                ))}
              </div>
            ) : displayHistory.length === 0 ? (
              <EmptyState
                title={
                  historyFilter === 'relapse'
                    ? '아직 재발 기록이 없습니다'
                    : '아직 남긴 기록이 없습니다'
                }
                description={
                  historyFilter === 'relapse'
                    ? '재발이 있었던 날에 기록을 남기면 패턴을 확인할 수 있습니다.'
                    : '오늘의 컨디션과 루틴을 기록해 보세요.'
                }
              />
            ) : (
              <>
                <ul className="space-y-2">
                  {displayHistory.map((record) => (
                    <li
                      key={record.id}
                      className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-ink">
                            {formatJournalDateLabel(record.recordDate)}
                          </p>
                          {record.hadSymptoms ? (
                            <p className="mt-1 text-muted">
                              재발 · 심각도 {record.severity ?? '-'} · 트리거{' '}
                              {formatTriggerLabels(record.triggers)}
                            </p>
                          ) : (
                            <p className="mt-1 text-muted">
                              무재발 · 수면 {formatSleepLabel(record)} · 컨디션{' '}
                              {formatConditionSummary(record)}
                            </p>
                          )}
                          {record.memo && (
                            <p className="mt-2 line-clamp-2 text-xs text-muted">{record.memo}</p>
                          )}
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <button
                            type="button"
                            onClick={() => openWizard(record.recordDate, record)}
                            className="text-xs font-medium text-primary"
                          >
                            수정
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(record.id)}
                            className="rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
                {(historyPageData?.totalPages ?? 0) > 1 && (
                  <div className="mt-4">
                    <Pagination
                      page={historyPage}
                      totalPages={historyPageData?.totalPages ?? 1}
                      onPageChange={setHistoryPage}
                    />
                  </div>
                )}
              </>
            )}
          </section>
        )}

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
