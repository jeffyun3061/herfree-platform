// V2__seed_boards.sql의 board_type 코드와 동기화
import { isOffCommunityPrivateBoardType } from '@/domain/board/privateBoard';

export type BoardType =
  | 'NOTICE'
  | 'PHOBIA'
  | 'SYMPTOM'
  | 'EXPERIENCE'
  | 'RELATIONSHIP'
  | 'SUPPORT'
  | 'EXPERT'
  | 'PRODUCT_REVIEW'
  | 'FREE'
  | 'QUESTION'
  | 'SECRET_STORY'
  | 'INQUIRY'
  | 'PRIVATE_CONSULT';

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

/** 목업 community.html 카테고리 칩 색상 */
const BOARD_TAG_CLASSES: Record<string, string> = {
  NOTICE: 'bg-[#E7ECEA] text-[#3C443E]',
  PHOBIA: 'bg-[#FFE9E0] text-[#8A3D1E]',
  SYMPTOM: 'bg-[#FFE9E0] text-[#8A3D1E]',
  EXPERIENCE: 'bg-[#E1F5EE] text-[#04342C]',
  RELATIONSHIP: 'bg-[#EDE7F6] text-[#4B3B72]',
  SUPPORT: 'bg-[#FDEAE3] text-[#7A2E12]',
  EXPERT: 'bg-[#EAF1EE] text-[#2F4A3D]',
  PRODUCT_REVIEW: 'bg-[#EAF1EE] text-[#2F4A3D]',
  FREE: 'bg-[#FDEAE3] text-[#7A2E12]',
  QUESTION: 'bg-[#FCEEE2] text-[#7A3E12]',
  SECRET_STORY: 'bg-[#E1F5EE] text-[#04342C]',
  INQUIRY: 'bg-[#E7ECEA] text-[#3C443E]',
  PRIVATE_CONSULT: 'bg-[#EDE7F6] text-[#4B3B72]',
};

export function getBoardTagClass(boardType: string): string {
  return BOARD_TAG_CLASSES[boardType] ?? 'bg-[#EAF1EE] text-[#2F4A3D]';
}

export function findBoardByType(boards: Board[], boardType: BoardType): Board | undefined {
  return boards.find((board) => board.boardType === boardType);
}

/** 운영자 전용 게시판 — 커뮤니티 글쓰기 UI·API 모두 금지, 공지는 `/admin` CMS 사용 */
export function isStaffOnlyBoardType(boardType: string): boolean {
  return boardType === 'NOTICE' || boardType === 'EXPERT';
}

// 공지·전문가·푸터 전용 비공개 게시판은 일반 커뮤니티 글쓰기 대상에서 제외
export function getWritableBoards(boards: Board[]): Board[] {
  return boards.filter(
    (board) =>
      !isStaffOnlyBoardType(board.boardType) && !isOffCommunityPrivateBoardType(board.boardType),
  );
}

export function canWriteToBoardViaCommunity(board: Board | undefined | null): boolean {
  if (!board) return false;
  return !isStaffOnlyBoardType(board.boardType);
}
