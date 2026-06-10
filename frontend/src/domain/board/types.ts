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

// 게시판별 아이콘 — 이름 문자열 대신 boardType 코드로 매칭해 이름 변경에 안전하다
export const BOARD_ICONS: Record<string, string> = {
  NOTICE: '📢',
  PHOBIA: '🌫️',
  SYMPTOM: '📋',
  EXPERIENCE: '🤝',
  RELATIONSHIP: '💌',
  SUPPORT: '🌿',
  EXPERT: '🩺',
  PRODUCT_REVIEW: '🧴',
  FREE: '💬',
};

export function getBoardIcon(boardType: string): string {
  return BOARD_ICONS[boardType] ?? '💬';
}

export function findBoardByType(boards: Board[], boardType: BoardType): Board | undefined {
  return boards.find((board) => board.boardType === boardType);
}

// 공지사항은 운영자만 작성하므로 일반 회원 글쓰기 대상에서 제외한다
export function getWritableBoards(boards: Board[]): Board[] {
  return boards.filter((board) => board.boardType !== 'NOTICE');
}
