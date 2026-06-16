'use client';

import { useEffect, useState } from 'react';
import {
  MEDICATION_OPTIONS,
  PRODROMAL_OPTIONS,
  SLEEP_OPTIONS,
  toDateInputValue,
  type JournalDashboard,
  type JournalRecordInput,
  type MedicationStatus,
  type SleepRange,
  type StressLevel,
} from '@/domain/journal/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalRecordWizardProps = {
  open: boolean;
  dashboard: JournalDashboard | null;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

const TOTAL_STEPS = 6;

const STRESS_SCALE: { value: number; emoji: string; label: string; level: StressLevel }[] = [
  { value: 1, emoji: '😌', label: '매우 낮음', level: 'LOW' },
  { value: 2, emoji: '🙂', label: '낮음', level: 'LOW' },
  { value: 3, emoji: '😐', label: '보통', level: 'MEDIUM' },
  { value: 4, emoji: '😟', label: '높음', level: 'HIGH' },
  { value: 5, emoji: '😰', label: '매우 높음', level: 'HIGH' },
];

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

function stressToScale(level: StressLevel | null | undefined): number {
  if (level === 'LOW') return 2;
  if (level === 'HIGH') return 4;
  return 3;
}

export function JournalRecordWizard({
  open,
  dashboard,
  isSubmitting,
  onClose,
  onSave,
}: JournalRecordWizardProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<JournalRecordInput>(() => buildBase(dashboard));
  const [stressScale, setStressScale] = useState(3);

  useEffect(() => {
    if (open) {
      const base = buildBase(dashboard);
      setForm(base);
      setStressScale(stressToScale(base.stressLevel));
      setStep(1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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
    setStep(1);
    setForm(buildBase(dashboard));
    onClose();
  };

  const goNext = () => setStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  const goBack = () => setStep((prev) => Math.max(prev - 1, 1));

  const finish = async () => {
    const stressLevel = STRESS_SCALE.find((s) => s.value === stressScale)?.level ?? 'MEDIUM';
    await onSave({
      ...form,
      stressLevel,
      prodromalSymptoms: form.hadSymptoms ? form.prodromalSymptoms : [],
      triggers: form.hadSymptoms ? form.triggers : [],
      severity: form.hadSymptoms ? form.severity ?? 3 : null,
      memo: form.memo?.trim().slice(0, 200) || null,
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

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-canvas">
      <div className="sticky top-0 z-10 bg-canvas px-4 pb-3 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <button
            type="button"
            onClick={step === 1 ? resetAndClose : goBack}
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-soft hover:bg-white"
            aria-label={step === 1 ? '닫기' : '이전'}
          >
            {step === 1 ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
          <span className="text-sm font-medium text-muted">
            {step}/{TOTAL_STEPS}
          </span>
          <div className="w-9" />
        </div>
        <div className="flex gap-1">
          <div className="journal-wizard-progress">
            <div className="journal-wizard-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-32 pt-2">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">오늘 증상 있었나요?</h2>
              <p className="mt-2 text-sm text-muted">솔직하게 기록하면 패턴을 더 잘 파악할 수 있어요.</p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, hadSymptoms: false }));
                  goNext();
                }}
                className={cn('journal-choice-btn', !form.hadSymptoms && step === 1 && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">😊</span>
                <span className="text-sm font-medium">없었어요</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setForm((prev) => ({ ...prev, hadSymptoms: true }));
                  goNext();
                }}
                className={cn('journal-choice-btn', form.hadSymptoms && step === 1 && 'journal-choice-btn-active')}
              >
                <span className="text-3xl">😣</span>
                <span className="text-sm font-medium">있었어요</span>
              </button>
            </div>
            <div className="rounded-card border border-primary/20 bg-primary/5 px-4 py-3">
              <p className="text-xs leading-relaxed text-ink-soft">
                🔒 이 기록은 나만 볼 수 있어요. 커뮤니티에 공개되지 않습니다.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
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

        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">오늘 스트레스는 어느 정도였나요?</h2>
              <p className="mt-2 text-sm text-muted">1(매우 낮음) ~ 5(매우 높음)</p>
            </div>
            <div className="flex justify-between gap-2">
              {STRESS_SCALE.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStressScale(item.value)}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-1 rounded-card border-2 py-4 transition-all',
                    stressScale === item.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border/60 bg-white hover:border-primary/30',
                  )}
                >
                  <span className="text-2xl">{item.emoji}</span>
                  <span className="text-[10px] text-muted">{item.value}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">어젯밤 수면은 어땠나요?</h2>
              <p className="mt-2 text-sm text-muted">대략적인 수면 시간을 선택해 주세요.</p>
            </div>
            <div className="grid gap-2">
              {SLEEP_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({ ...prev, avgSleep: option.value as SleepRange }))
                  }
                  className={cn(
                    'rounded-card border-2 px-4 py-3.5 text-left text-sm font-medium transition-all',
                    form.avgSleep === option.value
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

        {step === 5 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">약/보조제 복용 상태</h2>
              <p className="mt-2 text-sm text-muted">오늘 복용 상태를 알려 주세요.</p>
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
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({ ...prev, supplementTaken: !prev.supplementTaken }))
              }
              className={cn(
                'flex w-full items-center justify-between rounded-card border-2 px-4 py-3.5 text-sm font-medium transition-all',
                form.supplementTaken
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border/60 bg-white text-ink',
              )}
            >
              <span>보조제 복용함</span>
              <span className={cn('h-5 w-5 rounded-full border-2', form.supplementTaken ? 'border-primary bg-primary' : 'border-border')} />
            </button>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-ink">한줄 메모 (선택)</h2>
              <p className="mt-2 text-sm text-muted">오늘 상태를 간단히 남겨 보세요.</p>
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
        {step > 1 && step < TOTAL_STEPS && (
          <Button fullWidth size="lg" className="rounded-pill bg-primary" onClick={goNext}>
            다음
          </Button>
        )}
        {step === TOTAL_STEPS && (
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
