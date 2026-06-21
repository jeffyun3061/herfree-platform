/** 비공개 운영·상담 게시판 — 커뮤니티 탭과 분리 */
export const MASKED_PRIVATE_TITLE = '***************';

export type PrivateBoardType = 'INQUIRY' | 'PRIVATE_CONSULT';

export function isInquiryBoardType(boardType: string): boolean {
  return boardType === 'INQUIRY';
}

export function isSecretConsultBoardType(boardType: string): boolean {
  return boardType === 'PRIVATE_CONSULT';
}

export function isPrivateBoardType(boardType: string): boolean {
  return isInquiryBoardType(boardType) || isSecretConsultBoardType(boardType);
}

/** 커뮤니티 피드·탭에서 제외 */
export function getCommunityBoards<T extends { boardType: string }>(boards: T[]): T[] {
  return boards.filter((board) => !isPrivateBoardType(board.boardType));
}

export function getPrivateBoardMetaByType(boardType: string) {
  if (isInquiryBoardType(boardType)) return PRIVATE_BOARD_META.INQUIRY;
  if (isSecretConsultBoardType(boardType)) return PRIVATE_BOARD_META.PRIVATE_CONSULT;
  return null;
}

export const PRIVATE_BOARD_META: Record<
  PrivateBoardType,
  { path: string; title: string; description: string; writeLabel: string }
> = {
  INQUIRY: {
    path: '/inquiry',
    title: '운영 문의',
    description:
      '서비스 문의·건의·악성 이용 신고 등 운영팀에 전달하는 비공개 게시판입니다. 다른 회원 글은 제목만 마스킹되어 보이며, 본인 글만 열람·수정할 수 있습니다. 답글은 운영자만 작성합니다.',
    writeLabel: '문의하기',
  },
  PRIVATE_CONSULT: {
    path: '/consult',
    title: '1:1 비밀 상담',
    description:
      '관리자와 1:1로 나누는 비공개 상담 게시판입니다. 다른 회원 글은 제목만 마스킹되어 보이며, 본인 글만 열람·수정할 수 있습니다. 답글은 운영자만 작성합니다.',
    writeLabel: '상담 글쓰기',
  },
};
