package com.herfree.domain.user.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("회원 탈퇴 시 계정 DELETED 처리와 작성 콘텐츠 익명화가 수행된다")
    void withdraw_success() {
        Long userId = 1L;
        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("테스트유저")
                .isPublic(true)
                .build();

        Board board = org.mockito.Mockito.mock(Board.class);
        Post post = Post.builder()
                .board(board)
                .user(user)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .content("댓글")
                .isAnonymous(false)
                .build();

        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));
        given(postRepository.findByUserIdAndStatusNot(userId, PostStatus.DELETED)).willReturn(List.of(post));
        given(commentRepository.findByUserIdAndStatusNot(userId, CommentStatus.DELETED)).willReturn(List.of(comment));

        userService.withdraw(userId);

        assertThat(user.getStatus()).isEqualTo(UserStatus.DELETED);
        assertThat(post.isAnonymous()).isTrue();
        assertThat(comment.isAnonymous()).isTrue();
        assertThat(profile.getNickname()).isEqualTo("withdrawn_1");
        assertThat(profile.getBio()).isNull();
        assertThat(profile.isPublic()).isFalse();
    }

    @Test
    @DisplayName("이미 탈퇴한 계정은 UserNotFoundException을 던진다")
    void withdraw_deletedUser_throwsNotFound() {
        Long userId = 99L;
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.withdraw(userId))
                .isInstanceOf(UserNotFoundException.class);
    }
}
