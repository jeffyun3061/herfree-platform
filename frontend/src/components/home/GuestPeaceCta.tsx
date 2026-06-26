'use client';

import Link from 'next/link';

export function GuestPeaceCta() {
  return (
    <section className="mx-[18px] mt-[26px] overflow-hidden rounded-[22px] bg-[#07251F] px-[22px] py-[22px] text-white shadow-[0_18px_40px_-24px_rgba(7,37,31,.7)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">Day 1</p>
          <h2 className="hf-display mt-2 text-[20px] font-extrabold leading-[1.45] text-white">
            오늘부터
            <br />
            차분히 시작해요
          </h2>
        </div>
        <div className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full bg-white/10 text-[24px] font-extrabold text-[#F0C778]">
          1
        </div>
      </div>

      <p className="mt-3 text-[12.5px] leading-[1.75] text-white/70">
        관리의 시작은 기록부터예요.
        <br />
        증상, 마음, 생활 패턴을 나만의 공간에 남겨보세요.
      </p>

      <Link
        href="/signup?from=/journal"
        className="mt-[18px] flex min-h-[46px] items-center justify-center rounded-[12px] bg-[#F0C778] text-[14px] font-extrabold text-[#07251F]"
      >
        오늘부터 시작하기
      </Link>
      <Link href="/community" className="mt-[13px] block text-center text-[12.5px] text-white/58">
        먼저 둘러볼게요
      </Link>
    </section>
  );
}
