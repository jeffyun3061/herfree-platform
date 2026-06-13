export type MedicationStatus = 'NORMAL' | 'IRREGULAR' | 'NOT_TAKING';
export type SleepRange = 'UNDER_5' | 'H5_6' | 'H6_7' | 'H7_PLUS';
export type StressLevel = 'LOW' | 'MEDIUM' | 'HIGH';
export type MoodType = 'PEACEFUL' | 'NORMAL' | 'STRESS';

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

export type JournalDashboard = {
  relapseFreeDays: number;
  totalRelapses: number;
  monthRelapses: number;
  routineCompletedToday: number;
  routineTotalToday: number;
  todayRecord: JournalRecord | null;
  recentRelapses: JournalRecord[];
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

export type AdminJournalStats = {
  totalRecords: number;
  totalUsers: number;
  symptomRecords: number;
  insightLines: string[];
  communityInsights: JournalInsights;
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
  { value: 'SLEEP_DEFICIT', label: '수면 부족' },
  { value: 'ALCOHOL', label: '음주' },
  { value: 'MENSTRUATION', label: '생리 전후' },
  { value: 'OVERWORK', label: '과로' },
  { value: 'LOW_IMMUNITY', label: '면역 저하' },
  { value: 'UNKNOWN', label: '모르겠음' },
];

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
