'use client';

import type { JournalRecord } from '@/domain/journal/types';
import { PRODROMAL_OPTIONS, formatTriggerLabels } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalTodayRecordSummaryProps = {
  record: JournalRecord | null | undefined;
  isLoading?: boolean;
  onEdit?: () => void;
};

function formatProdromal(values: string[]): string {
  if (values.length === 0) return '—';
  return values
    .map((value) => PRODROMAL_OPTIONS.find((option) => option.value === value)?.label ?? value)
    .join(' · ');
}

function SummaryMetric({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn('min-w-0', className)}>
      <dt className="text-[10px] font-medium text-[var(--color-text-tertiary)]">{label}</dt>
      <dd className="mt-0.5 truncate text-[12px] font-semibold text-[var(--color-text-primary)]">
        {value}
      </dd>
    </div>
  );
}

/** 재발 기록일 때만 요약 카드 — 일상 루틴은 JournalRoutineCard에서 표시 */
export function JournalTodayRecordSummary({
  record,
  isLoading,
  onEdit,
}: JournalTodayRecordSummaryProps) {
  if (isLoading) {
    return (
      <section className="journal-summary-card animate-pulse">
        <div className="h-4 w-28 rounded bg-[var(--color-background-secondary)]" />
        <div className="mt-3 h-20 rounded-lg bg-[var(--color-background-secondary)]" />
      </section>
    );
  }

  if (!record || !record.hadSymptoms) {
    return null;
  }

  return (
    <section className="journal-summary-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">오늘 재발 기록</h3>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="text-[11px] font-semibold text-primary hover:underline"
          >
            수정
          </button>
        )}
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2.5">
        <SummaryMetric
          label="심각도"
          value={record.severity != null ? `${record.severity}단계` : '—'}
        />
        <SummaryMetric label="전조" value={formatProdromal(record.prodromalSymptoms)} />
        <SummaryMetric
          label="요인"
          value={formatTriggerLabels(record.triggers)}
          className="col-span-2"
        />
      </dl>
      {record.memo && (
        <p className="mt-2.5 line-clamp-2 rounded-lg bg-[var(--color-background-secondary)]/60 px-2.5 py-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
          {record.memo}
        </p>
      )}
    </section>
  );
}
