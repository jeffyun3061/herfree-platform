'use client';

import {
  TODAY_STATUS_LABELS,
  TREND_DIRECTION_LABELS,
  type JournalDashboard,
  type JournalTodayStatusLevel,
} from '@/domain/journal/types';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalTodayStatusCardProps = {
  dashboard: JournalDashboard | null;
  isLoggedIn: boolean;
  isLoading?: boolean;
  onCheckin: () => void;
};

const STATUS_BADGE: Record<JournalTodayStatusLevel, string> = {
  NOT_RECORDED: 'bg-white/20 text-white/90',
  STABLE: 'bg-white/25 text-white',
  ATTENTION: 'bg-gold/30 text-white',
  RELAPSE: 'bg-red-400/30 text-white',
};

export function JournalTodayStatusCard({
  dashboard,
  isLoggedIn,
  isLoading,
  onCheckin,
}: JournalTodayStatusCardProps) {
  if (!isLoggedIn) {
    return (
      <section className="journal-hero-card">
        <div className="relative z-10">
          <p className="text-sm text-white/70">개인 일지</p>
          <h2 className="mt-2 font-display text-2xl font-bold">나만의 패턴을 기록해 보세요</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-white/75">
            재발·수면·스트레스를 비공개로 남기면 패턴을 확인할 수 있어요.
          </p>
        </div>
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-6 right-4 h-24 w-24 rounded-full bg-white/5"
          aria-hidden
        />
      </section>
    );
  }

  const level = dashboard?.todayStatusLevel ?? 'NOT_RECORDED';
  const summary = dashboard?.todayStatusSummary ?? '오늘 기록 전이에요';
  const trend = dashboard?.trendDirection;
  const relapseFreeDays = dashboard?.relapseFreeDays ?? 0;

  if (isLoading) {
    return (
      <section className="journal-hero-card animate-pulse">
        <div className="space-y-3">
          <div className="h-4 w-20 rounded bg-white/20" />
          <div className="h-8 w-48 rounded bg-white/20" />
          <div className="h-12 w-full rounded-2xl bg-white/20" />
        </div>
      </section>
    );
  }

  return (
    <section className="journal-hero-card">
      <div className="relative z-10">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-white/80">오늘 상태</span>
          <span className={cn('rounded-pill px-2.5 py-0.5 text-[11px] font-semibold', STATUS_BADGE[level])}>
            {TODAY_STATUS_LABELS[level]}
          </span>
          {trend && trend !== 'UNKNOWN' && (
            <span className="text-xs text-white/70">{TREND_DIRECTION_LABELS[trend]}</span>
          )}
        </div>

        <p className="mt-3 text-lg font-semibold leading-snug">{summary}</p>

        <p className="mt-4 font-display text-3xl font-extrabold tracking-tight">
          재발 없이{' '}
          <span className="text-gold-light">{relapseFreeDays}</span>
          일
        </p>

        <Button
          fullWidth
          size="lg"
          className="mt-6 bg-white text-primary hover:bg-white/90"
          onClick={onCheckin}
        >
          30초 기록
        </Button>

        <p className="mt-3 text-center text-[11px] leading-relaxed text-white/60">
          이 기록은 진단이 아니라 내 패턴을 보기 위한 참고 자료예요.
        </p>
      </div>

      <div
        className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10"
        aria-hidden
      />
      <svg
        className="pointer-events-none absolute bottom-4 right-4 h-16 w-16 text-white/15"
        viewBox="0 0 64 64"
        fill="currentColor"
        aria-hidden
      >
        <circle cx="32" cy="32" r="28" opacity="0.5" />
        <circle cx="32" cy="32" r="18" opacity="0.3" />
      </svg>
    </section>
  );
}
