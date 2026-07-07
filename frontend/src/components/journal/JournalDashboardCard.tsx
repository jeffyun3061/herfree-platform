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

function getStatusTone(record: JournalRecord | null): {
  label: string;
  dot: string;
  overlay: string;
} {
  if (record?.hadSymptoms) {
    return {
      label: '증상 발현',
      dot: '#EF8C6B',
      overlay:
        'linear-gradient(180deg,rgba(50,20,14,.16)_0%,rgba(50,20,14,.08)_38%,rgba(74,24,16,.88)_70%,rgba(74,24,16,.96)_100%)',
    };
  }

  if ((record?.prodromalSymptoms ?? []).length > 0) {
    return {
      label: '전조 증상',
      dot: '#F0B27A',
      overlay:
        'linear-gradient(180deg,rgba(46,34,14,.14)_0%,rgba(46,34,14,.06)_40%,rgba(74,47,16,.86)_70%,rgba(74,47,16,.96)_100%)',
    };
  }

  return {
    label: '증상 없음',
    dot: '#8AD4B8',
    overlay:
      'linear-gradient(180deg,rgba(12,55,52,.12)_0%,rgba(7,37,31,.34)_46%,rgba(5,32,28,.96)_68%,rgba(5,32,28,.98)_100%)',
  };
}

function buildMainStatus(record: JournalRecord | null, todayRecord: boolean, relapseFreeDays: number): string {
  if (!record) {
    if (relapseFreeDays > 0) return `${relapseFreeDays}일째 평온`;
    return '첫 기록을 남겨볼까요';
  }
  if (record.hadSymptoms) return '증상 발현';
  if ((record.prodromalSymptoms ?? []).length > 0) return '전조 증상';
  if (todayRecord && record.mood) return `오늘은 ${MOOD_LABELS[record.mood]}`;
  if (record.mood) return MOOD_LABELS[record.mood];
  return '증상 없음';
}

function buildSubStatus(record: JournalRecord | null, todayRecord: boolean, relapseFreeDays: number): string {
  if (!record) {
    if (relapseFreeDays > 0) return '최근 기록을 기준으로 평온 흐름을 이어가고 있어요.';
    return '오늘의 수면, 영양제, 컨디션을 30초만 기록해 보세요.';
  }
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
  const statusTone = getStatusTone(focusRecord);

  return (
    <section className="relative overflow-hidden rounded-[25px] bg-[#07251F] text-white shadow-[0_22px_44px_-24px_rgba(7,37,31,.62)]">
      <img
        src={PUBLIC_IMAGES.journalDashboardCard}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[50%_38%]"
      />
      <div className="absolute inset-0" style={{ background: statusTone.overlay }} />

      <div className="relative flex min-h-[392px] flex-col px-5 pb-5 pt-[18px]">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12px] font-semibold tracking-wide text-white/92 drop-shadow">
            {formatDashboardDateBadge(new Date())}
          </span>
          <JournalShareButton dashboard={dashboard} variant="icon" />
        </div>

        <div className="mt-[76px]">
          <div className="mb-2 flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: statusTone.dot, boxShadow: `0 0 10px ${statusTone.dot}` }}
            />
            <span className="text-[13px] font-bold tracking-[0.02em] text-white/90 drop-shadow">
              {todayRecord ? '오늘 상태' : hasAnyRecord ? statusTone.label : '기록 시작'}
            </span>
          </div>
          <h2 className="hf-display text-[34px] font-extrabold leading-[1.08] text-white drop-shadow-[0_2px_14px_rgba(0,0,0,.45)]">
            {buildMainStatus(focusRecord, todayRecord, relapseFreeDays)}
          </h2>
          <p className="mt-2 line-clamp-2 text-[12.5px] leading-[1.5] text-white/72 drop-shadow">
            {buildSubStatus(focusRecord, todayRecord, relapseFreeDays)}
          </p>
        </div>

        <div className="mt-auto pt-8">
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-white/58">개인일지 요약 · 최근 기록 기준</span>
            {onRecordRelapse && (
              <button
                type="button"
                onClick={onRecordRelapse}
                className="shrink-0 text-[12px] font-extrabold text-[#F0C778]"
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
                {index > 0 && <span className="absolute left-0 top-1 h-11 w-px bg-white/13" />}
                <p className="hf-display text-[24px] font-extrabold leading-none">
                  {value}
                  {unit && <span className="ml-0.5 text-[12px] font-normal text-white/62">{unit}</span>}
                </p>
                <p className="mt-1.5 text-[10px] font-medium text-white/50">{label}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 truncate text-[11px] leading-snug text-white/44">
            마지막 재발 {lastRelapse} · 영양제 {focusRecord?.supplementTaken ? '복용' : '기록 전'}
          </p>

          {onRecordDaily && (
            <button
              type="button"
              onClick={onRecordDaily}
              className="mt-4 flex min-h-[54px] w-full items-center justify-center rounded-[17px] bg-[#F3CC70] text-[15px] font-extrabold text-[#082F2A] shadow-[0_16px_32px_-20px_rgba(243,204,112,.95)] transition-colors hover:bg-[#F8D77D]"
            >
              ✎ 오늘 기록하기
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
