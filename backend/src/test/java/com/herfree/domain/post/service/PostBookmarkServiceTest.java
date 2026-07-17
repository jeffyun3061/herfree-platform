package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.post.dto.response.PostBookmarkStatusResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostBookmarkRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostBookmarkServiceTest {

    @Mock
    private PostBookmarkRepository postBookmarkRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @InjectMocks
    private PostBookmarkService postBookmarkService;

    @Test
    @DisplayName("같은 글을 다시 스크랩해도 중복 없이 저장을 요청한다")
    void bookmark_isIdempotentAtRepositoryBoundary() {
        User user = user(1L);
        Post post = post(10L, user);
        given(userRepository.findByIdAndStatus(1L, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(postRepository.findByIdAndStatus(10L, PostStatus.ACTIVE)).willReturn(Optional.of(post));

        PostBookmarkStatusResponse result = postBookmarkService.bookmark(1L, 10L);

        assertThat(result.bookmarked()).isTrue();
        verify(postBookmarkRepository).insertIfAbsent(1L, 10L);
    }

    @Test
    @DisplayName("스크랩 목록은 작성자와 반응 수를 포함해 페이지로 반환한다")
    void getBookmarkedPosts_returnsMappedPage() {
        User viewer = user(1L);
        User author = user(2L);
        Post post = post(10L, author);
        given(post.getBoard().getId()).willReturn(1L);
        given(post.getBoard().getName()).willReturn("자유 게시판");
        UserProfile profile = UserProfile.builder()
                .user(author)
                .nickname("작성자")
                .isPublic(true)
                .build();
        PageRequest pageable = PageRequest.of(0, 10);
        given(userRepository.findByIdAndStatus(1L, UserStatus.ACTIVE)).willReturn(Optional.of(viewer));
        given(postBookmarkRepository.findPostsByUserIdAndStatus(1L, PostStatus.ACTIVE, pageable))
                .willReturn(new PageImpl<>(List.of(post), pageable, 1));
        given(userProfileRepository.findByUser_IdIn(Set.of(2L))).willReturn(List.of(profile));
        given(reactionRepository.countReactionsByPostIds(Set.of(10L)))
                .willReturn(List.<Object[]>of(new Object[]{10L, 3L}));

        PostResponse result = postBookmarkService.getBookmarkedPosts(1L, pageable).getContent().get(0);

        assertThat(result.authorNickname()).isEqualTo("작성자");
        assertThat(result.reactionCount()).isEqualTo(3);
    }

    private User user(Long id) {
        User user = User.builder()
                .email("user" + id + "@example.com")
                .password("encoded")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        ReflectionTestUtils.setField(user, "id", id);
        return user;
    }

    private Post post(Long id, User author) {
        Board board = org.mockito.Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn("FREE");
        Post post = Post.builder()
                .board(board)
                .user(author)
                .title("테스트 글")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();
        ReflectionTestUtils.setField(post, "id", id);
        return post;
    }
}
