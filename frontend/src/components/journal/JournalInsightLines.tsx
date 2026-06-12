type JournalInsightLinesProps = {
  lines: string[];
  title?: string;
};

export function JournalInsightLines({ lines, title = '익명 통계 한 줄 요약' }: JournalInsightLinesProps) {
  if (lines.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted">개인을 특정할 수 없는 익명 집계입니다.</p>
      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li
            key={line}
            className="rounded-xl bg-canvas px-3 py-2.5 text-sm leading-relaxed text-ink-soft"
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
