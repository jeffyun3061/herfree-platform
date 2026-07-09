import Link from 'next/link';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { InlineTopActions } from '@/components/layout/InlineTopActions';

type QnaPageProps = {
  searchParams?: {
    faq?: string;
    category?: string;
  };
};

function ChevronMark() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="transition-transform group-open:rotate-180"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

export default function QnaPage({ searchParams }: QnaPageProps) {
  const activeFaq = searchParams?.faq;
  const activeCategory = searchParams?.category;

  return (
    <div className="content-screen mx-auto max-w-app pb-24 lg:max-w-none">
      <div className="flex items-start justify-between gap-3 px-5 pt-7 lg:pt-8">
        <div className="min-w-0">
          <h1 className="hf-display m-0 text-[24px] font-extrabold leading-tight tracking-[-0.01em] text-[#15201D]">
            자주 묻는 질문
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#8B9590]">
            많이 물어보신 것들을 먼저 모아봤어요.
          </p>
        </div>
        <InlineTopActions />
      </div>

      <nav className="mt-[18px] flex gap-2 overflow-x-auto px-5 pb-1 pr-10 scrollbar-hide" aria-label="FAQ 카테고리">
        {FAQ_GROUPS.map((group) => {
          const selected = activeCategory === group.category;
          return (
            <Link
              key={group.category}
              href={`/qna?category=${encodeURIComponent(group.category)}#faq-category-${encodeURIComponent(group.category)}`}
              className={
                selected
                  ? 'community-chip community-chip-active'
                  : 'community-chip community-chip-inactive'
              }
            >
              {group.category}
            </Link>
          );
        })}
      </nav>

      <section className="mt-[18px] flex flex-col gap-[22px] px-5">
        {FAQ_GROUPS.map((group, groupIndex) => (
          <section
            key={group.category}
            id={`faq-category-${group.category}`}
            className="scroll-mt-24"
          >
            <h2 className="px-0.5 pb-2.5 text-[12.5px] font-bold tracking-[0.01em] text-[#15695E]">
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
                    className="scroll-mt-24 group border-t border-[#F2ECE1] first:border-t-0"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-2.5 px-4 py-[15px]">
                      <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#C9A24B]">
                        Q
                      </span>
                      <span className="flex-1 text-[13.5px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#1E2621]">
                        {item.question}
                      </span>
                      <span className="mt-0.5 shrink-0 text-[#B4B2A6]">
                        <ChevronMark />
                      </span>
                    </summary>
                    <div className="flex items-start gap-2.5 px-4 pb-4 pt-1">
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
        className="mx-5 mt-6 flex rounded-[16px] bg-[#0B3B36] px-[19px] py-[17px] leading-normal shadow-[0_14px_30px_-18px_rgba(11,59,54,.6)]"
      >
        <span className="flex-1">
          <span className="block text-[13.5px] font-bold text-white">원하는 답을 못 찾으셨나요?</span>
          <span className="mt-[3px] block text-[12px] text-white/70">
            1:1 비밀상담으로 편하게 물어보세요.
          </span>
        </span>
        <span className="shrink-0 text-[20px] text-[#F0C778]" aria-hidden>
          ›
        </span>
      </Link>
    </div>
  );
}
