'use client';

import { ButtonLink } from '@/components/ui/Button';

export function GuestPeaceCta() {
  return (
    <section className="journal-summary-card">
      <p className="text-sm leading-relaxed text-herfree-gray">
        당신의 평온한 일상은,
        <br />
        오늘부터 며칠째인가요?
      </p>
      <ButtonLink
        href="/signup?from=/journal"
        fullWidth
        size="md"
        className="mt-3 journal-record-cta shadow-sm"
      >
        오늘부터 시작하기
      </ButtonLink>
    </section>
  );
}
