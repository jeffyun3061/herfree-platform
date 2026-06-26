'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';

export function GuestHomeHero() {
  return (
    <section className="relative h-[330px] overflow-hidden">
      <PublicStaticImage
        src={PUBLIC_IMAGES.homeHero}
        alt=""
        fill
        priority
        sizes="390px"
        className="object-cover object-[50%_38%]"
      />
      <div
        className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,37,31,.5)_0%,rgba(7,37,31,.14)_30%,rgba(7,37,31,.32)_66%,rgba(7,37,31,.5)_86%,rgba(243,237,227,.55)_97%,#F3EDE3_100%)]"
        aria-hidden
      />

      <div className="absolute left-0 right-0 top-[52px] flex items-center justify-between px-[22px] py-1.5">
        <Link href="/" className="flex items-center gap-2" aria-label="헤르프리 홈">
          <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white/16 text-[16px] font-bold text-white backdrop-blur-md">
            h.
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em] text-white">
            헤르프리
          </span>
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

      <div className="absolute bottom-[42px] left-0 right-0 px-[26px]">
        <h1 className="hf-display m-0 text-[30px] font-extrabold leading-[1.4] tracking-[-0.01em] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
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
