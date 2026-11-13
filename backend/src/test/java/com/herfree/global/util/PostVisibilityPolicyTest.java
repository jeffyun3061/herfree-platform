package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.user.entity.UserRole;
import org.junit.jupiter.api.Test;

class PostVisibilityPolicyTest {
    @Test
    void noticeRequiresLoginEvenWhenPublic() {
        Post notice = mock(Post.class);
        assertThatThrownBy(() -> PostVisibilityPolicy.assertReadable(notice, null, null))
                .isInstanceOf(PostNotFoundException.class);
        Board board = mock(Board.class);
        when(notice.getBoard()).thenReturn(board);
        when(board.getBoardType()).thenReturn("NOTICE");
        assertThatCode(() -> PostVisibilityPolicy.assertReadable(notice, 1L, UserRole.USER))
                .doesNotThrowAnyException();
    }
}
