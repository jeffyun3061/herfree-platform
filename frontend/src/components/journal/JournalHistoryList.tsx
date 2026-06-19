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
  onEdit: (record: JournalRecord) => void;
  onDelete: (recordId: number) => void;
};

export function JournalHistoryList({
  records,
  isLoading,
  filter,
  page,
  totalPages,
  onFilterChange,
  onPageChange,
  onEdit,
  onDelete,
}: JournalHistoryListProps) {
  return (
    <section className="mx-auto w-full max-w-app">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">기록 목록</h2>
          <p className="mt-1 text-xs text-muted">날짜를 눌러 수정할 수 있어요.</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onFilterChange('relapse')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              filter === 'relapse'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted',
            )}
          >
            재발만
          </button>
          <button
            type="button"
            onClick={() => onFilterChange('all')}
            className={cn(
              'rounded-full border px-3 py-1.5 text-xs transition-colors',
              filter === 'all'
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted',
            )}
          >
            전체
          </button>
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
          <ul className="space-y-2">
            {records.map((record) => {
              const routineDone = countRoutineCompleted(record);
              return (
                <li
                  key={record.id}
                  className="rounded-2xl border border-border/70 bg-white px-4 py-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      className="min-w-0 flex-1 text-left"
                      onClick={() => onEdit(record)}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-ink">
                          {formatJournalDateLabel(record.recordDate)}
                        </p>
                        {record.hadSymptoms ? (
                          <span className="rounded-pill bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                            재발
                          </span>
                        ) : (
                          <span className="rounded-pill bg-journal-success/15 px-2 py-0.5 text-[10px] font-semibold text-journal-success">
                            루틴 {routineDone}/{ROUTINE_TASK_TOTAL}
                          </span>
                        )}
                      </div>
                      {record.hadSymptoms ? (
                        <p className="mt-1 text-muted">
                          심각도 {record.severity ?? '-'} · {formatTriggerLabels(record.triggers)}
                        </p>
                      ) : (
                        <p className="mt-1 text-muted">
                          수면 {formatSleepLabel(record)} · {formatConditionSummary(record)}
                        </p>
                      )}
                      {record.memo && (
                        <p className="mt-2 line-clamp-2 text-xs text-muted">{record.memo}</p>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(record.id)}
                      className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </button>
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
