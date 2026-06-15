type NavIconName = 'home' | 'community' | 'info' | 'video' | 'mypage' | 'lounge' | 'journal';

type NavIconProps = {
  name: NavIconName;
  className?: string;
};

export function NavIcon({ name, className = 'h-5 w-5' }: NavIconProps) {
  const stroke = 'currentColor';
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
        </svg>
      );
    case 'community':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M7 9h10M7 13h6" />
          <path d="M5 5h14a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9l-4 2v-4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M6 4h9l3 3v13H6V4Z" />
          <path d="M15 4v3h3M9 12h6M9 16h4" />
        </svg>
      );
    case 'video':
    case 'lounge':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m10 9 6 3-6 3V9Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'journal':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </svg>
      );
    case 'mypage':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <circle cx="12" cy="8" r="3.5" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
  }
}
