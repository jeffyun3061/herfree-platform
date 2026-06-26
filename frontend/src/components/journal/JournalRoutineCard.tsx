'use client';

import type { JournalDashboard } from '@/domain/journal/types';
import { buildTodayRoutineItems, type RoutineItemId } from '@/domain/journal/routine';
import { JOURNAL_ROUTINE_ICON } from '@/domain/assets/static';
import { JournalIcon } from '@/components/journal/JournalIcon';
import { cn } from '@/lib/cn';

type JournalRoutineCardProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
  onRoutineItemClick?: (itemId: RoutineItemId) => void;
  pulse?: boolean;
  showEmptyHint?: boolean;
};

export function JournalRoutineCard({
  dashboard,
  isLoading,
  onRoutineItemClick,
  pulse,
  showEmptyHint,
}: JournalRoutineCardProps) {
  if (isLoading) {
    return (
      <section className="journal-routine-card animate-pulse">
        <div className="h-5 w-32 rounded bg-[var(--color-background-secondary)]" />
        <div className="mt-4 space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-[var(--color-background-secondary)]" />
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
    <section className="journal-routine-card">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 text-[var(--color-text-primary)]" aria-hidden>
          <JournalIcon name="clipboard" size={20} />
        </span>
        <div>
          <h2 className="text-[14px] font-bold text-[var(--color-text-primary)]">
            오늘의 루틴
          </h2>
          <p className="text-[10px] text-[var(--color-text-primary)]/70">
            {showEmptyHint ? '기록하기를 누르면 1분이면 채울 수 있어요' : '하루 한 가지만 체크해도 충분해요'}
          </p>
        </div>
      </div>

      <ul className="mt-3">
        {items.map((item, index) => {
          const isClickable = Boolean(onRoutineItemClick);
          const RowTag = isClickable ? 'button' : 'div';
          return (
            <li
              key={item.id}
              className={cn(index > 0 && 'border-t border-[var(--color-border-tertiary)]/80')}
            >
              <RowTag
                type={isClickable ? 'button' : undefined}
                onClick={isClickable ? () => onRoutineItemClick?.(item.id) : undefined}
                className={cn(
                  'flex w-full items-center gap-3 py-3.5 text-left',
                  isClickable && 'hover:opacity-80',
                )}
              >
                <span
                  className={cn(
                    'shrink-0',
                    item.completed ? 'text-journal-success' : 'text-[var(--color-text-tertiary)]',
                  )}
                >
                  <JournalIcon name={JOURNAL_ROUTINE_ICON[item.id]} size={18} />
                </span>
                <p className="min-w-0 flex-1 text-[12px] font-medium text-[var(--color-text-primary)]">
                  {item.label}
                </p>
                <span
                  className={cn(
                    'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2',
                    item.completed
                      ? 'border-journal-success bg-journal-success text-white'
                      : 'border-[var(--color-border-secondary)] bg-transparent',
                  )}
                  aria-label={item.completed ? '완료' : '미완료'}
                >
                  {item.completed && (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                    >
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
              </RowTag>
            </li>
          );
        })}
      </ul>

      <div className="mt-1 flex items-center gap-3 border-t border-[var(--color-border-tertiary)]/80 pt-3">
        <span className="shrink-0 text-[10px] font-medium text-[var(--color-text-primary)]">
          {completed}/{total} 완료
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-background-secondary)]">
          <div
            className={cn(
              'h-full rounded-full bg-journal-success transition-all duration-500',
              pulse && 'animate-pulse',
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
}
