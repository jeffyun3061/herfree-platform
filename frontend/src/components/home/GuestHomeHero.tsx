'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { BRAND_LOGO } from '@/domain/brand/assets';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';
import Image from 'next/image';

export function GuestHomeHero() {
  return (
    <section className="relative h-[300px] overflow-hidden">
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

      <div className="absolute inset-x-0 top-[max(12px,env(safe-area-inset-top,12px))] z-10 hf-page-x flex items-center justify-between py-1">
        <Link href="/" className="shrink-0" aria-label="헤르프리 홈">
          <Image
            src={BRAND_LOGO.hMarkOnDark}
            alt=""
            width={30}
            height={30}
            className="h-[30px] w-[30px] rounded-full"
          />
        </Link>

        <Link
          href="/login"
          className="relative z-10 whitespace-nowrap rounded-md px-1 py-2 text-[13.5px] font-medium text-[#F3EDE3]/95 [text-shadow:0_1px_8px_rgba(7,37,31,.65)]"
        >
          로그인
        </Link>
      </div>

      <div className="absolute inset-x-0 top-[74px] px-[26px]">
        <h1 className="hf-display text-[30px] font-extrabold leading-[1.35] tracking-[-0.01em] text-white [text-shadow:0_2px_18px_rgba(7,37,31,.4)]">
          편하게
          <br />
          들어오세요
        </h1>
        <p className="mt-2.5 max-w-[300px] text-[13.5px] font-normal leading-[1.65] text-[#F3EDE3] [text-shadow:0_2px_14px_rgba(7,37,31,.82)]">
          우리들의 이야기가 모이는 공간입니다.
        </p>
      </div>
    </section>
  );
}
