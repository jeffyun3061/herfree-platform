'use client';

import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';

export function GuestHomeHero() {
  return (
    <section className="journal-hero-card relative overflow-hidden shadow-card">
      <PublicStaticImage
        src={PUBLIC_IMAGES.homeHero}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-[70%_center]"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[rgba(4,30,26,0.4)] via-[rgba(4,30,26,0.2)] to-[#0B3B36]"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-end p-4 sm:p-5">
        <p className="text-[11px] font-medium tracking-wide text-white/70">Herfree Health Community</p>
        <h1 className="font-display mt-2 text-[1.5rem] font-extrabold leading-[1.32] text-white sm:text-[1.75rem]">
          혼자 견디지 않아도 됩니다
        </h1>
        <p className="mt-2 text-[13px] leading-relaxed text-white/80">
          헤르프리는 같은 경험을 가진 이들이 담담하게
          <br />
          잘 살아가는 이야기가 모이는 곳입니다
        </p>
      </div>
    </section>
  );
}
