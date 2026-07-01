import type { JournalReviewSummary } from '@/domain/journal/types';
import {
  formatLabelList,
  formatReviewDateRange,
} from '@/domain/journal/types';

function resolveSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://herfree.com';
}

export function buildAnonymousReviewShareText(summary: JournalReviewSummary): string {
  const lines = [
    '[Herpfree] 최근 30일 기록 요약',
    `증상 기록 ${summary.symptomDays}일`,
    `전조: ${formatLabelList(summary.topProdromalLabels)}`,
    `함께 기록된 요인: ${formatLabelList(summary.topTriggerLabels)}`,
    '※ 메모·닉네임·상세 개인 정보는 포함되지 않습니다.',
    `Herpfree에서 함께 관리해요 → ${resolveSiteUrl()}`,
  ];
  return lines.join('\n');
}

export function buildConsultationReportShareText(summary: JournalReviewSummary): string {
  const { severityBreakdown } = summary;
  const lines = [
    '[Herpfree] 기록 요약 리포트',
    formatReviewDateRange(summary.periodStart, summary.periodEnd, summary.periodDays),
    `증상 기록 ${summary.symptomDays}일 / ${summary.periodDays}일`,
    `심각도 · 낮음 ${severityBreakdown.lowDays}일 · 보통 ${severityBreakdown.mediumDays}일 · 높음 ${severityBreakdown.highDays}일`,
    `평균 수면 ${summary.avgSleepLabel} · 평균 스트레스 ${summary.avgStressLabel}`,
    `복용 기록 ${summary.medicationRecordedDays}일 · ${summary.medicationPattern}`,
    '※ 개인 메모와 닉네임은 제외된 요약입니다.',
    resolveSiteUrl(),
  ];
  return lines.join('\n');
}
