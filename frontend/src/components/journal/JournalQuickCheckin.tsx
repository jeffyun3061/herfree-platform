'use client';

import { useEffect, useState } from 'react';
import {
  MEDICATION_OPTIONS,
  PRODROMAL_OPTIONS,
  SLEEP_OPTIONS,
  STRESS_OPTIONS,
  toDateInputValue,
  type JournalDashboard,
  type JournalRecordInput,
  type MedicationStatus,
  type SleepRange,
  type StressLevel,
} from '@/domain/journal/types';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalQuickCheckinProps = {
  open: boolean;
  dashboard: JournalDashboard | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

type Step = 'symptoms' | 'prodromal' | 'medication' | 'sleep' | 'stress' | 'done';

function buildBase(dashboard: JournalDashboard | null): JournalRecordInput {
  const today = dashboard?.todayRecord;
  return {
    recordDate: toDateInputValue(),
    medicationStatus: today?.medicationStatus ?? 'NORMAL',
    avgSleep: today?.avgSleep ?? 'H6_7',
    stressLevel: today?.stressLevel ?? 'MEDIUM',
    hadSymptoms: today?.hadSymptoms ?? false,
    prodromalSymptoms: today?.prodromalSymptoms ?? [],
    severity: today?.severity ?? null,
    triggers: today?.triggers ?? [],
    memo: today?.memo ?? null,
    mood: today?.mood ?? null,
    sleepHours: today?.sleepHours ?? null,
    supplementTaken: today?.supplementTaken ?? false,
    exerciseDone: today?.exerciseDone ?? false,
  };
}

function ChipButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-4 py-2 text-sm transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted hover:border-primary/30',
      )}
    >
      {label}
    </button>
  );
}

export function JournalQuickCheckin({
  open,
  dashboard,
  isSubmitting,
  onClose,
  onSave,
}: JournalQuickCheckinProps) {
  const [step, setStep] = useState<Step>('symptoms');
  const [form, setForm] = useState<JournalRecordInput>(() => buildBase(dashboard));

  useEffect(() => {
    if (open) {
      setForm(buildBase(dashboard));
      setStep('symptoms');
    }
    // dashboard는 모달이 열릴 때만 반영
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const resetAndClose = () => {
    setStep('symptoms');
    setForm(buildBase(dashboard));
    onClose();
  };

  const goNext = (next: Step) => setStep(next);

  const finish = async () => {
    await onSave({
      ...form,
      prodromalSymptoms: form.hadSymptoms ? form.prodromalSymptoms : [],
      triggers: form.hadSymptoms ? form.triggers : [],
      severity: form.hadSymptoms ? form.severity ?? 3 : null,
    });
    setStep('done');
    setTimeout(resetAndClose, 800);
  };

  const toggleProdromal = (value: string) => {
    setForm((prev) => {
      const current = prev.prodromalSymptoms ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, prodromalSymptoms: next };
    });
  };

  return (
    <Modal open={open} title="빠른 체크인" onClose={resetAndClose}>
      {step === 'symptoms' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">오늘 증상이 있었나요?</p>
          <div className="flex gap-2">
            <ChipButton
              active={!form.hadSymptoms}
              label="없었어요"
              onClick={() => {
                setForm((prev) => ({ ...prev, hadSymptoms: false }));
                goNext('medication');
              }}
            />
            <ChipButton
              active={form.hadSymptoms}
              label="있었어요"
              onClick={() => {
                setForm((prev) => ({ ...prev, hadSymptoms: true }));
                goNext('prodromal');
              }}
            />
          </div>
        </div>
      )}

      {step === 'prodromal' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">전조 증상을 선택해 주세요 (복수 선택 가능)</p>
          <div className="flex flex-wrap gap-2">
            {PRODROMAL_OPTIONS.map((option) => (
              <ChipButton
                key={option.value}
                active={(form.prodromalSymptoms ?? []).includes(option.value)}
                label={option.label}
                onClick={() => toggleProdromal(option.value)}
              />
            ))}
          </div>
          <Button fullWidth onClick={() => goNext('medication')}>
            다음
          </Button>
        </div>
      )}

      {step === 'medication' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">복약 상태는 어땠나요?</p>
          <div className="flex flex-wrap gap-2">
            {MEDICATION_OPTIONS.map((option) => (
              <ChipButton
                key={option.value}
                active={form.medicationStatus === option.value}
                label={option.label}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    medicationStatus: option.value as MedicationStatus,
                  }))
                }
              />
            ))}
          </div>
          <Button fullWidth onClick={() => goNext('sleep')}>
            다음
          </Button>
        </div>
      )}

      {step === 'sleep' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">어젯밤 수면은 어땠나요?</p>
          <div className="flex flex-wrap gap-2">
            {SLEEP_OPTIONS.map((option) => (
              <ChipButton
                key={option.value}
                active={form.avgSleep === option.value}
                label={option.label}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    avgSleep: option.value as SleepRange,
                  }))
                }
              />
            ))}
          </div>
          <Button fullWidth onClick={() => goNext('stress')}>
            다음
          </Button>
        </div>
      )}

      {step === 'stress' && (
        <div className="space-y-4">
          <p className="text-sm text-muted">오늘 스트레스 수준은?</p>
          <div className="flex flex-wrap gap-2">
            {STRESS_OPTIONS.map((option) => (
              <ChipButton
                key={option.value}
                active={form.stressLevel === option.value}
                label={option.label}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    stressLevel: option.value as StressLevel,
                  }))
                }
              />
            ))}
          </div>
          <Button fullWidth disabled={isSubmitting} onClick={() => void finish()}>
            {isSubmitting ? '저장 중…' : '저장하기'}
          </Button>
        </div>
      )}

      {step === 'done' && (
        <p className="py-6 text-center text-sm font-medium text-primary">기록이 저장되었어요!</p>
      )}
    </Modal>
  );
}
