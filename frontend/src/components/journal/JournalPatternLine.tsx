'use client';

type JournalPatternLineProps = {
  line: string | null | undefined;
  isLoading?: boolean;
};

export function JournalPatternLine({ line, isLoading }: JournalPatternLineProps) {
  if (isLoading) {
    return (
      <section className="animate-pulse rounded-2xl border border-border/70 bg-white p-4 shadow-sm">
        <div className="h-4 w-full rounded bg-canvas" />
      </section>
    );
  }

  if (!line) return null;

  return (
    <section className="rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 shadow-sm">
      <p className="text-xs font-medium text-primary">나의 패턴</p>
      <p className="mt-1 text-sm leading-relaxed text-ink">{line}</p>
    </section>
  );
}
