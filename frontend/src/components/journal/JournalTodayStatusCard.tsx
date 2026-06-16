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

const STATUS_STYLES: Record<JournalTodayStatusLevel, string> = {
  NOT_RECORDED: 'bg-cream text-muted ring-1 ring-border/70',
  STABLE: 'bg-primary/10 text-primary',
  ATTENTION: 'bg-gold/15 text-gold',
  RELAPSE: 'bg-red-50 text-red-700',
};

export function JournalTodayStatusCard({
  dashboard,
  isLoggedIn,
  isLoading,
  onCheckin,
}: JournalTodayStatusCardProps) {
  const level = dashboard?.todayStatusLevel ?? 'NOT_RECORDED';
  const summary = dashboard?.todayStatusSummary ?? '오늘 기록 전이에요';
  const trend = dashboard?.trendDirection;

  if (!isLoggedIn) {
    return (
      <section className="rounded-3xl bg-navy p-6 text-white shadow-sm">
        <p className="text-sm text-white/70">개인 일지</p>
        <h2 className="mt-2 font-serif text-2xl font-semibold">나만의 패턴을 기록해 보세요</h2>
        <p className="mt-2 text-sm leading-relaxed text-white/75">
          재발·수면·스트레스를 비공개로 남기면 패턴을 확인할 수 있어요.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-border/70 bg-white p-5 shadow-sm">
      {isLoading ? (
        <div className="animate-pulse space-y-3">
          <div className="h-4 w-24 rounded bg-canvas" />
          <div className="h-8 w-full rounded bg-canvas" />
          <div className="h-12 w-full rounded-2xl bg-canvas" />
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full px-2.5 py-1 text-xs font-semibold',
                    STATUS_STYLES[level],
                  )}
                >
                  {TODAY_STATUS_LABELS[level]}
                </span>
                {trend && trend !== 'UNKNOWN' && (
                  <span className="text-xs text-muted">{TREND_DIRECTION_LABELS[trend]}</span>
                )}
              </div>
              <p className="mt-3 text-lg font-semibold text-ink">{summary}</p>
              {dashboard && (
                <p className="mt-1 text-xs text-muted">
                  무재발 {dashboard.relapseFreeDays}일 · 이번 달 재발 {dashboard.monthRelapses}회
                </p>
              )}
            </div>
          </div>
          <Button fullWidth size="lg" className="mt-5" onClick={onCheckin}>
            오늘 기록하기
          </Button>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-muted">
            이 기록은 진단이 아니라 내 패턴을 보기 위한 참고 자료예요.
          </p>
        </>
      )}
    </section>
  );
}
