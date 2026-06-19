'use client';

import type { JournalDashboard } from '@/domain/journal/types';
import { buildTodayRoutineItems, type RoutineItemId } from '@/domain/journal/routine';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalRoutineCardProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
};

const ROUTINE_ICON_NAMES: Record<RoutineItemId, 'moon' | 'pill' | 'smiley'> = {
  sleep: 'moon',
  supplement: 'pill',
  condition: 'smiley',
};

export function JournalRoutineCard({ dashboard, isLoading }: JournalRoutineCardProps) {
  if (isLoading) {
    return (
      <section className="animate-pulse rounded-[1.25rem] border border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] p-5 shadow-card">
        <div className="h-5 w-32 rounded bg-[var(--color-background-secondary)]" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-[var(--color-background-secondary)]" />
          ))}
        </div>
      </section>
    );
  }

  const items = buildTodayRoutineItems(dashboard?.todayRecord);
  const completed = dashboard?.routineCompletedToday ?? items.filter((i) => i.completed).length;
  const total = dashboard?.routineTotalToday ?? items.length;
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <section className="rounded-[1.25rem] border border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] p-5 shadow-card">
      <div className="flex items-start gap-2">
        <span className="text-[var(--color-text-primary)]" aria-hidden>
          <JournalIcon name="clipboard" size={20} />
        </span>
        <div>
          <h2 className="font-display text-base font-bold text-[var(--color-text-primary)]">오늘의 루틴</h2>
          <p className="text-xs text-[var(--color-text-tertiary)]">하루 세 가지만 체크해요</p>
        </div>
      </div>

      <ul className="mt-4 space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-xl border border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]/50 px-3 py-3"
          >
            <span className="text-[var(--color-text-secondary)]">
              <JournalIcon name={ROUTINE_ICON_NAMES[item.id]} size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">{item.label}</p>
            </div>
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2',
                item.completed
                  ? 'border-journal-success bg-journal-success text-white'
                  : 'border-[var(--color-border-secondary)] bg-[var(--color-background-primary)] text-transparent',
              )}
              aria-label={item.completed ? '완료' : '미완료'}
            >
              {item.completed && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center gap-3">
        <span className="shrink-0 text-xs font-medium text-[var(--color-text-secondary)]">
          {completed}/{total} 완료
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[var(--color-background-secondary)]">
          <div
            className="h-full rounded-full bg-journal-success transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
