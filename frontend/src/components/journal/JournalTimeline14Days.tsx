'use client';

import type { JournalTimelineDay } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

type JournalTimeline14DaysProps = {
  days: JournalTimelineDay[];
  isLoading?: boolean;
};

function dayLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('ko-KR', { month: 'numeric', day: 'numeric' });
}

function Dot({ active, color, title }: { active: boolean; color: string; title: string }) {
  return (
    <span
      title={title}
      className={cn(
        'inline-block h-2 w-2 rounded-full',
        active ? color : 'bg-border/60',
      )}
    />
  );
}

export function JournalTimeline14Days({ days, isLoading }: JournalTimeline14DaysProps) {
  if (isLoading) {
    return (
      <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-32 rounded bg-canvas" />
          <div className="h-20 rounded-xl bg-canvas" />
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink">최근 14일 타임라인</h3>
      <p className="mt-1 text-xs text-muted">증상 · 전조 · 수면 · 스트레스 · 복약</p>

      <div className="mt-4 flex gap-1 overflow-x-auto pb-1">
        {days.map((day) => (
          <div
            key={day.date}
            className={cn(
              'flex min-w-[2.4rem] flex-col items-center gap-1.5 rounded-xl px-1 py-2',
              day.hadSymptoms && 'bg-red-50',
              !day.recorded && 'opacity-50',
            )}
          >
            <span className="text-[10px] text-muted">{dayLabel(day.date)}</span>
            <div className="flex flex-col gap-0.5">
              <Dot active={day.hadSymptoms} color="bg-red-500" title="증상" />
              <Dot active={day.hasProdromal} color="bg-orange-400" title="전조" />
              <Dot active={day.sleepDeficit} color="bg-indigo-400" title="수면 부족" />
              <Dot active={day.highStress} color="bg-amber-500" title="스트레스" />
              <Dot active={day.medicationMissed} color="bg-purple-400" title="복약" />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted">
        <Legend color="bg-red-500" label="증상" />
        <Legend color="bg-orange-400" label="전조" />
        <Legend color="bg-indigo-400" label="수면" />
        <Legend color="bg-amber-500" label="스트레스" />
        <Legend color="bg-purple-400" label="복약" />
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={cn('h-2 w-2 rounded-full', color)} />
      {label}
    </span>
  );
}
