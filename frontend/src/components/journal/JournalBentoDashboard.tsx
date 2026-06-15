'use client';

import Link from 'next/link';
import {
  MOOD_OPTIONS,
  formatJournalDateLabel,
  toDateInputValue,
  type JournalDashboard,
  type JournalInsights,
  type JournalRecordInput,
  type MoodType,
} from '@/domain/journal/types';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';

type JournalBentoDashboardProps = {
  dashboard: JournalDashboard | null;
  insights: JournalInsights | null;
  isLoggedIn: boolean;
  isSaving: boolean;
  onQuickSave: (input: JournalRecordInput) => Promise<void>;
};

function buildTodayBase(dashboard: JournalDashboard | null): JournalRecordInput {
  const today = dashboard?.todayRecord;
  return {
    recordDate: toDateInputValue(),
    medicationStatus: today?.medicationStatus ?? 'NORMAL',
    avgSleep: today?.avgSleep ?? null,
    stressLevel: today?.stressLevel ?? null,
    hadSymptoms: today?.hadSymptoms ?? false,
    prodromalSymptoms: today?.prodromalSymptoms ?? [],
    severity: today?.severity ?? null,
    triggers: today?.triggers ?? [],
    memo: today?.memo ?? null,
    mood: today?.mood ?? null,
    sleepHours: today?.sleepHours ?? null,
    supplementTaken: today?.supplementTaken ?? false,
    exerciseDone: today?.exerciseDone ?? false,
  };
}

export function JournalBentoDashboard({
  dashboard,
  insights,
  isLoggedIn,
  isSaving,
  onQuickSave,
}: JournalBentoDashboardProps) {
  const { user } = useAuth();
  const todayBase = buildTodayBase(dashboard);
  const routinePct = dashboard
    ? Math.round((dashboard.routineCompletedToday / dashboard.routineTotalToday) * 100)
    : 0;

  if (!isLoggedIn) {
    return (
      <div className="journal-bento-summary flex flex-col justify-between p-6 text-white lg:min-h-[28rem]">
        <div>
          <p className="text-sm text-white/70">개인 일지</p>
          <h2 className="mt-2 font-serif text-2xl font-semibold">나만의 방어선을 쌓아가요</h2>
          <p className="mt-3 text-sm leading-relaxed text-white/75">
            재발 기록과 루틴을 남기면 무재발 연속일과 패턴 인사이트를 확인할 수 있습니다.
          </p>
        </div>
        <Link href="/login?from=%2Fjournal">
          <Button variant="secondary" size="sm">
            로그인 후 시작하기
          </Button>
        </Link>
      </div>
    );
  }

  const handleMood = async (mood: MoodType) => {
    await onQuickSave({ ...todayBase, mood });
  };

  const handleSupplement = async () => {
    await onQuickSave({ ...todayBase, supplementTaken: !todayBase.supplementTaken });
  };

  const handleExercise = async () => {
    await onQuickSave({ ...todayBase, exerciseDone: !todayBase.exerciseDone });
  };

  return (
    <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
      <div className="journal-bento-summary flex flex-col justify-between p-6 text-white lg:col-span-1 lg:row-span-2 lg:min-h-[28rem]">
        <div>
          <p className="text-sm text-white/65">{formatJournalDateLabel(toDateInputValue())}</p>
          <h2 className="mt-3 font-serif text-xl font-semibold leading-snug lg:text-2xl">
            {user?.nickname ?? '회원'}님,
            <br />
            오늘도 평온한 하루를 시작해요.
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            작은 기록이 모여 단단한 방어선이 됩니다.
          </p>
        </div>

        <div className="mt-8 space-y-5">
          <div>
            <p className="text-xs uppercase tracking-widest text-gold-light">무재발 연속일</p>
            <p className="mt-1 font-serif text-5xl font-semibold text-gold-light">
              {dashboard?.relapseFreeDays ?? 0}
              <span className="ml-1 text-2xl">일</span>
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-white/60">총 재발 기록</p>
              <p className="mt-1 text-lg font-semibold">{dashboard?.totalRelapses ?? 0}회</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-3">
              <p className="text-[11px] text-white/60">이번 달</p>
              <p className="mt-1 text-lg font-semibold">{dashboard?.monthRelapses ?? 0}회</p>
            </div>
          </div>
          {insights?.sufficientData && insights.insightLines[0] && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold text-gold-light">데이터 인사이트</p>
              <p className="mt-2 text-sm leading-relaxed text-white/80">{insights.insightMessage}</p>
              <ul className="mt-3 space-y-1">
                {insights.insightLines.slice(0, 3).map((line) => (
                  <li key={line} className="text-xs text-white/60">
                    · {line}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="journal-bento-card p-5 lg:col-span-1">
        <p className="text-sm font-semibold text-ink">오늘의 2초 루틴</p>
        <p className="mt-1 text-xs text-muted">
          {dashboard?.routineCompletedToday ?? 0} / {dashboard?.routineTotalToday ?? 4} 완료
        </p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-canvas-dark">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${routinePct}%` }}
          />
        </div>
      </div>

      <div className="journal-bento-card p-5 lg:col-span-1">
        <p className="text-sm font-semibold text-ink">어제 수면 시간</p>
        <p className="mt-2 font-serif text-3xl font-semibold text-ink">
          {dashboard?.todayRecord?.sleepHours != null ? (
            <>
              {dashboard.todayRecord.sleepHours}
              <span className="ml-1 text-base font-medium text-muted">h</span>
            </>
          ) : (
            <span className="text-lg text-muted">기록 없음</span>
          )}
        </p>
        <p className="mt-2 text-xs text-muted">바이러스 억제에 7시간 이상 수면을 권장합니다.</p>
      </div>

      <div className="journal-bento-card flex flex-col justify-between p-5 lg:col-span-1">
        <div>
          <p className="text-sm font-semibold text-ink">영양제 복용</p>
          <p className="mt-1 text-xs text-muted">오늘의 면역 충전</p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleSupplement()}
          className={cn(
            'mt-4 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
            todayBase.supplementTaken
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-canvas text-ink-soft hover:border-primary/30',
          )}
        >
          {todayBase.supplementTaken ? '✓ 오늘 복용 완료' : '복용 기록하기'}
        </button>
      </div>

      <div className="journal-bento-card flex flex-col justify-between p-5 lg:col-span-1">
        <div>
          <p className="text-sm font-semibold text-ink">가벼운 유산소</p>
          <p className="mt-1 text-xs text-muted">혈액·림프 순환을 돕습니다.</p>
        </div>
        <button
          type="button"
          disabled={isSaving}
          onClick={() => void handleExercise()}
          className={cn(
            'mt-4 rounded-2xl border px-4 py-3 text-sm font-medium transition-colors',
            todayBase.exerciseDone
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-canvas text-ink-soft hover:border-primary/30',
          )}
        >
          {todayBase.exerciseDone ? '✓ 오늘 운동 완료' : '오늘의 땀방울 기록'}
        </button>
      </div>

      <div className="journal-bento-card p-5 lg:col-span-2">
        <p className="text-sm font-semibold text-ink">마음 날씨</p>
        <p className="mt-1 text-xs text-muted">재발의 가장 큰 트리거, 마음 상태를 기록해요.</p>
        <div className="mt-4 grid grid-cols-3 gap-2">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={isSaving}
              onClick={() => void handleMood(option.value)}
              className={cn(
                'rounded-2xl border px-3 py-3 text-center transition-colors',
                todayBase.mood === option.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-white hover:border-primary/30',
              )}
            >
              <span className="text-xl">{option.emoji}</span>
              <p className="mt-1 text-xs font-medium text-ink-soft">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
