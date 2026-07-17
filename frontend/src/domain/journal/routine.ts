/**
 * 일지 루틴 3종(수면·영양제·컨디션) 완료율·타임라인 표시용 순수 함수.
 * API {@code JournalService}의 ROUTINE_TASK_COUNT=3과 맞춘다.
 */
import type {
  JournalRecord,
  JournalTimelineDay,
  SleepRange,
  MoodType,
  StressLevel,
} from '@/domain/journal/types';
import { MOOD_OPTIONS, SLEEP_OPTIONS, STRESS_OPTIONS } from '@/domain/journal/types';

export const ROUTINE_TASK_TOTAL = 3;

export type RoutineItemId = 'sleep' | 'supplement' | 'condition';

export type RoutineItem = {
  id: RoutineItemId;
  label: string;
  hint: string;
  completed: boolean;
};

/** 수면 구간 → 대표 시간(시간). 히스토리·요약 표시용 */
export function avgSleepToHours(range: SleepRange | null | undefined): number | null {
  switch (range) {
    case 'UNDER_5':
      return 4.5;
    case 'H5_6':
      return 5.5;
    case 'H6_7':
      return 6.5;
    case 'H7_PLUS':
      return 7.5;
    default:
      return null;
  }
}

/** 대시보드 루틴 1: 7시간 이상 수면 */
export function isSleepRoutineComplete(record: JournalRecord | null | undefined): boolean {
  if (!record) return false;
  if (record.avgSleep === 'H7_PLUS') return true;
  if (record.sleepHours != null && record.sleepHours >= 7) return true;
  return false;
}

export function isSupplementRoutineComplete(record: JournalRecord | null | undefined): boolean {
  return record?.supplementTaken ?? false;
}

export function isConditionRoutineComplete(record: JournalRecord | null | undefined): boolean {
  if (!record) return false;
  if (record.mood != null || record.stressLevel != null) return true;
  const memo = record.memo?.trim();
  return Boolean(memo);
}

export function countRoutineCompleted(record: JournalRecord | null | undefined): number {
  let count = 0;
  if (isSleepRoutineComplete(record)) count++;
  if (isSupplementRoutineComplete(record)) count++;
  if (isConditionRoutineComplete(record)) count++;
  return count;
}

export function buildTodayRoutineItems(record: JournalRecord | null | undefined): RoutineItem[] {
  return [
    {
      id: 'sleep',
      label: '7시간 이상 수면하기',
      hint: '7시간 이상 선택 시 완료',
      completed: isSleepRoutineComplete(record),
    },
    {
      id: 'supplement',
      label: '영양제 챙겨 먹기',
      hint: '오늘 복용했으면 완료',
      completed: isSupplementRoutineComplete(record),
    },
    {
      id: 'condition',
      label: '오늘 컨디션 기록하기',
      hint: '기분·스트레스·메모 중 하나',
      completed: isConditionRoutineComplete(record),
    },
  ];
}

export function formatSleepLabel(record: JournalRecord): string {
  if (record.avgSleep) {
    return SLEEP_OPTIONS.find((o) => o.value === record.avgSleep)?.label ?? '—';
  }
  if (record.sleepHours != null) return `${record.sleepHours}시간`;
  return '—';
}

export function formatMoodLabel(mood: MoodType | null | undefined): string {
  if (!mood) return '—';
  return MOOD_OPTIONS.find((o) => o.value === mood)?.label ?? mood;
}

export function formatStressLabel(level: StressLevel | null | undefined): string {
  if (!level) return '—';
  return STRESS_OPTIONS.find((o) => o.value === level)?.label ?? level;
}

export function formatConditionSummary(record: JournalRecord): string {
  const parts: string[] = [];
  if (record.mood) parts.push(formatMoodLabel(record.mood));
  if (record.stressLevel) parts.push(`스트레스 ${formatStressLabel(record.stressLevel)}`);
  if (record.memo?.trim()) parts.push('메모');
  return parts.length > 0 ? parts.join(' · ') : '—';
}

/**
 * 연속 기록 일수 (오늘 또는 어제까지 끊기지 않은 recorded 일수).
 * 디자이너 개선판 홈/요약 탭의 "N일 연속 기록 중" 스트릭 라인에 사용한다.
 */
export function countRecordStreak(days: JournalTimelineDay[] | null | undefined): number {
  if (!days || days.length === 0) return 0;
  const sorted = [...days].sort((a, b) => (a.date < b.date ? 1 : -1));
  let streak = 0;
  for (let index = 0; index < sorted.length; index += 1) {
    const day = sorted[index];
    if (day.recorded) {
      streak += 1;
    } else if (index === 0) {
      // 오늘 아직 기록 전이면 어제까지의 연속 기록을 유지한다.
      continue;
    } else {
      break;
    }
  }
  return streak;
}

export function formatDashboardDateBadge(date: Date): string {
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d} ${weekdays[date.getDay()]}`;
}

export function formatLastRelapseLabel(isoDate: string | null | undefined): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${y}.${m}.${d}`;
}
