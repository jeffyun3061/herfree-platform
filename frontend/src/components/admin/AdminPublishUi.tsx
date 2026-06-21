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
    <div className="flex gap-2 rounded-xl bg-cream-dark p-1">
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
            'flex-1 rounded-lg py-2 text-[12px] font-medium transition-colors',
            mode === item.id ? 'bg-white text-cream-foreground shadow-sm' : 'text-muted',
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
    <div className="space-y-3">
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
          className="min-w-0 flex-1 rounded-xl border border-border bg-white px-3 py-2 text-[13px] outline-none focus:border-primary"
        />
        <button
          type="submit"
          className="shrink-0 rounded-xl border border-border px-3 py-2 text-[12px] font-medium text-cream-foreground hover:bg-cream-dark"
        >
          검색
        </button>
      </form>
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
  );
}

type AdminPublishHeaderProps = {
  title: string;
  description: string;
  note?: string;
};

export function AdminPublishHeader({ title, description, note }: AdminPublishHeaderProps) {
  return (
    <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3.5">
      <h2 className="text-[15px] font-semibold text-cream-foreground">{title}</h2>
      <p className="mt-1 text-[12px] leading-relaxed text-muted">{description}</p>
      {note && (
        <p className="mt-2 rounded-lg bg-card/80 px-2.5 py-2 text-[11px] leading-relaxed text-muted">
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
      <p className="mb-2 text-[12px] font-medium text-cream-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={cn(
              'rounded-full border px-3.5 py-1.5 text-[12px] transition-colors',
              value === option.value
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-card text-muted hover:border-primary/30',
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
  onTogglePin?: () => void;
  onToggleFeatured?: () => void;
  canMoveUp?: boolean;
  canMoveDown?: boolean;
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
  onTogglePin,
  onToggleFeatured,
  canMoveUp,
  canMoveDown,
}: AdminManageRowProps) {
  const showCuration =
    sortOrder !== undefined ||
    onMoveUp !== undefined ||
    onTogglePin !== undefined ||
    onToggleFeatured !== undefined;

  return (
    <div className="flex gap-3 rounded-2xl border border-border/80 bg-card p-3">
      {preview}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
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
          <span className="text-[10px] text-muted">{meta}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] font-medium text-cream-foreground">{title}</p>
        {showCuration && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {onMoveUp && (
              <button
                type="button"
                disabled={isSubmitting || canMoveUp === false}
                onClick={onMoveUp}
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] text-cream-foreground hover:bg-cream-dark disabled:opacity-40"
              >
                ▲ 위로
              </button>
            )}
            {onMoveDown && (
              <button
                type="button"
                disabled={isSubmitting || canMoveDown === false}
                onClick={onMoveDown}
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] text-cream-foreground hover:bg-cream-dark disabled:opacity-40"
              >
                ▼ 아래로
              </button>
            )}
            {onTogglePin && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onTogglePin}
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
              >
                {isPinned ? '고정 해제' : '상단 고정'}
              </button>
            )}
            {onToggleFeatured && (
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onToggleFeatured}
                className="rounded-lg border border-border px-2 py-0.5 text-[10px] text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
              >
                {isFeatured ? '추천 해제' : '추천 등록'}
              </button>
            )}
          </div>
        )}
        <div className="mt-2.5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-cream-foreground hover:bg-cream-dark"
          >
            수정
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onToggleVisibility}
            className="rounded-lg border border-border px-2.5 py-1 text-[11px] text-cream-foreground hover:bg-cream-dark disabled:opacity-60"
          >
            {isVisible ? '숨기기' : '다시 노출'}
          </button>
          {onDelete && (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onDelete}
              className="rounded-lg border border-red-200 px-2.5 py-1 text-[11px] text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              삭제
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
