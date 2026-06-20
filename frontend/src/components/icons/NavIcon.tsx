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
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className,
  };

  switch (name) {
    case 'home':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M4.5 11 12 5l7.5 6V19a1 1 0 0 1-1 1h-4.5v-5.5H10V20H5a1 1 0 0 1-1-1v-8Z" />
        </svg>
      );
    case 'community':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <path d="M20 11.5a7.5 7.5 0 0 1-1 3.2 7.5 7.5 0 0 1-6.7 4.1 7.5 7.5 0 0 1-3.3-.8L4 20l1.7-5a7.5 7.5 0 0 1-1-3.2 7.5 7.5 0 0 1 4.1-6.7 7.5 7.5 0 0 1 3.2-1h.4a7.5 7.5 0 0 1 7.5 7.5v.4Z" />
          <path d="m8.5 12 1.8 1.8L14.5 10" strokeWidth="1.9" />
        </svg>
      );
    case 'info':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="7.5" y="4.5" width="9" height="15" rx="1.5" />
          <path d="M12 4.5v15" />
          <circle cx="12" cy="9" r="0.6" fill="currentColor" stroke="none" />
          <circle cx="12" cy="13" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'video':
      return (
        <svg viewBox="0 0 24 24" aria-hidden {...common}>
          <rect x="4" y="6" width="16" height="12" rx="2" />
          <path d="M4 10h16" />
        </svg>
      );
    case 'lounge':
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
