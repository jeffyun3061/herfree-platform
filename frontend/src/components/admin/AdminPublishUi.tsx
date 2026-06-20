'use client';

import { cn } from '@/lib/cn';

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
}: AdminManageRowProps) {
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
          <span className="text-[10px] text-muted">{meta}</span>
        </div>
        <p className="mt-1 line-clamp-2 text-[13px] font-medium text-cream-foreground">{title}</p>
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
