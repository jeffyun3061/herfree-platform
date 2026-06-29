export type MedicationStatus = 'NORMAL' | 'IRREGULAR' | 'NOT_TAKING';
export type SleepRange = 'UNDER_5' | 'H5_6' | 'H6_7' | 'H7_PLUS';
export type StressLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type MoodType = 'PEACEFUL' | 'NORMAL' | 'STRESS';

export type JournalSeverityTier = 'LOW' | 'MEDIUM' | 'HIGH';

export type JournalReviewWeekDay = {
  date: string;
  dayLabel: string;
  hadSymptoms: boolean;
  severityTier: JournalSeverityTier | null;
};

export type JournalReviewTimelineDay = {
  date: string;
  hadSymptoms: boolean;
  severityTier: JournalSeverityTier | null;
};

export type JournalSeverityBreakdown = {
  lowDays: number;
  mediumDays: number;
  highDays: number;
};

export type JournalReviewSummary = {
  periodStart: string;
  periodEnd: string;
  periodDays: number;
  symptomDays: number;
  weekDays: JournalReviewWeekDay[];
  topProdromalLabels: string[];
  topTriggerLabels: string[];
  timelineDays: JournalReviewTimelineDay[];
  severityBreakdown: JournalSeverityBreakdown;
  prodromalOrder: string[];
  avgSleepLabel: string;
  avgStressLabel: string;
  medicationRecordedDays: number;
  medicationPattern: string;
};

export const SEVERITY_COLORS = {
  LOW: '#F3C691',
  MEDIUM: '#E67E22',
  HIGH: '#E74C3C',
} as const;

export const SEVERITY_TIER_LABELS: Record<JournalSeverityTier, string> = {
  LOW: '낮음',
  MEDIUM: '보통',
  HIGH: '높음',
};

export type JournalRecord = {
  id: number;
  recordDate: string;
  medicationStatus: MedicationStatus | null;
  avgSleep: SleepRange | null;
  stressLevel: StressLevel | null;
  hadSymptoms: boolean;
  prodromalSymptoms: string[];
  severity: number | null;
  triggers: string[];
  memo: string | null;
  mood: MoodType | null;
  sleepHours: number | null;
  supplementTaken: boolean;
  exerciseDone: boolean;
  createdAt: string;
  updatedAt: string;
};

export type JournalRecordInput = {
  recordDate: string;
  medicationStatus?: MedicationStatus | null;
  avgSleep?: SleepRange | null;
  stressLevel?: StressLevel | null;
  hadSymptoms: boolean;
  prodromalSymptoms?: string[];
  severity?: number | null;
  triggers?: string[];
  memo?: string | null;
  mood?: MoodType | null;
  sleepHours?: number | null;
  supplementTaken?: boolean;
  exerciseDone?: boolean;
};

export type JournalTodayStatusLevel = 'NOT_RECORDED' | 'STABLE' | 'ATTENTION' | 'RELAPSE';
export type JournalTrendDirection = 'IMPROVING' | 'STABLE' | 'WORSENING' | 'UNKNOWN';

export type JournalTimelineDay = {
  date: string;
  recorded: boolean;
  hadSymptoms: boolean;
  hasProdromal: boolean;
  sleepDeficit: boolean;
  highStress: boolean;
  medicationMissed: boolean;
};

export type JournalDashboard = {
  relapseFreeDays: number;
  totalRelapses: number;
  monthRelapses: number;
  yearRelapses: number;
  lastRelapseDate: string | null;
  routineCompletedToday: number;
  routineTotalToday: number;
  todayRecord: JournalRecord | null;
  recentRelapses: JournalRecord[];
  todayStatusSummary: string;
  todayStatusLevel: JournalTodayStatusLevel;
  trendDirection: JournalTrendDirection;
  personalPatternLine: string;
  timelineDays: JournalTimelineDay[];
};

export type JournalInsightItem = {
  code: string;
  label: string;
  percentage: number;
};

export type JournalInsights = {
  sampleSize: number;
  sufficientData: boolean;
  topTriggers: JournalInsightItem[];
  topProdromalSymptoms: JournalInsightItem[];
  insightMessage: string;
  insightLines: string[];
};

export type JournalPublicHomeStats = {
  usersRecordingToday: number;
  totalUsers: number;
};

export type AdminJournalStats = {
  totalRecords: number;
  totalUsers: number;
  symptomRecords: number;
  recordsLast7Days: number;
  recordsLast30Days: number;
  symptomRecordsLast7Days: number;
  symptomRecordsLast30Days: number;
  pendingReports: number;
  acceptedReports: number;
  rejectedReports: number;
  hiddenPostsCount: number;
  hiddenCommentsCount: number;
  contentHints: string[];
  insightLines: string[];
  communityInsights: JournalInsights;
};

export const TREND_DIRECTION_LABELS: Record<JournalTrendDirection, string> = {
  IMPROVING: '나아지는 중',
  STABLE: '안정적',
  WORSENING: '주의 필요',
  UNKNOWN: '데이터 부족',
};

export const TODAY_STATUS_LABELS: Record<JournalTodayStatusLevel, string> = {
  NOT_RECORDED: '기록 전',
  STABLE: '안정',
  ATTENTION: '주의',
  RELAPSE: '재발',
};

export const MEDICATION_OPTIONS: { value: MedicationStatus; label: string }[] = [
  { value: 'NORMAL', label: '정상 복용' },
  { value: 'IRREGULAR', label: '불규칙 복용' },
  { value: 'NOT_TAKING', label: '복용 안 함' },
];

export const SLEEP_OPTIONS: { value: SleepRange; label: string }[] = [
  { value: 'UNDER_5', label: '5시간 미만' },
  { value: 'H5_6', label: '5~6시간' },
  { value: 'H6_7', label: '6~7시간' },
  { value: 'H7_PLUS', label: '7시간 이상' },
];

export const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
];

export const PRODROMAL_OPTIONS: { value: string; label: string }[] = [
  { value: 'NUMBNESS', label: '저림' },
  { value: 'HEAVINESS', label: '묵직함' },
  { value: 'WARMTH', label: '열감' },
  { value: 'ITCHING', label: '가려움' },
  { value: 'FATIGUE', label: '피로감' },
  { value: 'NONE', label: '없었음' },
];

export const TRIGGER_OPTIONS: { value: string; label: string }[] = [
  { value: 'STRESS', label: '스트레스' },
  { value: 'SLEEP_DEFICIT', label: '수면부족' },
  { value: 'ALCOHOL', label: '음주' },
  { value: 'HIGH_EXERCISE', label: '고강도 운동' },
  { value: 'SEXUAL_ACTIVITY', label: '성관계' },
  { value: 'MENSTRUATION', label: '생리 전후' },
  { value: 'OVERWORK', label: '과로' },
  { value: 'LOW_IMMUNITY', label: '면역 저하' },
  { value: 'UNKNOWN', label: '모르겠음' },
];

/** 오늘 기록하기 증상 트리거 칩 (목업 순서) */
export const RECORD_SYMPTOM_TRIGGER_OPTIONS = TRIGGER_OPTIONS.filter((option) =>
  ['STRESS', 'SLEEP_DEFICIT', 'ALCOHOL', 'HIGH_EXERCISE', 'SEXUAL_ACTIVITY', 'UNKNOWN'].includes(
    option.value,
  ),
);

export const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'PEACEFUL', label: '평온', emoji: '😊' },
  { value: 'NORMAL', label: '보통', emoji: '😐' },
  { value: 'STRESS', label: '스트레스', emoji: '⚡' },
];

export const SEVERITY_EMOJIS = ['😌', '🙂', '😟', '😣', '😰'] as const;

export function toDateInputValue(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** API 날짜 필드를 `YYYY-MM-DD` 문자열로 통일한다 (배열 직렬화 등 방어). */
export function normalizeIsoDate(value: unknown): string {
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  if (Array.isArray(value) && value.length >= 3) {
    const [y, m, d] = value as [number, number, number];
    return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }
  return toDateInputValue();
}

export function normalizeJournalRecord(record: JournalRecord): JournalRecord {
  return {
    ...record,
    recordDate: normalizeIsoDate(record.recordDate),
  };
}

export function normalizeTimelineDay(day: JournalTimelineDay): JournalTimelineDay {
  return {
    ...day,
    date: normalizeIsoDate(day.date),
  };
}

export function normalizeJournalDashboard(dashboard: JournalDashboard): JournalDashboard {
  return {
    ...dashboard,
    todayRecord: dashboard.todayRecord
      ? normalizeJournalRecord(dashboard.todayRecord)
      : null,
    recentRelapses: dashboard.recentRelapses.map(normalizeJournalRecord),
    timelineDays: dashboard.timelineDays.map(normalizeTimelineDay),
  };
}

export function formatReviewDateDot(isoDate: string): string {
  const [y, m, d] = normalizeIsoDate(isoDate).split('-');
  return `${y}.${m}.${d}`;
}

export function formatReviewDateRange(start: string, end: string, days: number): string {
  return `${formatReviewDateDot(start)} - ${formatReviewDateDot(end)} (${days}일)`;
}

export function formatLabelList(labels: string[], fallback = '기록 없음'): string {
  return labels.length > 0 ? labels.join(' · ') : fallback;
}

export function normalizeReviewSummary(summary: JournalReviewSummary): JournalReviewSummary {
  return {
    ...summary,
    periodStart: normalizeIsoDate(summary.periodStart),
    periodEnd: normalizeIsoDate(summary.periodEnd),
    weekDays: summary.weekDays.map((day) => ({
      ...day,
      date: normalizeIsoDate(day.date),
    })),
    timelineDays: summary.timelineDays.map((day) => ({
      ...day,
      date: normalizeIsoDate(day.date),
    })),
  };
}

export function formatJournalDateLabel(isoDate: string): string {
  const date = new Date(isoDate + 'T00:00:00');
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });
}

export function getTriggerLabel(value: string): string {
  return TRIGGER_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

export function formatTriggerLabels(triggers: string[]): string {
  if (triggers.length === 0) return '없음';
  return triggers.map(getTriggerLabel).join(', ');
}

export function formatStressLabel(level: StressLevel | null | undefined): string {
  if (!level) return '—';
  return STRESS_OPTIONS.find((option) => option.value === level)?.label ?? level;
}
