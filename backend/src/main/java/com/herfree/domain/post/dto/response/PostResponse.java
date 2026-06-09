package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import java.time.LocalDateTime;

// 게시글 목록 응답 DTO — 본문(content)은 목록에서 제외해 응답 크기를 줄인다.
// 상세 내용은 PostDetailResponse에서 제공한다.
public record PostResponse(
        Long id,
        Long boardId,
        String boardName,
        String title,
        String authorNickname,
        int viewCount,
        LocalDateTime createdAt
) {
    // 익명 여부에 따라 닉네임 마스킹을 적용하는 정적 팩토리 메서드
    // 본인 글 조회(내 게시글 목록)에서는 직접 생성자를 호출해 마스킹 없이 실제 닉네임을 반환한다
    public static PostResponse of(Post post, String nickname) {
        String displayNickname = post.isAnonymous() ? "익명" : nickname;
        return new PostResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                post.getTitle(),
                displayNickname,
                post.getViewCount(),
                post.getCreatedAt()
        );
    }
}
