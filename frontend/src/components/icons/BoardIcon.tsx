import { getBoardIconKey } from '@/domain/board/types';
import { cn } from '@/lib/cn';

type BoardIconProps = {
  boardType: string;
  className?: string;
  variant?: 'default' | 'onPrimary';
};

export function BoardIcon({ boardType, className = 'h-5 w-5', variant = 'default' }: BoardIconProps) {
  const key = getBoardIconKey(boardType);
  const stroke = variant === 'onPrimary' ? 'currentColor' : 'currentColor';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cn(className),
  };

  switch (key) {
    case 'notice':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M12 4v12M8 8h8" />
          <path d="M6 18h12" />
        </svg>
      );
    case 'phobia':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M12 4a6 6 0 0 0-4 10.5V18h8v-3.5A6 6 0 0 0 12 4Z" />
        </svg>
      );
    case 'symptom':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'experience':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M8 12h8M12 8v8" />
          <circle cx="12" cy="12" r="8" />
        </svg>
      );
    case 'relationship':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M12 20s-6-4.5-6-9a4 4 0 0 1 8 0c0 4.5-6 9-6 9Z" />
        </svg>
      );
    case 'support':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M12 3c3 4 6 6 6 9a6 6 0 1 1-12 0c0-3 3-5 6-9Z" />
        </svg>
      );
    case 'expert':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M12 3v4M8 7h8" />
          <path d="M6 11h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-8Z" />
        </svg>
      );
    case 'product':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M8 7h8l1 14H7L8 7Z" />
          <path d="M9 7V5a3 3 0 0 1 6 0v2" />
        </svg>
      );
    case 'free':
    default:
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M7 9h10M7 13h6" />
          <path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 2v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      );
  }
}

export function BoardIconBadge({
  boardType,
  accentClass,
}: {
  boardType: string;
  accentClass: string;
}) {
  return (
    <span
      className={cn(
        'flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl',
        accentClass,
      )}
    >
      <BoardIcon boardType={boardType} className="h-5 w-5" />
    </span>
  );
}
