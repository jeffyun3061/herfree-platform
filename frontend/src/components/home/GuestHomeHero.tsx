'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';

export function GuestHomeHero() {
  return (
    <section className="relative h-[430px] overflow-hidden">
      <PublicStaticImage
        src={PUBLIC_IMAGES.homeHero}
        alt=""
        fill
        priority
        sizes="390px"
        className="object-cover object-[50%_44%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.68)_0%,rgba(7,37,31,.26)_34%,rgba(7,37,31,.12)_58%,rgba(243,237,227,.82)_90%,#F3EDE3_100%)]"
        aria-hidden
      />

      <div className="absolute left-0 right-0 top-[44px] flex items-center justify-between px-[22px]">
        <Link href="/" className="flex items-center gap-2" aria-label="herfree 홈">
          <span className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-white/92 text-[14px] font-extrabold text-[#0B3B36] shadow-[0_8px_18px_-12px_rgba(7,37,31,.8)]">
            h.
          </span>
          <span className="text-[13px] font-extrabold text-white drop-shadow-[0_1px_7px_rgba(7,37,31,.55)]">
            herfree
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/community?focus=search"
            aria-label="검색"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white drop-shadow-[0_1px_5px_rgba(7,37,31,.55)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.3"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </Link>
          <Link
            href="/login"
            className="text-[13px] font-extrabold text-white drop-shadow-[0_1px_5px_rgba(7,37,31,.55)]"
          >
            로그인
          </Link>
        </div>
      </div>

      <div className="absolute bottom-[96px] left-0 right-0 px-[26px]">
        <p className="mb-3 inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-bold text-white/88 backdrop-blur">
          안전한 익명 공간
        </p>
        <h1 className="hf-display text-[32px] font-extrabold leading-[1.35] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.42)]">
          편하게
          <br />
          들어오세요
        </h1>
        <p className="mt-3 max-w-[300px] text-[13.5px] font-semibold leading-[1.65] text-white/92">
          우리들의 이야기가 모이는 공간입니다.
        </p>
      </div>
    </section>
  );
}
