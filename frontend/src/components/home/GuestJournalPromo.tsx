'use client';

import { ButtonLink } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type GuestJournalPromoProps = {
  className?: string;
};

export function GuestJournalPromo({ className }: GuestJournalPromoProps) {
  return (
    <section className={cn(className)}>
      <ButtonLink href="/login?from=%2Fjournal" fullWidth size="lg">
        로그인하고 개인 일지 기록하기
      </ButtonLink>
    </section>
  );
}
