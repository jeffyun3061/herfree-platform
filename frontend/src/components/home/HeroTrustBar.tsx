const TRUST_ITEMS = [
  {
    label: '프라이빗 커뮤니티',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="12" cy="8" r="3" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    ),
  },
  {
    label: '칼럼',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 3l7 4v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V7l7-4Z" strokeLinejoin="round" />
        <path d="M12 9v4M12 17h.01" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: '건강한 라이프 케어',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] lg:h-5 lg:w-5" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path d="M12 20V10" strokeLinecap="round" />
        <path d="M8 14c0-2 1.5-3.5 4-5 2.5 1.5 4 3 4 5" />
        <path d="M12 6c-1 0-2 .5-2 1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function HeroTrustBar() {
  return (
    <div className="hero-trust-bar">
      {TRUST_ITEMS.map((item) => (
        <div key={item.label} className="hero-trust-item">
          <span className="hero-trust-icon">{item.icon}</span>
          <span className="mt-2 text-[9px] font-medium leading-tight text-primary lg:text-sm">
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
