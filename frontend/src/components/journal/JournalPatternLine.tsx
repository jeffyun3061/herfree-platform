'use client';

type JournalPatternLineProps = {
  line: string | null | undefined;
  isLoading?: boolean;
};

function WaveDecoration() {
  return (
    <svg
      viewBox="0 0 200 48"
      className="h-12 w-full text-primary/20"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M0 24 Q25 8 50 24 T100 24 T150 16 T200 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M0 32 Q30 20 60 32 T120 28 T180 36 T200 32"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.5"
      />
    </svg>
  );
}

export function JournalPatternLine({ line, isLoading }: JournalPatternLineProps) {
  if (isLoading) {
    return (
      <section className="animate-pulse rounded-card border border-border/50 bg-white p-5 shadow-card">
        <div className="h-4 w-24 rounded bg-canvas-dark" />
        <div className="mt-4 h-12 rounded bg-canvas-dark" />
        <div className="mt-3 h-16 rounded bg-canvas-dark" />
      </section>
    );
  }

  if (!line) return null;

  return (
    <section className="rounded-card border border-border/50 bg-white p-5 shadow-card">
      <h3 className="text-sm font-semibold text-ink">패턴 인사이트</h3>
      <p className="mt-1 text-xs text-muted">최근 기록에서 읽어낸 나의 흐름</p>

      <div className="my-4 overflow-hidden rounded-xl bg-primary/5 px-2 py-1">
        <WaveDecoration />
      </div>

      <p className="text-sm leading-relaxed text-ink-soft">{line}</p>
    </section>
  );
}
