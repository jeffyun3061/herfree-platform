'use client';

import { toDateInputValue, type JournalTimelineDay } from '@/domain/journal/types';
import { cn } from '@/lib/cn';

const LAYER_COLORS = [
  'var(--journal-flow-sleep)',
  'var(--journal-flow-supplement)',
  'var(--journal-flow-stress)',
  'var(--journal-flow-prodromal)',
  'var(--journal-flow-symptom)',
] as const;
const LAYER_LABELS = ['수면', '영양제', '스트레스', '전조증상', '증상'] as const;
const ROW_GAP = 21;
const BASELINE = 98;

function weekdayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T00:00:00`);
  return date.toLocaleDateString('ko-KR', { weekday: 'short' }).replace('요일', '');
}

function dayNumber(isoDate: string): number {
  return Number(isoDate.split('-')[2] ?? 0);
}

function layerFlags(day: JournalTimelineDay): boolean[] {
  return [
    day.recorded && !day.sleepDeficit,
    day.recorded,
    day.highStress,
    day.hasProdromal,
    day.hadSymptoms,
  ];
}

type JournalRecordFlowChartProps = {
  days: JournalTimelineDay[];
};

export function JournalRecordFlowChart({ days }: JournalRecordFlowChartProps) {
  const today = toDateInputValue();

  return (
    <section className="journal-record-card">
      <h3 className="journal-record-card__title">최근 14일 흐름</h3>
      <div className="mb-3.5 flex flex-wrap gap-x-3 gap-y-2">
        {LAYER_LABELS.map((label, index) => (
          <span key={label} className="inline-flex items-center gap-1.5 text-[11px] text-ink-soft">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: LAYER_COLORS[index] }}
            />
            {label}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto pb-1">
        <div className="flex min-w-max">
          {days.map((day) => {
            const flags = layerFlags(day);
            const activeIndexes = flags
              .map((active, index) => (active ? index : -1))
              .filter((index) => index >= 0);
            const isToday = day.date === today;

            return (
              <div key={day.date} className="flex w-8 shrink-0 flex-col items-center">
                <span
                  className={cn(
                    'mb-0.5 flex h-5 w-5 items-center justify-center text-[10px]',
                    isToday
                      ? 'rounded-full bg-journal-hero font-semibold text-white'
                      : 'text-[11px] text-muted',
                  )}
                >
                  {dayNumber(day.date)}
                </span>
                <span className="mb-1.5 text-[10px] text-muted">{weekdayLabel(day.date)}</span>
                <div className="relative h-[108px] w-8">
                  {activeIndexes.length > 0 && (
                    <>
                      <div
                        className="absolute left-1/2 w-0.5 -translate-x-1/2 bg-[var(--journal-flow-axis)]"
                        style={{
                          top: `${BASELINE - Math.max(...activeIndexes) * ROW_GAP}px`,
                          height: `${
                            Math.max(...activeIndexes) * ROW_GAP -
                            Math.min(...activeIndexes) * ROW_GAP
                          }px`,
                        }}
                      />
                      {activeIndexes.map((index) => (
                        <span
                          key={index}
                          className="absolute left-1/2 h-[9px] w-[9px] -translate-x-1/2 -translate-y-1/2 rounded-full"
                          style={{
                            top: `${BASELINE - index * ROW_GAP}px`,
                            backgroundColor: LAYER_COLORS[index],
                          }}
                        />
                      ))}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
