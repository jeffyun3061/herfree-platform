package com.herfree.domain.post.dto.response;

import com.herfree.domain.post.entity.Post;
import java.time.LocalDateTime;

// 게시글 상세 응답 DTO — 본문과 메타 정보를 모두 포함한다.
// isMyPost 필드로 클라이언트가 수정·삭제 버튼 노출 여부를 결정할 수 있다.
public record PostDetailResponse(
        Long id,
        Long boardId,
        String boardName,
        String title,
        String content,
        String authorNickname,
        boolean isMyPost,
        int viewCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static PostDetailResponse of(Post post, String nickname, boolean isMyPost) {
        // 익명 글은 관리자와 작성자 본인을 제외한 모든 사용자에게 "익명"으로 보인다.
        // isMyPost=true이면 본인이므로 마스킹 없이 실제 닉네임을 반환한다.
        String displayNickname = (post.isAnonymous() && !isMyPost) ? "익명" : nickname;
        return new PostDetailResponse(
                post.getId(),
                post.getBoard().getId(),
                post.getBoard().getName(),
                post.getTitle(),
                post.getContent(),
                displayNickname,
                isMyPost,
                post.getViewCount(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
