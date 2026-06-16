'use client';

import { useState } from 'react';
import { formatTriggerLabels, type JournalRecord } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalRecentRelapsesProps = {
  relapses: JournalRecord[];
  isLoading?: boolean;
};

export function JournalRecentRelapses({ relapses, isLoading }: JournalRecentRelapsesProps) {
  const [expanded, setExpanded] = useState(false);

  if (isLoading) {
    return (
      <section className="animate-pulse rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="h-4 w-32 rounded bg-canvas" />
      </section>
    );
  }

  if (relapses.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="text-sm font-semibold text-ink">최근 재발 기록 ({relapses.length})</span>
        <span className={cn('text-xs text-muted transition-transform', expanded && 'rotate-180')}>
          ▼
        </span>
      </button>
      {expanded && (
        <ul className="border-t border-border/70 px-4 py-2">
          {relapses.map((record) => (
            <li key={record.id} className="border-b border-border/50 py-3 last:border-b-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-ink">{record.recordDate}</span>
                <span className="text-xs text-muted">심각도 {record.severity ?? '—'}</span>
              </div>
              <p className="mt-1 text-xs text-muted">
                트리거: {formatTriggerLabels(record.triggers)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
