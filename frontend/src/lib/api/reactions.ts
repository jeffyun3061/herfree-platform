import type { ReactionRequest, ReactionResult, ReactionSummary } from '@/domain/reaction/types';
import { request } from '@/lib/api/client';

export function fetchReactionSummary(
  targetType: ReactionRequest['targetType'],
  targetId: number,
): Promise<ReactionSummary> {
  return request<ReactionSummary>('/api/reactions/summary', {
    query: { targetType, targetId },
  });
}

// 백엔드가 toggle 방식이므로 등록·취소 모두 이 함수 하나로 처리한다
export function toggleReaction(input: ReactionRequest): Promise<ReactionResult> {
  return request<ReactionResult>('/api/reactions', { method: 'POST', body: input });
}
