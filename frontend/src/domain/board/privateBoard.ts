/** 비공개·마스킹 게시판 정책 */
export const MASKED_PRIVATE_TITLE = '******';

export const SECRET_STORY_DETAIL_MESSAGE = '비밀 사연 입니다.';

export type OffCommunityPrivateBoardType = 'INQUIRY' | 'PRIVATE_CONSULT';

/** @deprecated use {@link OffCommunityPrivateBoardType} */
export type PrivateBoardType = OffCommunityPrivateBoardType;

export function isInquiryBoardType(boardType: string): boolean {
  return boardType === 'INQUIRY';
}

export function isSecretConsultBoardType(boardType: string): boolean {
  return boardType === 'PRIVATE_CONSULT';
}

export function isSecretStoryBoardType(boardType: string): boolean {
  return boardType === 'SECRET_STORY';
}

export function isQuestionBoardType(boardType: string): boolean {
  return boardType === 'QUESTION';
}

/** 푸터·전용 글쓰기 경로 — 운영 문의·1:1 상담 (커뮤니티 탭에는 상담 게시판 노출) */
export function isOffCommunityPrivateBoardType(boardType: string): boolean {
  return isInquiryBoardType(boardType) || isSecretConsultBoardType(boardType);
}

/** @deprecated use {@link isOffCommunityPrivateBoardType} */
export function isPrivateBoardType(boardType: string): boolean {
  return isOffCommunityPrivateBoardType(boardType);
}

/** 제목 마스킹·운영자 답글 정책 (비밀사연·문의·상담) */
export function isMaskedBoardType(boardType: string): boolean {
  return isInquiryBoardType(boardType)
    || isSecretConsultBoardType(boardType)
    || isSecretStoryBoardType(boardType);
}

/** 커뮤니티 탭에서 제외 (문의·전문가 정보방 — 칼럼 메뉴로 대체) */
export function isOffCommunityTabBoardType(boardType: string): boolean {
  return isInquiryBoardType(boardType) || boardType === 'EXPERT';
}

/** 커뮤니티 탭 — 문의·전문가 정보방 제외 (1:1 상담은 커뮤니티 카테고리로 노출) */
export function getCommunityBoards<T extends { boardType: string }>(boards: T[]): T[] {
  return boards.filter((board) => !isOffCommunityTabBoardType(board.boardType));
}

export function getPrivateBoardMetaByType(boardType: string) {
  if (isInquiryBoardType(boardType)) return PRIVATE_BOARD_META.INQUIRY;
  if (isSecretConsultBoardType(boardType)) return PRIVATE_BOARD_META.PRIVATE_CONSULT;
  return null;
}

export const PRIVATE_BOARD_META: Record<
  OffCommunityPrivateBoardType,
  { path: string; writePath: string; title: string; description: string; writeLabel: string }
> = {
  INQUIRY: {
    path: '/inquiry',
    writePath: '/inquiry/write',
    title: '운영 문의',
    description:
      '서비스 문의·건의·악성 이용 신고 등 운영팀에 전달하는 비공개 게시판입니다. 다른 회원 글은 제목만 마스킹되어 보이며, 본인 글만 열람·수정할 수 있습니다. 답글은 운영자만 작성합니다.',
    writeLabel: '문의하기',
  },
  PRIVATE_CONSULT: {
    path: '/consult',
    writePath: '/consult/write',
    title: '1:1 비밀 상담',
    description:
      '관리자와 1:1로 나누는 비공개 상담 게시판입니다. 다른 회원 글은 제목만 마스킹되어 보이며, 본인 글만 열람·수정할 수 있습니다. 답글은 운영자만 작성합니다.',
    writeLabel: '상담 글쓰기',
  },
};

export const SECRET_STORY_BOARD_COPY = {
  title: '비밀사연',
  bannerTitle: '헤르프리에게 사연을 제보해 주세요',
  bannerDescription:
    '마음속 이야기를 안전하게 남겨 주세요. 운영자만 전체 내용을 확인하며, 다른 회원에게는 제목만 마스킹되어 보입니다. 답변이 달리면 답변완료로 표시됩니다.',
  writeLabel: '사연 남기기',
};

export function getMaskedBoardBackHref(boardType: string, boardId: number): string {
  if (isInquiryBoardType(boardType)) return PRIVATE_BOARD_META.INQUIRY.path;
  if (isSecretConsultBoardType(boardType)) return PRIVATE_BOARD_META.PRIVATE_CONSULT.path;
  return `/community/${boardId}`;
}

export function getPrivateBoardWriteHref(boardType: OffCommunityPrivateBoardType): string {
  return PRIVATE_BOARD_META[boardType].writePath;
}

export function resolvePrivateBoardWritePath(
  boards: { id: number; boardType: string }[],
  boardId: number,
): string | null {
  if (boardId <= 0) return null;
  const target = boards.find((board) => board.id === boardId);
  if (!target || !isOffCommunityPrivateBoardType(target.boardType)) return null;
  return getPrivateBoardMetaByType(target.boardType)?.writePath ?? null;
}

export function getPrivatePostWriteHref(boardType: string, postId: number): string | null {
  if (isInquiryBoardType(boardType)) return `${PRIVATE_BOARD_META.INQUIRY.writePath}?postId=${postId}`;
  if (isSecretConsultBoardType(boardType)) {
    return `${PRIVATE_BOARD_META.PRIVATE_CONSULT.writePath}?postId=${postId}`;
  }
  return null;
}
