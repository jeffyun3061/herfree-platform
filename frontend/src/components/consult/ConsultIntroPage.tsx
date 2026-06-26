'use client';

import Link from 'next/link';
import { BrandMark } from '@/components/brand/BrandMark';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const steps = [
  {
    title: '고민 정리',
    description: '증상, 생활 패턴, 궁금한 점을 공개 커뮤니티와 분리된 흐름에서 차분히 정리해요.',
  },
  {
    title: '비공개 연결',
    description: '상담 버튼을 누르면 Herfree 카카오톡 오픈 상담방으로 바로 이동해요.',
  },
  {
    title: '기록 유지',
    description: '상담 전 개인일지와 내 활동을 함께 확인하면 더 정확하게 상황을 설명할 수 있어요.',
  },
];

const faqs = [
  {
    question: '어떤 내용을 상담할 수 있나요?',
    answer:
      '헤르페스 고민, 생활 관리, 기록 방법, 커뮤니티 이용, 정보 탐색처럼 혼자 정리하기 어려운 내용을 편하게 물어볼 수 있어요.',
  },
  {
    question: '상담 내용이 공개되나요?',
    answer:
      '카카오톡 상담은 공개 게시판과 분리되어 진행됩니다. 커뮤니티 글처럼 다른 회원에게 노출되는 구조가 아니에요.',
  },
  {
    question: '의료 진단이나 처방도 가능한가요?',
    answer:
      'Herfree 상담은 의료 진단이나 처방을 대신하지 않습니다. 갑작스러운 통증, 염증, 심한 증상이 있으면 의료기관 진료를 우선해 주세요.',
  },
  {
    question: '카카오톡으로 바로 연결되나요?',
    answer:
      '네. 상담 시작 버튼을 누르면 Herfree 오픈카톡 상담방으로 이동합니다. 이동 후 카카오톡에서 대화를 이어가면 됩니다.',
  },
];

export function ConsultIntroPage() {
  return (
    <main className="min-h-screen bg-[#F3EDE3] pb-36">
      <section className="consult-hero min-h-[316px] text-white">
        <div className="flex items-center justify-between">
          <BrandMark size="sm" variant="onDark" />
          <Link
            href="/"
            className="rounded-full bg-white/14 px-3 py-1.5 text-[12px] font-semibold text-white backdrop-blur-md"
          >
            홈
          </Link>
        </div>

        <div className="mt-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-white/65">
            Private care
          </p>
          <h1 className="hf-display mt-2 text-[30px] font-extrabold leading-[1.35] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
            1:1 비밀 상담
          </h1>
          <p className="mt-3 max-w-[315px] text-[13.5px] leading-[1.7] text-white/88">
            혼자 판단하기 어려운 고민을 공개 게시판이 아닌 카카오톡 상담 흐름으로 조용히 이어가세요.
          </p>
        </div>

        <div className="mt-7 grid grid-cols-[1.25fr_.75fr] gap-2.5">
          <a
            href={KAKAO_CONSULT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl bg-[#F0C778] px-4 text-sm font-extrabold text-[#07251F] shadow-[0_12px_26px_-18px_rgba(240,199,120,.9)] transition-colors hover:bg-[#F5D99A]"
          >
            카톡 상담 시작
          </a>
          <Link
            href="#faq"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/22 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            FAQ 보기
          </Link>
        </div>
      </section>

      <section className="space-y-4 px-4 pt-4">
        <div className="grid grid-cols-3 gap-2.5">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-[18px] border border-[#ECE5D8] bg-white p-3 shadow-card">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F6F1E8] text-sm font-bold text-[#0B3B36]">
                {index + 1}
              </span>
              <h2 className="mt-3 text-[13px] font-semibold text-[#1E2621]">{step.title}</h2>
              <p className="mt-1.5 text-[11.5px] leading-5 text-[#5C645A]">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="rounded-[20px] border border-[#ECE5D8] bg-white p-4 shadow-card">
          <h2 className="text-[14px] font-semibold text-[#1E2621]">상담 전 확인해 주세요</h2>
          <p className="mt-2 text-[12.5px] leading-6 text-[#5C645A]">
            Herfree 상담은 의료기관 진료를 대체하지 않습니다. 증상이 심하거나 불안이 커지는 상황이라면 전문의
            상담을 먼저 권장해요.
          </p>
          <Link href="/journal" className="mt-4 inline-flex text-[12px] font-semibold text-[#0B3B36]">
            상담 전 내 기록 정리하기
          </Link>
        </div>
      </section>

      <section id="faq" className="px-4 pt-5">
        <div className="mb-3 flex items-end justify-between px-0.5">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#8B9590]">FAQ</p>
            <h2 className="mt-1 text-[20px] font-extrabold text-[#161C19]">자주 묻는 질문</h2>
          </div>
          <Link href="/qna" className="text-[12px] font-semibold text-[#0B3B36]">
            전체 FAQ
          </Link>
        </div>

        <div className="space-y-2.5">
          {faqs.map((faq) => (
            <article key={faq.question} className="rounded-[18px] border border-[#E8E0D4] bg-[#FFFCF7] p-4">
              <h3 className="flex gap-2 text-[13.5px] font-bold leading-5 text-[#1E2621]">
                <span className="text-[#0B3B36]">Q.</span>
                <span>{faq.question}</span>
              </h3>
              <p className="mt-2 pl-5 text-[12.5px] leading-6 text-[#5C645A]">{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
