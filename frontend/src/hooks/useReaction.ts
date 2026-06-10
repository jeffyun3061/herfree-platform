'use client';

import { useState } from 'react';
import type { ReactionTargetType, ReactionType } from '@/domain/reaction/types';
import { getErrorMessage } from '@/lib/api/client';
import * as reactionsApi from '@/lib/api/reactions';

type ReactionState = {
  totalCount: number;
  reacted: boolean;
};

// 백엔드에 반응 집계 조회 API가 없어 초기 카운트는 알 수 없다.
// 토글 응답의 totalCount·reacted를 받아 화면을 갱신하는 방식으로 동작한다.
export function useReaction(targetType: ReactionTargetType, targetId: number) {
  const [states, setStates] = useState<Partial<Record<ReactionType, ReactionState>>>({});
  const [pendingType, setPendingType] = useState<ReactionType | null>(null);
  const [error, setError] = useState<string | null>(null);

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

  return { states, pendingType, error, toggle };
}
