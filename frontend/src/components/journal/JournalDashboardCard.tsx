'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import type { JournalDashboard, JournalRecord, StressLevel } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { JournalShareButton } from '@/components/journal/JournalShareButton';
import { HERFREE_SITE_URL } from '@/domain/journal/share';
import {
  avgSleepToHours,
  countRecordStreak,
  formatDashboardDateBadge,
} from '@/domain/journal/routine';

type JournalDashboardCardProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
  lastRecord?: JournalRecord | null;
  onRecordDaily?: () => void;
  onRecordRelapse?: () => void;
};

type PreviewStatus = 'none' | 'prodrome' | 'symptom';

const HOME_SUMMARY_DAYS = 90;

const STRESS_LABELS: Record<StressLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

const PREVIEW_STATUS_TONE: Record<
  PreviewStatus,
  { dot: string; title: string; overlay: string }
> = {
  none: {
    dot: '#8AD4B8',
    title: '증상 없음',
    overlay:
      'linear-gradient(180deg, rgba(20,40,44,.12) 0%, rgba(20,40,44,.02) 42%, rgba(9,32,30,.62) 100%)',
  },
  prodrome: {
    dot: '#F0B27A',
    title: '전조 증상',
    overlay:
      'linear-gradient(180deg, rgba(46,34,14,.14) 0%, rgba(46,34,14,.04) 40%, rgba(74,47,16,.66) 100%)',
  },
  symptom: {
    dot: '#EF8C6B',
    title: '증상 발현',
    overlay:
      'linear-gradient(180deg, rgba(50,20,14,.16) 0%, rgba(50,20,14,.05) 38%, rgba(74,24,16,.68) 100%)',
  },
};

function derivePreviewStatus(record: JournalRecord | null): PreviewStatus {
  if (!record) return 'none';
  if (record.hadSymptoms) return 'symptom';
  if ((record.prodromalSymptoms ?? []).length > 0) return 'prodrome';
  return 'none';
}

function formatSleepHours(record: JournalRecord | null | undefined): string {
  if (!record) return '-';
  if (record.sleepHours != null) return `${record.sleepHours}`;
  const hours = avgSleepToHours(record.avgSleep);
  return hours == null ? '-' : `${hours}`;
}

function formatStress(record: JournalRecord | null | undefined): string {
  if (!record?.stressLevel) return '보통';
  return STRESS_LABELS[record.stressLevel];
}

function calcSupplementRate(days: JournalDashboard['timelineDays']): number {
  const recorded = days.filter((day) => day.recorded);
  if (recorded.length === 0) return 0;
  const taken = recorded.filter((day) => !day.medicationMissed).length;
  return Math.round((taken / recorded.length) * 100);
}

function filterTimelineByDays(
  days: JournalDashboard['timelineDays'],
  periodDays: number,
): JournalDashboard['timelineDays'] {
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

function buildPreviewSubStatus(
  status: PreviewStatus,
  record: JournalRecord | null,
  relapseFreeDays: number,
): string {
  if (status === 'symptom') {
    const severity = record?.severity ?? 3;
    return `증상 1일째 · 심각도 ${severity} · 오늘은 몸을 아껴요`;
  }
  if (status === 'prodrome') {
    const labels = (record?.prodromalSymptoms ?? []).slice(0, 2).join('·') || '전조 신호 감지';
    return `전조 신호 감지 · ${labels} · 오늘은 컨디션을 살펴봐요`;
  }
  return `마지막 증상 이후 ${relapseFreeDays}일째 · 수면 ${formatSleepHours(record)}h · 스트레스 ${formatStress(record)}`;
}

export function JournalDashboardCard({
  dashboard,
  isLoading,
  lastRecord,
  onRecordDaily,
}: JournalDashboardCardProps) {
  const focusRecord = dashboard?.todayRecord ?? lastRecord ?? null;
  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;
  const yearRelapses = dashboard?.yearRelapses ?? 0;
  const recordStreak = countRecordStreak(dashboard?.timelineDays);

  const status = derivePreviewStatus(focusRecord);
  const statusTone = PREVIEW_STATUS_TONE[status];

  const summaryMetrics = useMemo(() => {
    const timelineDays = filterTimelineByDays(dashboard?.timelineDays ?? [], HOME_SUMMARY_DAYS);
    return [
      {
        value: `${calcSupplementRate(timelineDays)}`,
        unit: '%',
        label: '영양제',
      },
      {
        value: formatSleepHours(focusRecord),
        unit: 'h',
        label: '평균 수면',
      },
      {
        value: `${yearRelapses}`,
        unit: '회',
        label: '올해 재발',
      },
      {
        value: `${timelineDays.filter((day) => day.recorded).length}`,
        unit: '일',
        label: '기록',
      },
    ];
  }, [dashboard?.timelineDays, focusRecord, yearRelapses]);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <section className="h-[360px] animate-pulse rounded-[24px] bg-[#D8CDB9]" aria-hidden />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <section
        id="hf-dashboard-card"
        className="w-full min-w-0 overflow-hidden rounded-[24px] shadow-[0_26px_52px_-30px_rgba(7,37,31,.65)]"
      >
        <div className="relative h-[196px] overflow-hidden bg-[#07251F] text-white">
          <img
            src={PUBLIC_IMAGES.journalDashboardCard}
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[50%_38%]"
          />
          <div className="absolute inset-0" style={{ background: statusTone.overlay }} />

          <div className="relative flex h-full flex-col justify-between px-5 py-[18px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-medium text-white [text-shadow:0_1px_6px_rgba(0,0,0,.3)]">
                {formatDashboardDateBadge(new Date())}
              </span>
              <JournalShareButton
                dashboard={dashboard}
                lastRecord={lastRecord}
                showRecordButton={Boolean(onRecordDaily)}
                variant="icon"
              />
            </div>

            <div>
              <div className="mb-1 flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: statusTone.dot, boxShadow: `0 0 8px ${statusTone.dot}` }}
                />
                <span className="text-[12.5px] font-semibold text-white/92 [text-shadow:0_1px_6px_rgba(0,0,0,.35)]">
                  오늘 상태
                </span>
              </div>
              <h2 className="hf-display text-[30px] font-bold text-white [text-shadow:0_2px_12px_rgba(0,0,0,.4)]">
                {statusTone.title}
              </h2>
              <p
                data-share-text="1"
                className="mt-1.5 min-w-0 break-keep whitespace-normal text-[12.5px] leading-[1.35] text-white/90 [text-shadow:0_1px_6px_rgba(0,0,0,.35)]"
              >
                {buildPreviewSubStatus(status, focusRecord, relapseFreeDays)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#07251F] px-[18px] pb-[18px] pt-4 text-white">
          <div className="mb-3.5 flex min-w-0 items-start justify-between gap-2">
            <span
              data-share-text="1"
              className="min-w-0 flex-1 whitespace-normal break-keep text-[11.5px] leading-4 text-white/60"
            >
              개인일지 요약 · 최근 {HOME_SUMMARY_DAYS}일
            </span>
            <Link
              href="/journal?tab=insights"
              className="shrink-0 whitespace-nowrap pt-px pr-1 text-[12px] font-medium text-[#F0C778]"
            >
              자세히 ›
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {summaryMetrics.map((metric) => (
              <div key={metric.label}>
                <p className="text-[20px] font-extrabold leading-none text-white">
                  {metric.value}
                  <span className="ml-0.5 text-[11px] font-normal text-white/60">{metric.unit}</span>
                </p>
                <p className="mt-[3px] text-[9.5px] text-white/55">{metric.label}</p>
              </div>
            ))}
          </div>

          <p className="mt-[15px] flex items-center justify-center gap-1.5 text-[12px] font-semibold text-[#F0C778]">
            🔥 {recordStreak}일 연속 기록 중
          </p>

          {onRecordDaily && (
            <button
              type="button"
              onClick={onRecordDaily}
              className="mt-2.5 w-full rounded-[13px] border border-[rgba(243,237,227,.3)] bg-[rgba(243,237,227,.12)] px-4 py-3.5 text-center text-[14px] font-bold text-[#F3EDE3] backdrop-blur-sm transition-colors hover:bg-[rgba(243,237,227,.18)]"
            >
              ✏️ 오늘 기록하기
            </button>
          )}

          <div
            data-share-only="1"
            aria-hidden="true"
            className="hidden items-center justify-between border-t border-white/10 pt-3 text-[10px] text-white/45"
          >
            <span className="font-semibold text-white/60">헤르프리 개인일지</span>
            <a href={HERFREE_SITE_URL} className="text-white/55">
              {HERFREE_SITE_URL.replace(/^https?:\/\//, '')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
