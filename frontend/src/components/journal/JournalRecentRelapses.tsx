'use client';

import { formatTriggerLabels, type JournalRecord } from '@/domain/journal/types';

type JournalRecentRelapsesProps = {
  relapses: JournalRecord[];
  isLoading?: boolean;
};

export function JournalRecentRelapses({ relapses, isLoading }: JournalRecentRelapsesProps) {
  if (isLoading) {
    return (
      <section className="animate-pulse rounded-card border border-border/50 bg-white p-5 shadow-card">
        <div className="h-4 w-32 rounded bg-canvas-dark" />
        <div className="mt-4 h-20 rounded-xl bg-canvas-dark" />
      </section>
    );
  }

  if (relapses.length === 0) return null;

  const latest = relapses[0];

  return (
    <section className="rounded-card border border-border/50 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">최근 재발 기록</h3>
      <p className="mt-1 text-xs text-muted">가장 최근 재발 일지</p>

      <div className="mt-4 rounded-xl border border-red-100 bg-red-50/50 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-ink">{latest.recordDate}</span>
          <span className="rounded-pill bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
            심각도 {latest.severity ?? '—'}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted">
          트리거: {formatTriggerLabels(latest.triggers)}
        </p>
        {latest.memo && (
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-ink-soft">{latest.memo}</p>
        )}
      </div>

      {relapses.length > 1 && (
        <ul className="mt-3 space-y-2 border-t border-border/50 pt-3">
          {relapses.slice(1, 4).map((record) => (
            <li key={record.id} className="flex items-center justify-between text-xs">
              <span className="font-medium text-ink">{record.recordDate}</span>
              <span className="text-muted">심각도 {record.severity ?? '—'}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
