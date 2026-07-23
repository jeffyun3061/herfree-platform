import { Suspense } from 'react';
import Link from 'next/link';
import { FAQ_GROUPS } from '@/domain/faq/content';
import { QnaDeepLinkSync } from '@/components/faq/QnaDeepLinkSync';
import { ScreenHeader } from '@/components/layout/ScreenHeader';

export default function QnaPage() {
  return (
    <div className="content-screen mx-auto max-w-app hf-scroll-pad-nav lg:max-w-none">
      <Suspense fallback={null}>
        <QnaDeepLinkSync />
      </Suspense>
      <ScreenHeader
        title="자주 묻는 질문"
        subtitle="많이 물어보신 것들을 먼저 모아봤어요"
      />

      <section className="mt-[18px] flex flex-col gap-[22px] hf-page-x">
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

                return (
                  <details
                    key={item.question}
                    id={`faq-${faqKey}`}
                    className="group scroll-mt-24 border-t border-[#F2ECE1] first:border-t-0"
                  >
                    <summary className="flex cursor-pointer list-none items-start gap-[10px] px-4 py-[15px] [&::-webkit-details-marker]:hidden">
                      <span className="hf-display shrink-0 text-[15px] font-extrabold leading-[1.4] text-[#C9A24B]">
                        Q
                      </span>
                      <span className="flex-1 text-[13.5px] font-semibold leading-[1.5] tracking-[-0.01em] text-[#1E2621]">
                        {item.question}
                      </span>
                      <span className="mt-0.5 shrink-0 text-[13px] hf-text-muted group-open:hidden" aria-hidden>
                        ⌄
                      </span>
                      <span className="mt-0.5 hidden shrink-0 text-[13px] hf-text-muted group-open:inline" aria-hidden>
                        ⌃
                      </span>
                    </summary>
                    <div className="flex items-start gap-[10px] px-4 pb-4">
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
        className="mx-5 mt-6 flex items-center gap-3 rounded-[16px] bg-[#0B3B36] px-[19px] py-[17px] leading-normal shadow-[0_14px_30px_-18px_rgba(11,59,54,.6)]"
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
