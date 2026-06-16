'use client';

import { JournalAnonymousSummaryCard } from '@/components/journal/JournalAnonymousSummaryCard';
import { JournalConsultationReportCard } from '@/components/journal/JournalConsultationReportCard';
import type { JournalReviewSummary } from '@/domain/journal/types';

type JournalReviewDashboardProps = {
  summary: JournalReviewSummary | null | undefined;
  isLoading?: boolean;
};

export function JournalReviewDashboard({ summary, isLoading }: JournalReviewDashboardProps) {
  if (isLoading) {
    return (
      <section className="space-y-4" aria-label="증상 확인 대시보드">
        <div className="animate-pulse space-y-4">
          <div className="h-64 rounded-card bg-white" />
          <div className="h-80 rounded-card bg-white" />
        </div>
      </section>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <section className="space-y-6" aria-label="증상 확인 대시보드">
      <div>
        <h2 className="section-heading">기록 확인 대시보드</h2>
        <p className="mt-1 text-sm text-muted">
          최근 30일 증상·전조·요인을 한눈에 확인하고, 익명 요약 또는 상담용 리포트로 공유할 수
          있어요.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <JournalAnonymousSummaryCard summary={summary} />
        <JournalConsultationReportCard summary={summary} />
      </div>
    </section>
  );
}
