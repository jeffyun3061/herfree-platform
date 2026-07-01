'use client';

import Link from 'next/link';
import Image from 'next/image';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { BRAND_LOGO } from '@/domain/brand/assets';
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
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.42)_0%,rgba(7,37,31,.06)_30%,rgba(243,237,227,0)_55%,rgba(243,237,227,.85)_86%,#F3EDE3_100%)]"
        aria-hidden
      />

      <div className="absolute left-0 right-0 top-[52px] flex items-center justify-between px-[22px] py-1.5">
        <Link href="/" className="flex items-center" aria-label="herfree home">
          <Image
            src={BRAND_LOGO.hfreeWordmark}
            alt="h.free"
            width={120}
            height={44}
            priority
            unoptimized
            className="h-10 w-auto"
          />
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-[13.5px] font-medium text-white/90">
            로그인
          </Link>
          <Link href="/community" aria-label="커뮤니티 둘러보기" className="text-white/90">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <line x1="4" y1="7" x2="20" y2="7" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="17" x2="20" y2="17" />
            </svg>
          </Link>
        </div>
      </div>

      <div className="absolute bottom-[86px] left-0 right-0 px-[26px]">
        <h1 className="hf-display text-[33px] font-extrabold leading-[1.4] tracking-[-0.01em] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
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
