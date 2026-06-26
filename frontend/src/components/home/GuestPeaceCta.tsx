'use client';

import Link from 'next/link';

export function GuestPeaceCta() {
  return (
    <section className="mx-[18px] mt-[26px] rounded-[20px] border border-[#DCE6DC] bg-[#EDF2EC] px-[22px] py-[22px]">
      <h2 className="hf-display text-[17px] font-bold leading-[1.5] text-[#1E2621]">
        막막하게 느껴지나요?
      </h2>
      <p className="mt-2 text-[13px] leading-[1.75] text-[#54614F]">
        관리의 시작은 기록부터.
        <br />
        오늘부터 개인 일지를 작성해보세요.
      </p>
      <Link
        href="/signup?from=/journal"
        className="mt-[18px] flex min-h-[46px] items-center justify-center rounded-[12px] bg-[#0B3B36] text-[14px] font-bold text-white"
      >
        오늘부터 시작하기
      </Link>
      <Link
        href="/community"
        className="mt-[13px] block text-center text-[12.5px] text-[#54614F]"
      >
        먼저 둘러볼게요
      </Link>
    </section>
  );
}
