'use client';

import { useEffect, useState } from 'react';
import type { ReactionTargetType, ReactionType } from '@/domain/reaction/types';
import { REACTION_TYPES } from '@/domain/reaction/types';
import { getErrorMessage } from '@/lib/api/client';
import * as reactionsApi from '@/lib/api/reactions';

type ReactionState = {
  totalCount: number;
  reacted: boolean;
};

export function useReaction(targetType: ReactionTargetType, targetId: number) {
  const [states, setStates] = useState<Partial<Record<ReactionType, ReactionState>>>({});
  const [pendingType, setPendingType] = useState<ReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    void reactionsApi
      .fetchReactionSummary(targetType, targetId)
      .then((summary) => {
        if (cancelled) return;
        const next: Partial<Record<ReactionType, ReactionState>> = {};
        for (const type of REACTION_TYPES) {
          const item = summary.counts.find((count) => count.reactionType === type);
          next[type] = {
            totalCount: item?.totalCount ?? 0,
            reacted: item?.reacted ?? false,
          };
        }
        setStates(next);
      })
      .catch((err) => {
        if (!cancelled) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  const toggle = async (reactionType: ReactionType): Promise<void> => {
    if (pendingType) return;
    setPendingType(reactionType);
    setError(null);
    try {
      const result = await reactionsApi.toggleReaction({ targetType, targetId, reactionType });
      setStates((prev) => ({
        ...prev,
        [reactionType]: { totalCount: result.totalCount, reacted: result.reacted },
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPendingType(null);
    }
  };

  return { states, pendingType, error, isLoading, toggle };
}
