'use client';

import Link from 'next/link';
import { useState } from 'react';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { BRAND_LOGO } from '@/domain/brand/assets';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { ShellMenuIcon } from '@/components/layout/ShellTopIcons';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';
import Image from 'next/image';

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

      <div className="absolute left-0 right-0 top-[52px] flex items-center justify-between px-[22px] py-1.5">
        <Link href="/" className="flex min-w-0 items-center gap-[7px]" aria-label="헤르프리 홈">
          <Image
            src={BRAND_LOGO.hMarkOnDark}
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full"
            aria-hidden
          />
          <span className="truncate text-[15px] font-semibold tracking-[-0.01em] text-white drop-shadow-[0_1px_7px_rgba(7,37,31,.55)]">
            헤르프리
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-4">
          <Link
            href="/login"
            className="whitespace-nowrap text-[13.5px] font-medium text-white/92 [text-shadow:0_1px_8px_rgba(7,37,31,.55)]"
          >
            로그인
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="메뉴"
            className="flex h-8 w-8 items-center justify-center text-white/92"
          >
            <ShellMenuIcon className="h-5 w-5" stroke="currentColor" />
          </button>
        </div>
      </div>

      <div className="absolute bottom-[42px] left-0 right-0 px-[26px]">
        <h1 className="hf-display text-[30px] font-extrabold leading-[1.4] tracking-[-0.01em] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
          편하게
          <br />
          들어오세요
        </h1>
        <p className="mt-3 max-w-[300px] text-[13.5px] font-normal leading-[1.7] text-white/92 [text-shadow:0_1px_10px_rgba(7,37,31,.5)]">
          우리들의 이야기가 모이는 공간입니다.
        </p>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </section>
  );
}
