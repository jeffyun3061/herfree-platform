'use client';

import { useRef, useState } from 'react';
import type { JournalReviewSummary } from '@/domain/journal/types';
import {
  SEVERITY_COLORS,
  SEVERITY_TIER_LABELS,
  formatReviewDateRange,
  formatLabelList,
} from '@/domain/journal/types';
import { buildConsultationReportShareText } from '@/domain/journal/reviewShare';
import { shareJournalText } from '@/domain/journal/share';
import { downloadElementPng, printElement } from '@/lib/domCapture';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalConsultationReportCardProps = {
  summary: JournalReviewSummary;
  className?: string;
  compact?: boolean;
};

const SEVERITY_LEGEND: Array<{
  tier: keyof typeof SEVERITY_COLORS;
  label: string;
}> = [
  { tier: 'LOW', label: SEVERITY_TIER_LABELS.LOW },
  { tier: 'MEDIUM', label: SEVERITY_TIER_LABELS.MEDIUM },
  { tier: 'HIGH', label: SEVERITY_TIER_LABELS.HIGH },
];

export function JournalConsultationReportCard({
  summary,
  className,
  compact = false,
}: JournalConsultationReportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const shareText = buildConsultationReportShareText(summary);
  const symptomTimelineDays = summary.timelineDays.filter((day) => day.hadSymptoms);

  const handlePdfSave = () => {
    if (!cardRef.current) return;
    printElement(cardRef.current, 'Herfree 기록 요약 리포트');
    setMessage('인쇄 창에서 PDF로 저장할 수 있습니다.');
  };

  const handleCreateLink = async () => {
    setPending(true);
    setMessage(null);
    try {
      const result = await shareJournalText(shareText);
      setMessage(
        result === 'shared'
          ? '요약 링크 문구가 공유되었습니다.'
          : '요약 문구가 클립보드에 복사됐습니다. 상담 시 붙여넣기 해 주세요.',
      );
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setMessage(error instanceof Error ? error.message : '링크 만들기에 실패했습니다.');
    } finally {
      setPending(false);
    }
  };

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setPending(true);
    setMessage(null);
    try {
      await downloadElementPng(cardRef.current, 'herfree-consultation-report.png');
      setMessage('리포트 이미지가 저장되었습니다.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '이미지 저장에 실패했습니다.');
    } finally {
      setPending(false);
    }
  };

  return (
    <div className={cn(compact ? 'space-y-2' : 'space-y-3', className)}>
      <div
        ref={cardRef}
        className="overflow-hidden rounded-card border border-border/60 bg-white shadow-card"
      >
        <div className={cn('bg-primary text-primary-foreground', compact ? 'px-4 py-3' : 'px-5 py-5')}>
          {!compact && (
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold tracking-wide">
                Herfree
              </span>
            </div>
          )}
          <h3 className={cn('font-display font-bold', compact ? 'text-sm' : 'mt-3 text-lg')}>
            기록 요약 리포트
          </h3>
          <p className="mt-0.5 text-[11px] text-primary-foreground/80">
            {formatReviewDateRange(summary.periodStart, summary.periodEnd, summary.periodDays)}
          </p>
        </div>

        <div className={cn('space-y-4', compact ? 'px-4 py-3' : 'space-y-5 px-5 py-5')}>
          <section>
            <p className="text-sm font-semibold text-ink">
              증상 기록 일수 {summary.symptomDays}일 / {summary.periodDays}일
            </p>
            <div className="relative mt-4 h-8">
              <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
              <div className="relative flex h-full items-center justify-between px-1">
                {symptomTimelineDays.length === 0 ? (
                  <span className="text-xs text-muted">최근 30일 증상 기록이 없습니다.</span>
                ) : (
                  symptomTimelineDays.map((day) => (
                    <span
                      key={day.date}
                      className="h-3 w-3 rounded-full ring-2 ring-white"
                      style={{
                        backgroundColor: day.severityTier
                          ? SEVERITY_COLORS[day.severityTier]
                          : SEVERITY_COLORS.MEDIUM,
                      }}
                      title={day.date}
                    />
                  ))
                )}
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 text-xs font-semibold text-muted">증상 강도</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {SEVERITY_LEGEND.map(({ tier, label }) => {
                const count =
                  tier === 'LOW'
                    ? summary.severityBreakdown.lowDays
                    : tier === 'MEDIUM'
                      ? summary.severityBreakdown.mediumDays
                      : summary.severityBreakdown.highDays;
                return (
                  <div
                    key={tier}
                    className="flex items-center gap-2 rounded-xl bg-canvas px-3 py-2 text-xs"
                  >
                    <span
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: SEVERITY_COLORS[tier] }}
                    />
                    <span className="text-ink-soft">
                      {label} <span className="font-semibold text-ink">{count}일</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          <section className={cn(compact ? 'grid gap-2' : 'grid gap-3 sm:grid-cols-3')}>
            <ReportStat
              icon="✨"
              label="전조 증상"
              value={formatLabelList(summary.prodromalOrder, '—')}
              compact={compact}
            />
            <ReportStat icon="🌙" label="평균 수면" value={summary.avgSleepLabel} compact={compact} />
            <ReportStat icon="〰️" label="평균 스트레스" value={summary.avgStressLabel} compact={compact} />
          </section>

          {!compact && (
            <section className="rounded-xl bg-canvas px-4 py-3">
              <p className="text-sm font-semibold text-ink">복용 기록</p>
              <p className="mt-1 text-sm text-ink-soft">
                기록된 날 {summary.medicationRecordedDays}일
              </p>
              <p className="mt-0.5 text-xs text-muted">{summary.medicationPattern}</p>
            </section>
          )}

          <p className="flex items-center gap-1.5 text-[11px] text-muted">
            <span aria-hidden>🔒</span>
            개인 메모와 닉네임 제외
          </p>
        </div>
      </div>

      <div className={cn('flex gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}>
        <Button
          fullWidth
          variant="secondary"
          size={compact ? 'sm' : 'md'}
          disabled={pending}
          onClick={handlePdfSave}
        >
          PDF
        </Button>
        <Button
          fullWidth
          size={compact ? 'sm' : 'md'}
          disabled={pending}
          onClick={() => void handleCreateLink()}
        >
          링크
        </Button>
      </div>

      {!compact && (
        <button
          type="button"
          className="w-full text-center text-xs font-medium text-primary"
          disabled={pending}
          onClick={() => void handleSaveImage()}
        >
          리포트 이미지로 저장
        </button>
      )}

      {message && <p className="text-center text-[11px] text-primary">{message}</p>}
    </div>
  );
}

function ReportStat({
  icon,
  label,
  value,
  compact,
}: {
  icon: string;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/50 bg-white',
        compact ? 'px-2.5 py-2' : 'px-3 py-3',
      )}
    >
      <p className="flex items-center gap-1 text-[10px] font-semibold text-muted">
        <span aria-hidden>{icon}</span>
        {label}
      </p>
      <p className={cn('mt-0.5 font-medium text-ink', compact ? 'text-[11px]' : 'text-sm')}>
        {value}
      </p>
    </div>
  );
}
