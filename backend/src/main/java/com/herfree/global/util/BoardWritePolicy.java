package com.herfree.global.util;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.exception.PostAccessDeniedException;
import java.util.Set;

public final class BoardWritePolicy {

    private static final Set<String> COMMUNITY_WRITE_BLOCKED = Set.of("NOTICE", "EXPERT");

    private BoardWritePolicy() {
    }

    /** 공지·전문가 게시판은 커뮤니티 글쓰기 API로 등록할 수 없다 — 운영 CMS·관리 API 사용 */
    public static void assertCommunityWritable(Board board) {
        if (board != null && COMMUNITY_WRITE_BLOCKED.contains(board.getBoardType())) {
            throw new PostAccessDeniedException();
        }
    }
}
