'use client';

import Link from 'next/link';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';
import { HeroTrustBar } from '@/components/home/HeroTrustBar';
import { ButtonLink } from '@/components/ui/Button';

export function HomeHero() {
  return (
    <section className="hero-card">
      <div className="hero-card__body">
        <PublicStaticImage
          src={PUBLIC_IMAGES.homeHero}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[70%_center] lg:object-[75%_center]"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-canvas-dark via-canvas-dark/88 to-canvas-dark/25 lg:from-canvas-dark/95 lg:via-canvas-dark/72 lg:to-canvas-dark/15"
          aria-hidden
        />

        <div className="hero-card__text">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary lg:text-xs lg:tracking-[0.2em]">
            Herfree Health Community
          </p>
          <h1 className="font-display mt-2 text-[1.35rem] font-extrabold leading-[1.3] text-ink lg:mt-3 lg:text-[2.75rem] lg:leading-[1.2] xl:text-5xl">
            herfree
          </h1>
          <p className="mt-2.5 text-sm leading-relaxed text-ink-soft lg:mt-5 lg:text-base lg:leading-relaxed">
            당신의 새로운 건강한 일상을
            <br className="lg:hidden" />
            herfree와 함께 만들어가세요.
          </p>

          {/* 모바일: 개인 일지 우선 CTA (Wrtn식 단일 흐름) */}
          <div className="cta-stack mt-5 lg:mt-6">
            <ButtonLink
              href="/journal"
              fullWidth
              size="lg"
              className="lg:w-auto lg:min-w-[10.5rem] lg:rounded-pill"
            >
              개인일지 시작
            </ButtonLink>
            <ButtonLink
              href="/community"
              variant="secondary"
              fullWidth
              size="lg"
              className="lg:w-auto lg:min-w-[10.5rem] lg:rounded-pill"
            >
              커뮤니티 둘러보기
            </ButtonLink>
            <Link
              href="/contents"
              className="cta-pill-secondary w-full text-center lg:w-auto lg:min-w-[9.5rem] lg:rounded-pill"
            >
              칼럼 보기
            </Link>
          </div>
        </div>
      </div>
      <HeroTrustBar />
    </section>
  );
}
