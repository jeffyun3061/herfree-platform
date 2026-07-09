'use client';

import type { ReactionTargetType, ReactionType } from '@/domain/reaction/types';
import { REACTION_ICONS, REACTION_LABELS, REACTION_TYPES } from '@/domain/reaction/types';
import { useReaction } from '@/hooks/useReaction';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

type ReactionBarProps = {
  targetType: ReactionTargetType;
  targetId: number;
  variant?: 'default' | 'detail';
  commentCount?: number;
};

function DetailReactionButton({
  type,
  active,
  count,
  disabled,
  onClick,
}: {
  type: ReactionType;
  active: boolean;
  count: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const isEmpathy = type === 'EMPATHY';

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-8 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-[#ECE5D8] bg-white px-3 py-[11px] text-[12.5px] text-[#6E766F] transition-colors',
        active && isEmpathy && 'border-[#0B3B36]/25 bg-[#E7F1EC] text-[#0B3B36]',
        disabled && 'cursor-not-allowed opacity-60',
      )}
    >
      {isEmpathy ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#C0AE8C" strokeWidth="2" aria-hidden>
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
        </svg>
      ) : (
        <span className="shrink-0 text-[13px]" aria-hidden>
          {REACTION_ICONS[type]}
        </span>
      )}
      <span className="min-w-0 truncate">{isEmpathy ? '공감' : REACTION_LABELS[type]}</span>
      <span className="shrink-0 tabular-nums">{count}</span>
    </button>
  );
}

export function ReactionBar({
  targetType,
  targetId,
  variant = 'default',
  commentCount = 0,
}: ReactionBarProps) {
  const { isLoggedIn } = useAuth();
  const { states, pendingType, error, isLoading, toggle } = useReaction(targetType, targetId);
  const disabled = !isLoggedIn || pendingType !== null || isLoading;
  const empathyState = states.EMPATHY;
  const empathyActive = empathyState?.reacted ?? false;
  const empathyCount = empathyState?.totalCount ?? 0;
  const secondaryTypes = REACTION_TYPES.filter((type) => type !== 'EMPATHY');

  if (variant === 'detail') {
    return (
      <div className="space-y-2">
        <div className="flex gap-2.5">
          <DetailReactionButton
            type="EMPATHY"
            active={empathyActive}
            count={empathyCount}
            disabled={disabled}
            onClick={() => void toggle('EMPATHY')}
          />
          <div
            className="flex flex-1 items-center justify-center gap-1.5 rounded-[11px] border border-[#ECE5D8] bg-white px-3 py-[11px] text-[12.5px] text-[#6E766F]"
            aria-label={`댓글 ${commentCount}개`}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#9FB6AC"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <path d="M21 11.5a8.38 8.38 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z" />
            </svg>
            <span>댓글</span>
            <span className="tabular-nums">{commentCount}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {secondaryTypes.map((type) => {
            const state = states[type];
            const active = state?.reacted ?? false;
            const count = state?.totalCount ?? 0;

            return (
              <button
                key={type}
                type="button"
                disabled={disabled}
                onClick={() => void toggle(type)}
                className={cn(
                  'inline-flex min-h-7 items-center justify-center gap-1 rounded-full border px-2.5 py-1 text-[10.5px] font-bold leading-none transition-colors',
                  active
                    ? 'border-[#0B3B36] bg-[#E7F1EC] text-[#0B3B36]'
                    : 'border-[#E2D7C8] bg-[#FFFDF8] text-[#6E766F] hover:border-[#0B3B36]/35',
                  disabled && 'cursor-not-allowed opacity-60',
                )}
              >
                <span className="shrink-0" aria-hidden>
                  {REACTION_ICONS[type]}
                </span>
                <span className="min-w-0 truncate">{REACTION_LABELS[type]}</span>
                {!isLoading && <span className="shrink-0 tabular-nums">{count}</span>}
              </button>
            );
          })}
        </div>
        {!isLoggedIn && (
          <p className="text-xs text-muted">로그인 후 반응을 남길 수 있습니다.</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2 min-[390px]:grid-cols-3 sm:flex sm:flex-wrap">
        {REACTION_TYPES.map((type) => {
          const state = states[type];
          const active = state?.reacted ?? false;
          const count = state?.totalCount ?? 0;

          return (
            <button
              key={type}
              type="button"
              disabled={disabled}
              onClick={() => void toggle(type)}
              className={cn(
                'inline-flex min-h-8 min-w-0 items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold leading-none transition-colors',
                active
                  ? 'border-[#0B3B36] bg-[#E7F1EC] text-[#0B3B36]'
                  : 'border-[#E2D7C8] bg-[#FFFDF8] text-[#6E766F] hover:border-[#0B3B36]/35',
                disabled && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="shrink-0" aria-hidden>
                {REACTION_ICONS[type]}
              </span>
              <span className="min-w-0 truncate">{REACTION_LABELS[type]}</span>
              {!isLoading && <span className="shrink-0 tabular-nums text-cream-foreground">{count}</span>}
            </button>
          );
        })}
      </div>
      {!isLoggedIn && (
        <p className="text-xs text-muted">로그인 후 반응을 남길 수 있습니다.</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
