import type { JournalDashboard } from '@/domain/journal/types';

export type JournalShareOptions = {
  includeStreak?: boolean;
  includeRoutine?: boolean;
  includeSiteLink?: boolean;
};

function resolveSiteUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'https://herfree.com';
}

export function buildJournalShareText(
  dashboard: JournalDashboard | null | undefined,
  options: JournalShareOptions = {},
): string {
  const {
    includeStreak = true,
    includeRoutine = true,
    includeSiteLink = true,
  } = options;

  const lines: string[] = ['[Herfree] 나의 건강 기록'];

  if (includeStreak && dashboard) {
    lines.push(`무재발 연속 ${dashboard.relapseFreeDays}일 관리 중`);
  }
  if (includeRoutine && dashboard) {
    lines.push(
      `오늘 루틴 ${dashboard.routineCompletedToday}/${dashboard.routineTotalToday} 완료`,
    );
  }

  lines.push('※ 개인 메모·상세 증상 내용은 공유되지 않습니다.');

  if (includeSiteLink) {
    lines.push(`Herfree에서 함께 관리해요 → ${resolveSiteUrl()}`);
  }

  return lines.join('\n');
}

export async function shareJournalText(text: string): Promise<'shared' | 'copied'> {
  const url = resolveSiteUrl();

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Herfree 건강 기록',
        text,
        url,
      });
      return 'shared';
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }

  throw new Error('이 브라우저에서는 공유를 지원하지 않습니다.');
}

export function buildKakaoShareUrl(text: string): string {
  const url = resolveSiteUrl();
  const params = new URLSearchParams({
    text: `${text}\n${url}`,
  });
  return `https://sharer.kakao.com/talk/friends/picker/link?${params.toString()}`;
}
