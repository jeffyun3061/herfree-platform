import { describe, expect, it } from 'vitest';
import {
  COMMUNITY_TAB_BOARD_TYPES,
  getCommunityBoardTabLabel,
  getCommunityBoards,
} from '@/domain/board/privateBoard';

describe('community board tabs', () => {
  it('includes anonymous concerns while excluding private inquiries and stories', () => {
    const boards = [
      { boardType: 'SUPPORT' },
      { boardType: 'NOTICE' },
      { boardType: 'ANONYMOUS_QUESTION' },
      { boardType: 'INQUIRY' },
      { boardType: 'PHOBIA' },
      { boardType: 'SECRET_STORY' },
      { boardType: 'FREE' },
      { boardType: 'RELATIONSHIP' },
      { boardType: 'EXPERIENCE' },
      { boardType: 'QUESTION' },
    ];

    expect(getCommunityBoards(boards).map((board) => board.boardType)).toEqual([
      'NOTICE',
      'ANONYMOUS_QUESTION',
      'FREE',
      'EXPERIENCE',
      'RELATIONSHIP',
      'PHOBIA',
    ]);
  });

  it('keeps the user-facing board names stable', () => {
    expect(COMMUNITY_TAB_BOARD_TYPES.map((tab) => tab.label)).toEqual([
      '공지',
      '익명 고민',
      '자유게시판',
      '정보공유',
      '연애고지',
      '검사대기',
    ]);
    expect(getCommunityBoardTabLabel('FREE')).toBe('자유게시판');
  });
});
