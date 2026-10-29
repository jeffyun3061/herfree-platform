package com.herfree.domain.post.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;

class PostSharePreviewServiceTest {
    private final PostRepository repository = mock(PostRepository.class);
    private final PostSharePreviewService service = new PostSharePreviewService(repository);

    private Post post(String boardType, PostVisibility visibility, boolean optedIn) {
        Board board = mock(Board.class);
        when(board.getBoardType()).thenReturn(boardType);
        Post post = Post.builder().board(board).title("선택한 제목").content("비밀 건강 본문")
                .visibility(visibility).build();
        post.setShareTitlePublicly(optedIn);
        when(repository.findByIdAndStatus(7L, PostStatus.ACTIVE)).thenReturn(Optional.of(post));
        return post;
    }

    @Test void optedInMemberPreviewContainsTitleButNotBody() {
        post("FREE", PostVisibility.MEMBERS_ONLY, true);
        var preview = service.getPreview(7L);
        assertThat(preview.title()).isEqualTo("선택한 제목");
        assertThat(preview.description()).isEqualTo("로그인하면 글을 볼 수 있어요.").doesNotContain("건강");
        assertThat(preview.mode()).isEqualTo("TITLE_ONLY");
        assertThat(preview.boardType()).isEqualTo("MEMBER");
    }

    @Test void defaultMemberAndAllPrivateBoardTypesRemainUnavailable() {
        post("FREE", PostVisibility.MEMBERS_ONLY, false);
        assertThatThrownBy(() -> service.getPreview(7L)).isInstanceOf(PostNotFoundException.class);
        for (String type : new String[]{"SECRET_STORY", "INQUIRY", "PRIVATE_CONSULT"}) {
            post(type, PostVisibility.MEMBERS_ONLY, true);
            assertThatThrownBy(() -> service.getPreview(7L)).isInstanceOf(PostNotFoundException.class);
        }
    }

    @Test void withdrawnTitleChoiceAndHiddenOrDeletedPostsAreNotShareable() {
        Post p = post("FREE", PostVisibility.MEMBERS_ONLY, true);
        p.update("새 제목", "새 본문", false);
        assertThatThrownBy(() -> service.getPreview(7L)).isInstanceOf(PostNotFoundException.class);
        p.setShareTitlePublicly(true); p.hide();
        assertThatThrownBy(() -> service.getPreview(7L)).isInstanceOf(PostNotFoundException.class);
        p.delete();
        assertThatThrownBy(() -> service.getPreview(7L)).isInstanceOf(PostNotFoundException.class);
    }
}
