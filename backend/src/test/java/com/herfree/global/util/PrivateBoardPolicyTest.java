package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

@DisplayName("PrivateBoardPolicy")
class PrivateBoardPolicyTest {

    @Test
    @DisplayName("비로그인 사용자는 비밀사연·문의·1:1 상담 글을 읽을 수 없다")
    void canViewerReadPost_guest_cannotReadPrivateBoards() {
        assertThat(canRead("SECRET_STORY", null, null)).isFalse();
        assertThat(canRead("INQUIRY", null, null)).isFalse();
        assertThat(canRead("PRIVATE_CONSULT", null, null)).isFalse();
    }

    @Test
    @DisplayName("비밀사연 작성자도 본인 글 전체를 읽을 수 없다")
    void canViewerReadPost_secretStoryAuthor_cannotReadOwnPost() {
        long authorId = 10L;
        assertThat(canRead("SECRET_STORY", authorId, UserRole.USER, authorId)).isFalse();
    }

    @Test
    @DisplayName("문의·1:1 상담 작성자는 본인 글을 읽을 수 있다")
    void canViewerReadPost_author_canReadOwnInquiryOrConsult() {
        long authorId = 10L;
        assertThat(canRead("INQUIRY", authorId, UserRole.USER, authorId)).isTrue();
        assertThat(canRead("PRIVATE_CONSULT", authorId, UserRole.USER, authorId)).isTrue();
    }

    @Test
    @DisplayName("타인의 비밀사연·문의·1:1 상담 글은 일반 회원이 읽을 수 없다")
    void canViewerReadPost_otherUser_cannotReadPrivatePost() {
        assertThat(canRead("SECRET_STORY", 10L, UserRole.USER, 99L)).isFalse();
        assertThat(canRead("INQUIRY", 10L, UserRole.USER, 99L)).isFalse();
        assertThat(canRead("PRIVATE_CONSULT", 10L, UserRole.USER, 99L)).isFalse();
    }

    @Test
    @DisplayName("운영자는 비밀사연·문의·1:1 상담 글을 읽을 수 있다")
    void canViewerReadPost_staff_canReadPrivatePost() {
        assertThat(canRead("SECRET_STORY", 10L, UserRole.ADMIN, 99L)).isTrue();
        assertThat(canRead("INQUIRY", 10L, UserRole.ADMIN, 99L)).isTrue();
        assertThat(canRead("PRIVATE_CONSULT", 10L, UserRole.ADMIN, 99L)).isTrue();
    }

    @Test
    @DisplayName("공개 게시판 글은 비로그인도 읽을 수 있다")
    void canViewerReadPost_publicBoard_guestCanRead() {
        assertThat(canRead("FREE", null, null)).isTrue();
        assertThat(canRead("QUESTION", null, null)).isTrue();
    }

    @Test
    @DisplayName("비공개 목록은 권한 없는 사용자에게 제목이 마스킹된다")
    void shouldMaskInList_masksForUnauthorizedViewer() {
        Post secretPost = buildPost("SECRET_STORY", 10L);
        assertThat(PrivateBoardPolicy.shouldMaskInList(secretPost, null, null)).isTrue();
        assertThat(PrivateBoardPolicy.shouldMaskInList(secretPost, 99L, UserRole.USER)).isTrue();
        assertThat(PrivateBoardPolicy.shouldMaskInList(secretPost, 10L, UserRole.USER)).isTrue();
        assertThat(PrivateBoardPolicy.shouldMaskInList(secretPost, 99L, UserRole.ADMIN)).isFalse();
    }

    @Test
    @DisplayName("마스킹 제목은 6자리 별표로 표시된다")
    void maskedTitle_isSixAsterisks() {
        assertThat(PrivateBoardPolicy.MASKED_TITLE).isEqualTo("******");
    }

    private static boolean canRead(String boardType, Long viewerId, UserRole viewerRole) {
        return canRead(boardType, 10L, viewerRole, viewerId);
    }

    private static boolean canRead(String boardType, long authorId, UserRole viewerRole, Long viewerId) {
        Post post = buildPost(boardType, authorId);
        return PrivateBoardPolicy.canViewerReadPost(post, viewerId, viewerRole);
    }

    private static Post buildPost(String boardType, long authorId) {
        Board board = Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn(boardType);

        User author = Mockito.mock(User.class);
        given(author.getId()).willReturn(authorId);

        return Post.builder()
                .board(board)
                .user(author)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.MEMBERS_ONLY)
                .isAnonymous(true)
                .build();
    }
}
