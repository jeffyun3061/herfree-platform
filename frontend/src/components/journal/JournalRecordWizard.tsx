'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  MEDICATION_OPTIONS,
  MOOD_OPTIONS,
  PRODROMAL_OPTIONS,
  SLEEP_OPTIONS,
  TRIGGER_OPTIONS,
  toDateInputValue,
  formatJournalDateLabel,
  type JournalRecord,
  type JournalRecordInput,
  type MedicationStatus,
  type MoodType,
  type SleepRange,
  type StressLevel,
} from '@/domain/journal/types';
import { avgSleepToHours } from '@/domain/journal/routine';
import {
  WIZARD_STEP,
  buildWizardStepSequence,
  wizardStepIndex,
  type WizardEntryMode,
  type WizardStepId,
} from '@/domain/journal/wizard';
import { SeveritySelector } from '@/components/journal/SeveritySelector';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';

type JournalRecordWizardProps = {
  open: boolean;
  targetDate: string;
  initialRecord?: JournalRecord | null;
  entryMode?: WizardEntryMode;
  initialStepId?: WizardStepId;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

const STRESS_SCALE: { value: number; emoji: string; level: StressLevel }[] = [
  { value: 1, emoji: '😌', level: 'LOW' },
  { value: 2, emoji: '🙂', level: 'LOW' },
  { value: 3, emoji: '😐', level: 'MEDIUM' },
  { value: 4, emoji: '😟', level: 'HIGH' },
  { value: 5, emoji: '😰', level: 'HIGH' },
];

const STEP_SYMPTOM = WIZARD_STEP.SYMPTOM;
const STEP_SEVERITY = WIZARD_STEP.SEVERITY;
const STEP_PRODROMAL = WIZARD_STEP.PRODROMAL;
const STEP_TRIGGERS = WIZARD_STEP.TRIGGERS;
const STEP_SLEEP = WIZARD_STEP.SLEEP;
const STEP_SUPPLEMENT = WIZARD_STEP.SUPPLEMENT;
const STEP_CONDITION = WIZARD_STEP.CONDITION;
const STEP_MEDICATION = WIZARD_STEP.MEDICATION;
const STEP_MEMO = WIZARD_STEP.MEMO;

function recordToForm(
  record: JournalRecord | null | undefined,
  date: string,
  mode: WizardEntryMode,
): JournalRecordInput {
  return {
    recordDate: date,
    medicationStatus: record?.medicationStatus ?? 'NORMAL',
    avgSleep: record?.avgSleep ?? null,
    stressLevel: record?.stressLevel ?? null,
    hadSymptoms: mode === 'relapse' ? true : (record?.hadSymptoms ?? false),
    prodromalSymptoms: record?.prodromalSymptoms ?? [],
    severity: record?.severity ?? null,
    triggers: record?.triggers ?? [],
    memo: record?.memo ?? null,
    mood: record?.mood ?? null,
    sleepHours: record?.sleepHours ?? null,
    supplementTaken: record?.supplementTaken ?? false,
    exerciseDone: record?.exerciseDone ?? false,
  };
}

function stressToScale(level: StressLevel | null | undefined): number {
  if (level === 'LOW') return 2;
  if (level === 'HIGH') return 4;
  if (level === 'MEDIUM') return 3;
  return 0;
}

function wizardTitle(mode: WizardEntryMode): string {
  if (mode === 'daily') return '오늘 하루 기록';
  if (mode === 'relapse') return '재발 기록';
  return '기록 수정';
}

export function JournalRecordWizard({
  open,
  targetDate,
  initialRecord,
  entryMode = 'edit',
  initialStepId,
  isSubmitting,
  onClose,
  onSave,
}: JournalRecordWizardProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<JournalRecordInput>(() =>
    recordToForm(initialRecord, targetDate, entryMode),
  );
  const [stressScale, setStressScale] = useState(0);

  const stepSequence = useMemo(
    () => buildWizardStepSequence(entryMode, form.hadSymptoms),
    [entryMode, form.hadSymptoms],
  );
  const currentStepId = stepSequence[stepIndex] ?? STEP_SYMPTOM;
  const totalSteps = stepSequence.length;

  useEffect(() => {
    if (!open) return;
    const nextForm = recordToForm(initialRecord, targetDate, entryMode);
    setForm(nextForm);
    setStressScale(stressToScale(nextForm.stressLevel));
    const sequence = buildWizardStepSequence(entryMode, nextForm.hadSymptoms);
    const startIndex = initialStepId ? wizardStepIndex(sequence, initialStepId) : 0;
    setStepIndex(startIndex);
  }, [open, initialRecord, targetDate, entryMode, initialStepId]);

  useEffect(() => {
    if (stepIndex >= stepSequence.length) {
      setStepIndex(Math.max(0, stepSequence.length - 1));
    }
  }, [stepIndex, stepSequence.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const resetAndClose = () => {
    setStepIndex(0);
    onClose();
  };

  const goNext = () => setStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
  const goBack = () => setStepIndex((prev) => Math.max(prev - 1, 0));

  const finish = async () => {
    const stressLevel =
      stressScale > 0
        ? (STRESS_SCALE.find((s) => s.value === stressScale)?.level ?? 'MEDIUM')
        : form.stressLevel ?? null;

    await onSave({
      ...form,
      recordDate: form.recordDate,
      stressLevel,
      avgSleep: form.avgSleep ?? null,
      sleepHours: form.sleepHours ?? avgSleepToHours(form.avgSleep ?? null),
      prodromalSymptoms: form.prodromalSymptoms ?? [],
      triggers: form.hadSymptoms ? form.triggers ?? [] : [],
      severity: form.hadSymptoms ? form.severity ?? 3 : null,
      memo: form.memo?.trim().slice(0, 200) || null,
      supplementTaken: form.supplementTaken ?? false,
      exerciseDone: initialRecord?.exerciseDone ?? false,
    });
    resetAndClose();
  };

  const toggleProdromal = (value: string) => {
    setForm((prev) => {
      const current = prev.prodromalSymptoms ?? [];
      if (value === 'NONE') {
        return { ...prev, prodromalSymptoms: ['NONE'] };
      }
      const withoutNone = current.filter((item) => item !== 'NONE');
      const next = withoutNone.includes(value)
        ? withoutNone.filter((item) => item !== value)
        : [...withoutNone, value];
      return { ...prev, prodromalSymptoms: next };
    });
  };

  const toggleTrigger = (value: string) => {
    setForm((prev) => {
      const current = prev.triggers ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, triggers: next };
    });
  };

  const isLastStep = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;
  const isToday = form.recordDate === toDateInputValue();

  const canProceedFromCondition = form.mood != null || stressScale > 0 || Boolean(form.memo?.trim());

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="sticky top-0 z-10 bg-canvas px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={stepIndex === 0 ? resetAndClose : goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-white"
            aria-label={stepIndex === 0 ? '닫기' : '이전'}
          >
            {stepIndex === 0 ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <div className="text-center">
            <span className="text-sm font-medium text-muted">
              {stepIndex + 1}/{totalSteps}
            </span>
            <p className="text-[11px] text-muted">{wizardTitle(entryMode)}</p>
            <p className="text-[10px] text-muted/80">
              {isToday ? '오늘' : formatJournalDateLabel(form.recordDate)}
            </p>
          </div>
          <div className="w-9" />
        </div>
        <div className="journal-wizard-progress">
          <div className="journal-wizard-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2">
        {currentStepId === STEP_SYMPTOM && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">오늘 증상 있었나요?</h2>
              <p className="mt-2 text-sm text-muted">솔직하게 기록하면 패턴을 더 잘 파악할 수 있어요.</p>
            </div>
            {!isToday && (
              <label className="block space-y-1.5">
                <span className="text-xs text-muted">기록 날짜</span>
                <Input
                  type="date"
                  value={form.recordDate}
                  onChange={(e) => setForm((prev) => ({ ...prev, recordDate: e.target.value }))}
                />
              </label>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, hadSymptoms: false }))}
                className={cn('journal-choice-btn', !form.hadSymptoms && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">😊</span>
                <span className="text-sm font-medium">없었어요</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, hadSymptoms: true }))}
                className={cn('journal-choice-btn', form.hadSymptoms && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">😣</span>
                <span className="text-sm font-medium">있었어요</span>
              </button>
            </div>
            <div className="rounded-card border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-ink-soft">
                이후 단계에서 수면·영양제·컨디션도 함께 기록해요. 대시보드 루틴과 연결됩니다.
              </p>
            </div>
          </div>
        )}

        {currentStepId === STEP_SEVERITY && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">증상 심각도는 어느 정도였나요?</h2>
              <p className="mt-2 text-sm text-muted">1(가벼움) ~ 5(심함)</p>
            </div>
            <SeveritySelector
              value={form.severity ?? null}
              onChange={(value) => setForm((prev) => ({ ...prev, severity: value }))}
            />
          </div>
        )}

        {currentStepId === STEP_PRODROMAL && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">전조 증상이 있었나요?</h2>
              <p className="mt-2 text-sm text-muted">해당하는 항목을 모두 선택해 주세요.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRODROMAL_OPTIONS.map((option) => {
                const active = (form.prodromalSymptoms ?? []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleProdromal(option.value)}
                    className={cn(
                      'community-chip',
                      active ? 'community-chip-active' : 'community-chip-inactive',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStepId === STEP_TRIGGERS && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">어떤 요인이 있었나요?</h2>
              <p className="mt-2 text-sm text-muted">추정 트리거를 선택해 주세요.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRIGGER_OPTIONS.map((option) => {
                const active = (form.triggers ?? []).includes(option.value);
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => toggleTrigger(option.value)}
                    className={cn(
                      'community-chip',
                      active ? 'community-chip-active' : 'community-chip-inactive',
                    )}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {currentStepId === STEP_SLEEP && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">7시간 이상 수면했나요?</h2>
              <p className="mt-2 text-sm text-muted">어젯밤 수면 시간을 선택해 주세요.</p>
            </div>
            <div className="grid gap-2">
              {SLEEP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      avgSleep: option.value as SleepRange,
                      sleepHours: avgSleepToHours(option.value as SleepRange),
                    }))
                  }
                  className={cn(
                    'rounded-card border-2 px-4 py-3.5 text-left text-sm font-medium transition-all',
                    form.avgSleep === option.value
                      ? 'border-journal-success bg-journal-success/10 text-journal-success'
                      : 'border-border/60 bg-white text-ink hover:border-primary/30',
                    option.value === 'H7_PLUS' && form.avgSleep !== option.value && 'ring-1 ring-journal-success/20',
                  )}
                >
                  {option.label}
                  {option.value === 'H7_PLUS' && (
                    <span className="ml-2 text-xs font-normal text-journal-success">루틴 완료</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStepId === STEP_SUPPLEMENT && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">영양제 챙겨 먹었나요?</h2>
              <p className="mt-2 text-sm text-muted">오늘 복용했다면 완료로 표시돼요.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: true }))}
                className={cn('journal-choice-btn', form.supplementTaken && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">💊</span>
                <span className="text-sm font-medium">먹었어요</span>
              </button>
              <button
                type="button"
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: false }))}
                className={cn('journal-choice-btn', !form.supplementTaken && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">—</span>
                <span className="text-sm font-medium">안 먹었어요</span>
              </button>
            </div>
          </div>
        )}

        {currentStepId === STEP_CONDITION && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">오늘 컨디션은 어땠나요?</h2>
              <p className="mt-2 text-sm text-muted">기분 또는 스트레스 중 하나 이상 선택해 주세요.</p>
            </div>
            <div className="flex gap-2">
              {MOOD_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, mood: option.value as MoodType }))
                  }
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-card border-2 py-4 transition-all',
                    form.mood === option.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 bg-white hover:border-primary/30',
                  )}
                >
                  <span className="text-2xl">{option.emoji}</span>
                  <span className="text-xs font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ink">스트레스 정도</p>
              <div className="flex justify-between gap-2">
                {STRESS_SCALE.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setStressScale(item.value)}
                    className={cn(
                      'flex flex-1 flex-col items-center gap-1 rounded-card border-2 py-3 transition-all',
                      stressScale === item.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border/60 bg-white hover:border-primary/30',
                    )}
                  >
                    <span className="text-xl">{item.emoji}</span>
                    <span className="text-[10px] text-muted">{item.value}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {currentStepId === STEP_MEDICATION && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">약 복용 상태</h2>
              <p className="mt-2 text-sm text-muted">처방 약 복용 패턴을 기록해 주세요.</p>
            </div>
            <div className="grid gap-2">
              {MEDICATION_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      medicationStatus: option.value as MedicationStatus,
                    }))
                  }
                  className={cn(
                    'rounded-card border-2 px-4 py-3.5 text-left text-sm font-medium transition-all',
                    form.medicationStatus === option.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border/60 bg-white text-ink hover:border-primary/30',
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStepId === STEP_MEMO && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">한줄 메모 (선택)</h2>
              <p className="mt-2 text-sm text-muted">메모만 남겨도 컨디션 루틴이 완료됩니다.</p>
            </div>
            <textarea
              className="journal-textarea min-h-[120px] resize-none"
              rows={4}
              maxLength={200}
              value={form.memo ?? ''}
              onChange={(e) => setForm((prev) => ({ ...prev, memo: e.target.value }))}
              placeholder="예: 오늘은 컨디션이 괜찮았어요."
            />
            <p className="text-right text-xs text-muted">{(form.memo ?? '').length}/200</p>
          </div>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-border/60 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
        {currentStepId === STEP_SYMPTOM ? (
          <Button fullWidth size="lg" className="rounded-pill bg-primary" onClick={goNext}>
            다음
          </Button>
        ) : currentStepId === STEP_CONDITION && !isLastStep && !canProceedFromCondition ? (
          <Button fullWidth size="lg" className="rounded-pill bg-primary" variant="secondary" onClick={goNext}>
            건너뛰기
          </Button>
        ) : !isLastStep ? (
          <Button fullWidth size="lg" className="rounded-pill bg-primary" onClick={goNext}>
            다음
          </Button>
        ) : (
          <Button
            fullWidth
            size="lg"
            className="rounded-pill bg-primary"
            disabled={isSubmitting}
            onClick={() => void finish()}
          >
            {isSubmitting ? '저장 중…' : '저장하고 닫기'}
          </Button>
        )}
      </div>
    </div>
  );
}
