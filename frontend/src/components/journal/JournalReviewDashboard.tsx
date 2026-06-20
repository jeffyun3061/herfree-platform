'use client';

import { useState } from 'react';
import { JournalAnonymousSummaryCard } from '@/components/journal/JournalAnonymousSummaryCard';
import { JournalConsultationReportCard } from '@/components/journal/JournalConsultationReportCard';
import type { JournalReviewSummary } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalReviewDashboardProps = {
  summary: JournalReviewSummary | null | undefined;
  isLoading?: boolean;
};

type ReviewView = 'summary' | 'report';

export function JournalReviewDashboard({ summary, isLoading }: JournalReviewDashboardProps) {
  const [activeView, setActiveView] = useState<ReviewView>('summary');

  if (isLoading) {
    return (
      <section className="journal-review-panel animate-pulse" aria-label="기록 확인 대시보드">
        <div className="h-5 w-40 rounded bg-[var(--color-background-secondary)]" />
        <div className="mt-4 h-48 rounded-xl bg-[var(--color-background-secondary)]" />
      </section>
    );
  }

  if (!summary) {
    return (
      <section className="journal-review-panel" aria-label="기록 확인 대시보드">
        <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">기록 확인</h2>
        <p className="mt-2 text-[12px] text-[var(--color-text-secondary)]">
          기록이 더 쌓이면 30일 요약과 상담용 리포트를 볼 수 있어요.
        </p>
      </section>
    );
  }

  return (
    <section className="journal-review-panel" aria-label="기록 확인 대시보드">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">기록 확인</h2>
          <p className="mt-0.5 text-[11px] text-[var(--color-text-secondary)]">
            최근 30일 · 증상 {summary.symptomDays}일
          </p>
        </div>
        <div className="flex shrink-0 rounded-lg border border-[var(--color-border-tertiary)] bg-white p-0.5">
          {(
            [
              { id: 'summary' as const, label: '요약' },
              { id: 'report' as const, label: '리포트' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
              className={cn(
                'rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors',
                activeView === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-3">
        {activeView === 'summary' ? (
          <JournalAnonymousSummaryCard summary={summary} compact />
        ) : (
          <JournalConsultationReportCard summary={summary} compact />
        )}
      </div>
    </section>
  );
}
