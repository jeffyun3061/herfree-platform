'use client';

import type { ReactionTargetType } from '@/domain/reaction/types';
import { REACTION_ICONS, REACTION_LABELS, REACTION_TYPES } from '@/domain/reaction/types';
import { useReaction } from '@/hooks/useReaction';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/cn';

type ReactionBarProps = {
  targetType: ReactionTargetType;
  targetId: number;
};

export function ReactionBar({ targetType, targetId }: ReactionBarProps) {
  const { isLoggedIn } = useAuth();
  const { states, pendingType, error, isLoading, toggle } = useReaction(targetType, targetId);

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
              disabled={!isLoggedIn || pendingType !== null || isLoading}
              onClick={() => void toggle(type)}
              className={cn(
                'inline-flex min-h-8 min-w-0 items-center justify-center gap-1 rounded-full border px-3 py-1.5 text-[11px] font-bold leading-none transition-colors',
                active
                  ? 'border-[#0B3B36] bg-[#E7F1EC] text-[#0B3B36]'
                  : 'border-[#E2D7C8] bg-[#FFFDF8] text-[#6E766F] hover:border-[#0B3B36]/35',
                !isLoggedIn && 'cursor-not-allowed opacity-60',
              )}
            >
              <span className="shrink-0" aria-hidden>{REACTION_ICONS[type]}</span>
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
