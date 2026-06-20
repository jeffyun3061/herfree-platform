import type { JournalRecord, JournalRecordInput, SleepRange, StressLevel } from '@/domain/journal/types';
import { avgSleepToHours } from '@/domain/journal/routine';
import type { WizardEntryMode } from '@/domain/journal/wizard';

export function hoursToSleepRange(hours: number): SleepRange {
  if (hours < 5) return 'UNDER_5';
  if (hours < 6) return 'H5_6';
  if (hours < 7) return 'H6_7';
  return 'H7_PLUS';
}

export function resolveSleepHours(record: JournalRecord | null | undefined, fallback = 7): number {
  if (record?.sleepHours != null) return Math.round(record.sleepHours);
  const fromRange = avgSleepToHours(record?.avgSleep ?? null);
  return fromRange != null ? Math.round(fromRange) : fallback;
}

export function formatRecordSheetDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  return `${year}.${month}.${day}`;
}

export function recordToSheetForm(
  record: JournalRecord | null | undefined,
  date: string,
  mode: WizardEntryMode,
): JournalRecordInput {
  return {
    recordDate: date,
    medicationStatus: record?.medicationStatus ?? 'NORMAL',
    avgSleep: record?.avgSleep ?? null,
    stressLevel: record?.stressLevel ?? 'MEDIUM',
    hadSymptoms: mode === 'relapse' ? true : (record?.hadSymptoms ?? false),
    prodromalSymptoms: record?.prodromalSymptoms ?? [],
    severity: record?.severity ?? null,
    triggers: record?.triggers ?? [],
    memo: record?.memo ?? null,
    mood: record?.mood ?? null,
    sleepHours: resolveSleepHours(record),
    supplementTaken: record?.supplementTaken ?? false,
    exerciseDone: record?.exerciseDone ?? false,
  };
}

export function sheetFormToInput(form: JournalRecordInput, sleepHours: number): JournalRecordInput {
  const avgSleep = hoursToSleepRange(sleepHours);
  const hasProdromal = (form.prodromalSymptoms ?? []).length > 0;
  const hadSymptoms = Boolean(form.hadSymptoms);

  return {
    ...form,
    sleepHours,
    avgSleep,
    stressLevel: form.stressLevel ?? 'MEDIUM',
    hadSymptoms,
    prodromalSymptoms: hasProdromal ? form.prodromalSymptoms ?? [] : [],
    severity: hadSymptoms ? form.severity ?? 3 : null,
    triggers: hadSymptoms ? form.triggers ?? [] : [],
    memo: form.memo?.trim().slice(0, 200) || null,
    supplementTaken: form.supplementTaken ?? false,
    exerciseDone: form.exerciseDone ?? false,
  };
}

export const STRESS_BUTTONS: { value: StressLevel; label: string }[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
];

export const SEVERITY_LEVEL_STYLES: Record<number, string> = {
  1: 'bg-[#FCE4DE] text-[#4A1B0C]',
  2: 'bg-[#F8C2B0] text-[#4A1B0C]',
  3: 'bg-[#F09A7B] text-[#4A1B0C]',
  4: 'bg-[#E8623A] text-white',
  5: 'bg-[#D8401C] text-white',
};
