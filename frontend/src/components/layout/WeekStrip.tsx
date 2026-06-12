'use client';

import { cn } from '@/lib/cn';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

type WeekStripProps = {
  recordDateKeys?: Set<string>;
  weekOffset?: number;
};

function getWeekDates(weekOffset = 0): Date[] {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day + weekOffset * 7);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return toDateKey(a) === toDateKey(b);
}

export function WeekStrip({ recordDateKeys, weekOffset = 0 }: WeekStripProps) {
  const today = new Date();
  const dates = getWeekDates(weekOffset);

  return (
    <div className="flex justify-between gap-1 rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border/60">
      {dates.map((date, index) => {
        const active = weekOffset === 0 && isSameDay(date, today);
        const hasRecord = recordDateKeys?.has(toDateKey(date));

        return (
          <div
            key={toDateKey(date)}
            className={cn(
              'flex flex-1 flex-col items-center rounded-xl py-2 text-center transition-colors',
              active && 'bg-primary text-primary-foreground',
              !active && hasRecord && 'bg-gold/10',
            )}
          >
            <span className={cn('text-[10px]', active ? 'opacity-90' : 'text-muted')}>
              {WEEKDAY_LABELS[index]}
            </span>
            <span className={cn('mt-0.5 text-sm font-semibold', !active && 'text-cream-foreground')}>
              {date.getDate()}
            </span>
            {hasRecord && (
              <span
                className={cn(
                  'mt-1 h-1.5 w-1.5 rounded-full',
                  active ? 'bg-gold' : 'bg-primary',
                )}
                aria-label="기록 있음"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
