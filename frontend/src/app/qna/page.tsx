import Link from 'next/link';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { InlineTopActions } from '@/components/layout/InlineTopActions';

type QnaPageProps = {
  searchParams?: {
    faq?: string;
    category?: string;
  };
};

export default function QnaPage({ searchParams }: QnaPageProps) {
  const activeFaq = searchParams?.faq;
  const activeCategory = searchParams?.category;

  return (
    <div className="content-screen mx-auto max-w-app pb-[96px] lg:max-w-none">
      <div className="hf-screen-header lg:pt-[34px]">
        <div className="min-w-0">
          <h1 className="hf-display m-0 text-[24px] font-extrabold leading-tight tracking-[-0.01em] text-[#15201D]">
            자주 묻는 질문
          </h1>
          <p className="mt-[5px] text-[13px] leading-relaxed hf-text-subtle">
            많이 물어보신 것들을 먼저 모아봤어요
          </p>
        </div>
        <InlineTopActions />
      </div>

      <section className="mt-[18px] flex flex-col gap-[22px] px-5">
        {FAQ_GROUPS.map((group, groupIndex) => (
          <section
            key={group.category}
            id={`faq-category-${group.category}`}
            className="scroll-mt-24"
          >
            <h2 className="px-0.5 pb-[10px] text-[12.5px] font-bold tracking-[0.01em] text-[#15695E]">
              {group.category}
            </h2>
            <div className="overflow-hidden rounded-[16px] bg-white shadow-[0_1px_2px_rgba(20,30,25,.04),0_14px_30px_-24px_rgba(20,30,25,.22)]">
              {group.items.map((item, itemIndex) => {
                const faqKey = `${groupIndex}-${itemIndex}`;
                const openByFaq = activeFaq === faqKey;
                const openByCategory = !activeFaq && activeCategory === group.category && itemIndex === 0;

                return (
                  <details
                    key={item.question}
                    id={`faq-${faqKey}`}
                    open={openByFaq || openByCategory}
                    className="group scroll-mt-24 border-t border-[#F2ECE1] first:border-t-0"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-[10px] px-4 py-[15px] [&::-webkit-details-marker]:hidden">
                      <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#C9A24B]">
                        Q
                      </span>
                      <span className="flex-1 text-[13.5px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#15201D]">
                        {item.question}
                      </span>
                      <span className="mt-0.5 shrink-0 text-[13px] text-[#B4B2A6] group-open:hidden" aria-hidden>
                        ⌄
                      </span>
                      <span className="mt-0.5 hidden shrink-0 text-[13px] text-[#B4B2A6] group-open:inline" aria-hidden>
                        ⌃
                      </span>
                    </summary>
                    <div className="flex items-start gap-[10px] px-4 pb-4">
                      <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#15695E]">
                        A
                      </span>
                      <p className="flex-1 text-[12.5px] leading-[1.75] text-[#6E766F]">{item.answer}</p>
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
        className="mx-5 mt-[24px] flex items-center gap-3 rounded-[16px] bg-[#0B3B36] px-[19px] py-[17px] leading-normal shadow-[0_14px_30px_-18px_rgba(11,59,54,.6)]"
      >
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold text-white">원하는 답을 못 찾으셨나요?</span>
          <span className="mt-[3px] block text-[12px] text-white/72">
            1:1 비밀상담으로 편하게 물어보세요
          </span>
        </span>
        <span className="shrink-0 text-[20px] text-[#F0C778]" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  );
}
