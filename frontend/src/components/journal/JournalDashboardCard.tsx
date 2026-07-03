'use client';

import type { JournalDashboard, JournalRecord, SleepRange, StressLevel, MoodType } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { JournalShareButton } from '@/components/journal/JournalShareButton';
import { formatDashboardDateBadge, formatLastRelapseLabel } from '@/domain/journal/routine';

type JournalDashboardCardProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
  lastRecord?: JournalRecord | null;
  onRecordDaily?: () => void;
  onRecordRelapse?: () => void;
};

const SLEEP_LABELS: Record<SleepRange, string> = {
  UNDER_5: '5시간 미만',
  H5_6: '5~6시간',
  H6_7: '6~7시간',
  H7_PLUS: '7시간 이상',
};

const STRESS_LABELS: Record<StressLevel, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

const MOOD_LABELS: Record<MoodType, string> = {
  PEACEFUL: '평온해요',
  NORMAL: '보통이에요',
  STRESS: '조금 지쳤어요',
};

function isToday(isoDate: string | null | undefined): boolean {
  if (!isoDate) return false;
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return isoDate === `${y}-${m}-${d}`;
}

function formatRecordDate(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

function formatSleep(record: JournalRecord | null | undefined): string {
  if (!record) return '-';
  if (record.sleepHours != null) return `${record.sleepHours}h`;
  if (record.avgSleep) return SLEEP_LABELS[record.avgSleep];
  return '-';
}

function formatStress(record: JournalRecord | null | undefined): string {
  if (!record?.stressLevel) return '-';
  return STRESS_LABELS[record.stressLevel];
}

function buildMainStatus(record: JournalRecord | null, todayRecord: boolean): string {
  if (!record) return '첫 기록을 남겨볼까요';
  if (todayRecord && record.mood) return `오늘은 ${MOOD_LABELS[record.mood]}`;
  if (record.hadSymptoms) return '증상 기록이 있어요';
  if (record.mood) return MOOD_LABELS[record.mood];
  return '증상 없음';
}

function buildSubStatus(record: JournalRecord | null, todayRecord: boolean): string {
  if (!record) return '오늘의 수면, 영양제, 컨디션을 30초만 기록해 보세요.';
  const prefix = todayRecord ? '오늘 기록' : `${formatRecordDate(record.recordDate)} 기록`;
  return `${prefix} · 수면 ${formatSleep(record)} · 스트레스 ${formatStress(record)}`;
}

export function JournalDashboardCard({
  dashboard,
  isLoading,
  lastRecord,
  onRecordDaily,
  onRecordRelapse,
}: JournalDashboardCardProps) {
  if (isLoading) {
    return <section className="h-[333px] animate-pulse rounded-[24px] bg-[#D8CDB9]" aria-hidden />;
  }

  const focusRecord = dashboard?.todayRecord ?? lastRecord ?? null;
  const todayRecord = Boolean(dashboard?.todayRecord && isToday(dashboard.todayRecord.recordDate));
  const hasAnyRecord = Boolean(focusRecord);
  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;
  const yearRelapses = dashboard?.yearRelapses ?? 0;
  const lastRelapse = formatLastRelapseLabel(dashboard?.lastRelapseDate);
  const routineCompleted = dashboard?.routineCompletedToday ?? 0;
  const routineTotal = dashboard?.routineTotalToday ?? 3;

  return (
    <section className="overflow-hidden rounded-[24px] bg-[#07251F] shadow-[0_18px_40px_-22px_rgba(7,37,31,.55)]">
      <div className="relative h-[210px] overflow-hidden">
        <img
          src={PUBLIC_IMAGES.journalDashboardCard}
          alt=""
          className="absolute inset-0 h-full w-full object-cover object-[50%_40%]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(20,40,44,.12)_0%,rgba(20,40,44,.02)_40%,rgba(9,32,30,.66)_100%)]" />
        <div className="absolute inset-0 flex flex-col justify-between px-5 py-[18px]">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12.5px] font-medium tracking-wide text-white drop-shadow">
              {formatDashboardDateBadge(new Date())}
            </span>
            <JournalShareButton dashboard={dashboard} variant="icon" />
          </div>

          <div>
            <div className="mb-1.5 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#8AD4B8] shadow-[0_0_8px_#8AD4B8]" />
              <span className="text-[12.5px] font-semibold tracking-[0.02em] text-white/90 drop-shadow">
                {todayRecord ? '오늘 상태' : hasAnyRecord ? '마지막 기록' : '기록 시작'}
              </span>
            </div>
            <h2 className="hf-display text-[28px] font-extrabold leading-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,.42)]">
              {buildMainStatus(focusRecord, todayRecord)}
            </h2>
            <p className="mt-1.5 text-[12.5px] leading-[1.45] text-white/88 drop-shadow">
              {buildSubStatus(focusRecord, todayRecord)}
            </p>
          </div>
        </div>
      </div>

      <div className="px-[18px] py-[15px] text-white">
        <div className="mb-[13px] flex items-center justify-between gap-3">
          <span className="text-[11.5px] text-white/60">개인일지 요약 · 최근 기록 기준</span>
          {onRecordRelapse && (
            <button
              type="button"
              onClick={onRecordRelapse}
              className="text-[12px] font-medium text-[#F0C778]"
            >
              재발 기록
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-0 text-center">
          {[
            [`${relapseFreeDays}`, '일', '평온 유지'],
            [`${routineCompleted}/${routineTotal}`, '', '오늘 루틴'],
            [formatSleep(focusRecord), '', '수면'],
            [`${yearRelapses}`, '회', '올해 재발'],
          ].map(([value, unit, label], index) => (
            <div key={label} className="relative px-1">
              {index > 0 && <span className="absolute left-0 top-1 h-10 w-px bg-white/12" />}
              <p className="hf-display text-[20px] font-extrabold leading-none">
                {value}
                {unit && <span className="ml-0.5 text-[11px] font-normal text-white/60">{unit}</span>}
              </p>
              <p className="mt-1 text-[9.5px] text-white/55">{label}</p>
            </div>
          ))}
        </div>

        <p className="mt-3 text-[10.5px] leading-snug text-white/45">
          마지막 재발 {lastRelapse} · 영양제 {focusRecord?.supplementTaken ? '복용' : '기록 전'}
        </p>
      </div>

      {onRecordDaily && (
        <button
          type="button"
          onClick={onRecordDaily}
          className="mx-[14px] mb-3 flex min-h-[48px] w-[calc(100%-28px)] items-center justify-center rounded-[15px] bg-[#0B3B36] text-[14px] font-extrabold text-white shadow-[0_12px_28px_-20px_rgba(0,0,0,.5)] transition-colors hover:bg-[#0F4F48]"
        >
          오늘 기록하기
        </button>
      )}
    </section>
  );
}
