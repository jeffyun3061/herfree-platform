'use client';

import type { JournalDashboard, JournalInsights, JournalReviewSummary } from '@/domain/journal/types';
import { JournalTimeline14Days } from '@/components/journal/JournalTimeline14Days';
import { JournalPatternLine } from '@/components/journal/JournalPatternLine';
import { JournalReviewDashboard } from '@/components/journal/JournalReviewDashboard';
import { JournalRecentRelapses } from '@/components/journal/JournalRecentRelapses';
import { JournalInsightLines } from '@/components/journal/JournalInsightLines';
import { SnapCarousel } from '@/components/ui/SnapCarousel';

type JournalInsightsCarouselProps = {
  dashboard: JournalDashboard | null;
  dashboardLoading: boolean;
  reviewSummary: JournalReviewSummary | null | undefined;
  reviewSummaryLoading: boolean;
  insights: JournalInsights | null | undefined;
  onDaySelect: (date: string) => void;
};

export function JournalInsightsCarousel({
  dashboard,
  dashboardLoading,
  reviewSummary,
  reviewSummaryLoading,
  insights,
  onDaySelect,
}: JournalInsightsCarouselProps) {
  const panels = [
    {
      id: 'timeline',
      label: '14일 흐름',
      content: (
        <JournalTimeline14Days
          days={dashboard?.timelineDays ?? []}
          isLoading={dashboardLoading}
          onDaySelect={onDaySelect}
        />
      ),
    },
    {
      id: 'pattern',
      label: '나의 패턴',
      content: (
        <JournalPatternLine
          line={dashboard?.personalPatternLine}
          isLoading={dashboardLoading}
        />
      ),
    },
    {
      id: 'review',
      label: '기록 확인',
      content: (
        <JournalReviewDashboard summary={reviewSummary} isLoading={reviewSummaryLoading} />
      ),
    },
    {
      id: 'relapses',
      label: '최근 재발',
      content: (
        <div className="space-y-4">
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
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-app">
      <SnapCarousel panels={panels} showTabs />
    </div>
  );
}
