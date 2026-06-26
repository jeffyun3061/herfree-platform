'use client';

import Link from 'next/link';
import { ButtonLink } from '@/components/ui/Button';
import { PRIVATE_BOARD_META } from '@/domain/board/privateBoard';
import { KAKAO_CONSULT_URL } from '@/domain/consult/constants';

const steps = [
  {
    title: '상담 내용을 남겨요',
    description: '증상, 고민, 서비스 이용 문의를 부담 없이 정리해 남길 수 있어요.',
  },
  {
    title: '운영진만 확인해요',
    description: '글 제목은 목록에서 가려지고, 작성자와 운영진만 내용을 볼 수 있어요.',
  },
  {
    title: '답변을 다시 확인해요',
    description: '내가 남긴 상담 글은 마이페이지와 상담 게시판에서 이어서 확인할 수 있어요.',
  },
];

export function ConsultIntroPage() {
  const meta = PRIVATE_BOARD_META.PRIVATE_CONSULT;

  return (
    <main className="min-h-screen bg-wrtn-bg pb-24">
      <section className="consult-hero text-white">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/60">
          Private care
        </p>
        <h1 className="mt-3 text-[1.8rem] font-bold leading-tight">
          1:1 비밀 상담
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-6 text-white/72">
          혼자 판단하기 어려운 탈모 고민이나 Herfree 이용 문의를 안전하게 남겨 주세요.
          공개 커뮤니티와 분리된 비공개 흐름으로 관리됩니다.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <ButtonLink href={meta.writePath} size="lg" className="bg-[#FFD566] text-[#0B3B36] hover:bg-[#FFE08A]">
            상담 글쓰기
          </ButtonLink>
          <a
            href={KAKAO_CONSULT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/20 px-5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            카카오 상담
          </a>
        </div>
      </section>

      <section className="page-container space-y-5">
        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, index) => (
            <article key={step.title} className="rounded-[14px] border border-[#DDE3E1] bg-white p-4 shadow-sm">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#E8F4F2] text-sm font-bold text-[#0B3B36]">
                {index + 1}
              </span>
              <h2 className="mt-3 text-sm font-semibold text-[#15201D]">{step.title}</h2>
              <p className="mt-1.5 text-xs leading-5 text-[#5B6864]">{step.description}</p>
            </article>
          ))}
        </div>

        <div className="rounded-[14px] border border-[#DDE3E1] bg-white p-4">
          <h2 className="text-sm font-semibold text-[#15201D]">상담 전 확인해 주세요</h2>
          <p className="mt-2 text-xs leading-5 text-[#5B6864]">
            Herfree 상담은 의료 진단이나 처방을 대신하지 않습니다. 갑작스러운 통증, 염증, 심한 탈모 등
            긴급한 증상이 있다면 의료기관 진료를 우선해 주세요.
          </p>
          <Link href="/mypage" className="mt-4 inline-flex text-xs font-semibold text-[#0B3B36]">
            내 상담과 활동 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
