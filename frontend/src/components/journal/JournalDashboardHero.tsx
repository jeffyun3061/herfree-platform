'use client';

import type { JournalDashboard } from '@/domain/journal/types';
import { JOURNAL_DASHBOARD_HERO_IMAGE } from '@/domain/journal/assets';
import { formatDashboardDateBadge, formatLastRelapseLabel } from '@/domain/journal/routine';
import { JournalShareButton } from '@/components/journal/JournalShareButton';

type JournalDashboardHeroProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
};

export function JournalDashboardHero({ dashboard, isLoading }: JournalDashboardHeroProps) {
  if (isLoading) {
    return (
      <section className="relative min-h-[240px] animate-pulse overflow-hidden rounded-[1.25rem] bg-journal-hero" />
    );
  }

  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;
  const yearRelapses = dashboard?.yearRelapses ?? 0;
  const lastRelapse = formatLastRelapseLabel(dashboard?.lastRelapseDate);
  const today = new Date();

  return (
    <section className="relative min-h-[240px] overflow-hidden rounded-[1.25rem] shadow-card">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={JOURNAL_DASHBOARD_HERO_IMAGE}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      <div className="relative z-10 flex min-h-[240px] flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className="text-[11px] font-medium tracking-wide text-white/70">
            {formatDashboardDateBadge(today)}
          </span>
          <JournalShareButton dashboard={dashboard} variant="icon" />
        </div>

        <div className="mt-5 flex flex-1 flex-col justify-center">
          <p className="text-sm leading-relaxed text-white/80">
            작은 기록이 쌓여
            <br />
            지금의 <span className="font-semibold">{relapseFreeDays}일</span>이 됐어요
          </p>
          <p className="mt-3 font-display text-[2.5rem] font-extrabold leading-none tracking-tight text-white">
            {relapseFreeDays}
            <span className="ml-2 text-2xl font-bold">일째 평온</span>
          </p>
        </div>

        <p className="mt-4 text-[11px] text-white/[0.55]">
          올해 재발 <span className="font-medium">{yearRelapses}회</span>
          {' · '}
          마지막 <span className="font-medium">{lastRelapse}</span>
        </p>
      </div>
    </section>
  );
}
