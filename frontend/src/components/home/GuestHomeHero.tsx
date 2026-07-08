'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

export function GuestHomeHero() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <section className="relative h-[330px] overflow-hidden">
      <PublicStaticImage
        src={PUBLIC_IMAGES.homeHero}
        alt=""
        fill
        priority
        sizes="430px"
        className="object-cover object-[50%_38%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.5)_0%,rgba(7,37,31,.14)_30%,rgba(7,37,31,.32)_66%,rgba(7,37,31,.5)_86%,rgba(243,237,227,.55)_97%,#F3EDE3_100%)]"
        aria-hidden
      />

      <div className="absolute left-4 top-[44px]">
        <Link href="/" className="flex min-w-0 items-center gap-2" aria-label="헤르프리 홈">
          <span className="flex h-[31px] w-[31px] shrink-0 items-center justify-center rounded-full bg-white/92 text-[14px] font-extrabold text-[#0B3B36] shadow-[0_8px_18px_-12px_rgba(7,37,31,.8)]">
            h.
          </span>
          <span className="truncate text-[13px] font-extrabold text-white drop-shadow-[0_1px_7px_rgba(7,37,31,.55)]">
            헤르프리
          </span>
        </Link>
      </div>

      <div className="absolute right-[22px] top-[44px] flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className="text-[13.5px] font-semibold text-white/92 drop-shadow-[0_1px_7px_rgba(7,37,31,.55)]"
          >
            로그인
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴"
            className="flex h-8 w-8 items-center justify-center text-white drop-shadow-[0_1px_7px_rgba(7,37,31,.55)]"
          >
            <MenuIcon />
          </button>
      </div>

      <div className="absolute bottom-[42px] left-0 right-0 px-[26px]">
        <p className="mb-2 text-[12px] font-bold text-white/86 [text-shadow:0_1px_10px_rgba(7,37,31,.45)]">
          우리들의 이야기
        </p>
        <h1 className="hf-display text-[32px] font-extrabold leading-[1.28] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.42)]">
          편하게
          <br />
          들어오세요
        </h1>
        <p className="mt-3 max-w-[300px] text-[13.5px] font-medium leading-[1.7] text-white/92">
          우리들의 이야기가 모이는 공간입니다.
        </p>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  );
}
