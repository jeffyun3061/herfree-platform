package com.herfree.domain.post.dto.response;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.user.entity.UserRole;
import org.junit.jupiter.api.Test;

class PostResponseNoticeTest {
    @Test
    void noticeListOmitsBodyForGuestAndKeepsItForMember() {
        Post post = mock(Post.class);
        Board board = mock(Board.class);
        when(post.getBoard()).thenReturn(board);
        when(board.getBoardType()).thenReturn("NOTICE");
        when(post.getTitle()).thenReturn("공지 제목");
        when(post.getContent()).thenReturn("공지 본문");
        assertThat(PostResponse.of(post, "운영자", null, null).contentPreview()).isEmpty();
        // A viewer ID makes PostResponse check ownership.
        var user = mock(com.herfree.domain.user.entity.User.class);
        when(post.getUser()).thenReturn(user);
        when(user.getId()).thenReturn(9L);
        assertThat(PostResponse.of(post, "운영자", 1L, UserRole.USER).contentPreview()).isEqualTo("공지 본문");
    }
}
