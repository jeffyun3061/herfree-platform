'use client';

import type {
  JournalDashboard,
  JournalRecord,
  JournalReviewSummary,
  JournalTimelineDay,
} from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalInsightsSummaryCardProps = {
  dashboard: JournalDashboard | null | undefined;
  reviewSummary: JournalReviewSummary | null | undefined;
  isLoading?: boolean;
  onDetailsClick?: () => void;
};

function calcSupplementRate(days: JournalTimelineDay[]): number {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return 0;
  const taken = recorded.filter((day) => !day.medicationMissed).length;
  return Math.round((taken / recorded.length) * 100);
}

function parseSleepHours(label: string | undefined): number | null {
  if (!label || label.includes('기록 없음')) return null;
  const match = label.match(/([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function normalizeStressLabel(label: string | undefined): string {
  if (!label || label.includes('기록 없음')) return '기록 전';
  return label;
}

function stressSegments(label: string): { calm: number; mid: number; rest: number } {
  if (label.includes('낮')) return { calm: 70, mid: 0, rest: 30 };
  if (label.includes('높')) return { calm: 18, mid: 62, rest: 20 };
  if (label.includes('보통')) return { calm: 22, mid: 52, rest: 26 };
  return { calm: 0, mid: 0, rest: 100 };
}

function relapseSeverityLabel(record: JournalRecord | null | undefined): string {
  if (!record?.hadSymptoms) return '안정';
  const severity = record.severity ?? 0;
  if (severity >= 7) return '높음';
  if (severity >= 4) return '보통';
  return '낮음';
}

function recentRelapseAverageDays(dashboard: JournalDashboard): number {
  const relapses = dashboard.recentRelapses ?? [];
  if (relapses.length < 2) return dashboard.relapseFreeDays || 0;

  const times = relapses
    .map((record) => new Date(`${record.recordDate}T00:00:00`).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a);

  if (times.length < 2) return dashboard.relapseFreeDays || 0;

  const gaps = times.slice(0, -1).map((time, index) =>
    Math.max(0, Math.round((time - times[index + 1]) / 86_400_000)),
  );

  const avg = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  return Math.round(avg);
}

function ProgressRow({
  icon,
  label,
  value,
  children,
}: {
  icon: string;
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <p className="flex min-w-0 items-center gap-2 text-[13px] font-semibold text-[#4A514B]">
          <span aria-hidden>{icon}</span>
          <span className="truncate">{label}</span>
        </p>
        <span className="shrink-0 text-[13px] font-extrabold text-[#0B6D60]">{value}</span>
      </div>
      {children}
    </div>
  );
}

function MetricBar({ percent, tone = 'green' }: { percent: number; tone?: 'green' | 'mint' }) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#DED6C9]">
      <div
        className={cn(
          'h-full rounded-full transition-all',
          tone === 'green' ? 'bg-[#0B8E73]' : 'bg-[#60C5A8]',
        )}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E7DFD2] bg-white px-3 py-3 shadow-[0_1px_0_rgba(7,37,31,.04)]">
      <p className="text-[10.5px] font-medium text-[#7A847C]">{label}</p>
      <p className="mt-1 text-[14px] font-extrabold leading-tight text-[#1E2621]">{value}</p>
    </div>
  );
}

export function JournalInsightsSummaryCard({
  dashboard,
  reviewSummary,
  isLoading,
  onDetailsClick,
}: JournalInsightsSummaryCardProps) {
  if (isLoading) {
    return (
      <section
        className="h-[354px] animate-pulse overflow-hidden rounded-[24px] bg-[#D8CDB9]"
        aria-label="개인일지 요약"
      />
    );
  }

  if (!dashboard) return null;

  const periodDays = reviewSummary?.periodDays ?? 90;
  const focusRecord = dashboard.todayRecord ?? dashboard.recentRelapses[0] ?? null;
  const symptomDays = reviewSummary?.symptomDays ?? dashboard.yearRelapses ?? 0;
  const relapseGap = recentRelapseAverageDays(dashboard);
  const supplementRate = calcSupplementRate(dashboard.timelineDays ?? []);
  const avgSleep = reviewSummary?.avgSleepLabel ?? '기록 전';
  const sleepHours = parseSleepHours(avgSleep);
  const sleepPercent = sleepHours != null ? Math.round((sleepHours / 8) * 100) : 0;
  const stressLabel = normalizeStressLabel(reviewSummary?.avgStressLabel);
  const stress = stressSegments(stressLabel);
  const recoveryDays = dashboard.relapseFreeDays || 0;

  return (
    <section
      className="overflow-hidden rounded-[24px] bg-[#F3EDE3] shadow-[0_18px_42px_-28px_rgba(7,37,31,.42)]"
      aria-label="개인일지 요약"
    >
      <div className="bg-[#07251F] px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium tracking-wide text-white/72">
            개인일지 요약 · 최근 {periodDays}일
          </p>
          {onDetailsClick ? (
            <button
              type="button"
              onClick={onDetailsClick}
              className="text-[12px] font-semibold text-[#F0C778]"
            >
              자세히 &gt;
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-2">
          <div className="pr-4">
            <p className="text-[11.5px] text-white/62">마지막 증상 이후</p>
            <p className="hf-display mt-1 text-[40px] font-extrabold leading-none tracking-tight">
              {recoveryDays}
              <span className="ml-1 text-[15px] font-semibold text-white/70">일</span>
            </p>
          </div>
          <div className="border-l border-white/14 pl-4">
            <p className="text-[11.5px] text-white/62">재발 간격</p>
            <p className="hf-display mt-1 text-[40px] font-extrabold leading-none tracking-tight">
              {relapseGap}
              <span className="ml-1 text-[15px] font-semibold text-white/70">일 평균</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <ProgressRow icon="💊" label="영양제 복용률" value={`${supplementRate}%`}>
          <MetricBar percent={supplementRate} />
        </ProgressRow>

        <ProgressRow icon="😴" label="평균 수면" value={avgSleep}>
          <MetricBar percent={sleepPercent} tone="mint" />
        </ProgressRow>

        <ProgressRow icon="🧠" label="스트레스" value={stressLabel}>
          <div className="flex h-2 overflow-hidden rounded-full bg-[#DED6C9]">
            {stress.calm > 0 && (
              <div className="h-full bg-[#60C5A8]" style={{ width: `${stress.calm}%` }} />
            )}
            {stress.mid > 0 && (
              <div className="h-full bg-[#E8A04C]" style={{ width: `${stress.mid}%` }} />
            )}
            {stress.rest > 0 && (
              <div className="h-full bg-transparent" style={{ width: `${stress.rest}%` }} />
            )}
          </div>
        </ProgressRow>

        <div className="grid grid-cols-3 gap-2 pt-1">
          <StatTile label="증상 정도" value={relapseSeverityLabel(focusRecord)} />
          <StatTile label="평온 회복" value={`${recoveryDays}일`} />
          <StatTile label="최근 증상" value={`${symptomDays}일`} />
        </div>
      </div>
    </section>
  );
}
