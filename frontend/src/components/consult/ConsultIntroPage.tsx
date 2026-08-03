'use client';

import Link from 'next/link';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const consultFaqs = [
  {
    question: '어떤 내용을 문의할 수 있나요?',
    answer: '회원가입·게시글·개인일지 등 서비스 이용과 운영에 관한 내용을 남겨 주세요. 의료 진단·처방·치료 상담은 제공하지 않습니다.',
  },
  {
    question: '답변은 어떻게 받나요?',
    answer: '문의 순서대로 권한이 있는 운영자가 확인합니다. 답변 시간은 운영 상황에 따라 달라질 수 있습니다.',
  },
] as const;

const consultInfo = [
  ['문의 방식', '카카오톡 문의'],
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
        <h1 className="text-[15px] font-bold text-[#1E2621]">상담문의</h1>
      </header>

      <section className="relative overflow-hidden bg-[#04342C] px-6 py-[30px] text-white">
        <div
          className="pointer-events-none absolute right-[-30px] top-[-30px] h-[140px] w-[140px] rounded-full bg-[radial-gradient(circle,rgba(240,199,120,.16)_0%,rgba(240,199,120,0)_70%)]"
          aria-hidden
        />
        <h2 className="hf-display relative z-10 mb-3 text-[20px] font-semibold leading-[1.5] text-white">
          서비스 이용 중 궁금한 점,
          <br />
          편하게 남겨 주세요.
        </h2>
        <p className="relative z-10 text-[12.5px] leading-[1.7] text-white/78">
          서비스 이용·운영 관련 문의를 남기면 권한이 있는 운영자가 확인합니다.
          의료 진단·처방·치료 상담은 제공하지 않습니다.
        </p>
      </section>

      <section className="mx-5 mt-[18px] flex items-start gap-2.5 rounded-xl bg-[#E3F1EA] px-4 py-3.5">
        <span className="shrink-0 text-[15px]" aria-hidden>
          🔒
        </span>
        <p className="text-[12px] leading-[1.6] text-[#04342C]">
          작성 내용은 커뮤니티와 분리되어 권한이 있는 운영자만 확인합니다. 개인정보 처리방침에 따라 보관·삭제됩니다.
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
          <h2 className="text-[13.5px] font-bold text-[#1E2621]">운영 문의 담당자</h2>
          <p className="mt-0.5 text-[12px] text-[#9A9F94]">서비스 이용 안내 및 운영 문의</p>
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
          카카오톡으로 문의하기
        </a>
        <p className="mt-2 text-[11px] leading-[1.6] text-[#9A9F94]">
          카카오톡으로 이동하면 카카오의 서비스 약관·개인정보 처리방침이 적용될 수 있습니다. 민감한 건강정보는 꼭 필요한 범위에서만 작성해 주세요.
        </p>
      </section>
    </main>
  );
}
