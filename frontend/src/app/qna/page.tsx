import Link from 'next/link';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { InlineTopActions } from '@/components/layout/InlineTopActions';

type QnaPageProps = {
  searchParams?: {
    faq?: string;
  };
};

export default function QnaPage({ searchParams }: QnaPageProps) {
  const activeFaq = searchParams?.faq;

  return (
    <div className="page-container content-screen mx-auto max-w-app pb-24 lg:max-w-content lg:pb-12">
      <div className="mb-4 flex items-start justify-between gap-3 lg:hidden">
        <div className="min-w-0">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8B9590]">FAQ</p>
          <h1 className="hf-display m-0 mt-2 text-[25px] font-extrabold leading-tight text-[#15201D]">
            자주 묻는 질문
          </h1>
          <p className="mt-1 text-[12.5px] text-[#8B9590]">
            헤르페스와 관련해 많이 물어보신 것들을 먼저 모아봤어요.
          </p>
        </div>
        <InlineTopActions />
      </div>

      <div className="mb-6 hidden lg:block">
        <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#8B9590]">FAQ</p>
        <h1 className="section-heading mt-2">자주 묻는 질문</h1>
        <p className="mt-2 text-sm text-muted">
          헤르페스와 관련해 많이 물어보신 것들을 먼저 모아봤어요.
        </p>
      </div>

      <section className="flex flex-col gap-[22px]">
        {FAQ_GROUPS.map((group, groupIndex) => (
          <section key={group.category}>
            <h2 className="px-0.5 pb-2.5 text-[12.5px] font-bold tracking-[0.01em] text-[#15695E]">
              {group.category}
            </h2>
            <div className="overflow-hidden rounded-[20px] border border-[#E7DFD2] bg-[#FFFCF7] shadow-[0_14px_30px_-26px_rgba(20,30,25,.26)]">
              {group.items.map((item, itemIndex) => {
                const faqKey = `${groupIndex}-${itemIndex}`;

                return (
                <details
                  key={item.question}
                  id={`faq-${faqKey}`}
                  open={activeFaq === faqKey}
                  className="scroll-mt-24 group border-t border-[#F2ECE1] first:border-t-0"
                >
                  <summary className="flex cursor-pointer list-none items-start gap-2.5 px-4 py-[15px]">
                    <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#C9A24B]">
                      Q
                    </span>
                    <span className="flex-1 text-[13.5px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#1E2621]">
                      {item.question}
                    </span>
                    <span className="mt-0.5 shrink-0 text-[13px] text-[#B4B2A6] transition-transform group-open:rotate-180">
                      ˅
                    </span>
                  </summary>
                  <div className="flex items-start gap-2.5 bg-white/45 px-4 pb-4 pt-1">
                    <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#15695E]">
                      A
                    </span>
                    <p className="flex-1 text-[12.5px] leading-[1.75] text-[#5C645A]">{item.answer}</p>
                  </div>
                </details>
                );
              })}
            </div>
          </section>
        ))}
      </section>

      <Link
        href="/consult"
        className="mt-6 flex rounded-[20px] bg-[#0B3B36] p-[16px_18px] leading-normal shadow-[0_14px_30px_-18px_rgba(11,59,54,.6)]"
      >
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold text-white">원하는 답을 못 찾으셨나요?</span>
          <span className="mt-[3px] block text-[12px] text-white/70">
            1:1 비밀상담으로 편하게 물어보세요.
          </span>
        </span>
        <span className="shrink-0 text-[20px] text-[#F0C778]">›</span>
      </Link>
    </div>
  );
}
