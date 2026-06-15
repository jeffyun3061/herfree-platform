import { cn } from '@/lib/cn';

type JournalInsightLinesProps = {
  lines: string[];
  title?: string;
  sufficientData?: boolean;
  insightMessage?: string;
};

export function JournalInsightLines({
  lines,
  title = '익명 통계 한 줄 요약',
  sufficientData = true,
  insightMessage,
}: JournalInsightLinesProps) {
  if (lines.length === 0) return null;

  return (
    <section className="rounded-2xl border border-border/70 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-muted">
        {sufficientData
          ? '개인을 특정할 수 없는 익명 집계입니다.'
          : (insightMessage ?? '회원들의 재발 기록이 더 쌓이면 패턴을 보여 드립니다.')}
      </p>
      <ul className="mt-4 space-y-2">
        {lines.map((line) => (
          <li
            key={line}
            className={cn(
              'rounded-xl px-3 py-2.5 text-sm leading-relaxed',
              sufficientData ? 'bg-canvas text-ink-soft' : 'bg-canvas/80 text-muted',
            )}
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
