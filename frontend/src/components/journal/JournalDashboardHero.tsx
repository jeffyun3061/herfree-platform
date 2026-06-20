'use client';

import type { JournalDashboard } from '@/domain/journal/types';
import { PUBLIC_IMAGES } from '@/domain/assets/static';
import { PublicStaticImage } from '@/components/ui/PublicStaticImage';
import { formatDashboardDateBadge, formatLastRelapseLabel } from '@/domain/journal/routine';
import { JournalShareButton } from '@/components/journal/JournalShareButton';

type JournalDashboardHeroProps = {
  dashboard: JournalDashboard | null;
  isLoading?: boolean;
  showFirstRecordHint?: boolean;
  onRecordRelapse?: () => void;
};

export function JournalDashboardHero({
  dashboard,
  isLoading,
  showFirstRecordHint,
  onRecordRelapse,
}: JournalDashboardHeroProps) {
  if (isLoading) {
    return (
      <section className="journal-hero-card animate-pulse bg-journal-hero" aria-hidden />
    );
  }

  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;
  const yearRelapses = dashboard?.yearRelapses ?? 0;
  const lastRelapse = formatLastRelapseLabel(dashboard?.lastRelapseDate);
  const today = new Date();

  return (
    <section className="journal-hero-card relative overflow-hidden shadow-card">
      <PublicStaticImage
        src={PUBLIC_IMAGES.journalDashboardHero}
        alt=""
        fill
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#092a2a]/25 via-transparent to-[#092a2a]/55"
        aria-hidden
      />

      <div className="relative z-10 flex h-full min-h-0 flex-col justify-between p-4 sm:p-5">
        <div className="flex items-start justify-between gap-2">
          <span className="text-[11px] font-medium tracking-wide text-white/70">
            {formatDashboardDateBadge(today)}
          </span>
          <JournalShareButton dashboard={dashboard} variant="icon" />
        </div>

        <div className="flex flex-1 flex-col justify-center py-2">
          {showFirstRecordHint ? (
            <>
              <p className="text-[13px] leading-relaxed text-white/80">
                첫 기록을 남기면
                <br />
                여기에 나만의 일수가 쌓여요
              </p>
              <p className="mt-2 font-display text-[1.75rem] font-bold leading-tight text-white">
                오늘부터 시작해요
              </p>
            </>
          ) : (
            <>
              <p className="text-[13px] leading-relaxed text-white/80">
                작은 기록이 쌓여
                <br />
                지금의{' '}
                <span className="font-semibold text-herfree-yellow">{relapseFreeDays}일</span>이 됐어요
              </p>
              <p className="mt-2 font-display font-extrabold leading-none tracking-tight text-white">
                <span className="text-[2.75rem] text-herfree-yellow sm:text-[3rem]">
                  {relapseFreeDays}
                </span>
                <span className="ml-2 text-xl font-bold sm:text-2xl">일째 평온</span>
              </p>
            </>
          )}
        </div>

        <div className="flex items-end justify-between gap-2">
          <p className="text-[11px] leading-snug text-white/[0.55]">
            올해 재발 <span className="font-medium text-white/70">{yearRelapses}회</span>
            {' · '}
            마지막 <span className="font-medium text-white/70">{lastRelapse}</span>
          </p>
          {onRecordRelapse && (
            <button
              type="button"
              onClick={onRecordRelapse}
              className="shrink-0 text-[10px] font-medium text-white/45 underline-offset-2 hover:text-white/70 hover:underline"
            >
              재발 기록
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
