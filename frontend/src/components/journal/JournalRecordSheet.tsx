'use client';

import { useEffect, useState } from 'react';
import {
  PRODROMAL_OPTIONS,
  RECORD_SYMPTOM_TRIGGER_OPTIONS,
  type JournalRecord,
  type JournalRecordInput,
  type JournalTimelineDay,
  type StressLevel,
} from '@/domain/journal/types';
import {
  formatRecordSheetDate,
  recordToSheetForm,
  SEVERITY_LEVEL_STYLES,
  sheetFormToInput,
  STRESS_BUTTONS,
} from '@/domain/journal/recordForm';
import type { WizardEntryMode } from '@/domain/journal/wizard';
import { JournalRecordFlowChart } from '@/components/journal/JournalRecordFlowChart';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalRecordSheetProps = {
  open: boolean;
  targetDate: string;
  initialRecord?: JournalRecord | null;
  entryMode?: WizardEntryMode;
  timelineDays?: JournalTimelineDay[];
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

function ToggleSwitch({
  on,
  onChange,
  label,
}: {
  on: boolean;
  onChange: (value: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={cn(
        'relative h-[22px] w-[38px] shrink-0 rounded-full transition-colors',
        on ? 'bg-primary' : 'bg-canvas-dark',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[18px] w-[18px] rounded-full bg-white transition-all',
          on ? 'right-0.5' : 'left-0.5',
        )}
      />
    </button>
  );
}

function ChoiceButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex-1 rounded-[10px] border px-0 py-2.5 text-center text-[12.5px] text-ink transition-colors',
        selected
          ? 'border-[1.5px] border-primary bg-primary/10 font-medium text-herfree-green'
          : 'border-border/80 bg-canvas',
      )}
    >
      {children}
    </button>
  );
}

function ChipButton({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-lg border px-[11px] py-1.5 text-[11.5px] transition-colors',
        selected
          ? 'border-primary bg-primary/10 text-herfree-green'
          : 'border-border/80 bg-canvas text-ink-soft',
      )}
    >
      {children}
    </button>
  );
}

const PRODROMAL_CHIP_OPTIONS = PRODROMAL_OPTIONS.filter(
  (option) => option.value !== 'FATIGUE' && option.value !== 'NONE',
);

export function JournalRecordSheet({
  open,
  targetDate,
  initialRecord,
  entryMode = 'edit',
  timelineDays = [],
  isSubmitting,
  onClose,
  onSave,
}: JournalRecordSheetProps) {
  const [form, setForm] = useState<JournalRecordInput>(() =>
    recordToSheetForm(initialRecord, targetDate, entryMode),
  );
  const [sleepHours, setSleepHours] = useState(7);
  const [prodromalOpen, setProdromalOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const nextForm = recordToSheetForm(initialRecord, targetDate, entryMode);
    setForm(nextForm);
    setSleepHours(nextForm.sleepHours ?? 7);
    setProdromalOpen((nextForm.prodromalSymptoms ?? []).length > 0);
  }, [open, initialRecord, targetDate, entryMode]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleSave = async () => {
    const payload = sheetFormToInput(
      {
        ...form,
        prodromalSymptoms: prodromalOpen ? form.prodromalSymptoms ?? [] : [],
      },
      sleepHours,
    );
    await onSave(payload);
    onClose();
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

  const toggleTrigger = (value: string) => {
    setForm((prev) => {
      const current = prev.triggers ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, triggers: next };
    });
  };

  return (
    <div className="journal-record-screen">
      <div className="mx-auto flex w-full max-w-app flex-col gap-3.5 px-3.5 pb-8 pt-[18px]">
        <div className="flex items-center justify-between px-0.5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-ink-soft hover:bg-white/80"
            aria-label="닫기"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2 text-center">
            <JournalIcon name="pencil" size={22} />
            <div>
              <p className="text-base font-semibold text-ink">오늘 기록하기</p>
              <p className="text-xs text-ink-soft">{formatRecordSheetDate(targetDate)}</p>
            </div>
          </div>
          <div className="w-8" />
        </div>

        {timelineDays.length > 0 && <JournalRecordFlowChart days={timelineDays} />}

        <section className="journal-record-card">
          <h3 className="journal-record-card__title">오늘 기본 컨디션</h3>
          <p className="journal-record-card__sub">수면 · 영양제 · 스트레스</p>

          <div className="mb-4">
            <div className="journal-record-field-label">
              <JournalIcon name="moon" size={20} />
              <span>
                수면 시간 —{' '}
                <strong className="font-semibold text-ink">{sleepHours}시간</strong>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={sleepHours}
              onChange={(event) => setSleepHours(Number(event.target.value))}
              className="journal-record-range mt-2 w-full"
            />
          </div>

          <div className="mb-4">
            <div className="journal-record-field-label">
              <JournalIcon name="pill" size={20} />
              <span>영양제 복용</span>
            </div>
            <div className="mt-2 flex gap-2">
              <ChoiceButton
                selected={form.supplementTaken === true}
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: true }))}
              >
                복용
              </ChoiceButton>
              <ChoiceButton
                selected={form.supplementTaken === false}
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: false }))}
              >
                빠뜨림
              </ChoiceButton>
            </div>
          </div>

          <div>
            <div className="journal-record-field-label">
              <JournalIcon name="brain" size={20} />
              <span>스트레스</span>
            </div>
            <div className="mt-2 flex gap-2">
              {STRESS_BUTTONS.map((option) => (
                <ChoiceButton
                  key={option.value}
                  selected={form.stressLevel === option.value}
                  onClick={() =>
                    setForm((prev) => ({ ...prev, stressLevel: option.value as StressLevel }))
                  }
                >
                  {option.label}
                </ChoiceButton>
              ))}
            </div>
          </div>
        </section>

        <section className="journal-record-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <JournalIcon name="speech" size={20} />
              전조증상이 있었어요
            </div>
            <ToggleSwitch
              on={prodromalOpen}
              label="전조증상 토글"
              onChange={(value) => {
                setProdromalOpen(value);
                if (!value) setForm((prev) => ({ ...prev, prodromalSymptoms: [] }));
              }}
            />
          </div>
          {prodromalOpen && (
            <div className="mt-3.5 border-t border-border/60 pt-3.5">
              <p className="journal-record-field-label mb-2">어떤 느낌이었나요</p>
              <div className="flex flex-wrap gap-1.5">
                {PRODROMAL_CHIP_OPTIONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    selected={(form.prodromalSymptoms ?? []).includes(option.value)}
                    onClick={() => toggleProdromal(option.value)}
                  >
                    {option.label}
                  </ChipButton>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="journal-record-card">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-medium text-ink">
              <JournalIcon name="pill" size={20} />
              오늘 증상이 있었어요
            </div>
            <ToggleSwitch
              on={Boolean(form.hadSymptoms)}
              label="증상 토글"
              onChange={(value) => {
                setForm((prev) => ({
                  ...prev,
                  hadSymptoms: value,
                  severity: value ? prev.severity ?? 3 : null,
                  triggers: value ? prev.triggers ?? [] : [],
                }));
              }}
            />
          </div>
          <div className={cn('mt-3.5 border-t border-border/60 pt-3.5', !form.hadSymptoms && 'opacity-40')}>
            <div className="mb-3.5">
              <p className="journal-record-field-label mb-2">심각도</p>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4, 5].map((level) => (
                  <button
                    key={level}
                    type="button"
                    disabled={!form.hadSymptoms}
                    onClick={() => setForm((prev) => ({ ...prev, severity: level }))}
                    className={cn(
                      'flex h-[30px] flex-1 items-center justify-center rounded-lg text-[11.5px] transition-all',
                      SEVERITY_LEVEL_STYLES[level],
                      form.severity === level && 'ring-2 ring-primary ring-offset-1',
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-3.5">
              <p className="journal-record-field-label mb-2">트리거로 의심되는 것 (운동 포함)</p>
              <div className="flex flex-wrap gap-1.5">
                {RECORD_SYMPTOM_TRIGGER_OPTIONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    selected={(form.triggers ?? []).includes(option.value)}
                    onClick={() => toggleTrigger(option.value)}
                  >
                    {option.label}
                  </ChipButton>
                ))}
              </div>
            </div>

            <div className="mb-3.5">
              <p className="journal-record-field-label mb-2">사진 첨부 (선택)</p>
              <div className="flex flex-col items-center gap-1 rounded-[10px] border border-dashed border-border px-3.5 py-3.5 text-muted">
                <span className="text-lg">＋</span>
                <span className="text-[11px]">나만 볼 수 있어요 (준비 중)</span>
              </div>
            </div>

            <div>
              <p className="journal-record-field-label mb-2">오늘 날씨</p>
              <div className="flex items-center gap-2 rounded-lg bg-canvas px-2.5 py-2">
                <span className="text-[11.5px] text-ink-soft">날씨 정보 준비 중</span>
                <span className="ml-auto text-[10.5px] text-muted">자동 연동 예정</span>
              </div>
            </div>
          </div>
        </section>

        <section className="journal-record-card">
          <div className="mb-2.5 flex items-center gap-2">
            <JournalIcon name="pencil" size={18} />
            <h3 className="text-sm font-semibold text-ink">오늘 메모</h3>
          </div>
          <textarea
            rows={3}
            maxLength={200}
            value={form.memo ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
            placeholder="오늘 특이사항이 있다면 적어주세요"
            className="journal-record-textarea"
          />
        </section>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSave()}
          className="w-full rounded-xl bg-herfree-green py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {isSubmitting ? '저장 중…' : '기록 저장하기'}
        </button>
      </div>
    </div>
  );
}
