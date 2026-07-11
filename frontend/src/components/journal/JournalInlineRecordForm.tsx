'use client';

import { useEffect, useState } from 'react';
import {
  toDateInputValue,
  type JournalRecord,
  type JournalRecordInput,
  type StressLevel,
} from '@/domain/journal/types';
import { recordToSheetForm, sheetFormToInput } from '@/domain/journal/recordForm';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalInlineRecordFormProps = {
  initialRecord?: JournalRecord | null;
  isSubmitting: boolean;
  onSave: (input: JournalRecordInput) => Promise<void>;
};

const STRESS_OPTIONS: { value: StressLevel; label: string }[] = [
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

function formatRecordDateBadge(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return isoDate;
  const weekdays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'] as const;
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}.${m}.${d} ${weekdays[date.getDay()]}`;
}

function FieldCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <section
      className={cn(
        'rounded-[20px] border border-[#EADFCB] bg-[#FBF6EA] p-5 shadow-[0_14px_32px_-26px_rgba(7,37,31,.4)]',
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
        'flex min-h-10 flex-1 items-center justify-center rounded-[11px] border px-3 text-[12.5px] transition-colors',
        selected
          ? 'border-[1.5px] border-[#1D9E75] bg-[#E3F1EA] font-semibold text-[#04342C]'
          : 'border-[#E5D9C2] bg-[#F3ECDD] text-[#5C645A]',
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
          : 'border-[#E5D9C2] bg-[#F3ECDD] text-[#5C645A]',
      )}
    >
      {children}
    </button>
  );
}

function ToggleSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={cn('relative h-[23px] w-10 rounded-full transition-colors', on ? 'bg-[#1D9E75]' : 'bg-[#DCD8CE]')}
    >
      <span
        className={cn(
          'absolute top-0.5 h-[19px] w-[19px] rounded-full bg-white shadow-[0_1px_3px_rgba(20,30,25,.25)] transition-all',
          on ? 'left-[19px]' : 'left-0.5',
        )}
      />
    </button>
  );
}

export function JournalInlineRecordForm({
  initialRecord,
  isSubmitting,
  onSave,
}: JournalInlineRecordFormProps) {
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<JournalRecordInput>(() =>
    recordToSheetForm(initialRecord, '', initialRecord ? 'edit' : 'daily'),
  );
  const [sleepHours, setSleepHours] = useState(form.sleepHours ?? 7);
  const [customProdromeText, setCustomProdromeText] = useState('');

  useEffect(() => {
    setMounted(true);
    const today = toDateInputValue();
    const nextForm = recordToSheetForm(
      initialRecord,
      initialRecord?.recordDate || today,
      initialRecord ? 'edit' : 'daily',
    );
    setForm(nextForm);
    setSleepHours(nextForm.sleepHours ?? 7);
    setCustomProdromeText('');
  }, [initialRecord]);

  const currentRecordDate = form.recordDate || (mounted ? toDateInputValue() : '');
  const hasProdromal = (form.prodromalSymptoms ?? []).length > 0;
  const hasSymptoms = Boolean(form.hadSymptoms);
  const customProdromeValues = (form.prodromalSymptoms ?? []).filter((value) => !PRESET_PRODROME_VALUES.has(value));

  const toggleProdromalChip = (value: string) => {
    setForm((prev) => {
      const current = prev.prodromalSymptoms ?? [];
      const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value];
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

  const handleSave = async () => {
    await onSave(sheetFormToInput({ ...form, recordDate: currentRecordDate }, sleepHours));
  };

  if (!mounted) {
    return (
      <section className="mx-auto w-full max-w-app space-y-3 px-1">
        <div className="h-[52px] animate-pulse rounded-[12px] bg-[#E8DFD2]/80" aria-hidden />
        <div className="h-[280px] animate-pulse rounded-[20px] bg-[#E8DFD2]/60" aria-hidden />
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-app space-y-3">
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[13.5px] font-bold text-[#1E2621]">{formatRecordDateBadge(currentRecordDate)}</p>
          <p className="mt-0.5 text-[11.5px] text-[#9A9F94]">하루에 한 번 기록해요</p>
        </div>
        <label className="flex shrink-0 items-center gap-1.5 rounded-[9px] border-[0.5px] border-[#DCD6C8] bg-white px-2.5 py-1.5">
          <span className="text-[10px] font-semibold text-[#9A9F94]">날짜</span>
          <input
            type="date"
            value={currentRecordDate}
            onChange={(event) => setForm((prev) => ({ ...prev, recordDate: event.target.value }))}
            className="w-[112px] border-0 bg-transparent text-right text-[12px] font-semibold text-[#5C645A] outline-none"
            aria-label="기록 날짜 선택"
          />
        </label>
      </div>

      <FieldCard>
        <h2 className="text-[14px] font-bold text-[#1E2621]">기본 컨디션</h2>
        <p className="mb-[18px] mt-1 text-[11.5px] text-[#9A9F94]">수면, 영양제, 스트레스를 가볍게 적어주세요</p>

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
            <SegmentButton selected={form.supplementTaken === true} onClick={() => setForm((prev) => ({ ...prev, supplementTaken: true }))}>
              복용
            </SegmentButton>
            <SegmentButton selected={form.supplementTaken === false} onClick={() => setForm((prev) => ({ ...prev, supplementTaken: false }))}>
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
          <ToggleSwitch
            on={hasProdromal}
            onClick={() => setForm((prev) => ({ ...prev, prodromalSymptoms: hasProdromal ? [] : ['ITCHING'] }))}
          />
        </div>

        {hasProdromal && (
          <div className="mt-4 border-t border-[#EFE6D5] pt-4">
            <p className="mb-2.5 text-[12.5px] text-[#5C645A]">어떤 전조였나요</p>
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
                  onClick={() => setForm((prev) => ({ ...prev, prodromalSymptoms: (prev.prodromalSymptoms ?? []).filter((item) => item !== value) }))}
                  className="rounded-[9px] border border-[#1D9E75] bg-[#E3F1EA] px-3 py-2 text-[12px] font-medium text-[#04342C]"
                >
                  {value}
                  <span className="ml-1.5 text-[#54766A]" aria-hidden>
                    x
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
                className="min-w-0 flex-1 rounded-[10px] border border-[#E5D9C2] bg-[#F3ECDD] px-3 py-2.5 text-[12px] text-[#1E2621] outline-none placeholder:text-[#B4B2A6] focus:border-[#1D9E75]"
              />
              <button type="button" onClick={addCustomProdrome} className="shrink-0 rounded-[10px] border border-[#E5D9C2] bg-[#F3ECDD] px-4 text-[12px] font-bold text-[#0B3B36]">
                추가
              </button>
            </div>
          </div>
        )}
      </FieldCard>

      <FieldCard>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[14px] font-semibold text-[#1E2621]">
            <span className="h-[9px] w-[9px] rounded-full bg-[#CF5B36]" />
            증상이 있었어요
          </div>
          <ToggleSwitch
            on={hasSymptoms}
            onClick={() =>
              setForm((prev) => ({
                ...prev,
                hadSymptoms: !prev.hadSymptoms,
                severity: prev.hadSymptoms ? null : prev.severity ?? 3,
                triggers: [],
              }))
            }
          />
        </div>

        <div
          className={cn(
            'mt-4 border-t border-[#EADFCB] pt-4 transition-opacity',
            !hasSymptoms && 'pointer-events-none opacity-40',
          )}
        >
          <p className="mb-2.5 text-[12.5px] text-[#5C645A]">심각도</p>
          <div className="flex gap-1.5">
            {SEVERITY_CELLS.map(([bg, fg], index) => {
              const value = index + 1;
              const active = form.severity === value;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!hasSymptoms}
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
      </FieldCard>

      <FieldCard>
        <h2 className="mb-3 text-[14px] font-bold text-[#1E2621]">메모</h2>
        <textarea
          rows={4}
          maxLength={200}
          value={form.memo ?? ''}
          onChange={(event) => setForm((prev) => ({ ...prev, memo: event.target.value }))}
          placeholder="특이사항이 있다면 적어주세요"
          className="min-h-[74px] w-full resize-none rounded-[12px] border border-[#E5D9C2] bg-[#F3ECDD] px-3.5 py-3 text-[13px] text-[#1E2621] outline-none placeholder:text-[#B4B2A6] focus:border-[#1D9E75]"
        />
      </FieldCard>

      <button
        type="button"
        disabled={isSubmitting}
        onClick={() => void handleSave()}
        className="rounded-[14px] bg-[#0B3B36] px-4 py-[15px] text-center text-[14.5px] font-bold text-white transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {isSubmitting ? '저장 중...' : initialRecord ? '기록 수정하기' : '기록 저장하기'}
      </button>
    </section>
  );
}
