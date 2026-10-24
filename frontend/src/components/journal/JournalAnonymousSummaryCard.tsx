'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import type { JournalReviewSummary } from '@/domain/journal/types';
import {
  formatLabelList,
} from '@/domain/journal/types';
import { downloadElementPng } from '@/lib/domCapture';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalAnonymousSummaryCardProps = {
  summary: JournalReviewSummary;
  className?: string;
  compact?: boolean;
};

function severityDotColor(tier: JournalReviewSummary['weekDays'][number]['severityTier']) {
  if (!tier) return 'bg-border/60';
  return tier === 'HIGH' ? 'bg-[var(--journal-risk-high)]' : 'bg-[var(--journal-risk-medium)]';
}

export function JournalAnonymousSummaryCard({
  summary,
  className,
  compact = false,
}: JournalAnonymousSummaryCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const handleSaveImage = async () => {
    if (!cardRef.current) return;
    setPending(true);
    setMessage(null);
    try {
      await downloadElementPng(cardRef.current, 'herfree-journal-summary.png');
      setMessage('이미지가 저장되었습니다.');
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
        {!compact && (
          <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
            <h3 className="hf-display text-base font-bold text-ink">최근 30일 기록 요약</h3>
            <span className="text-lg text-sage" aria-hidden>
              🌿
            </span>
          </div>
        )}

        <div className={cn('space-y-3', compact ? 'px-4 py-3' : 'space-y-4 px-5 py-4')}>
          <section className="flex items-start gap-3">
            <span className="text-lg" aria-hidden>
              📅
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-ink">증상 기록 {summary.symptomDays}일</p>
              <div className="mt-3 flex justify-between gap-1">
                {summary.weekDays.map((day) => (
                  <div key={day.date} className="flex flex-col items-center gap-1.5">
                    <span className="text-[10px] font-medium text-muted">{day.dayLabel}</span>
                    <span
                      className={cn(
                        'h-3 w-3 rounded-full',
                        day.hadSymptoms ? severityDotColor(day.severityTier) : 'bg-border/50',
                      )}
                      title={day.hadSymptoms ? '증상 기록' : '기록 없음'}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="flex items-start gap-3">
            <span className="text-lg" aria-hidden>
              ⚡
            </span>
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">전조:</span>{' '}
              {formatLabelList(summary.topProdromalLabels)}
            </p>
          </section>

          <section className="flex items-start gap-3">
            <span className="text-lg" aria-hidden>
              👤
            </span>
            <p className="text-sm text-ink-soft">
              <span className="font-semibold text-ink">함께 기록된 요인:</span>{' '}
              {formatLabelList(summary.topTriggerLabels)}
            </p>
          </section>
        </div>

      </div>

      <div className={cn('flex gap-2', compact ? 'flex-row' : 'flex-col sm:flex-row')}>
        <Button
          fullWidth
          variant="secondary"
          size={compact ? 'sm' : 'md'}
          disabled={pending}
          onClick={() => void handleSaveImage()}
        >
          이미지 저장
        </Button>
      </div>

      {!compact && (
        <p className="text-center text-xs text-muted">
          커뮤니티 글 작성은{' '}
          <Link href="/community" className="font-medium text-primary underline-offset-2 hover:underline">
            커뮤니티
          </Link>
          에서 이어서 진행할 수 있어요.
        </p>
      )}

      {message && <p className="text-center text-[11px] text-primary">{message}</p>}
    </div>
  );
}
