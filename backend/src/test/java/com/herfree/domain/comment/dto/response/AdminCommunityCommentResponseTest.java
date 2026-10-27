package com.herfree.domain.comment.dto.response;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import org.junit.jupiter.api.Test;

class AdminCommunityCommentResponseTest {
    @Test void reportsParentStatusAndMasksDeletedParentTitle() {
        Comment comment = mock(Comment.class);
        Post post = mock(Post.class);
        Board board = mock(Board.class);
        when(comment.getPost()).thenReturn(post);
        when(comment.getContent()).thenReturn("댓글");
        when(post.getBoard()).thenReturn(board);
        when(board.getBoardType()).thenReturn("FREE");
        when(post.getTitle()).thenReturn("삭제 전 제목");
        when(post.getStatus()).thenReturn(PostStatus.ACTIVE);
        var active = AdminCommunityCommentResponse.from(comment, "익명");
        when(post.getStatus()).thenReturn(PostStatus.HIDDEN);
        var hidden = AdminCommunityCommentResponse.from(comment, "익명");
        when(post.getStatus()).thenReturn(PostStatus.DELETED);
        var deleted = AdminCommunityCommentResponse.from(comment, "익명");
        assertThat(active.postStatus()).isEqualTo(PostStatus.ACTIVE);
        assertThat(hidden.postStatus()).isEqualTo(PostStatus.HIDDEN);
        assertThat(deleted.postStatus()).isEqualTo(PostStatus.DELETED);
        assertThat(deleted.postTitle()).isEqualTo("삭제된 게시글");
    }
}
