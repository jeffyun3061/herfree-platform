'use client';

import {
  formatTriggerLabels,
  formatJournalDateLabel,
  type JournalRecord,
} from '@/domain/journal/types';
import {
  formatConditionSummary,
  formatSleepLabel,
  countRoutineCompleted,
  ROUTINE_TASK_TOTAL,
} from '@/domain/journal/routine';
import { Pagination } from '@/components/common/Pagination';
import { EmptyState } from '@/components/ui/EmptyState';
import { cn } from '@/lib/cn';

type JournalHistoryListProps = {
  records: JournalRecord[];
  isLoading: boolean;
  filter: 'relapse' | 'all';
  page: number;
  totalPages: number;
  onFilterChange: (filter: 'relapse' | 'all') => void;
  onPageChange: (page: number) => void;
  onCreate?: () => void;
  onCreateForDate?: (date: string) => void;
  onEdit: (record: JournalRecord) => void;
  onDelete: (recordId: number) => void;
};

function parseRecordDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatMonthTitle(date: string): string {
  return parseRecordDate(date).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
  });
}

function formatDayNumber(date: string): string {
  return String(parseRecordDate(date).getDate());
}

function formatWeekday(date: string): string {
  return parseRecordDate(date).toLocaleDateString('ko-KR', { weekday: 'short' });
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function buildMonthDays(anchorDate: string): string[] {
  const anchor = parseRecordDate(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();

  return Array.from({ length: lastDay }, (_, index) => toIsoDate(new Date(year, month, index + 1)));
}

function buildMonthCalendar(anchorDate: string): Array<{ date: string | null; inMonth: boolean }> {
  const anchor = parseRecordDate(anchorDate);
  const year = anchor.getFullYear();
  const month = anchor.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const cells: Array<{ date: string | null; inMonth: boolean }> = [];

  for (let index = 0; index < firstDay; index += 1) {
    cells.push({ date: null, inMonth: false });
  }

  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({ date: toIsoDate(new Date(year, month, day)), inMonth: true });
  }

  while (cells.length % 7 !== 0) {
    cells.push({ date: null, inMonth: false });
  }

  return cells;
}

function recordTone(record: JournalRecord): {
  label: string;
  badgeClassName: string;
  cardClassName: string;
  accentClassName: string;
} {
  if (record.hadSymptoms) {
    return {
      label: '재발',
      badgeClassName: 'bg-[#FFF1EC] text-[#B6402D]',
      cardClassName: 'border-[#F0C9BC] bg-[#FFFCF8]',
      accentClassName: 'bg-[#D94B3D]',
    };
  }

  const routineDone = countRoutineCompleted(record);
  if (routineDone >= ROUTINE_TASK_TOTAL) {
    return {
      label: '완료',
      badgeClassName: 'bg-[#E7F1EC] text-[#0B6D60]',
      cardClassName: 'border-[#D6E8DE] bg-[#F8FFFB]',
      accentClassName: 'bg-[#60C5A8]',
    };
  }

  return {
    label: `루틴 ${routineDone}/${ROUTINE_TASK_TOTAL}`,
    badgeClassName: 'bg-[#F8F1E4] text-[#8A6A2A]',
    cardClassName: 'border-[#E7DFD2] bg-white',
    accentClassName: 'bg-[#E8A04C]',
  };
}

export function JournalHistoryList({
  records,
  isLoading,
  filter,
  page,
  totalPages,
  onFilterChange,
  onPageChange,
  onCreate,
  onCreateForDate,
  onEdit,
  onDelete,
}: JournalHistoryListProps) {
  const todayIso = toIsoDate(new Date());
  const monthAnchor = records[0]?.recordDate ?? todayIso;
  const monthTitle = formatMonthTitle(monthAnchor);
  const recordsByDate = new Map(records.map((record) => [record.recordDate, record]));
  const monthDays = buildMonthDays(monthAnchor);
  const calendarCells = buildMonthCalendar(monthAnchor);
  const monthRecordCount = monthDays.filter((date) => recordsByDate.has(date)).length;

  return (
    <section className="mx-auto w-full max-w-app">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">기록 목록</h2>
          <p className="mt-1 text-xs text-muted">날짜를 눌러 수정할 수 있어요.</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {onCreate && (
            <button
              type="button"
              onClick={onCreate}
              className="rounded-full bg-primary px-3.5 py-1.5 text-xs font-bold text-primary-foreground shadow-[0_10px_24px_-18px_rgba(11,59,54,.75)] transition-colors hover:bg-[#0F4F48]"
            >
              오늘 기록하기
            </button>
          )}
          <div className="inline-flex rounded-full border border-[#D9CDBA] bg-[#EDE4D6] p-1 shadow-inner">
            <button
              type="button"
              onClick={() => onFilterChange('all')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                filter === 'all'
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_18px_-14px_rgba(11,59,54,.9)]'
                  : 'text-[#756A5D]',
              )}
            >
              전체
            </button>
            <button
              type="button"
              onClick={() => onFilterChange('relapse')}
              className={cn(
                'rounded-full px-3 py-1.5 text-xs font-bold transition-colors',
                filter === 'relapse'
                  ? 'bg-primary text-primary-foreground shadow-[0_8px_18px_-14px_rgba(11,59,54,.9)]'
                  : 'text-[#756A5D]',
              )}
            >
              재발만
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white" />
          ))}
        </div>
      ) : records.length === 0 ? (
        <EmptyState
          title={filter === 'relapse' ? '재발 기록이 없어요' : '아직 기록이 없어요'}
          description={
            filter === 'relapse'
              ? '재발이 있었던 날 「재발 기록하기」로 남겨 보세요.'
              : '홈에서 오늘 기록하기로 첫 기록을 남겨 보세요.'
          }
        />
      ) : (
        <>
          <div className="mb-4 rounded-[24px] border border-[#E2D7C8] bg-[#FFFDF8] px-4 py-4 shadow-[0_16px_36px_-30px_rgba(7,37,31,.45)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold tracking-[0.08em] text-[#8A7964]">
                  RECORD CALENDAR
                </p>
                <h3 className="mt-1 text-[16px] font-extrabold text-[#1E2621]">{monthTitle}</h3>
              </div>
              <span className="rounded-full bg-[#F8F4EC] px-3 py-1 text-[11px] font-bold text-[#65706B]">
                {monthRecordCount}일 기록
              </span>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1.5 text-center">
              {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
                <span key={weekday} className="text-[10px] font-bold text-[#9A8F80]">
                  {weekday}
                </span>
              ))}
              {calendarCells.map((cell, index) => {
                if (!cell.date) {
                  return <span key={`empty-${index}`} className="h-[42px]" aria-hidden="true" />;
                }

                const date = cell.date;
                const record = recordsByDate.get(date);
                const isToday = date === todayIso;
                const canCreate = !record && Boolean(onCreateForDate);
                const tone = record ? recordTone(record) : null;
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() => (record ? onEdit(record) : onCreateForDate?.(date))}
                    disabled={!record && !canCreate}
                    className={cn(
                      'flex h-[42px] flex-col items-center justify-center rounded-[14px] border text-center transition-colors',
                      record && tone ? tone.cardClassName : 'border-[#E8DECF] bg-[#F7F0E5] text-[#9A8F80]',
                      isToday && 'ring-2 ring-[#0B3B36]/20',
                      (record || canCreate) ? 'hover:bg-[#FFFCF7]' : 'cursor-default opacity-60',
                    )}
                    aria-label={`${date} ${record ? '기록 수정' : '기록 작성'}`}
                  >
                    <span
                      className={cn(
                        'text-[13px] font-extrabold leading-none',
                        record ? 'text-[#1E2621]' : 'text-[#9A8F80]',
                      )}
                    >
                      {formatDayNumber(date)}
                    </span>
                    <span
                      className={cn(
                        'mt-1.5 h-1.5 w-1.5 rounded-full',
                        record ? tone?.accentClassName : isToday ? 'bg-[#D6A84F]' : 'bg-[#DED6C9]',
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <ul className="space-y-3">
            {records.map((record) => {
              const routineDone = countRoutineCompleted(record);
              const tone = recordTone(record);
              return (
                <li
                  key={record.id}
                  className={cn(
                    'relative overflow-hidden rounded-[22px] border px-4 py-3.5 text-sm shadow-[0_14px_30px_-28px_rgba(7,37,31,.55)]',
                    record.hadSymptoms ? 'border-[#E9C5B7] bg-[#FFF9F3]' : 'border-[#E3D8C7] bg-[#FFFDF8]',
                  )}
                >
                  <span className={cn('absolute left-0 top-0 h-full w-1', tone.accentClassName)} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-left">
                      <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-[#A08D72]">
                        JOURNAL NOTE
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-display text-[16px] font-bold text-ink">
                          {formatJournalDateLabel(record.recordDate)}
                        </p>
                        <span
                          className={cn(
                            'rounded-pill px-2 py-0.5 text-[10px] font-bold',
                            tone.badgeClassName,
                          )}
                        >
                          {record.hadSymptoms ? '재발' : `루틴 ${routineDone}/${ROUTINE_TASK_TOTAL}`}
                        </span>
                      </div>
                      {record.hadSymptoms ? (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[#645D55]">
                          심각도 {record.severity ?? '-'} · {formatTriggerLabels(record.triggers)}
                        </p>
                      ) : (
                        <p className="mt-1.5 text-[13px] leading-relaxed text-[#645D55]">
                          수면 {formatSleepLabel(record)} · {formatConditionSummary(record)}
                        </p>
                      )}
                      {record.memo && (
                        <p className="mt-2 line-clamp-2 rounded-[14px] bg-[#F7F1E8] px-3 py-2 text-xs leading-relaxed text-[#635A4F]">
                          {record.memo}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => onEdit(record)}
                        className="rounded-lg border border-[#D8CDBD] bg-white/70 px-2 py-1 text-xs font-bold text-ink-soft hover:bg-canvas"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(record.id)}
                        className="rounded-lg border border-red-200 bg-white/70 px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          {totalPages > 1 && (
            <div className="mt-4">
              <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
          )}
        </>
      )}
    </section>
  );
}
