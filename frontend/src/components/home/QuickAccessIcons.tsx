/** 목업 Quick Access 아이콘 */

const GREEN = '#0f5050';

type IconProps = { className?: string };

export function QuickAccessLockIcon({ className = 'h-[22px] w-[22px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="8" y="12" width="8" height="7.5" rx="1.2" stroke={GREEN} strokeWidth="1.3" />
      <path
        d="M9.75 12V9.25a2.25 2.25 0 0 1 4.5 0V12"
        stroke={GREEN}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function QuickAccessChecklistIcon({ className = 'h-[22px] w-[22px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="7" y="6.5" width="10" height="13.5" rx="1.2" stroke={GREEN} strokeWidth="1.3" />
      <path
        d="M10 6.5V5.5a2 2 0 0 1 4 0v1"
        stroke={GREEN}
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M9.5 11.5h5M9.5 14h5M9.5 16.5h3.5" stroke={GREEN} strokeWidth="1.15" strokeLinecap="round" />
    </svg>
  );
}

export function QuickAccessColumnIcon({ className = 'h-[22px] w-[22px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="5.5" y="10" width="9.5" height="10.5" rx="1.1" stroke={GREEN} strokeWidth="1.3" />
      <rect x="9" y="6.5" width="9.5" height="10.5" rx="1.1" stroke={GREEN} strokeWidth="1.3" />
    </svg>
  );
}

export function QuickAccessVideoIcon({ className = 'h-[22px] w-[22px]' }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <rect x="7" y="7" width="10" height="10" rx="1.6" fill={GREEN} />
      <path d="m10.8 10.5 3.8 2.2-3.8 2.2v-4.4Z" fill="#ffffff" />
    </svg>
  );
}
