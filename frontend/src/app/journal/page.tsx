'use client';

import { useState } from 'react';
import Link from 'next/link';
import { JournalBentoDashboard } from '@/components/journal/JournalBentoDashboard';
import { JournalInsightLines } from '@/components/journal/JournalInsightLines';
import { JournalRecordForm } from '@/components/journal/JournalRecordForm';
import { JournalShareButton } from '@/components/journal/JournalShareButton';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';
import { toDateInputValue } from '@/domain/journal/types';
import { useAuth } from '@/hooks/useAuth';
import {
  useJournalDashboard,
  useJournalInsights,
  useJournalMutation,
  useJournalRecordByDate,
} from '@/hooks/useJournal';

export default function JournalPage() {
  const { isLoggedIn, isReady } = useAuth();
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const {
    data: dashboard,
    isLoading: dashboardLoading,
    refetch: refetchDashboard,
  } = useJournalDashboard(isLoggedIn);
  const { data: insights } = useJournalInsights();
  const { data: recordByDate, isLoading: recordLoading, refetch: refetchRecord } =
    useJournalRecordByDate(selectedDate, isLoggedIn);
  const { save, isSubmitting, error } = useJournalMutation();

  const handleSave = async (input: Parameters<typeof save>[0]) => {
    await save(input);
    setSelectedDate(input.recordDate);
    setSaveMessage('기록이 저장되었습니다.');
    await Promise.all([refetchDashboard(), refetchRecord()]);
    setTimeout(() => setSaveMessage(null), 2500);
  };

  if (!isReady) {
    return <LoadingSpinner label="불러오는 중…" />;
  }

  return (
    <div className="bg-canvas pb-10 lg:bg-[#eceae5] lg:pb-14">
      <div className="page-container space-y-6 lg:space-y-8">
        <div className="hidden items-start justify-between gap-4 lg:flex">
          <div>
            <h1 className="section-heading">개인 일지</h1>
            <p className="mt-2 max-w-prose text-sm text-muted">
              재발 기록과 일상 루틴을 비공개로 남기세요. 익명 통계로 패턴 인사이트도 받을 수 있습니다.
            </p>
          </div>
          {isLoggedIn && <JournalShareButton dashboard={dashboard} />}
        </div>

        <div className="flex items-center justify-between lg:hidden">
          <div>
            <h1 className="font-serif text-xl font-semibold text-ink">재발 기록</h1>
            <p className="text-xs text-muted">오늘 {new Date().toLocaleDateString('ko-KR')}</p>
          </div>
          <div className="flex items-center gap-2">
            {isLoggedIn && <JournalShareButton dashboard={dashboard} />}
            <Link href="/journal#history" className="text-xs font-medium text-primary">
              전체 기록 보기
            </Link>
          </div>
        </div>

        <div className="grid gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-sm sm:grid-cols-3 lg:hidden">
          <Stat label="무재발 연속일" value={`${dashboard?.relapseFreeDays ?? '—'}`} suffix="일" />
          <Stat label="총 재발 기록" value={`${dashboard?.totalRelapses ?? 0}`} suffix="회" />
          <Stat label="이번 달" value={`${dashboard?.monthRelapses ?? 0}`} suffix="회" />
        </div>

        {(dashboardLoading || (isLoggedIn && recordLoading)) && (
          <LoadingSpinner label="일지 불러오는 중…" />
        )}

        {error && <ErrorMessage message={error} />}
        {saveMessage && (
          <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-primary">
            {saveMessage}
          </p>
        )}

        {insights && insights.insightLines.length > 0 && (
          <JournalInsightLines lines={insights.insightLines} />
        )}

        <div className="lg:grid lg:grid-cols-12 lg:items-start lg:gap-8">
          <div className="lg:col-span-7">
            <JournalBentoDashboard
              dashboard={dashboard}
              insights={insights}
              isLoggedIn={isLoggedIn}
              isSaving={isSubmitting}
              onQuickSave={handleSave}
            />
          </div>
          <div className="mt-8 lg:col-span-5 lg:mt-0">
            {isLoggedIn ? (
              <JournalRecordForm
                key={selectedDate}
                initialRecord={recordByDate}
                isSubmitting={isSubmitting}
                onSubmit={handleSave}
                onDateChange={setSelectedDate}
              />
            ) : (
              <div className="journal-form-card text-sm text-muted">
                로그인 후 재발 기록 폼을 사용할 수 있습니다.
              </div>
            )}
          </div>
        </div>

        {isLoggedIn && dashboard && dashboard.recentRelapses.length > 0 && (
          <section id="history" className="scroll-mt-24">
            <h2 className="section-heading mb-4">최근 재발 기록</h2>
            <ul className="space-y-2">
              {dashboard.recentRelapses.map((record) => (
                <li
                  key={record.id}
                  className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm"
                >
                  <p className="font-medium text-ink">{record.recordDate}</p>
                  <p className="mt-1 text-muted">
                    심각도 {record.severity ?? '-'} · 트리거{' '}
                    {record.triggers.length > 0 ? record.triggers.join(', ') : '없음'}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <MedicalDisclaimer />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string;
  suffix?: string;
}) {
  return (
    <div className="text-center">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-lg font-semibold text-ink">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-medium text-muted">{suffix}</span>}
      </p>
    </div>
  );
}
