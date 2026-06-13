'use client';

import Image from 'next/image';
import Link from 'next/link';
import { HeroTrustBar } from '@/components/home/HeroTrustBar';

export function HomeHero() {
  return (
    <section className="hero-card">
      <div className="hero-card__body">
        <div className="hero-card__text">
          <p className="hidden text-xs font-medium uppercase tracking-[0.2em] text-primary lg:block">
            Herfree Health Community
          </p>
          <h1 className="font-serif text-[1.2rem] font-semibold leading-[1.35] text-ink lg:mt-3 lg:text-[2.75rem] lg:leading-[1.2] xl:text-5xl">
            헤르페스, 그 이후의 삶.
            <br />
            진짜 이야기를 함께합니다.
          </h1>
          <p className="mt-2.5 text-[11px] leading-relaxed text-ink-soft lg:mt-5 lg:text-base lg:leading-relaxed">
            당신의 새로운 건강한 일상을
            <br className="lg:hidden" />
            헤르프리와 함께 만들어가세요.
          </p>
          <div className="mt-5 flex flex-wrap gap-2 lg:mt-6 lg:gap-3">
            <Link
              href="/community"
              className="inline-flex h-10 items-center rounded-full bg-navy px-5 text-xs font-medium text-white transition-colors hover:bg-navy-light lg:h-11 lg:px-6 lg:text-sm"
            >
              커뮤니티 참여하기
            </Link>
            <Link
              href="/journal"
              className="inline-flex h-10 items-center rounded-full border border-border bg-white px-5 text-xs font-medium text-ink transition-colors hover:border-primary/30 hover:text-primary lg:h-11 lg:px-6 lg:text-sm"
            >
              개인 일지 시작
            </Link>
            <Link
              href="/contents"
              className="inline-flex h-10 items-center rounded-full border border-border bg-white px-5 text-xs font-medium text-ink transition-colors hover:border-primary/30 hover:text-primary lg:h-11 lg:px-6 lg:text-sm"
            >
              건강 정보 보기
            </Link>
          </div>
        </div>
        <div className="hero-card__visual">
          <Image
            src="/images/main.png"
            alt=""
            fill
            priority
            sizes="(max-width: 1024px) 45vw, 560px"
            className="object-cover object-[65%_center]"
          />
        </div>
      </div>
      <HeroTrustBar />
    </section>
  );
}
