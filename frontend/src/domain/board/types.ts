// V2__seed_boards.sql의 board_type 코드와 동기화
export type BoardType =
  | 'NOTICE'
  | 'PHOBIA'
  | 'SYMPTOM'
  | 'EXPERIENCE'
  | 'RELATIONSHIP'
  | 'SUPPORT'
  | 'EXPERT'
  | 'PRODUCT_REVIEW'
  | 'FREE';

// GET /api/boards 응답 (BoardResponse)
export type Board = {
  id: number;
  name: string;
  description: string;
  boardType: string;
};

export type BoardIconKey =
  | 'notice'
  | 'phobia'
  | 'symptom'
  | 'experience'
  | 'relationship'
  | 'support'
  | 'expert'
  | 'product'
  | 'free';

const BOARD_ICON_KEYS: Record<string, BoardIconKey> = {
  NOTICE: 'notice',
  PHOBIA: 'phobia',
  SYMPTOM: 'symptom',
  EXPERIENCE: 'experience',
  RELATIONSHIP: 'relationship',
  SUPPORT: 'support',
  EXPERT: 'expert',
  PRODUCT_REVIEW: 'product',
  FREE: 'free',
};

const BOARD_ACCENT_CLASSES: Record<string, string> = {
  NOTICE: 'bg-gold/15 text-gold',
  PHOBIA: 'bg-cream-dark text-muted',
  SYMPTOM: 'bg-primary/10 text-primary',
  EXPERIENCE: 'bg-gold/10 text-primary',
  RELATIONSHIP: 'bg-gold/15 text-gold',
  SUPPORT: 'bg-primary/10 text-primary-light',
  EXPERT: 'bg-primary/15 text-primary',
  PRODUCT_REVIEW: 'bg-gold/10 text-gold',
  FREE: 'bg-cream-dark text-primary',
};

export function getBoardIconKey(boardType: string): BoardIconKey {
  return BOARD_ICON_KEYS[boardType] ?? 'free';
}

export function getBoardAccentClass(boardType: string): string {
  return BOARD_ACCENT_CLASSES[boardType] ?? 'bg-cream-dark text-primary';
}

const BOARD_BANNER_CLASSES: Record<string, string> = {
  NOTICE: 'bg-gold text-gold-foreground',
  SYMPTOM: 'bg-primary text-primary-foreground',
  SUPPORT: 'bg-primary-light text-primary-foreground',
  EXPERT: 'bg-primary text-primary-foreground',
  FREE: 'bg-primary/90 text-primary-foreground',
};

export function getBoardBannerClass(boardType: string): string {
  return BOARD_BANNER_CLASSES[boardType] ?? 'bg-cream text-cream-foreground ring-1 ring-border/80';
}

export function findBoardByType(boards: Board[], boardType: BoardType): Board | undefined {
  return boards.find((board) => board.boardType === boardType);
}

// 공지·전문가 게시판은 운영자 전용이므로 일반 회원 글쓰기 대상에서 제외한다
export function getWritableBoards(boards: Board[]): Board[] {
  return boards.filter(
    (board) => board.boardType !== 'NOTICE' && board.boardType !== 'EXPERT',
  );
}
