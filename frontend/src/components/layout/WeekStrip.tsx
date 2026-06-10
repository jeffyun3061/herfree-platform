'use client';

import { cn } from '@/lib/cn';

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

function getWeekDates(): Date[] {
  const today = new Date();
  const day = today.getDay();
  const start = new Date(today);
  start.setDate(today.getDate() - day);

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function WeekStrip() {
  const today = new Date();
  const dates = getWeekDates();

  return (
    <div className="flex justify-between gap-1 rounded-2xl bg-card p-2 shadow-sm ring-1 ring-border/60">
      {dates.map((date, index) => {
        const active = isSameDay(date, today);
        return (
          <div
            key={date.toISOString()}
            className={cn(
              'flex flex-1 flex-col items-center rounded-xl py-2 text-center',
              active && 'bg-primary text-primary-foreground',
            )}
          >
            <span className={cn('text-[10px]', active ? 'opacity-90' : 'text-muted')}>
              {WEEKDAY_LABELS[index]}
            </span>
            <span className={cn('mt-0.5 text-sm font-semibold', !active && 'text-cream-foreground')}>
              {date.getDate()}
            </span>
          </div>
        );
      })}
    </div>
  );
}
