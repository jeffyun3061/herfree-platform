'use client';

import Link from 'next/link';
import { WeekStrip } from '@/components/layout/WeekStrip';
import { PostCard } from '@/components/community/PostCard';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { useRoutineDashboard } from '@/hooks/useRoutineDashboard';
import { getErrorMessage } from '@/lib/api/client';
import { cn } from '@/lib/cn';

type StatCardProps = {
  label: string;
  value: number | string;
  suffix?: string;
};

function StatCard({ label, value, suffix }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-border/80 bg-card px-3 py-4 text-center shadow-sm">
      <p className="text-[11px] text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold text-cream-foreground">
        {value}
        {suffix && <span className="ml-0.5 text-sm font-medium text-muted">{suffix}</span>}
      </p>
    </div>
  );
}

export function RoutineDashboard() {
  const {
    isLoggedIn,
    weekOffset,
    setWeekOffset,
    isLoading,
    error,
    symptomBoard,
    reviewBoard,
    recordDateKeys,
    stats,
    recentRecords,
  } = useRoutineDashboard();

  if (isLoading) {
    return <LoadingSpinner label="기록 대시보드 불러오는 중…" />;
  }

  return (
    <div className="space-y-6">
      {error && <ErrorMessage message={getErrorMessage(error)} />}

      <section className="hero-panel py-5">
        <p className="relative z-10 text-sm text-primary-foreground/85">나만의 건강 기록</p>
        <h2 className="relative z-10 mt-1 text-lg font-semibold">오늘 컨디션을 남겨 보세요</h2>
        <p className="relative z-10 mt-2 text-sm leading-relaxed text-primary-foreground/80">
          증상·복용·루틴을 기록하면 주간 캘린더에서 흐름을 확인할 수 있습니다.
        </p>
        {isLoggedIn ? (
          <div className="relative z-10 mt-4 flex flex-wrap gap-2">
            {symptomBoard && (
              <Link href={`/community/write?boardId=${symptomBoard.id}`}>
                <Button variant="secondary" size="sm">
                  증상 기록하기
                </Button>
              </Link>
            )}
            {reviewBoard && (
              <Link href={`/community/write?boardId=${reviewBoard.id}`}>
                <Button variant="secondary" size="sm">
                  루틴·제품 후기
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <Link href="/login" className="relative z-10 mt-4 inline-block">
            <Button variant="secondary" size="sm">
              로그인 후 기록하기
            </Button>
          </Link>
        )}
      </section>

      {isLoggedIn && (
        <>
          <section>
            <h3 className="mb-3 text-base font-semibold text-cream-foreground">기록 요약</h3>
            <div className="grid grid-cols-2 gap-2">
              <StatCard label="전체 기록" value={stats.total} suffix="건" />
              <StatCard label="이번 주 기록일" value={stats.thisWeek} suffix="일" />
              <StatCard label="연속 기록" value={stats.streak} suffix="일" />
              <StatCard label="주간 기록률" value={stats.weekRate} suffix="%" />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-cream-foreground">주간 캘린더</h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev - 1)}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-cream-foreground"
                  aria-label="이전 주"
                >
                  ←
                </button>
                <span className="text-xs text-muted">
                  {weekOffset === 0 ? '이번 주' : weekOffset > 0 ? `${weekOffset}주 후` : `${Math.abs(weekOffset)}주 전`}
                </span>
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => Math.min(prev + 1, 0))}
                  disabled={weekOffset >= 0}
                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted hover:text-cream-foreground disabled:opacity-40"
                  aria-label="다음 주"
                >
                  →
                </button>
              </div>
            </div>
            <WeekStrip recordDateKeys={recordDateKeys} weekOffset={weekOffset} />
            <p className="mt-2 text-xs text-muted">
              이 주에 기록한 날 {stats.weekRecords}일 · 점이 표시된 날에 기록이 있습니다.
            </p>
            <Link href="/mypage" className="mt-2 inline-block text-xs font-medium text-primary">
              마이페이지에서 전체 글 보기
            </Link>
          </section>

          <section>
            <h3 className="mb-3 text-base font-semibold text-cream-foreground">최근 기록</h3>
            {recentRecords.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center">
                <p className="text-sm text-muted">아직 증상 기록이 없습니다.</p>
                <p className="mt-1 text-xs text-muted">짧은 한 줄이라도 남기면 나중에 흐름을 비교하기 쉽습니다.</p>
                {symptomBoard && (
                  <Link
                    href={`/community/write?boardId=${symptomBoard.id}`}
                    className="mt-3 inline-block"
                  >
                    <Button size="sm">첫 기록 남기기</Button>
                  </Link>
                )}
              </div>
            ) : (
              recentRecords.map((post) => <PostCard key={post.id} post={post} />)
            )}
          </section>
        </>
      )}

      {!isLoggedIn && (
        <section
          className={cn('rounded-2xl border border-border/80 bg-cream px-4 py-5 text-sm text-muted')}
        >
          로그인하면 기록 통계, 주간 캘린더, 최근 기록을 한곳에서 확인할 수 있습니다.
        </section>
      )}
    </div>
  );
}
