'use client';

type JournalPatternLineProps = {
  line: string | null | undefined;
  isLoading?: boolean;
};

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
    <section className="rounded-card border border-border/50 bg-white p-4 shadow-card">
      <h3 className="text-[13px] font-semibold text-ink">패턴 한줄</h3>
      <p className="mt-2 text-[12px] leading-relaxed text-ink-soft">{line}</p>
    </section>
  );
}
