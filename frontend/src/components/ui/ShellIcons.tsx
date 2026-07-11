import { cn } from '@/lib/cn';

type IconProps = {
  className?: string;
};

const stroke = {
  fill: 'none' as const,
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <circle cx="11" cy="11" r="6.5" {...stroke} />
      <path d="M16.5 16.5 20 20" {...stroke} />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <circle cx="12" cy="8" r="4" {...stroke} />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" {...stroke} />
    </svg>
  );
}

export function MenuIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <line x1="4" y1="7" x2="20" y2="7" {...stroke} />
      <line x1="4" y1="12" x2="20" y2="12" {...stroke} />
      <line x1="4" y1="17" x2="20" y2="17" {...stroke} />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <path d="M6 6l12 12M18 6 6 18" {...stroke} />
    </svg>
  );
}

export function BackChevronIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn('h-5 w-5', className)} aria-hidden>
      <path d="M14.5 6 9 12l5.5 6" {...stroke} />
    </svg>
  );
}
