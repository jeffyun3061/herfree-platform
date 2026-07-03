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
    <section className="overflow-hidden rounded-[24px] border border-[#E6DDD0] bg-[#F3EDE3] shadow-[0_12px_28px_-24px_rgba(7,37,31,.35)]">
      <div className="border-b border-[#E6DDD0]/80 bg-[#07251F] px-5 py-4">
        <h3 className="text-[14px] font-bold text-white">{title}</h3>
        <p className="mt-1 text-[11.5px] leading-relaxed text-white/68">
          {sufficientData
            ? '최근 6개월·재발 기록 10건 이상일 때, 회원 전체 익명 집계로 보여 드립니다.'
            : (insightMessage ?? '회원들의 재발 기록이 더 쌓이면 패턴을 보여 드립니다.')}
        </p>
      </div>
      <ul className="space-y-2 px-4 py-4">
        {lines.map((line) => (
          <li
            key={line}
            className={cn(
              'rounded-[14px] px-4 py-3 text-[13px] leading-relaxed',
              sufficientData
                ? 'bg-white font-medium text-[#1E2621] shadow-[0_1px_0_rgba(7,37,31,.04)]'
                : 'bg-white/70 text-[#5C645A]',
            )}
          >
            {line}
          </li>
        ))}
      </ul>
    </section>
  );
}
