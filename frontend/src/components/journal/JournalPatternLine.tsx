'use client';

type JournalPatternLineProps = {
  line: string | null | undefined;
  isLoading?: boolean;
};

export function JournalPatternLine({ line, isLoading }: JournalPatternLineProps) {
  if (isLoading) {
    return (
      <section className="animate-pulse overflow-hidden rounded-[24px] bg-[#E8DFD2]" aria-hidden>
        <div className="h-12 bg-[#D8CDB9]" />
        <div className="space-y-3 p-5">
          <div className="h-4 w-24 rounded bg-[#D8CDB9]" />
          <div className="h-12 rounded-xl bg-[#D8CDB9]" />
        </div>
      </section>
    );
  }

  if (!line) return null;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[#E6DDD0] bg-white shadow-[0_12px_28px_-24px_rgba(7,37,31,.28)]">
      <div className="border-b border-[#ECE5D8] bg-[#F8F4EC] px-5 py-3.5">
        <h3 className="text-[14px] font-bold text-[#1E2621]">패턴 한줄</h3>
        <p className="mt-0.5 text-[11.5px] leading-relaxed text-[#5C645A]">
          본인 최근 재발 기록(최대 5건)에서 가장 자주 남긴 트리거를 요약합니다.
        </p>
      </div>
      <p className="px-5 py-4 text-[13.5px] font-medium leading-relaxed text-[#1E2621]">{line}</p>
    </section>
  );
}
