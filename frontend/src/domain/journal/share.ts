import type { JournalDashboard } from '@/domain/journal/types';

export type JournalShareOptions = {
  includeStreak?: boolean;
  includeRoutine?: boolean;
  includeSiteLink?: boolean;
};

export const HERFREE_SITE_URL = 'https://herpfree.co.kr';

function resolveSiteUrl(): string {
  return HERFREE_SITE_URL;
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

  const lines: string[] = ['[헤르프리] 오늘의 기록 카드'];

  if (includeStreak && dashboard) {
    lines.push(`무재발 연속 ${dashboard.relapseFreeDays}일 관리 중`);
  }
  if (includeRoutine && dashboard) {
    lines.push(
      `오늘 루틴 ${dashboard.routineCompletedToday}/${dashboard.routineTotalToday} 완료`,
    );
  }

  lines.push('※ 개인 메모·상세 증상은 공유되지 않습니다.');

  if (includeSiteLink) {
    lines.push(`헤르프리에서 기록을 이어가요 → ${resolveSiteUrl()}/`);
  }

  return lines.join('\n');
}

export async function shareJournalText(text: string): Promise<'shared' | 'copied'> {
  const url = resolveSiteUrl();

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: '헤르프리 기록 카드',
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
