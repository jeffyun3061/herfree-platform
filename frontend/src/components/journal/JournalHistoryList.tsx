'use client';

import { useMemo, useState } from 'react';
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
  calendarRecords?: JournalRecord[];
  calendarMonth?: string;
  isLoading: boolean;
  filter: 'relapse' | 'all';
  page: number;
  totalPages: number;
  totalElements?: number;
  onFilterChange: (filter: 'relapse' | 'all') => void;
  onCalendarMonthChange?: (month: string) => void;
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

function addMonths(monthDate: string, amount: number): string {
  const date = parseRecordDate(monthDate);
  return toIsoDate(new Date(date.getFullYear(), date.getMonth() + amount, 1));
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

function JournalRecordDetailSheet({
  record,
  onClose,
  onEdit,
}: {
  record: JournalRecord;
  onClose: () => void;
  onEdit: (record: JournalRecord) => void;
}) {
  const routineDone = countRoutineCompleted(record);

  return (
    <div className="fixed inset-0 z-50 bg-black/35 px-4 py-6">
      <div className="mx-auto flex min-h-full w-full max-w-app items-end sm:items-center">
        <div className="w-full rounded-[28px] border border-[#E2D7C8] bg-[#FFFDF8] p-5 shadow-[0_30px_80px_-36px_rgba(7,37,31,.65)]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-[0.12em] text-[#A08D72]">
                JOURNAL DETAIL
              </p>
              <h3 className="mt-1 font-display text-[20px] font-bold text-[#1E2621]">
                {formatJournalDateLabel(record.recordDate)}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E2D7C8] bg-[#F8F1E6] text-lg font-bold text-[#65706B]"
              aria-label="기록 상세 닫기"
            >
              ×
            </button>
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-[16px] bg-[#F8F1E6] px-3 py-3">
              <p className="text-[10px] text-[#8A7964]">상태</p>
              <p className="mt-1 text-[12px] font-bold text-[#1E2621]">
                {record.hadSymptoms ? '재발 기록' : '일상 기록'}
              </p>
            </div>
            <div className="rounded-[16px] bg-[#F8F1E6] px-3 py-3">
              <p className="text-[10px] text-[#8A7964]">수면</p>
              <p className="mt-1 text-[12px] font-bold text-[#1E2621]">
                {formatSleepLabel(record)}
              </p>
            </div>
            <div className="rounded-[16px] bg-[#F8F1E6] px-3 py-3">
              <p className="text-[10px] text-[#8A7964]">루틴</p>
              <p className="mt-1 text-[12px] font-bold text-[#1E2621]">
                {routineDone}/{ROUTINE_TASK_TOTAL}
              </p>
            </div>
          </div>

          <div className="mt-3 rounded-[18px] bg-[#F8F1E6] px-4 py-3 text-[13px] leading-relaxed text-[#5E594F]">
            {record.hadSymptoms
              ? `심각도 ${record.severity ?? '-'} · ${formatTriggerLabels(record.triggers)}`
              : formatConditionSummary(record)}
          </div>

          {record.memo && (
            <div className="mt-3 whitespace-pre-line rounded-[18px] bg-[#F8F1E6] px-4 py-3 text-[13px] leading-relaxed text-[#5E594F]">
              {record.memo}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(record);
            }}
            className="mt-4 w-full rounded-[15px] bg-[#0B3B36] px-4 py-3 text-sm font-extrabold text-white shadow-[0_14px_24px_-18px_rgba(11,59,54,.8)]"
          >
            이 기록 수정하기
          </button>
        </div>
      </div>
    </div>
  );
}

export function JournalHistoryList({
  records,
  calendarRecords = records,
  calendarMonth,
  isLoading,
  filter,
  page,
  totalPages,
  totalElements,
  onFilterChange,
  onCalendarMonthChange,
  onPageChange,
  onCreate,
  onCreateForDate,
  onEdit,
  onDelete,
}: JournalHistoryListProps) {
  const [selectedRecordId, setSelectedRecordId] = useState<number | null>(null);
  const todayIso = toIsoDate(new Date());
  const sortedRecords = useMemo(
    () =>
      [...records].sort(
        (a, b) =>
          new Date(`${b.recordDate}T00:00:00`).getTime() -
          new Date(`${a.recordDate}T00:00:00`).getTime(),
      ),
    [records],
  );
  const selectedRecord =
    [...sortedRecords, ...calendarRecords].find((record) => record.id === selectedRecordId) ??
    null;
  const monthAnchor = calendarMonth ?? sortedRecords[0]?.recordDate ?? todayIso;
  const monthTitle = formatMonthTitle(monthAnchor);
  const recordsByDate = new Map(
    [...calendarRecords, ...records].map((record) => [record.recordDate, record]),
  );
  const monthDays = buildMonthDays(monthAnchor);
  const calendarCells = buildMonthCalendar(monthAnchor);
  const monthRecordCount = monthDays.filter((date) => recordsByDate.has(date)).length;
  const recordTotal = totalElements ?? records.length;
  const goPrevMonth = () => onCalendarMonthChange?.(addMonths(monthAnchor, -1));
  const goNextMonth = () => onCalendarMonthChange?.(addMonths(monthAnchor, 1));
  const goThisMonth = () => onCalendarMonthChange?.(toIsoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));

  return (
    <section className="mx-auto w-full max-w-app">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white" />
          ))}
        </div>
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
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2D7C8] bg-[#F8F4EC] text-sm font-bold text-[#65706B]"
                  aria-label="이전 달"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goThisMonth}
                  className="rounded-full bg-[#F8F4EC] px-2.5 py-1 text-[11px] font-bold text-[#65706B]"
                >
                  {monthRecordCount}일
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E2D7C8] bg-[#F8F4EC] text-sm font-bold text-[#65706B]"
                  aria-label="다음 달"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              className="mt-4 grid gap-1.5 text-center"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => (
                <span key={weekday} className="text-[10px] font-bold text-[#9A8F80]">
                  {weekday}
                </span>
              ))}
              {calendarCells.map((cell, index) => {
                if (!cell.date) {
                  return <span key={`empty-${index}`} className="h-[36px] min-w-0" aria-hidden="true" />;
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
                    onClick={() => (record ? setSelectedRecordId(record.id) : onCreateForDate?.(date))}
                    disabled={!record && !canCreate}
                    className={cn(
                      'flex h-[36px] min-w-0 flex-col items-center justify-center rounded-[12px] border text-center transition-colors',
                      record && tone ? tone.cardClassName : 'border-[#E8DECF] bg-[#F7F0E5] text-[#9A8F80]',
                      isToday && 'ring-2 ring-[#0B3B36]/20',
                      (record || canCreate) ? 'hover:bg-[#FFFCF7]' : 'cursor-default opacity-60',
                    )}
                    aria-label={`${date} ${record ? '기록 보기' : '기록 작성'}`}
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

          <div className="mb-3 flex items-center justify-between gap-2">
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
            {onCreate && (
              <button
                type="button"
                onClick={onCreate}
                className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-extrabold text-primary-foreground shadow-[0_12px_26px_-18px_rgba(11,59,54,.85)] transition-colors hover:bg-[#0F4F48]"
              >
                오늘 기록하기
              </button>
            )}
          </div>

          <div className="mb-3 flex items-center justify-between rounded-[16px] border border-[#E6D9C8] bg-[#F8F1E6] px-3.5 py-2.5 text-[11px] text-[#6E6257]">
            <span>
              총 <strong className="text-[#0B3B36]">{recordTotal}</strong>개 기록
            </span>
            <span>
              최신순 · {page + 1}/{Math.max(totalPages, 1)}페이지
            </span>
          </div>

          {records.length === 0 ? (
            <EmptyState
              title={filter === 'relapse' ? '재발 기록이 없어요' : '아직 기록이 없어요'}
              description={
                filter === 'relapse'
                  ? '재발이 있었던 날 「재발 기록하기」로 남겨 보세요.'
                  : '달력에서 원하는 날짜를 눌러 첫 기록을 남겨 보세요.'
              }
            />
          ) : (
            <>
          <ul className="space-y-3">
            {sortedRecords.map((record) => {
              const routineDone = countRoutineCompleted(record);
              const tone = recordTone(record);
              return (
                <li
                  key={record.id}
                  className={cn(
                    'relative h-[116px] overflow-hidden rounded-[22px] border px-4 py-3 text-sm shadow-[0_14px_30px_-28px_rgba(7,37,31,.55)]',
                    record.hadSymptoms ? 'border-[#E9C5B7] bg-[#FFF9F3]' : 'border-[#E3D8C7] bg-[#FFFDF8]',
                  )}
                >
                  <span className={cn('absolute left-0 top-0 h-full w-1', tone.accentClassName)} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1 text-left">
                      <p className="mb-1 text-[10px] font-bold tracking-[0.12em] text-[#A08D72]">
                        JOURNAL NOTE
                      </p>
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 truncate font-display text-[16px] font-bold text-ink">
                          {formatJournalDateLabel(record.recordDate)}
                        </p>
                        <span
                          className={cn(
                            'shrink-0 rounded-pill px-2 py-0.5 text-[10px] font-bold',
                            tone.badgeClassName,
                          )}
                        >
                          {record.hadSymptoms ? '재발' : `루틴 ${routineDone}/${ROUTINE_TASK_TOTAL}`}
                        </span>
                      </div>
                      {record.hadSymptoms ? (
                        <p className="mt-1.5 max-w-full truncate text-[13px] leading-relaxed text-[#645D55]">
                          심각도 {record.severity ?? '-'} · {formatTriggerLabels(record.triggers)}
                        </p>
                      ) : (
                        <p className="mt-1.5 max-w-full truncate text-[13px] leading-relaxed text-[#645D55]">
                          수면 {formatSleepLabel(record)} · {formatConditionSummary(record)}
                        </p>
                      )}
                      <p
                        className={cn(
                          'mt-2 h-[24px] max-w-full truncate rounded-[12px] bg-[#F7F1E8] px-3 py-1.5 text-xs leading-none text-[#635A4F]',
                          !record.memo && 'text-transparent',
                        )}
                        aria-hidden={!record.memo}
                      >
                        {record.memo || '메모 없음'}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRecordId(record.id)}
                        className="rounded-lg border border-[#D8CDBD] bg-white/70 px-2 py-1 text-xs font-bold text-[#0B3B36] hover:bg-canvas"
                      >
                        보기
                      </button>
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
        </>
      )}
      {selectedRecord && (
        <JournalRecordDetailSheet
          record={selectedRecord}
          onClose={() => setSelectedRecordId(null)}
          onEdit={onEdit}
        />
      )}
    </section>
  );
}
