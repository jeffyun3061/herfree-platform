const TRUST_ITEMS = [
  {
    title: '익명 보호 커뮤니티',
    description: '민감한 고민을 닉네임 기반으로 안전하게 나눕니다.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3l7 4v5c0 4.2-2.8 7.4-7 9-4.2-1.6-7-4.8-7-9V7l7-4Z" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: '검증된 정보 콘텐츠',
    description: '검사, 재발, 전염, 치료 정보를 쉽게 정리합니다.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M6 4h9l3 3v13H6V4Z" />
        <path d="M15 4v3h3M9 12h6M9 16h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: '건강한 일상 관리',
    description: '증상 기록과 생활 관리로 불안을 줄입니다.',
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export function TrustCards() {
  return (
    <section className="grid gap-3 lg:grid-cols-3 lg:gap-5">
      {TRUST_ITEMS.map((item) => (
        <article key={item.title} className="trust-card">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 text-primary">
            {item.icon}
          </div>
          <h3 className="mt-4 text-base font-semibold text-ink">{item.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted">{item.description}</p>
        </article>
      ))}
    </section>
  );
}
