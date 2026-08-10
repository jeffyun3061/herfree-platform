'use client';

import { useMemo, useState } from 'react';
import type {
  JournalDashboard,
  JournalInsights,
  JournalReviewSummary,
  JournalTimelineDay,
} from '@/domain/journal/types';
import { countRecordStreak } from '@/domain/journal/routine';
import { cn } from '@/lib/cn';

type JournalInsightsPanelProps = {
  dashboard: JournalDashboard | null | undefined;
  dashboardLoading: boolean;
  reviewSummary: JournalReviewSummary | null | undefined;
  reviewSummaryLoading: boolean;
  insights?: JournalInsights | null | undefined;
  onDaySelect: (date: string) => void;
};

/** 디자이너 원본 흐름 차트의 지표 행 (아래에서 위 순서). */
const FLOW_ROWS = [
  { key: 'sleep', label: '수면', color: '#6FC2A6' },
  { key: 'supplement', label: '영양제', color: '#1D9E75' },
  { key: 'stress', label: '스트레스', color: '#E0A93D' },
  { key: 'prodrome', label: '전조증상', color: '#E0936B' },
  { key: 'symptom', label: '증상', color: '#CF5B36' },
] as const;

const SUMMARY_PERIOD_OPTIONS = [
  { id: '3m', label: '3개월', days: 90 },
  { id: '6m', label: '6개월', days: 180 },
  { id: '1y', label: '1년', days: 365 },
] as const;

type SummaryPeriod = (typeof SUMMARY_PERIOD_OPTIONS)[number]['id'];

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function formatDayNumber(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return date.slice(-2);
  return String(parsed.getDate()).padStart(2, '0');
}

function formatWeekday(date: string): string {
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return '';
  return ['일', '월', '화', '수', '목', '금', '토'][parsed.getDay()];
}

function isTodayIso(date: string): boolean {
  const now = new Date();
  const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
  return date === iso;
}

/** 하루 기록을 흐름 차트 지표 플래그 [수면·영양제·스트레스·전조·증상]로 변환. */
function dayFlags(day: JournalTimelineDay): boolean[] {
  return [
    day.recorded && !day.sleepDeficit,
    day.recorded && !day.medicationMissed,
    day.recorded && day.highStress,
    day.recorded && day.hasProdromal,
    day.recorded && day.hadSymptoms,
  ];
}

function calcSupplementRate(days: JournalTimelineDay[]): number {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return 0;
  const taken = recorded.filter((day) => !day.medicationMissed).length;
  return Math.round((taken / recorded.length) * 100);
}

function filterTimelineByDays(days: JournalTimelineDay[], periodDays: number): JournalTimelineDay[] {
  if (days.length === 0) return [];
  const anchorDate = days[days.length - 1]?.date;
  const anchor = new Date(`${anchorDate}T00:00:00`);
  if (Number.isNaN(anchor.getTime())) return days.slice(-periodDays);
  const cutoff = new Date(anchor);
  cutoff.setDate(cutoff.getDate() - periodDays + 1);
  const cutoffIso = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, '0')}-${String(
    cutoff.getDate(),
  ).padStart(2, '0')}`;
  return days.filter((day) => day.date >= cutoffIso);
}

function timelineStressTone(days: JournalTimelineDay[]): { percent: number; label: string; color: string } {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return { percent: 0, label: '기록 전', color: '#C98A2E' };
  const highCount = recorded.filter((day) => day.highStress).length;
  const ratio = highCount / recorded.length;
  if (ratio >= 0.45) return { percent: 82, label: '높음', color: '#CF5B36' };
  if (ratio >= 0.2) return { percent: 52, label: '보통', color: '#C98A2E' };
  return { percent: 24, label: '낮음', color: '#1D9E75' };
}

function timelineSleepLabel(days: JournalTimelineDay[]): { label: string; percent: number } {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return { label: '기록 전', percent: 0 };
  const goodSleep = recorded.filter((day) => !day.sleepDeficit).length;
  const rate = Math.round((goodSleep / recorded.length) * 100);
  return { label: `충분 ${rate}%`, percent: rate };
}

function symptomDegreeLabel(summary: JournalReviewSummary | null | undefined): string {
  const breakdown = summary?.severityBreakdown;
  if (!breakdown) return '안정';
  if (breakdown.highDays > 0) return '심함';
  if (breakdown.mediumDays > 0) return '보통';
  if (breakdown.lowDays > 0) return '경미';
  return '안정';
}

/** 디자이너 원본 흐름 차트: 날짜별 세로 스템 + 지표 도트. */
function FlowChart({
  days,
  onDaySelect,
}: {
  days: JournalTimelineDay[];
  onDaySelect: (date: string) => void;
}) {
  const rowGap = 20;
  const baseline = 96;

  return (
    <div
      className="grid w-full pl-0.5"
      style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}
    >
      {days.map((day) => {
        const flags = dayFlags(day);
        const active = flags.map((flag, index) => (flag ? index : -1)).filter((index) => index >= 0);
        const today = isTodayIso(day.date);
        let stem: React.ReactNode = null;
        if (active.length > 0) {
          const minIndex = Math.min(...active);
          const maxIndex = Math.max(...active);
          const yTop = baseline - maxIndex * rowGap;
          const yBottom = baseline - minIndex * rowGap;
          stem = (
            <span
              className="absolute left-1/2 w-[2px] -translate-x-1/2 bg-[#E7E0D4]"
              style={{ top: yTop, height: yBottom - yTop }}
              aria-hidden
            />
          );
        }

        return (
          <button
            key={day.date}
            type="button"
            disabled={!day.recorded}
            onClick={() => onDaySelect(day.date)}
            className={cn(
              'flex min-w-0 flex-col items-center',
              day.recorded ? 'cursor-pointer' : 'cursor-default',
            )}
            aria-label={`${day.date} ${day.recorded ? '기록 보기' : '기록 없음'}`}
          >
            {today ? (
              <span className="mb-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-[#0B3B36] text-[10px] font-bold text-white">
                {formatDayNumber(day.date)}
              </span>
            ) : (
              <span className="mb-0.5 text-[11px] text-[#9A9F94]">{formatDayNumber(day.date)}</span>
            )}
            <span className="mb-1.5 text-[10px] text-[#B0B4A8]">{formatWeekday(day.date)}</span>
            <span className="relative h-[108px] w-full min-w-0">
              {stem}
              {active.map((index) => (
                <span
                  key={index}
                  className="absolute left-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{ top: baseline - index * rowGap, background: FLOW_ROWS[index].color }}
                  aria-hidden
                />
              ))}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function JournalInsightsPanel({
  dashboard,
  dashboardLoading,
  reviewSummary,
  reviewSummaryLoading,
  onDaySelect,
}: JournalInsightsPanelProps) {
  const [summaryPeriod, setSummaryPeriod] = useState<SummaryPeriod>('6m');
  const loading = dashboardLoading || reviewSummaryLoading;

  const timelineDays = useMemo(() => dashboard?.timelineDays ?? [], [dashboard?.timelineDays]);
  const periodConfig =
    SUMMARY_PERIOD_OPTIONS.find((option) => option.id === summaryPeriod) ?? SUMMARY_PERIOD_OPTIONS[1];
  const periodDays = periodConfig.days;
  const filteredDays = useMemo(
    () => filterTimelineByDays(timelineDays, periodDays),
    [timelineDays, periodDays],
  );

  if (loading) {
    return (
      <div className="mx-auto max-w-app space-y-3">
        <section className="h-[80px] animate-pulse rounded-[16px] bg-[#E8DFD2]" aria-hidden />
        <section className="h-[220px] animate-pulse rounded-[24px] bg-[#E8DFD2]" aria-hidden />
        <section className="h-[260px] animate-pulse rounded-[24px] bg-[#D8CDB9]" aria-hidden />
      </div>
    );
  }

  if (!dashboard) {
    return (
      <section className="mx-auto max-w-app rounded-[20px] border border-[#EADFCB] bg-[#FBF6EA] px-4 py-8 text-center shadow-[0_14px_32px_-26px_rgba(7,37,31,.4)]">
        <h2 className="text-[16px] font-extrabold text-[#1E2621]">기록을 남기면 요약이 열려요</h2>
        <p className="mt-2 text-[12.5px] leading-[1.6] text-[#7A847C]">
          수면, 영양제, 스트레스, 증상 기록이 쌓이면 관리 흐름을 한눈에 볼 수 있어요.
        </p>
      </section>
    );
  }

  const recentDays = timelineDays.slice(-14);
  const streak = countRecordStreak(timelineDays);

  const supplementRate = calcSupplementRate(filteredDays);
  const sleepFromTimeline = timelineSleepLabel(filteredDays);
  const avgSleep = sleepFromTimeline.label;
  const sleepPercent = sleepFromTimeline.percent;
  const stress = timelineStressTone(filteredDays);
  const symptomDays = filteredDays.filter((day) => day.recorded && day.hadSymptoms).length;
  const recordedDays = filteredDays.filter((day) => day.recorded).length;
  const relapseFreeDays = dashboard.relapseFreeDays ?? 0;
  const lastSymptomLabel =
    symptomDays === 0 && relapseFreeDays === 0
      ? '기간 내 증상 없음'
      : `마지막 증상 ${relapseFreeDays}일 전`;

  const summaryBars = [
    {
      icon: '💊',
      label: '영양제 복용률',
      value: `${supplementRate}%`,
      valueColor: '#1D9E75',
      barColor: '#1D9E75',
      percent: supplementRate,
    },
    {
      icon: '😴',
      label: '수면 충분',
      value: avgSleep,
      valueColor: '#1D9E75',
      barColor: '#1D9E75',
      percent: sleepPercent,
    },
    {
      icon: '🧠',
      label: '스트레스',
      value: stress.label,
      valueColor: stress.color,
      barColor: stress.color === '#1D9E75' ? '#1D9E75' : '#E0A93D',
      percent: stress.percent,
    },
  ];

  const summaryStats = [
    { value: symptomDegreeLabel(reviewSummary), label: '증상 정도' },
    { value: `${symptomDays}일`, label: '증상 있던 날' },
    { value: `${recordedDays}일`, label: '기록한 날' },
  ];

  return (
    <div className="mx-auto max-w-app space-y-[18px]">
      {/* 연속 기록 스트릭 */}
      <section className="flex items-center gap-3.5 rounded-[16px] border border-[#EADFCB] bg-[#FBF6EA] px-[18px] py-[15px] shadow-[0_12px_28px_-26px_rgba(7,37,31,.4)]">
        <span
          className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#FBF3DF] text-[20px]"
          aria-hidden
        >
          🔥
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-bold text-[#1E2621]">
            <span className="hf-display text-[17px] font-extrabold text-[#0B3B36]">{streak}일</span>{' '}
            연속 기록 중
          </p>
          <p className="mt-0.5 text-[11.5px] text-[#8A9089]">
            꾸준히 기록할수록 내 흐름이 잘 보여요
          </p>
        </div>
      </section>

      {/* 최근 14일 흐름 */}
      <section className="px-0.5">
        <h3 className="mb-1 text-[14px] font-bold text-[#1E2621]">최근 14일 흐름</h3>
        <p className="mb-3.5 text-[11.5px] text-[#9A9F94]">
          재발했을 때 요즘 컨디션을 돌아보기 좋아요
        </p>
        <div className="mb-4 flex flex-wrap gap-x-3.5 gap-y-2">
          {FLOW_ROWS.map((row) => (
            <span key={row.key} className="flex items-center gap-1.5 text-[11px] text-[#5C645A]">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: row.color }}
                aria-hidden
              />
              {row.label}
            </span>
          ))}
        </div>
        {recentDays.length > 0 ? (
          <div className="w-full overflow-hidden">
            <FlowChart days={recentDays} onDaySelect={onDaySelect} />
          </div>
        ) : (
          <p className="py-5 text-center text-[12px] font-medium text-[#7A847C]">
            아직 표시할 기록이 없어요.
          </p>
        )}
      </section>

      {/* 개인일지 요약 */}
      <section className="border-t-[0.5px] border-[#E4DBC9] px-0.5 pt-1.5">
        <div className="my-[18px] flex items-center justify-between gap-3">
          <h3 className="text-[14px] font-bold text-[#1E2621]">
            개인일지 요약 · 최근 {periodDays}일
          </h3>
          <span className="shrink-0 text-[12.5px] font-semibold text-[#15695E]">
            {lastSymptomLabel}
          </span>
        </div>

        <div className="mb-4 flex gap-[3px] rounded-full bg-[#EBE2D1] p-[3px]">
          {SUMMARY_PERIOD_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setSummaryPeriod(option.id)}
              className={cn(
                'flex-1 rounded-full px-1 py-1.5 text-center text-[11px] transition-colors',
                summaryPeriod === option.id
                  ? 'bg-[#0B3B36] font-bold text-white'
                  : 'font-medium text-[#8A9089]',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="space-y-[15px]">
          {summaryBars.map((bar) => (
            <div key={bar.label}>
              <div className="mb-[7px] flex items-center justify-between gap-3">
                <span className="min-w-0 truncate text-[12.5px] text-[#5C645A]">
                  {bar.icon} {bar.label}
                </span>
                <span className="shrink-0 text-[13px] font-bold" style={{ color: bar.valueColor }}>
                  {bar.value}
                </span>
              </div>
              <div className="h-[7px] rounded-[4px] bg-[#E7DFCF]">
                <div
                  className="h-[7px] rounded-[4px]"
                  style={{ background: bar.barColor, width: `${clampPercent(bar.percent)}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex border-t-[0.5px] border-[#E4DBC9] pt-[18px]">
          {summaryStats.map((stat, index) => (
            <div
              key={stat.label}
              className={cn(
                'flex-1 text-center',
                index > 0 && 'border-l-[0.5px] border-[#E4DBC9]',
              )}
            >
              <p className="hf-display text-[20px] font-extrabold text-[#0B3B36]">{stat.value}</p>
              <p className="mt-[3px] text-[10.5px] text-[#9A9F94]">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
