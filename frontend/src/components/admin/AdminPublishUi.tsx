'use client';

import { cn } from '@/lib/cn';
import type { AdminModerationStatus } from '@/lib/api/admin';

export type AdminSectionMode = 'list' | 'create';

type AdminSectionModeTabsProps = {
  mode: AdminSectionMode;
  onChange: (mode: AdminSectionMode) => void;
  listLabel?: string;
  createLabel?: string;
};

export function AdminSectionModeTabs({
  mode,
  onChange,
  listLabel = '목록 관리',
  createLabel = '새로 올리기',
}: AdminSectionModeTabsProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5 rounded-[16px] bg-[#E5D9C7] p-1">
      {(
        [
          { id: 'list' as const, label: listLabel },
          { id: 'create' as const, label: createLabel },
        ] as const
      ).map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onChange(item.id)}
          className={cn(
            'min-h-10 rounded-[12px] px-2 py-2 text-[12px] font-bold transition-colors',
            mode === item.id ? 'bg-white text-[#1E2621] shadow-sm' : 'text-[#81786A]',
          )}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

type AdminListToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: () => void;
  statusFilter: AdminModerationStatus | '';
  onStatusFilterChange: (value: AdminModerationStatus | '') => void;
  searchPlaceholder?: string;
  categoryFilter?: string;
  onCategoryFilterChange?: (value: string) => void;
  categoryOptions?: string[];
};

export function AdminListToolbar({
  searchValue,
  onSearchChange,
  onSearchSubmit,
  statusFilter,
  onStatusFilterChange,
  searchPlaceholder = '제목 검색',
  categoryFilter,
  onCategoryFilterChange,
  categoryOptions,
}: AdminListToolbarProps) {
  return (
    <div className="sticky top-2 z-10 rounded-[18px] border border-[#E7DFD2] bg-[#FBF7EF]/95 p-3 shadow-[0_14px_30px_-26px_rgba(20,31,26,.28)] backdrop-blur">
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          onSearchSubmit();
        }}
      >
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="min-w-0 flex-1 rounded-[13px] border border-[#E4D8C8] bg-white px-3 py-2.5 text-[13px] outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="shrink-0 rounded-[13px] border border-[#E4D8C8] bg-white px-3 py-2.5 text-[12px] font-bold text-[#1E2621] hover:bg-[#F6F1E8]"
        >
          검색
        </button>
      </form>
      <div className="mt-3 grid gap-3">
        <AdminChipGroup
          label="노출 상태"
          value={statusFilter === '' ? 'ALL' : statusFilter}
          options={[
            { value: 'ALL', label: '전체' },
            { value: 'ACTIVE', label: '노출 중' },
            { value: 'HIDDEN', label: '숨김' },
          ]}
          onChange={(value) =>
            onStatusFilterChange(value === 'ALL' ? '' : (value as AdminModerationStatus))
          }
        />
        {categoryOptions && onCategoryFilterChange && (
          <AdminChipGroup
            label="카테고리"
            value={categoryFilter || 'ALL'}
            options={[
              { value: 'ALL', label: '전체' },
              ...categoryOptions.map((cat) => ({ value: cat, label: cat })),
            ]}
            onChange={(value) => onCategoryFilterChange(value === 'ALL' ? '' : value)}
          />
        )}
      </div>
    </div>
  );
}

type AdminListSummaryProps = {
  totalElements: number;
  page: number;
  totalPages: number;
  currentCount: number;
  label: string;
};

export function AdminListSummary({
  totalElements,
  page,
  totalPages,
  currentCount,
  label,
}: AdminListSummaryProps) {
  const safeTotalPages = Math.max(totalPages, 1);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] border border-[#E7DFD2] bg-white/75 px-3 py-2 text-[11.5px] text-[#6F766F]">
      <span>
        전체 <strong className="font-extrabold text-[#1E2621]">{totalElements.toLocaleString('ko-KR')}</strong>
        개 {label}
      </span>
      <span>
        현재 <strong className="font-extrabold text-[#1E2621]">{currentCount.toLocaleString('ko-KR')}</strong>
        개 · {page + 1}/{safeTotalPages}페이지
      </span>
    </div>
  );
}

type AdminPublishHeaderProps = {
  title: string;
  description: string;
  note?: string;
};

export function AdminPublishHeader({ title, description, note }: AdminPublishHeaderProps) {
  return (
    <div className="rounded-[18px] border border-[#DDE4D9] bg-[#F7F5ED] px-4 py-3.5">
      <h2 className="text-[16px] font-extrabold text-[#1E2621]">{title}</h2>
      <p className="mt-1.5 text-[12px] leading-[1.65] text-[#67706A]">{description}</p>
      {note && (
        <p className="mt-2 rounded-[12px] bg-white/80 px-3 py-2 text-[11px] leading-[1.6] text-[#737A75]">
          {note}
        </p>
      )}
    </div>
  );
}

type AdminChipOption<T extends string> = {
  value: T;
  label: string;
};

type AdminChipGroupProps<T extends string> = {
  label: string;
  value: T;
  options: AdminChipOption<T>[];
  onChange: (value: T) => void;
};

export function AdminChipGroup<T extends string>({
  label,
  value,
  options,
  onChange,
}: AdminChipGroupProps<T>) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-bold text-[#26322E]">{label}</p>
      <div className="hf-chip-rail gap-1.5 pb-1 pr-6">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'shrink-0 whitespace-nowrap rounded-full border px-3 py-1.5 text-[11.5px] font-semibold transition-colors',
              value === option.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-[#E4D8C8] bg-white text-[#737A75] hover:border-primary/30',
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

type AdminManageRowProps = {
  title: string;
  meta: string;
  statusLabel: string;
  statusVariant?: 'default' | 'muted';
  onEdit: () => void;
  onToggleVisibility: () => void;
  onDelete?: () => void;
  isVisible: boolean;
  isSubmitting?: boolean;
  preview?: React.ReactNode;
  sortOrder?: number;
  isPinned?: boolean;
  isFeatured?: boolean;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onSetSortOrder?: (sortOrder: number) => void;
  onTogglePin?: () => void;
  onToggleFeatured?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
  highlight?: boolean;
  className?: string;
};

export function AdminManageRow({
  title,
  meta,
  statusLabel,
  statusVariant = 'default',
  onEdit,
  onToggleVisibility,
  onDelete,
  isVisible,
  isSubmitting,
  preview,
  sortOrder,
  isPinned,
  isFeatured,
  onMoveUp,
  onMoveDown,
  onSetSortOrder,
  onTogglePin,
  onToggleFeatured,
  canMoveUp,
  canMoveDown,
  highlight,
  className,
}: AdminManageRowProps) {
  const showCuration =
    sortOrder !== undefined ||
    onMoveUp !== undefined ||
    onSetSortOrder !== undefined ||
    onTogglePin !== undefined ||
    onToggleFeatured !== undefined;

  const commitSortOrder = (value: string) => {
    if (!onSetSortOrder || sortOrder === undefined) return;
    const next = Number(value);
    if (!Number.isFinite(next) || next < 0) return;
    const normalized = Math.round(next);
    if (normalized === sortOrder) return;
    onSetSortOrder(normalized);
  };

  return (
    <div
      className={cn(
        'h-full rounded-[16px] border border-[#E7DFD2] bg-[#FFFCF7] p-3 shadow-[0_10px_22px_-24px_rgba(20,31,26,.35)]',
        preview ? 'grid grid-cols-[88px_minmax(0,1fr)] gap-3' : 'block',
        highlight
          ? 'border-[#D8C69E] bg-[#FFF9EE] shadow-[0_18px_36px_-28px_rgba(7,37,31,.45)]'
          : undefined,
        className,
      )}
    >
      {preview ? (
        <div
          className={cn(
            'overflow-hidden rounded-[11px] bg-[#E9DFD1]',
            'h-[74px] w-[88px]',
          )}
        >
          {preview}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          {highlight && (
            <span className="rounded-full bg-[#0B3B36] px-2 py-0.5 text-[10px] font-bold text-white">
              최신
            </span>
          )}
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-[10px] font-medium',
              statusVariant === 'default'
                ? 'bg-primary/10 text-primary'
                : 'bg-cream-dark text-muted',
            )}
          >
            {statusLabel}
          </span>
          {isPinned && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">
              고정
            </span>
          )}
          {isFeatured && (
            <span className="rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-800">
              추천
            </span>
          )}
          {sortOrder !== undefined && (
            <span className="text-[10px] text-muted">순서 {sortOrder}</span>
          )}
          <span className="min-w-0 truncate text-[10.5px] text-muted">{meta}</span>
        </div>
        <p
          className={cn(
            'mt-1 line-clamp-2 font-semibold leading-[1.45] text-cream-foreground',
            'text-[13.5px]',
          )}
        >
          {title}
        </p>
        {showCuration && (
          <details className="mt-2 rounded-[12px] border border-[#E9DFD1] bg-[#F8F1E6] p-2">
            <summary className="cursor-pointer list-none text-[11px] font-bold text-[#4F574F] marker:hidden">
              정렬·고정 설정
            </summary>
            <div className="mt-2">
            {sortOrder !== undefined && onSetSortOrder && (
              <label className="mb-1.5 flex items-center justify-between gap-2 rounded-lg border border-[#E2D8C8] bg-white px-2 py-1 text-[10px] font-semibold text-[#4F574F]">
                순서
                <input
                  type="number"
                  min={0}
                  defaultValue={sortOrder}
                  disabled={isSubmitting}
                  onBlur={(event) => commitSortOrder(event.currentTarget.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') event.currentTarget.blur();
                  }}
                  className="w-12 bg-transparent text-[11px] font-bold text-[#1E2621] outline-none disabled:opacity-60"
                />
              </label>
            )}
            <div className="grid grid-cols-2 gap-1.5">
              {onMoveUp && (
                <button
                  type="button"
                  disabled={isSubmitting || canMoveUp === false}
                  onClick={onMoveUp}
                  className="rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-semibold text-cream-foreground hover:bg-cream-dark disabled:opacity-40"
                >
                  위로
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  disabled={isSubmitting || canMoveDown === false}
                  onClick={onMoveDown}
                  className="rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-semibold text-cream-foreground hover:bg-cream-dark disabled:opacity-40"
                >
                  아래로
                </button>
              )}
            </div>
            {onTogglePin && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onTogglePin}
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-semibold text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
              >
                {isPinned ? '고정 해제' : '상단 고정'}
              </button>
            )}
            {onToggleFeatured && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onToggleFeatured}
                className="mt-1.5 w-full rounded-lg border border-border bg-white px-2 py-1.5 text-[10px] font-semibold text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
              >
                {isFeatured ? '추천 해제' : '추천 등록'}
              </button>
            )}
            </div>
          </details>
        )}
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[11px] font-semibold text-cream-foreground hover:bg-cream-dark"
          >
            수정
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onToggleVisibility}
            className="rounded-lg border border-border bg-white px-2 py-1.5 text-[11px] font-semibold text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
          >
            {isVisible ? '숨기기' : '다시 노출'}
          </button>
          {onDelete && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onDelete}
              className="rounded-lg border border-red-200 bg-white px-2 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
