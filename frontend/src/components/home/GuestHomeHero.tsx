'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';

export function GuestHomeHero() {
  return (
    <section className="relative h-[472px] overflow-hidden">
      <PublicStaticImage
        src={PUBLIC_IMAGES.homeHero}
        alt=""
        fill
        priority
        sizes="390px"
        className="object-cover object-[50%_42%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.55)_0%,rgba(7,37,31,.12)_28%,rgba(243,237,227,0)_55%,rgba(243,237,227,.85)_86%,#F3EDE3_100%)]"
        aria-hidden
      />

      <div className="absolute left-0 right-0 top-[52px] flex items-center justify-between px-[22px] py-1.5">
        <Link href="/" className="flex items-center gap-2" aria-label="herpfree 홈">
          <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full bg-[#0B3B36] text-[14px] font-bold text-white shadow-[0_2px_8px_rgba(0,0,0,.25)]">
            h.
          </span>
          <span className="text-[15px] font-semibold text-white drop-shadow-[0_1px_6px_rgba(7,37,31,.45)]">
            herpfree
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            href="/community?focus=search"
            aria-label="검색"
            className="flex h-8 w-8 items-center justify-center rounded-full text-white/95 drop-shadow-[0_1px_4px_rgba(7,37,31,.4)]"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
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
            className="text-[13.5px] font-medium text-white drop-shadow-[0_1px_4px_rgba(7,37,31,.4)]"
          >
            로그인
          </Link>
        </div>
      </div>

      <div className="absolute bottom-[86px] left-0 right-0 px-[26px]">
        <h1 className="hf-display text-[33px] font-extrabold leading-[1.4] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
          편하게
          <br />
          들어오세요
        </h1>
        <p className="mt-3 max-w-[300px] text-[13.5px] leading-[1.7] text-white/90">
          우리들의 이야기가 모이는 공간입니다.
        </p>
      </div>
    </section>
  );
}
