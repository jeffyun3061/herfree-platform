'use client';

import Link from 'next/link';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const consultFaqs = [
  {
    question: '어떤 주제로 상담할 수 있나요?',
    answer: '연애 고지, 재발 불안, 진단 초기처럼 혼자 정리하기 어려운 이야기를 편하게 남길 수 있어요.',
  },
  {
    question: '신청하면 바로 시작하나요?',
    answer: '상담 신청 버튼을 누르면 카카오톡 오픈채팅으로 이동합니다. 이동 후 카카오톡에서 대화를 이어가면 됩니다.',
  },
  {
    question: '나중에 유료로 바뀌나요?',
    answer: '현재는 초기 운영 기간으로 무료 상담 흐름을 유지하고 있어요. 정책이 바뀌면 미리 안내드릴게요.',
  },
];

const consultInfo = [
  ['상담 방식', '카카오톡 오픈채팅'],
  ['소요 시간', '30분'],
  ['비용', '무료'],
] as const;

export function ConsultIntroPage() {
  return (
    <main className="min-h-screen bg-white pb-12">
      <header className="flex items-center gap-2.5 border-b border-[#EFE9DD] px-[18px] pb-3.5 pt-14">
        <Link
          href="/"
          aria-label="홈으로 돌아가기"
          className="flex h-7 w-7 items-center justify-center text-[22px] leading-none text-[#5C645A]"
        >
          ‹
        </Link>
        <h1 className="text-[15px] font-bold text-[#1E2621]">1:1 비밀 상담</h1>
      </header>

      <section className="relative overflow-hidden bg-[#04342C] px-6 py-[30px] text-white">
        <div className="absolute right-[-30px] top-[-30px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(240,199,120,.16)_0%,rgba(240,199,120,0)_70%)]" />
        <h2 className="hf-display relative text-[20px] font-semibold leading-[1.5] text-white">
          말 꺼내기 어려운 이야기,
          <br />
          1:1로 편하게.
        </h2>
        <p className="relative mt-3 text-[12.5px] leading-[1.7] text-white/80">
          13년의 경험에서 나온 실전 조언과 2급 심리상담 자격을 바탕으로, 공개하기 어려운 고민을
          조용히 들어드립니다.
        </p>
      </section>

      <section className="mx-5 mt-[18px] flex items-start gap-2.5 rounded-xl bg-[#E3F1EA] px-4 py-3.5">
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0B3B36] text-[11px] font-bold text-white">
          i
        </span>
        <p className="text-[12px] leading-[1.6] text-[#04342C]">
          상담은 커뮤니티와 완전히 분리되어 운영돼요. 닉네임이나 게시글과 무관하게 100% 비공개로
          진행됩니다.
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

      <p className="mx-5 mt-2 text-[10.5px] text-[#C7826B]">* 초기 운영 기간 동안은 무료로 진행돼요.</p>

      <section className="mx-5 mt-5 flex items-center gap-3">
        <div className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-[#E3F1EA] text-[20px] font-bold text-[#0B3B36]">
          h.
        </div>
        <div>
          <h2 className="text-[13.5px] font-bold text-[#1E2621]">헤르프리 상담자</h2>
          <p className="mt-0.5 text-[11.5px] text-[#9A9F94]">13년의 경험 · 2급 심리상담 자격 보유</p>
        </div>
      </section>

      <section className="mx-5 mt-6">
        <p className="mb-1.5 text-[12px] font-semibold text-[#9A9F94]">자주 묻는 질문</p>
        <div>
          {consultFaqs.map((faq) => (
            <article key={faq.question} className="border-t border-[#EFE9DD] py-[13px]">
              <h3 className="mb-1 text-[13px] font-semibold text-[#1E2621]">{faq.question}</h3>
              <p className="text-[12px] leading-[1.65] text-[#5C645A]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="px-5 pt-6">
        <a
          href={KAKAO_CONSULT_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-h-[52px] w-full items-center justify-center rounded-[14px] bg-[#0B3B36] text-[14.5px] font-bold text-white shadow-[0_14px_30px_-18px_rgba(7,37,31,.62)] transition-colors hover:bg-[#0F4F48]"
        >
          상담 신청하기
        </a>
      </section>
    </main>
  );
}
