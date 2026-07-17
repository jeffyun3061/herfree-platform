'use client';

import Link from 'next/link';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const consultFaqs = [
  {
    question: '어떤 주제든 괜찮나요?',
    answer: '연애고지, 재발 불안, 확진 초기 등 어떤 이야기도 괜찮아요. 의학적 진단·처방은 다루지 않아요.',
  },
  {
    question: '신청하면 바로 시작되나요?',
    answer: '신청 순서대로 채팅방이 열려요. 보통 1~2일 안에 연결돼요.',
  },
] as const;

const consultInfo = [
  ['상담 방식', '카카오톡 오픈채팅'],
  ['소요 시간', '30분'],
  ['비용', '무료'],
] as const;

export function ConsultIntroPage() {
  return (
    <main className="min-h-full bg-white pb-8">
      <header
        className="flex items-center gap-2.5 border-b border-[#EFE9DD] px-[18px] pb-3.5"
        style={{ paddingTop: 'var(--hf-page-pt)' }}
      >
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="text-[22px] leading-none text-[#5C645A]"
        >
          ‹
        </Link>
        <h1 className="text-[15px] font-bold text-[#1E2621]">1:1 비밀 상담</h1>
      </header>

      <section className="relative overflow-hidden bg-[#04342C] px-6 py-[30px] text-white">
        <div
          className="pointer-events-none absolute right-[-30px] top-[-30px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(240,199,120,.16)_0%,rgba(240,199,120,0)_70%)]"
          aria-hidden
        />
        <h2 className="hf-display relative z-10 mb-3 text-[20px] font-semibold leading-[1.5] text-white">
          말 꺼내기 어려운 이야기,
          <br />
          1:1로 편하게.
        </h2>
        <p className="relative z-10 text-[12.5px] leading-[1.7] text-white/78">
          13년 경험과 2급 심리상담 자격을 바탕으로, 1:1로 깊은 이야기를 나눕니다.
        </p>
      </section>

      <section className="mx-5 mt-[18px] flex items-start gap-2.5 rounded-xl bg-[#E3F1EA] px-4 py-3.5">
        <span className="shrink-0 text-[15px]" aria-hidden>
          🔒
        </span>
        <p className="text-[12px] leading-[1.6] text-[#04342C]">
          커뮤니티와 분리된 100% 비공개 상담이에요. 닉네임·IP 정책과 무관하게 운영됩니다.
        </p>
      </section>

      <section className="mx-5 mt-[18px] rounded-2xl border border-[#ECE5D8] px-[18px] py-1.5">
        {consultInfo.map(([label, value]) => (
          <div
            key={label}
            className="flex justify-between border-t border-[#F2ECE1] py-[11px] text-[13px] first:border-t-0"
          >
            <span className="text-[#9A9F94]">{label}</span>
            <span className="font-semibold text-[#1E2621]">{value}</span>
          </div>
        ))}
      </section>

      <section className="mx-5 mt-5 flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#E3F1EA] text-[20px]">
          🌿
        </div>
        <div>
          <h2 className="text-[13.5px] font-bold text-[#1E2621]">헤르프리 상담사</h2>
          <p className="mt-0.5 text-[12px] text-[#9A9F94]">13년 경험 · 2급 심리상담 자격</p>
        </div>
      </section>

      <section className="mx-5 mt-6">
        <p className="mb-1.5 text-[12px] font-semibold text-[#9A9F94]">자주 묻는 질문</p>
        <div>
          {consultFaqs.map((faq) => (
            <article key={faq.question} className="border-t border-[#EFE9DD] py-[13px] first:border-t-0">
              <h3 className="mb-[5px] text-[13px] font-semibold text-[#1E2621]">{faq.question}</h3>
              <p className="text-[12px] leading-[1.65] text-[#5C645A]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pb-0 pt-6">
        <a
          href={KAKAO_CONSULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[48px] w-full items-center justify-center rounded-[14px] bg-[#0B3B36] px-4 py-[15px] text-center text-[14.5px] font-bold text-white"
        >
          카카오톡 상담 신청
        </a>
      </section>
    </main>
  );
}
