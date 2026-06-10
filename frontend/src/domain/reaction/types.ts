// 백엔드 ReactionType·ReactionTargetType enum과 동기화
export type ReactionType = 'EMPATHY' | 'COMFORT' | 'HELPFUL' | 'SUPPORT' | 'SAME';
export type ReactionTargetType = 'POST' | 'COMMENT';

export type ReactionRequest = {
  targetType: ReactionTargetType;
  targetId: number;
  reactionType: ReactionType;
};

// 토글 결과 (ReactionResponse) — totalCount로 클라이언트가 즉시 UI를 갱신한다
export type ReactionResult = {
  targetType: ReactionTargetType;
  targetId: number;
  reactionType: ReactionType;
  totalCount: number;
  reacted: boolean;
};

export const REACTION_TYPES: ReactionType[] = ['EMPATHY', 'COMFORT', 'HELPFUL', 'SUPPORT', 'SAME'];

export const REACTION_LABELS: Record<ReactionType, string> = {
  EMPATHY: '공감해요',
  COMFORT: '위로해요',
  HELPFUL: '도움됐어요',
  SUPPORT: '응원해요',
  SAME: '나도 그래요',
};

export const REACTION_ICONS: Record<ReactionType, string> = {
  EMPATHY: '💚',
  COMFORT: '🫂',
  HELPFUL: '💡',
  SUPPORT: '📣',
  SAME: '🙋',
};
