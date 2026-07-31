'use client';

import { useEffect, useMemo, useState } from 'react';
import { PRODROMAL_OPTIONS, formatTriggerLabels, type JournalRecord } from '@/domain/journal/types';
import {
  addJournalMonths,
  buildJournalMonthCalendar,
  buildJournalMonthDays,
  formatJournalDateTitle,
  formatJournalDayNumber,
  formatJournalMonthTitle,
  formatJournalWeekday,
  todayJournalDate,
} from '@/domain/journal/calendar';
import {
  formatConditionSummary,
  formatSleepLabel,
  formatStressLabel,
  countRoutineCompleted,
  ROUTINE_TASK_TOTAL,
} from '@/domain/journal/routine';
import { Pagination } from '@/components/common/Pagination';
import { cn } from '@/lib/cn';
import { lockBodyScroll, unlockBodyScroll } from '@/lib/body-scroll-lock';

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

/** 디자이너 원본 카드 좌측 강조선 색: 증상 > 전조 > 루틴 완료 > 나머지. */
function recordAccent(record: JournalRecord): string {
  if (record.hadSymptoms) return '#CF5B36';
  if ((record.prodromalSymptoms ?? []).length > 0) return '#E0936B';
  if (countRoutineCompleted(record) >= ROUTINE_TASK_TOTAL) return '#6FC2A6';
  return '#E0A93D';
}

/** 개선판 심각도 라벨: 안정 / 경미 / 보통 / 심함. */
function severityLabel(severity: number | null | undefined): string {
  if (!severity) return '안정';
  if (severity <= 2) return '경미';
  if (severity === 3) return '보통';
  return '심함';
}

function severityColor(severity: number | null | undefined): string {
  if (!severity || severity <= 2) return '#6FC2A6';
  if (severity === 3) return '#E0A93D';
  return '#CF5B36';
}

/** 전조증상 코드(ITCHING 등) → 한글 라벨. 직접 입력 값은 그대로 표시. */
function prodromeLabel(value: string): string {
  return PRODROMAL_OPTIONS.find((option) => option.value === value)?.label ?? value;
}

function recordLine(record: JournalRecord): string {
  if (record.hadSymptoms) {
    return `심각도 ${record.severity ?? '-'} · ${formatTriggerLabels(record.triggers)}`;
  }
  return `수면 ${formatSleepLabel(record)} · ${formatConditionSummary(record)}`;
}

function RoutineBadge({ record }: { record: JournalRecord }) {
  const routineDone = countRoutineCompleted(record);
  const full = routineDone >= ROUTINE_TASK_TOTAL;
  return (
    <span
      className={cn(
        'shrink-0 rounded-[7px] px-2 py-[3px] text-[10.5px] font-bold',
        full ? 'bg-[#DCEFE4] text-[#1D7A5E]' : 'bg-[#F1E7D2] text-[#9A6B1E]',
      )}
    >
      루틴 {routineDone}/{ROUTINE_TASK_TOTAL}
    </span>
  );
}

/** 디자이너 개선판 "기록 상세" 전체화면. */
function JournalRecordDetailScreen({
  record,
  onClose,
  onEdit,
}: {
  record: JournalRecord;
  onClose: () => void;
  onEdit: (record: JournalRecord) => void;
}) {
  const prodromes = record.prodromalSymptoms ?? [];

  useEffect(() => {
    lockBodyScroll();
    return () => unlockBodyScroll();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-[#F3EDE3]"
      role="dialog"
      aria-modal="true"
      aria-label="기록 상세"
    >
      <div className="mx-auto flex w-full max-w-app flex-col gap-3.5 px-4 pb-10 pt-[56px]">
        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={onClose}
            className="text-[22px] leading-none text-[#5C645A]"
            aria-label="기록 상세 닫기"
          >
            ‹
          </button>
          <span className="text-[16px] font-bold text-[#1E2621]">기록 상세</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 px-1">
          <span className="text-[17px] font-bold text-[#1E2621]">
            {formatJournalDateTitle(record.recordDate)}
          </span>
          <span className="text-[12px] text-[#B4B2A6]">{formatJournalWeekday(record.recordDate)}</span>
          <RoutineBadge record={record} />
          {record.hadSymptoms && (
            <span className="rounded-[7px] bg-[#F6E0D2] px-2 py-[3px] text-[10.5px] font-bold text-[#8A3D1E]">
              재발
            </span>
          )}
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_32px_-24px_rgba(20,30,25,.2)]">
          <h3 className="mb-1.5 text-[14px] font-bold text-[#1E2621]">기본 컨디션</h3>
          <div className="flex items-center justify-between py-[11px]">
            <span className="text-[13px] text-[#5C645A]">😴 수면</span>
            <span className="text-[13.5px] font-semibold text-[#1E2621]">
              {formatSleepLabel(record)}
            </span>
          </div>
          <div className="flex items-center justify-between border-t-[0.5px] border-[#F2ECE1] py-[11px]">
            <span className="text-[13px] text-[#5C645A]">💊 영양제</span>
            <span
              className={cn(
                'text-[13.5px] font-semibold',
                record.supplementTaken ? 'text-[#1D7A5E]' : 'text-[#C0512F]',
              )}
            >
              {record.supplementTaken ? '복용' : '빠뜨림'}
            </span>
          </div>
          <div className="flex items-center justify-between border-t-[0.5px] border-[#F2ECE1] py-[11px]">
            <span className="text-[13px] text-[#5C645A]">🧠 스트레스</span>
            <span className="text-[13.5px] font-semibold text-[#1E2621]">
              {formatStressLabel(record.stressLevel)}
            </span>
          </div>
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_32px_-24px_rgba(20,30,25,.2)]">
          <h3 className="mb-3 text-[14px] font-bold text-[#1E2621]">전조증상</h3>
          {prodromes.length > 0 ? (
            <div className="flex flex-wrap gap-[7px]">
              {prodromes.map((value) => (
                <span
                  key={value}
                  className="rounded-[9px] border border-[#1D9E75] bg-[#E3F1EA] px-[13px] py-[7px] text-[12px] font-medium text-[#04342C]"
                >
                  {prodromeLabel(value)}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-[#9A9F94]">없었어요</p>
          )}
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_32px_-24px_rgba(20,30,25,.2)]">
          <h3 className="mb-3 text-[14px] font-bold text-[#1E2621]">증상</h3>
          {record.hadSymptoms && (record.severity ?? 0) > 0 ? (
            <div className="flex items-center gap-2.5">
              <span
                className="rounded-[8px] px-[11px] py-1 text-[11.5px] font-bold text-white"
                style={{ background: severityColor(record.severity) }}
              >
                심각도 {record.severity}
              </span>
              <span className="text-[13.5px] font-semibold text-[#1E2621]">
                {severityLabel(record.severity)}
              </span>
            </div>
          ) : (
            <p className="text-[13px] text-[#9A9F94]">없었어요</p>
          )}
        </div>

        <div className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_32px_-24px_rgba(20,30,25,.2)]">
          <h3 className="mb-3 text-[14px] font-bold text-[#1E2621]">메모</h3>
          <div
            className={cn(
              'min-h-[60px] whitespace-pre-line rounded-[12px] border-[0.5px] border-[#ECE5D8] bg-[#F8F4EC] px-[13px] py-[13px] text-[13px] leading-[1.6]',
              record.memo ? 'text-[#3C443E]' : 'text-[#B4B2A6]',
            )}
          >
            {record.memo || '메모 없음'}
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit(record);
          }}
          className="w-full rounded-[14px] bg-[#0B3B36] px-4 py-[15px] text-center text-[14.5px] font-bold text-white"
        >
          수정하기
        </button>
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
  const todayIso = todayJournalDate();
  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => b.recordDate.localeCompare(a.recordDate)),
    [records],
  );
  const selectedRecord =
    [...sortedRecords, ...calendarRecords].find((record) => record.id === selectedRecordId) ??
    null;
  const monthAnchor = calendarMonth ?? sortedRecords[0]?.recordDate ?? todayIso;
  const monthTitle = formatJournalMonthTitle(monthAnchor);
  const recordsByDate = new Map(
    [...calendarRecords, ...records].map((record) => [record.recordDate, record]),
  );
  const monthDays = buildJournalMonthDays(monthAnchor);
  const calendarCells = buildJournalMonthCalendar(monthAnchor);
  const monthRecordCount = monthDays.filter((date) => recordsByDate.has(date)).length;
  const recordTotal = totalElements ?? records.length;
  const goPrevMonth = () => onCalendarMonthChange?.(addJournalMonths(monthAnchor, -1));
  const goNextMonth = () => onCalendarMonthChange?.(addJournalMonths(monthAnchor, 1));

  return (
    <section className="mx-auto w-full max-w-app">
      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-2xl bg-white" />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {/* 달력 카드 (디자이너 원본 크림 카드) */}
          <div className="rounded-[20px] border-[0.5px] border-[#EADFCB] bg-[#FBF6EA] px-[18px] pb-5 pt-[18px] shadow-[0_14px_32px_-26px_rgba(7,37,31,.4)]">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="mb-[3px] text-[11px] font-bold tracking-[0.1em] text-[#B79A5E]">
                  RECORD CALENDAR
                </p>
                <h3 className="hf-display text-[20px] font-extrabold text-[#1E2621]">
                  {monthTitle}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={goPrevMonth}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#F3ECDD] text-[15px] text-[#8A7A5A]"
                  aria-label="이전 달"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNextMonth}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-[#F3ECDD] text-[15px] text-[#8A7A5A]"
                  aria-label="다음 달"
                >
                  ›
                </button>
              </div>
            </div>

            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}
            >
              {['일', '월', '화', '수', '목', '금', '토'].map((weekday, index) => (
                <span
                  key={weekday}
                  className={cn(
                    'pb-1 text-center text-[11px] text-[#A6ABA0]',
                    index === 0 && 'font-semibold',
                  )}
                >
                  {weekday}
                </span>
              ))}
              {calendarCells.map((cell, index) => {
                if (!cell.date) {
                  return <span key={`empty-${index}`} aria-hidden="true" />;
                }

                const date = cell.date;
                const record = recordsByDate.get(date);
                const isToday = date === todayIso;
                const canCreate = !record && Boolean(onCreateForDate);
                return (
                  <button
                    key={date}
                    type="button"
                    onClick={() =>
                      record ? setSelectedRecordId(record.id) : onCreateForDate?.(date)
                    }
                    disabled={!record && !canCreate}
                    className={cn(
                      'flex aspect-square min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] transition-colors',
                      isToday
                        ? 'bg-[#0B3B36]'
                        : 'border-[0.5px] border-[#EFE6D5] bg-[#FBF6EA] hover:bg-[#F6EFE0]',
                      !record && !canCreate && 'cursor-default',
                    )}
                    aria-label={`${date} ${record ? '기록 보기' : '기록 작성'}`}
                  >
                    <span
                      className={cn(
                        'text-[13px] leading-none',
                        isToday ? 'font-bold text-white' : 'font-semibold text-[#3C443E]',
                      )}
                    >
                      {formatJournalDayNumber(date)}
                    </span>
                    <span
                      className="h-[5px] w-[5px] rounded-full"
                      style={{
                        background: record ? (isToday ? '#F0C778' : '#6FC2A6') : 'transparent',
                      }}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-3.5 border-t-[0.5px] border-[#EFE6D5] pt-3.5">
              <span className="flex items-center gap-[5px] text-[11px] text-[#5C645A]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#6FC2A6]" aria-hidden />
                기록한 날
              </span>
              <span className="flex items-center gap-[5px] text-[11px] text-[#5C645A]">
                <span className="h-3 w-3 rounded-[4px] bg-[#0B3B36]" aria-hidden />
                오늘
              </span>
              <span className="ml-auto text-[11px] text-[#9A9F94]">이번 달 {monthRecordCount}일 기록</span>
            </div>
          </div>

          {/* 필터 + 총 개수 */}
          <div className="flex items-center justify-between px-0.5">
            <div className="flex gap-[3px] rounded-full bg-[#EBE2D1] p-[3px]">
              {(
                [
                  ['all', '전체'],
                  ['relapse', '재발만'],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilterChange(key)}
                  className={cn(
                    'rounded-full px-[15px] py-1.5 text-[12px] font-semibold transition-colors',
                    filter === key ? 'bg-[#0B3B36] text-white' : 'text-[#8A9089]',
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-[11.5px] text-[#9A9F94]">
              총 {recordTotal}개 · 최신순
            </span>
          </div>

          {records.length === 0 ? (
            <div className="rounded-[20px] border-[0.5px] border-[#EADFCB] bg-[#FBF6EA] px-5 py-8 text-center shadow-[0_12px_28px_-26px_rgba(7,37,31,.4)]">
              <h3 className="text-[15px] font-extrabold text-[#1E2621]">
                {filter === 'relapse' ? '재발 기록이 없어요' : '아직 기록이 없어요'}
              </h3>
              <p className="mx-auto mt-2 max-w-[260px] text-[12.5px] leading-[1.65] text-[#65706B]">
                {filter === 'relapse'
                  ? '재발이 있었던 날을 달력에서 선택하거나 기록하기로 남겨 보세요.'
                  : '달력에서 원하는 날짜를 누르거나 기록하기 버튼으로 첫 기록을 남겨 보세요.'}
              </p>
              {onCreate && (
                <button
                  type="button"
                  onClick={onCreate}
                  className="mt-5 rounded-[13px] bg-[#0B3B36] px-5 py-3 text-[13px] font-extrabold text-white shadow-[0_12px_24px_-18px_rgba(11,59,54,.9)]"
                >
                  기록하기
                </button>
              )}
            </div>
          ) : (
            <>
              <ul className="space-y-3">
                {sortedRecords.map((record) => (
                  <li key={record.id}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRecordId(record.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedRecordId(record.id);
                        }
                      }}
                      className="cursor-pointer rounded-[16px] border-[0.5px] border-[#EADFCB] bg-[#FBF6EA] px-[17px] py-4 shadow-[0_12px_28px_-26px_rgba(7,37,31,.4)] transition-colors hover:bg-[#F8F1E2]"
                      style={{ borderLeft: `3px solid ${recordAccent(record)}` }}
                      aria-label={`${formatJournalDateTitle(record.recordDate)} 기록 상세 보기`}
                    >
                      <div className="mb-2.5 flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-2">
                          <span className="whitespace-nowrap text-[14.5px] font-bold text-[#1E2621]">
                            {formatJournalDateTitle(record.recordDate)}
                          </span>
                          <RoutineBadge record={record} />
                          {record.hadSymptoms && (
                            <span className="shrink-0 rounded-[7px] bg-[#F6E0D2] px-2 py-[3px] text-[10.5px] font-bold text-[#8A3D1E]">
                              재발
                            </span>
                          )}
                        </div>
                        <span className="shrink-0 text-[11px] text-[#B4B2A6]">
                          {formatJournalWeekday(record.recordDate)}
                        </span>
                      </div>
                      <p className="mb-1.5 truncate text-[12.5px] text-[#5C645A]">
                        {recordLine(record)}
                      </p>
                      <p
                        className={cn(
                          'mb-[13px] truncate text-[12.5px] text-[#8A9089]',
                          !record.memo && 'text-[#B4B2A6]',
                        )}
                      >
                        {record.memo ? `“${record.memo}”` : '메모 없음'}
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onEdit(record);
                          }}
                          className="rounded-[9px] border-[0.5px] border-[#E5D9C2] bg-[#F3ECDD] px-[15px] py-[7px] text-[12px] font-semibold text-[#0B3B36]"
                        >
                          수정
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onDelete(record.id);
                          }}
                          className="ml-auto rounded-[9px] border-[0.5px] border-[#E7C9BC] bg-transparent px-[15px] py-[7px] text-[12px] font-semibold text-[#C0512F]"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              {totalPages > 1 && (
                <div className="mt-4">
                  <Pagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
                </div>
              )}
            </>
          )}
        </div>
      )}
      {selectedRecord && (
        <JournalRecordDetailScreen
          record={selectedRecord}
          onClose={() => setSelectedRecordId(null)}
          onEdit={onEdit}
        />
      )}
    </section>
  );
}
