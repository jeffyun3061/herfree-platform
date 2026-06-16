'use client';

import Link from 'next/link';
import { MedicalDisclaimer } from '@/components/layout/MedicalDisclaimer';

const ENTRIES = [
  {
    href: '/community',
    title: '익명 커뮤니티',
    description: '같은 경험을 나누는 안전한 공간',
    emoji: '💬',
    className: 'bg-primary text-primary-foreground',
  },
  {
    href: '/journal',
    title: '개인 일지',
    description: '나만 보는 재발·루틴 기록',
    emoji: '📔',
    className: 'bg-navy text-white',
  },
  {
    href: '/contents',
    title: '검증 정보',
    description: '검사·재발·치료 정보 확인',
    emoji: '📚',
    className: 'bg-gold text-gold-foreground',
  },
] as const;

export function HomeMobileEntry() {
  return (
    <section className="lg:hidden">
      <p className="mb-3 text-center text-xs font-medium text-primary">안전한 익명 공간</p>
      <div className="grid gap-3">
        {ENTRIES.map((entry) => (
          <Link
            key={entry.href}
            href={entry.href}
            className={`flex items-center gap-4 rounded-2xl px-5 py-4 shadow-sm transition-opacity hover:opacity-95 ${entry.className}`}
          >
            <span className="text-2xl" aria-hidden>
              {entry.emoji}
            </span>
            <div>
              <p className="text-base font-semibold">{entry.title}</p>
              <p className="mt-0.5 text-xs opacity-85">{entry.description}</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-4">
        <MedicalDisclaimer />
      </div>
    </section>
  );
}
