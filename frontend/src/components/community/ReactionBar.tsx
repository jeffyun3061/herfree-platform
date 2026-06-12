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
      <div className="flex flex-wrap gap-2">
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
                'inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition-colors',
                active
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border bg-card text-muted hover:border-primary/40',
                !isLoggedIn && 'cursor-not-allowed opacity-60',
              )}
            >
              <span aria-hidden>{REACTION_ICONS[type]}</span>
              <span>{REACTION_LABELS[type]}</span>
              {!isLoading && <span className="font-medium">{count}</span>}
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
