'use client';

import { useEffect, useState } from 'react';
import {
  RECORD_SYMPTOM_TRIGGER_OPTIONS,
  toDateInputValue,
  type JournalRecord,
  type JournalRecordInput,
  type StressLevel,
} from '@/domain/journal/types';
import { recordToSheetForm, sheetFormToInput } from '@/domain/journal/recordForm';
import type { WizardEntryMode } from '@/domain/journal/wizard';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalRecordSheetProps = {
  open: boolean;
  targetDate: string;
  initialRecord?: JournalRecord | null;
  entryMode?: WizardEntryMode;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

type StressOption = {
  value: StressLevel;
  label: string;
};

const STRESS_OPTIONS: StressOption[] = [
  { value: 'LOW', label: '낮음' },
  { value: 'MEDIUM', label: '보통' },
  { value: 'HIGH', label: '높음' },
];

const PRODROMAL_OPTIONS = [
  { value: 'ITCHING', label: '가려움' },
  { value: 'NUMBNESS', label: '저림' },
  { value: 'WARMTH', label: '열감' },
  { value: 'PAIN', label: '통증' },
];

const PRESET_PRODROME_VALUES = new Set(PRODROMAL_OPTIONS.map((option) => option.value));

/** 디자이너 원본 심각도 셀 색상 (1~5). */
const SEVERITY_CELLS: Array<[string, string]> = [
  ['#FBE3DA', '#7A2E12'],
  ['#F4C3B1', '#7A2E12'],
  ['#EA9C7F', '#fff'],
  ['#DD6E48', '#fff'],
  ['#CF5B36', '#fff'],
];

function FieldCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'rounded-[20px] border border-[#ECE5D8] bg-white p-5 shadow-[0_14px_32px_-24px_rgba(20,30,25,.2)]',
        className,
      )}
    >
      {children}
    </section>
  );
}

function SegmentButton({
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
        'flex min-h-11 flex-1 items-center justify-center rounded-[11px] border px-3 text-[13px] transition-colors',
        selected
          ? 'border-[1.5px] border-[#1D9E75] bg-[#E3F1EA] font-semibold text-[#04342C]'
          : 'border-[#ECE5D8] bg-[#F6F1E8] text-[#5C645A]',
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
        'rounded-[9px] border px-3 py-2 text-[12px] transition-colors',
        selected
          ? 'border-[#1D9E75] bg-[#E3F1EA] font-medium text-[#04342C]'
          : 'border-[#ECE5D8] bg-[#F6F1E8] text-[#5C645A]',
      )}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({
  on,
  onClick,
}: {
  on: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn(
        'relative h-[23px] w-10 rounded-full transition-colors',
        on ? 'bg-[#1D9E75]' : 'bg-[#E8E0D2]',
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[19px] w-[19px] rounded-full bg-white transition-all',
          on ? 'right-0.5' : 'left-0.5',
        )}
      />
    </button>
  );
}

export function JournalRecordSheet({
  open,
  targetDate,
  initialRecord,
  entryMode = 'edit',
  isSubmitting,
  onClose,
  onSave,
}: JournalRecordSheetProps) {
  const [form, setForm] = useState<JournalRecordInput>(() =>
    recordToSheetForm(initialRecord, targetDate, entryMode),
  );
  const [sleepHours, setSleepHours] = useState(7);
  const [customProdromeText, setCustomProdromeText] = useState('');

  useEffect(() => {
    if (!open) return;
    const nextForm = recordToSheetForm(initialRecord, targetDate, entryMode);
    setForm(nextForm);
    setSleepHours(nextForm.sleepHours ?? 7);
    setCustomProdromeText('');
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

  const currentRecordDate = form.recordDate || targetDate || toDateInputValue();
  const isEditMode = entryMode === 'edit' && Boolean(initialRecord);
  const hasProdromal = (form.prodromalSymptoms ?? []).length > 0;
  const hasSymptoms = Boolean(form.hadSymptoms);
  const customProdromeValues = (form.prodromalSymptoms ?? []).filter(
    (value) => !PRESET_PRODROME_VALUES.has(value),
  );

  const toggleProdromal = () => {
    setForm((prev) => ({
      ...prev,
      prodromalSymptoms: hasProdromal ? [] : ['ITCHING'],
    }));
  };

  const toggleProdromalChip = (value: string) => {
    setForm((prev) => {
      const current = prev.prodromalSymptoms ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, prodromalSymptoms: next };
    });
  };

  const addCustomProdrome = () => {
    const value = customProdromeText.trim();
    if (!value) return;
    setForm((prev) => {
      const current = prev.prodromalSymptoms ?? [];
      if (current.includes(value)) return prev;
      return { ...prev, prodromalSymptoms: [...current, value] };
    });
    setCustomProdromeText('');
  };

  const removeCustomProdrome = (value: string) => {
    setForm((prev) => ({
      ...prev,
      prodromalSymptoms: (prev.prodromalSymptoms ?? []).filter((item) => item !== value),
    }));
  };

  const toggleSymptoms = () => {
    setForm((prev) => ({
      ...prev,
      hadSymptoms: !prev.hadSymptoms,
      severity: prev.hadSymptoms ? null : prev.severity ?? 3,
      triggers: prev.hadSymptoms ? [] : prev.triggers ?? [],
    }));
  };

  const toggleTriggerChip = (value: string) => {
    setForm((prev) => {
      const current = prev.triggers ?? [];
      const next = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, triggers: next };
    });
  };

  const handleSave = async () => {
    const payload = sheetFormToInput({ ...form, recordDate: currentRecordDate }, sleepHours);
    await onSave(payload);
    onClose();
  };

  return (
    <div className="journal-record-screen bg-[#F3F6F4]">
      <div className="mx-auto flex min-h-screen w-full max-w-app flex-col gap-3.5 px-4 pb-10 pt-14">
        <header className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 text-[#5C645A]"
            aria-label="기록 화면 닫기"
          >
            <span className="text-[24px] leading-none">‹</span>
            <span className="text-[16px] font-bold text-[#1E2621]">
              {isEditMode ? '기록 수정하기' : '기록하기'}
            </span>
          </button>

          <label className="relative flex shrink-0 items-center gap-1.5 rounded-full border border-[#E1D8C8] bg-white px-3 py-2 shadow-[0_8px_20px_-18px_rgba(20,30,25,.35)]">
            <span className="text-[10px] font-semibold text-[#9A9F94]">날짜</span>
            <input
              type="date"
              value={currentRecordDate}
              onChange={(event) => setForm((prev) => ({ ...prev, recordDate: event.target.value }))}
              className="w-[116px] border-0 bg-transparent text-right text-[12px] font-semibold text-[#5C645A] outline-none"
              aria-label="기록 날짜 선택"
            />
          </label>
        </header>

        <FieldCard>
          <h2 className="text-[14px] font-bold text-[#1E2621]">기본 컨디션</h2>
          <p className="mb-[18px] mt-1 text-[11.5px] text-[#9A9F94]">
            수면, 영양제, 스트레스를 가볍게 남겨두세요.
          </p>

          <div className="mb-[18px]">
            <div className="mb-2.5 flex items-center gap-2 text-[13px] text-[#5C645A]">
              <JournalIcon name="moon" size={20} />
              <span>
                수면 시간 - <strong className="font-bold text-[#1E2621]">{sleepHours}시간</strong>
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={12}
              value={sleepHours}
              onChange={(event) => setSleepHours(Number(event.target.value))}
              className="h-2 w-full accent-[#15695E]"
              aria-label="수면 시간"
            />
          </div>

          <div className="mb-[18px]">
            <div className="mb-2.5 flex items-center gap-2 text-[13px] text-[#5C645A]">
              <JournalIcon name="pill" size={20} />
              <span>영양제 복용</span>
            </div>
            <div className="flex gap-2">
              <SegmentButton
                selected={form.supplementTaken === true}
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: true }))}
              >
                복용
              </SegmentButton>
              <SegmentButton
                selected={form.supplementTaken === false}
                onClick={() => setForm((prev) => ({ ...prev, supplementTaken: false }))}
              >
                빠뜨림
              </SegmentButton>
            </div>
          </div>

          <div>
            <div className="mb-2.5 flex items-center gap-2 text-[13px] text-[#5C645A]">
              <JournalIcon name="brain" size={20} />
              <span>스트레스</span>
            </div>
            <div className="flex gap-2">
              {STRESS_OPTIONS.map((option) => (
                <SegmentButton
                  key={option.value}
                  selected={form.stressLevel === option.value}
                  onClick={() => setForm((prev) => ({ ...prev, stressLevel: option.value }))}
                >
                  {option.label}
                </SegmentButton>
              ))}
            </div>
          </div>
        </FieldCard>

        <FieldCard>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1E2621]">
              <span className="h-[9px] w-[9px] rounded-full bg-[#E0936B]" />
              전조증상이 있었어요
            </div>
            <ToggleSwitch on={hasProdromal} onClick={toggleProdromal} />
          </div>

          {hasProdromal && (
            <div className="mt-4 border-t border-[#F2ECE1] pt-4">
              <p className="mb-2.5 text-[12.5px] text-[#5C645A]">어떤 느낌이었나요</p>
              <div className="flex flex-wrap gap-2">
                {PRODROMAL_OPTIONS.map((option) => (
                  <ChipButton
                    key={option.value}
                    selected={(form.prodromalSymptoms ?? []).includes(option.value)}
                    onClick={() => toggleProdromalChip(option.value)}
                  >
                    {option.label}
                  </ChipButton>
                ))}
                {customProdromeValues.map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => removeCustomProdrome(value)}
                    className="rounded-[9px] border border-[#1D9E75] bg-[#E3F1EA] px-3 py-2 text-[12px] font-medium text-[#04342C]"
                  >
                    {value}
                    <span className="ml-1.5 text-[#54766A]" aria-hidden>
                      ×
                    </span>
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={customProdromeText}
                  onChange={(event) => setCustomProdromeText(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      addCustomProdrome();
                    }
                  }}
                  placeholder="직접 입력"
                  className="min-w-0 flex-1 rounded-[10px] border border-[#ECE5D8] bg-[#F8F4EC] px-3 py-2.5 text-[12px] text-[#1E2621] outline-none placeholder:text-[#B4B2A6] focus:border-[#1D9E75]"
                />
                <button
                  type="button"
                  onClick={addCustomProdrome}
                  className="shrink-0 rounded-[10px] border border-[#E5D9C2] bg-[#F6F1E8] px-4 text-[12px] font-bold text-[#0B3B36]"
                >
                  추가
                </button>
              </div>
            </div>
          )}
        </FieldCard>

        <FieldCard className={hasSymptoms ? 'border-[#F0B39A] bg-[#FFF8F3]' : undefined}>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1E2621]">
                <span className="h-[9px] w-[9px] rounded-full bg-[#CF5B36]" />
                증상이 있었어요
              </div>
              <p className="mt-1 text-[11.5px] text-[#8A9086]">
                증상이 있었던 날만 켜고 심각도와 요인을 남겨주세요.
              </p>
            </div>
            <ToggleSwitch on={hasSymptoms} onClick={toggleSymptoms} />
          </div>

          {hasSymptoms && (
            <div className="mt-4 space-y-4 border-t border-[#F1DED2] pt-4">
              <div>
                <p className="mb-2.5 text-[12.5px] text-[#5C645A]">심각도</p>
                <div className="flex gap-1.5">
                  {SEVERITY_CELLS.map(([bg, fg], index) => {
                    const value = index + 1;
                    const active = form.severity === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setForm((prev) => ({ ...prev, severity: value }))}
                        className={cn(
                          'flex h-[34px] flex-1 items-center justify-center rounded-[9px] text-[11.5px] transition-shadow',
                          active ? 'font-extrabold shadow-[inset_0_0_0_2px_#1E2621]' : 'font-normal',
                        )}
                        style={{ background: bg, color: fg }}
                        aria-pressed={active}
                      >
                        {value}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-2.5 text-[12.5px] font-semibold text-[#5C645A]">관련 요인</p>
                <div className="flex flex-wrap gap-2">
                  {RECORD_SYMPTOM_TRIGGER_OPTIONS.map((option) => (
                    <ChipButton
                      key={option.value}
                      selected={(form.triggers ?? []).includes(option.value)}
                      onClick={() => toggleTriggerChip(option.value)}
                    >
                      {option.label}
                    </ChipButton>
                  ))}
                </div>
              </div>
            </div>
          )}
        </FieldCard>

        <FieldCard>
          <h2 className="mb-3 text-[14px] font-bold text-[#1E2621]">메모</h2>
          <textarea
            rows={4}
            maxLength={200}
            value={form.memo ?? ''}
            onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
            placeholder="특이사항이 있다면 적어주세요"
            className="min-h-[74px] w-full resize-none rounded-[12px] border border-[#ECE5D8] bg-[#F8F4EC] px-3.5 py-3 text-[13px] text-[#1E2621] outline-none placeholder:text-[#B4B2A6] focus:border-[#1D9E75]"
          />
        </FieldCard>

        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => void handleSave()}
          className="mt-0.5 rounded-[14px] bg-[#0B3B36] px-4 py-[15px] text-center text-[14.5px] font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting ? '저장 중...' : isEditMode ? '수정 저장하기' : '기록 저장하기'}
        </button>
      </div>
    </div>
  );
}
