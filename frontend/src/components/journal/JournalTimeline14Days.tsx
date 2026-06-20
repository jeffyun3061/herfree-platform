'use client';

import { formatJournalDateLabel, type JournalTimelineDay } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalTimeline14DaysProps = {
  days: JournalTimelineDay[];
  isLoading?: boolean;
  onDaySelect?: (date: string) => void;
};

function dayLabel(dateStr: string): string {
  return formatJournalDateLabel(dateStr).replace(/^\d{4}년 /, '');
}

const LEGEND = [
  { key: 'hadSymptoms' as const, color: 'bg-red-500', label: '증상' },
  { key: 'hasProdromal' as const, color: 'bg-orange-400', label: '전조증상' },
  { key: 'sleepDeficit' as const, color: 'bg-indigo-400', label: '수면부족' },
  { key: 'highStress' as const, color: 'bg-amber-500', label: '스트레스' },
];

function DayColumn({
  day,
  onSelect,
}: {
  day: JournalTimelineDay;
  onSelect?: (date: string) => void;
}) {
  const flags = LEGEND.map((item) => day[item.key]);
  const hasAny = flags.some(Boolean);

  return (
    <button
      type="button"
      disabled={!day.recorded || !onSelect}
      onClick={() => onSelect?.(day.date)}
      className={cn(
        'flex min-w-[2.75rem] flex-col items-center gap-2 rounded-lg transition-colors',
        !day.recorded && 'opacity-40',
        day.recorded && onSelect && 'hover:bg-canvas-dark/60',
      )}
      aria-label={day.recorded ? `${dayLabel(day.date)} 기록 보기` : `${dayLabel(day.date)} 기록 없음`}
    >
      <span className="text-[10px] font-medium text-muted">{dayLabel(day.date)}</span>
      <div className="flex h-16 flex-col items-center justify-end gap-1">
        {LEGEND.map((item) => (
          <span
            key={item.key}
            className={cn(
              'h-2 w-2 rounded-full transition-colors',
              day[item.key] ? item.color : 'bg-border/50',
            )}
            title={item.label}
          />
        ))}
      </div>
      {day.hadSymptoms && (
        <span className="h-1 w-full max-w-[1.5rem] rounded-full bg-red-400/60" />
      )}
      {!hasAny && day.recorded && (
        <span className="h-1 w-full max-w-[1.5rem] rounded-full bg-primary/30" />
      )}
    </button>
  );
}

export function JournalTimeline14Days({ days, isLoading, onDaySelect }: JournalTimeline14DaysProps) {
  if (isLoading) {
    return (
      <section className="rounded-card border border-border/50 bg-white p-5 shadow-card">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-32 rounded bg-canvas-dark" />
          <div className="h-24 rounded-xl bg-canvas-dark" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-card border border-border/50 bg-white p-4 shadow-card">
      <h3 className="text-[13px] font-semibold text-ink">최근 14일 흐름</h3>
      <p className="mt-0.5 text-[11px] text-muted">날짜를 눌러 기록을 수정할 수 있어요</p>

      <div className="mt-4 flex items-end gap-0.5 overflow-x-auto pb-1">
        {days.map((day) => (
          <DayColumn key={day.date} day={day} onSelect={onDaySelect} />
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-border/50 pt-3">
        {LEGEND.map((item) => (
          <span key={item.key} className="inline-flex items-center gap-1.5 text-[11px] text-muted">
            <span className={cn('h-2 w-2 rounded-full', item.color)} />
            {item.label}
          </span>
        ))}
      </div>
    </section>
  );
}
