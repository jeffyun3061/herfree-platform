'use client';

import type { JournalRecord } from '@/domain/journal/types';
import { PRODROMAL_OPTIONS, formatTriggerLabels } from '@/domain/journal/types';
import {
  formatConditionSummary,
  formatSleepLabel,
  isSleepRoutineComplete,
  isSupplementRoutineComplete,
} from '@/domain/journal/routine';
import { JournalIcon } from '@/components/journal/JournalIcon';
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

function DailyMetricTile({
  icon,
  label,
  value,
  done,
}: {
  icon: 'moon' | 'pill' | 'brain';
  label: string;
  value: string;
  done: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border px-2.5 py-2.5 text-center',
        done
          ? 'border-journal-success/30 bg-journal-success/5'
          : 'border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]/40',
      )}
    >
      <span
        className={cn(
          'mx-auto flex justify-center',
          done ? 'text-journal-success' : 'text-[var(--color-text-tertiary)]',
        )}
      >
        <JournalIcon name={icon} size={16} />
      </span>
      <p className="mt-1 text-[10px] text-[var(--color-text-tertiary)]">{label}</p>
      <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold leading-tight text-[var(--color-text-primary)]">
        {value}
      </p>
    </div>
  );
}

export function JournalTodayRecordSummary({
  record,
  isLoading,
  onEdit,
}: JournalTodayRecordSummaryProps) {
  if (isLoading) {
    return (
      <section className="journal-summary-card animate-pulse">
        <div className="h-4 w-24 rounded bg-[var(--color-background-secondary)]" />
        <div className="mt-3 grid grid-cols-3 gap-2">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-16 rounded-xl bg-[var(--color-background-secondary)]" />
          ))}
        </div>
      </section>
    );
  }

  if (!record) {
    return (
      <section className="journal-summary-card text-center">
        <p className="text-[12px] text-[var(--color-text-secondary)]">오늘 남긴 기록이 없어요</p>
        {onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="mt-2 text-[12px] font-semibold text-primary hover:underline"
          >
            첫 기록 남기기
          </button>
        )}
      </section>
    );
  }

  if (record.hadSymptoms) {
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

  return (
    <section className="journal-summary-card">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-[13px] font-bold text-[var(--color-text-primary)]">오늘 기록</h3>
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
      <div className="mt-3 grid grid-cols-3 gap-2">
        <DailyMetricTile
          icon="moon"
          label="수면"
          value={formatSleepLabel(record)}
          done={isSleepRoutineComplete(record)}
        />
        <DailyMetricTile
          icon="pill"
          label="영양제"
          value={record.supplementTaken ? '복용함' : '미복용'}
          done={isSupplementRoutineComplete(record)}
        />
        <DailyMetricTile
          icon="brain"
          label="컨디션"
          value={formatConditionSummary(record)}
          done={Boolean(record.mood || record.stressLevel || record.memo?.trim())}
        />
      </div>
      {record.memo && (
        <p className="mt-2.5 line-clamp-2 text-[11px] leading-relaxed text-[var(--color-text-secondary)]">
          {record.memo}
        </p>
      )}
    </section>
  );
}
