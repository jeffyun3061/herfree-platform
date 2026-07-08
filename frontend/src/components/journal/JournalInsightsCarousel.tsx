'use client';

import { useState } from 'react';
import type {
  JournalDashboard,
  JournalInsights,
  JournalReviewSummary,
  JournalTimelineDay,
} from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalInsightsPanelProps = {
  dashboard: JournalDashboard | null | undefined;
  dashboardLoading: boolean;
  reviewSummary: JournalReviewSummary | null | undefined;
  reviewSummaryLoading: boolean;
  insights?: JournalInsights | null | undefined;
  onDaySelect: (date: string) => void;
};

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatDayNumber(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date.slice(-2);
  return String(parsed.getDate());
}

function calcSupplementRate(days: JournalTimelineDay[]): number {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return 0;
  const taken = recorded.filter((day) => !day.medicationMissed).length;
  return Math.round((taken / recorded.length) * 100);
}

function parseSleepHours(label: string | undefined): number | null {
  if (!label || label.includes('기록 없음') || label.includes('기록 전')) return null;
  const match = label.match(/([\d.]+)/);
  return match ? Number.parseFloat(match[1]) : null;
}

function normalizeText(value: string | null | undefined, fallback = '기록 전'): string {
  if (!value || value.trim().length === 0) return fallback;
  return value;
}

function stressTone(label: string): { percent: number; label: string; variant: 'green' | 'gold' } {
  if (label.includes('낮')) return { percent: 24, label: '안정', variant: 'green' };
  if (label.includes('높')) return { percent: 82, label: '주의', variant: 'gold' };
  if (label.includes('보통')) return { percent: 52, label: '보통', variant: 'gold' };
  return { percent: 0, label, variant: 'gold' };
}

function averageRelapseGap(dashboard: JournalDashboard): number {
  const relapses = dashboard.recentRelapses ?? [];
  if (relapses.length < 2) return dashboard.relapseFreeDays || 0;

  const times = relapses
    .map((record) => new Date(`${record.recordDate}T00:00:00`).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => b - a);

  if (times.length < 2) return dashboard.relapseFreeDays || 0;

  const gaps = times.slice(0, -1).map((time, index) =>
    Math.max(0, Math.round((time - times[index + 1]) / 86_400_000)),
  );
  return Math.max(1, Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length));
}

function timelineSignalLabels(day: JournalTimelineDay): string[] {
  const labels: string[] = [];
  if (day.hadSymptoms) labels.push('증상');
  if (day.hasProdromal) labels.push('전조');
  if (day.sleepDeficit) labels.push('수면');
  if (day.highStress) labels.push('스트레스');
  if (day.medicationMissed) labels.push('복용');
  return labels;
}

function signalSummary(days: JournalTimelineDay[]): string {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return '기록을 남기면 최근 흐름을 분석해드려요.';

  const counts = [
    { label: '증상', count: days.filter((day) => day.hadSymptoms).length },
    { label: '전조', count: days.filter((day) => day.hasProdromal).length },
    { label: '수면 부족', count: days.filter((day) => day.sleepDeficit).length },
    { label: '높은 스트레스', count: days.filter((day) => day.highStress).length },
    { label: '복용 누락', count: days.filter((day) => day.medicationMissed).length },
  ]
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count);

  if (counts.length === 0) return '최근 기록에서는 뚜렷한 주의 신호가 적어요.';
  return `${counts[0].label}이 ${counts[0].count}일로 가장 많이 보여요.`;
}

function SignalDot({ className }: { className: string }) {
  return <span className={cn('h-2 w-2 rounded-full shadow-[0_1px_4px_rgba(0,0,0,.12)]', className)} />;
}

function MetricBar({
  label,
  value,
  percent,
  variant = 'green',
}: {
  label: string;
  value: string;
  percent: number;
  variant?: 'green' | 'gold';
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <p className="min-w-0 truncate text-[12px] font-bold text-[#4A514B]">{label}</p>
        <span className={cn('shrink-0 text-[12px] font-extrabold', variant === 'green' ? 'text-[#0B8E73]' : 'text-[#A66A20]')}>
          {value}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[#DED6C9]">
        <div
          className={cn('h-full rounded-full', variant === 'green' ? 'bg-[#0B8E73]' : 'bg-[#E8A04C]')}
          style={{ width: `${clampPercent(percent)}%` }}
        />
      </div>
    </div>
  );
}

function TimelineCard({
  days,
  onDaySelect,
}: {
  days: JournalTimelineDay[];
  onDaySelect: (date: string) => void;
}) {
  const recentDays = days.slice(-14);
  const recordedDays = recentDays.filter((day) => day.recorded);
  const warningDays = recordedDays.filter((day) => timelineSignalLabels(day).length > 0);
  const stableDays = recordedDays.length - warningDays.length;

  return (
    <section className="rounded-[24px] border border-[#E7DFD2] bg-white px-4 py-4 shadow-[0_14px_32px_-28px_rgba(7,37,31,.35)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[16px] font-extrabold text-[#1E2621]">최근 14일 흐름</h3>
          <p className="mt-1 text-[11.5px] leading-[1.5] text-[#7A847C]">
            기록한 날짜를 눌러 상세 내용을 확인하거나 수정할 수 있어요.
          </p>
        </div>
        <span className="rounded-full bg-[#E7F1EC] px-2.5 py-1 text-[10.5px] font-bold text-[#0B3B36]">
          흐름
        </span>
      </div>

      <div className="mt-4 rounded-[19px] bg-[#F8F4EC] px-3 py-3">
        {recentDays.length > 0 ? (
          <div className="grid items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${recentDays.length}, minmax(16px, 1fr))` }}>
            {recentDays.map((day) => {
              const signals = timelineSignalLabels(day);
              const stable = day.recorded && signals.length === 0;

              return (
                <button
                  key={day.date}
                  type="button"
                  disabled={!day.recorded}
                  onClick={() => onDaySelect(day.date)}
                  className={cn(
                    'flex min-w-0 flex-col items-center rounded-[12px] px-1 py-1.5 transition-colors',
                    day.recorded ? 'hover:bg-white/80' : 'cursor-default opacity-50',
                    day.hadSymptoms && 'bg-[#FFF1EC]',
                  )}
                  aria-label={`${day.date} 기록 보기`}
                >
                  <span className="text-[9.5px] font-bold text-[#7A847C]">{formatDayNumber(day.date)}</span>
                  <span className="mt-2 flex h-[54px] flex-col-reverse items-center gap-1">
                    {!day.recorded && <span className="h-2 w-2 rounded-full bg-[#CCC2B4]" />}
                    {stable && <span className="h-8 w-2 rounded-full bg-[#60C5A8]" />}
                    {day.medicationMissed && <SignalDot className="bg-[#8B7A64]" />}
                    {day.sleepDeficit && <SignalDot className="bg-[#2F6DE8]" />}
                    {day.highStress && <SignalDot className="bg-[#E8A04C]" />}
                    {day.hasProdromal && <SignalDot className="bg-[#F0C778]" />}
                    {day.hadSymptoms && <SignalDot className="bg-[#D94B3D]" />}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="py-5 text-center text-[12px] font-medium text-[#7A847C]">아직 표시할 기록이 없어요.</p>
        )}
      </div>

      <div className="mt-3 rounded-[16px] border border-[#ECE5D8] bg-[#FFFCF7] px-3 py-3">
        <p className="text-[12px] font-extrabold text-[#1E2621]">{signalSummary(recentDays)}</p>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1.5 text-[10.5px] font-medium text-[#65706B]">
          <span className="inline-flex items-center gap-1"><SignalDot className="bg-[#60C5A8]" />안정</span>
          <span className="inline-flex items-center gap-1"><SignalDot className="bg-[#2F6DE8]" />수면</span>
          <span className="inline-flex items-center gap-1"><SignalDot className="bg-[#E8A04C]" />스트레스</span>
          <span className="inline-flex items-center gap-1"><SignalDot className="bg-[#F0C778]" />전조</span>
          <span className="inline-flex items-center gap-1"><SignalDot className="bg-[#D94B3D]" />증상</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="rounded-[15px] bg-[#F8F4EC] px-3 py-3">
          <p className="text-[10.5px] font-bold text-[#7A847C]">기록</p>
          <p className="mt-1 text-[17px] font-extrabold text-[#1E2621]">{recordedDays.length}일</p>
        </div>
        <div className="rounded-[15px] bg-[#F1FAF5] px-3 py-3">
          <p className="text-[10.5px] font-bold text-[#0B6D60]">안정</p>
          <p className="mt-1 text-[17px] font-extrabold text-[#0B6D60]">{stableDays}일</p>
        </div>
        <div className="rounded-[15px] bg-[#FFF2EA] px-3 py-3">
          <p className="text-[10.5px] font-bold text-[#B6402D]">주의</p>
          <p className="mt-1 text-[17px] font-extrabold text-[#B6402D]">{warningDays.length}일</p>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  dashboard,
  reviewSummary,
}: {
  dashboard: JournalDashboard;
  reviewSummary: JournalReviewSummary | null | undefined;
}) {
  const periodDays = reviewSummary?.periodDays ?? 30;
  const supplementRate = calcSupplementRate(dashboard.timelineDays ?? []);
  const avgSleep = normalizeText(reviewSummary?.avgSleepLabel);
  const sleepHours = parseSleepHours(avgSleep);
  const sleepPercent = sleepHours == null ? 0 : Math.round((sleepHours / 8) * 100);
  const stress = stressTone(normalizeText(reviewSummary?.avgStressLabel));
  const relapseGap = averageRelapseGap(dashboard);
  const symptomDays = reviewSummary?.symptomDays ?? dashboard.yearRelapses ?? 0;
  const symptomStatus = symptomDays === 0 ? '안정' : symptomDays >= 5 ? '주의' : '보통';

  return (
    <section className="overflow-hidden rounded-[24px] bg-[#F3EDE3] shadow-[0_18px_42px_-28px_rgba(7,37,31,.42)]">
      <div className="bg-[#07251F] px-5 pb-5 pt-4 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[12px] font-medium tracking-wide text-white/72">
            개인일지 요약 · 최근 {periodDays}일
          </p>
          <span className="text-[12px] font-semibold text-[#F0C778]">자세히</span>
        </div>

        <div className="mt-4 grid grid-cols-2">
          <div className="pr-4">
            <p className="text-[11.5px] text-white/62">마지막 증상 이후</p>
            <p className="hf-display mt-1 text-[40px] font-extrabold leading-none tracking-tight">
              {dashboard.relapseFreeDays || 0}
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
        <MetricBar label="💊 영양제 복용률" value={`${supplementRate}%`} percent={supplementRate} />
        <MetricBar label="😴 평균 수면" value={avgSleep} percent={sleepPercent} />
        <MetricBar label="🧠 스트레스" value={stress.label} percent={stress.percent} variant={stress.variant} />

        <div className="grid grid-cols-3 gap-2 pt-1">
          <div className="rounded-[12px] border border-[#E7DFD2] bg-white px-3 py-3 shadow-[0_1px_0_rgba(7,37,31,.04)]">
            <p className="text-[10.5px] font-medium text-[#7A847C]">증상 정도</p>
            <p className="mt-1 text-[14px] font-extrabold leading-tight text-[#1E2621]">{symptomStatus}</p>
          </div>
          <div className="rounded-[12px] border border-[#E7DFD2] bg-white px-3 py-3 shadow-[0_1px_0_rgba(7,37,31,.04)]">
            <p className="text-[10.5px] font-medium text-[#7A847C]">평균 회복</p>
            <p className="mt-1 text-[14px] font-extrabold leading-tight text-[#1E2621]">{relapseGap}일</p>
          </div>
          <div className="rounded-[12px] border border-[#E7DFD2] bg-white px-3 py-3 shadow-[0_1px_0_rgba(7,37,31,.04)]">
            <p className="text-[10.5px] font-medium text-[#7A847C]">올해 재발</p>
            <p className="mt-1 text-[14px] font-extrabold leading-tight text-[#1E2621]">{dashboard.yearRelapses ?? 0}회</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function JournalInsightsPanel({
  dashboard,
  dashboardLoading,
  reviewSummary,
  reviewSummaryLoading,
  onDaySelect,
}: JournalInsightsPanelProps) {
  const loading = dashboardLoading || reviewSummaryLoading;
  const [period, setPeriod] = useState<'3m' | '6m' | '1y'>('6m');

  if (loading) {
    return (
      <div className="mx-auto max-w-app space-y-3">
        <section className="h-[230px] animate-pulse rounded-[24px] bg-[#E8DFD2]" aria-hidden />
        <section className="h-[260px] animate-pulse rounded-[24px] bg-[#D8CDB9]" aria-hidden />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <section className="mx-auto max-w-app rounded-[24px] border border-[#E7DFD2] bg-white px-4 py-8 text-center shadow-[0_14px_32px_-28px_rgba(7,37,31,.35)]">
        <h2 className="text-[16px] font-extrabold text-[#1E2621]">기록을 남기면 요약이 열려요</h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[#7A847C]">
          수면, 영양제, 스트레스, 증상 기록이 쌓이면 관리 흐름을 한눈에 볼 수 있어요.
        </p>
      </section>
    );
  }

  return (
    <div className="mx-auto max-w-app space-y-3">
      <section className="rounded-[20px] border border-[#E7DFD2] bg-[#FFF9EE] px-4 py-3 shadow-[0_14px_32px_-28px_rgba(7,37,31,.35)]">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F7E7C3] text-lg" aria-hidden>
            🔥
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-extrabold text-[#1E2621]">
              {dashboard.relapseFreeDays || 0}일째 평온 기록 중
            </p>
            <p className="mt-1 truncate text-[11px] font-medium text-[#7A847C]">
              최근 흐름을 먼저 확인하고 관리 요약을 살펴봐요
            </p>
          </div>
        </div>
      </section>

      <TimelineCard days={dashboard.timelineDays ?? []} onDaySelect={onDaySelect} />

      <div className="grid grid-cols-3 gap-1 rounded-full border border-[#D9CDBA] bg-[#EDE4D6] p-1 shadow-inner">
        {[
          ['3m', '3개월'],
          ['6m', '6개월'],
          ['1y', '1년'],
        ].map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPeriod(key as '3m' | '6m' | '1y')}
            className={cn(
              'rounded-full px-3 py-2 text-xs font-extrabold transition-colors',
              period === key ? 'bg-primary text-primary-foreground' : 'text-[#756A5D]',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <SummaryCard dashboard={dashboard} reviewSummary={reviewSummary} />
    </div>
  );
}
