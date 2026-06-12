'use client';

import { useEffect, useState } from 'react';
import {
  MEDICATION_OPTIONS,
  PRODROMAL_OPTIONS,
  SLEEP_OPTIONS,
  STRESS_OPTIONS,
  TRIGGER_OPTIONS,
  toDateInputValue,
  type JournalRecord,
  type JournalRecordInput,
  type MedicationStatus,
  type SleepRange,
  type StressLevel,
} from '@/domain/journal/types';
import { ChipMultiSelect } from '@/components/journal/ChipMultiSelect';
import { SeveritySelector } from '@/components/journal/SeveritySelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type JournalRecordFormProps = {
  initialRecord?: JournalRecord | null;
  isSubmitting: boolean;
  onSubmit: (input: JournalRecordInput) => Promise<void>;
  onDateChange?: (date: string) => void;
};

function toFormState(record?: JournalRecord | null, date?: string): JournalRecordInput {
  return {
    recordDate: record?.recordDate ?? date ?? toDateInputValue(),
    medicationStatus: record?.medicationStatus ?? 'NORMAL',
    avgSleep: record?.avgSleep ?? 'UNDER_5',
    stressLevel: record?.stressLevel ?? 'HIGH',
    hadSymptoms: record?.hadSymptoms ?? false,
    prodromalSymptoms: record?.prodromalSymptoms ?? [],
    severity: record?.severity ?? null,
    triggers: record?.triggers ?? [],
    memo: record?.memo ?? '',
    mood: record?.mood ?? null,
    sleepHours: record?.sleepHours ?? null,
    supplementTaken: record?.supplementTaken ?? false,
    exerciseDone: record?.exerciseDone ?? false,
  };
}

export function JournalRecordForm({
  initialRecord,
  isSubmitting,
  onSubmit,
  onDateChange,
}: JournalRecordFormProps) {
  const [form, setForm] = useState<JournalRecordInput>(() => toFormState(initialRecord));

  useEffect(() => {
    setForm(toFormState(initialRecord));
    // key={selectedDate}로 날짜 변경 시 리마운트되므로 initialRecord 동기화만 처리
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialRecord?.id, initialRecord?.updatedAt]);

  const update = <K extends keyof JournalRecordInput>(key: K, value: JournalRecordInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await onSubmit({
      ...form,
      memo: form.memo?.trim() || null,
      severity: form.hadSymptoms ? form.severity ?? 3 : null,
      prodromalSymptoms: form.hadSymptoms ? form.prodromalSymptoms : [],
      triggers: form.hadSymptoms ? form.triggers : [],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="journal-form-card space-y-6">
      <div>
        <h2 className="font-serif text-xl font-semibold text-ink">재발 기록</h2>
        <p className="mt-1 text-sm text-muted">나만 볼 수 있는 비공개 일지입니다.</p>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-ink">기본 정보</h3>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted">날짜</span>
          <Input
            type="date"
            value={form.recordDate}
            onChange={(e) => {
              update('recordDate', e.target.value);
              onDateChange?.(e.target.value);
            }}
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted">복약 상태</span>
          <select
            className="journal-select"
            value={form.medicationStatus ?? ''}
            onChange={(e) => update('medicationStatus', e.target.value as MedicationStatus)}
          >
            {MEDICATION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted">이번 주 평균 수면</span>
          <select
            className="journal-select"
            value={form.avgSleep ?? ''}
            onChange={(e) => update('avgSleep', e.target.value as SleepRange)}
          >
            {SLEEP_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs text-muted">이번 주 스트레스</span>
          <select
            className="journal-select"
            value={form.stressLevel ?? ''}
            onChange={(e) => update('stressLevel', e.target.value as StressLevel)}
          >
            {STRESS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="space-y-4 rounded-2xl border border-border/70 bg-canvas/60 p-4">
        <label className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-ink">증상이 있었어요 (상세 입력)</span>
          <button
            type="button"
            role="switch"
            aria-checked={form.hadSymptoms}
            onClick={() => update('hadSymptoms', !form.hadSymptoms)}
            className={cn(
              'relative h-7 w-12 rounded-full transition-colors',
              form.hadSymptoms ? 'bg-primary' : 'bg-border',
            )}
          >
            <span
              className={cn(
                'absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                form.hadSymptoms ? 'translate-x-5' : 'translate-x-0.5',
              )}
            />
          </button>
        </label>

        {form.hadSymptoms && (
          <div className="space-y-5 pt-2">
            <div>
              <p className="mb-2 text-xs font-medium text-muted">전조 증상</p>
              <ChipMultiSelect
                options={PRODROMAL_OPTIONS}
                values={form.prodromalSymptoms ?? []}
                onChange={(values) => update('prodromalSymptoms', values)}
                exclusiveNone="NONE"
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">심각도</p>
              <SeveritySelector
                value={form.severity ?? null}
                onChange={(value) => update('severity', value)}
              />
            </div>
            <div>
              <p className="mb-2 text-xs font-medium text-muted">추정 트리거 (복수 선택)</p>
              <ChipMultiSelect
                options={TRIGGER_OPTIONS}
                values={form.triggers ?? []}
                onChange={(values) => update('triggers', values)}
              />
            </div>
          </div>
        )}
      </section>

      <label className="block space-y-1.5">
        <span className="text-xs text-muted">메모</span>
        <textarea
          className="journal-textarea"
          rows={4}
          value={form.memo ?? ''}
          onChange={(e) => update('memo', e.target.value)}
          placeholder="이번 재발 전후 상황, 느낌, 회복 과정 등을 자유롭게 적어 주세요. 나만 볼 수 있습니다."
        />
      </label>

      <Button type="submit" className="w-full bg-navy hover:bg-navy-light" disabled={isSubmitting}>
        {isSubmitting ? '저장 중…' : '저장하기'}
      </Button>
    </form>
  );
}
