package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import java.time.LocalDateTime;

// 게시글 목록 응답 DTO — 목록에서는 content를 제외해 페이로드 크기를 줄인다
public record PostResponse(
        Long id,
        Long boardId,
        String boardName,
        String boardType,
        String title,
        String contentPreview,
        // 익명 여부에 따라 실제 닉네임 또는 "익명"을 반환한다
        String authorNickname,
        int viewCount,
        LocalDateTime createdAt
) {
    // 익명 글이면 닉네임을 "익명"으로 마스킹하는 로직을 팩토리 메서드 안에 응집한다.
    // Service에서 매번 조건문을 쓰지 않아도 되어 코드 중복이 줄어든다.
    public static PostResponse of(Post post, String authorNickname) {
        String displayNickname = post.isAnonymous() ? "익명" : authorNickname;
        return new PostResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                post.getBoard().getBoardType(),
                post.getTitle(),
                toPreview(post.getContent()),
                displayNickname,
                post.getViewCount(),
                post.getCreatedAt()
        );
    }

    private static String toPreview(String content) {
        if (content == null || content.isBlank()) {
            return "";
        }
        String plain = content.replaceAll("\\s+", " ").trim();
        return plain.length() > 80 ? plain.substring(0, 80) + "…" : plain;
    }
}
