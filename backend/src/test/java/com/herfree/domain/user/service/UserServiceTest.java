package com.herfree.domain.user.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.auth.repository.UserOAuthAccountRepository;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.auth.service.CurrentPasswordLockoutService;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.post.repository.PostBookmarkRepository;
import com.herfree.domain.post.service.PostImageCleanupService;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
import com.herfree.domain.user.dto.request.ChangePasswordRequest;
import com.herfree.domain.user.entity.NicknameChangeHistory;
import com.herfree.domain.user.entity.NicknameChangeType;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.NicknameChangeTooSoonException;
import com.herfree.domain.user.exception.SameNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.exception.InvalidCurrentPasswordException;
import com.herfree.domain.user.exception.PasswordChangeNotAvailableException;
import com.herfree.domain.user.exception.SamePasswordException;
import com.herfree.domain.user.repository.NicknameChangeHistoryRepository;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private NicknameChangeHistoryRepository nicknameChangeHistoryRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostBookmarkRepository postBookmarkRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @Mock
    private UserOAuthAccountRepository userOAuthAccountRepository;

    @Mock
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Mock
    private PostImageCleanupService postImageCleanupService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private CurrentPasswordLockoutService currentPasswordLockoutService;

    @InjectMocks
    private UserService userService;

    @Test
    @DisplayName("활동 요약은 활성 게시글의 스크랩 수를 반환한다")
    void getMyActivity_returnsActiveBookmarkCount() {
        Long userId = 1L;
        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        given(postRepository.countByUserIdAndStatus(userId, PostStatus.ACTIVE)).willReturn(2L);
        given(boardRepository.findByBoardType("SYMPTOM")).willReturn(Optional.empty());
        given(reactionRepository.countReactionsOnUserPosts(userId)).willReturn(3L);
        given(postBookmarkRepository.countActiveByUserId(userId)).willReturn(4L);
        given(postRepository.findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PostStatus.ACTIVE))
                .willReturn(Optional.empty());
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        var result = userService.getMyActivity(userId);

        assertThat(result.totalPosts()).isEqualTo(2);
        assertThat(result.receivedReactions()).isEqualTo(3);
        assertThat(result.bookmarkCount()).isEqualTo(4);
    }

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
        ReflectionTestUtils.setField(post, "id", 1L);

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
        assertThat(user.getEmail()).isEqualTo("withdrawn-1@deleted.invalid");
        assertThat(user.getPassword()).isEqualTo("withdrawn-account-disabled");
        assertThat(post.isAnonymous()).isTrue();
        assertThat(comment.isAnonymous()).isTrue();
        assertThat(profile.getNickname()).isEqualTo("withdrawn_1");
        assertThat(profile.getBio()).isNull();
        assertThat(profile.isPublic()).isFalse();
        verify(journalRecordRepository).deleteAllByUserId(userId);
        verify(userOAuthAccountRepository).deleteAllByUserId(userId);
        verify(passwordResetTokenRepository).deleteAllByUserId(userId);
        verify(nicknameChangeHistoryRepository).anonymizeByUserId(userId);
        verify(postBookmarkRepository).deleteAllByUserId(userId);
        verify(postImageCleanupService).deleteImagesForPostIds(List.of(post.getId()));
    }

    @Test
    @DisplayName("이미 탈퇴한 계정은 UserNotFoundException을 던진다")
    void withdraw_deletedUser_throwsNotFound() {
        Long userId = 99L;
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.empty());

        assertThatThrownBy(() -> userService.withdraw(userId))
                .isInstanceOf(UserNotFoundException.class);
    }

    @Test
    @DisplayName("같은 닉네임으로 변경을 요청하면 변경하지 않는다")
    void updateProfile_sameNickname_throwsSameNickname() {
        Long userId = 1L;
        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("기존닉네임")
                .isPublic(true)
                .build();

        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

        assertThatThrownBy(() -> userService.updateProfile(userId, new UpdateProfileRequest(" 기존닉네임 ", null)))
                .isInstanceOf(SameNicknameException.class);

        assertThat(profile.getNickname()).isEqualTo("기존닉네임");
        verify(userProfileRepository, never()).existsByNickname(any());
        verify(nicknameChangeHistoryRepository, never()).save(any(NicknameChangeHistory.class));
    }

    @Test
    @DisplayName("닉네임 변경 성공 시 변경 이력을 저장한다")
    void updateProfile_nicknameChanged_savesHistory() {
        Long userId = 1L;
        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("기존닉네임")
                .isPublic(true)
                .build();

        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));
        given(userProfileRepository.existsByNickname("새닉네임")).willReturn(false);
        given(nicknameChangeHistoryRepository.findFirstByUserIdAndChangeTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                any(), any(), any()
        )).willReturn(Optional.empty());

        userService.updateProfile(userId, new UpdateProfileRequest(" 새닉네임 ", null));

        assertThat(profile.getNickname()).isEqualTo("새닉네임");
        verify(nicknameChangeHistoryRepository).save(any(NicknameChangeHistory.class));
    }

    @Test
    @DisplayName("닉네임은 30일 안에 다시 변경할 수 없다")
    void updateProfile_recentNicknameChange_throwsTooSoon() {
        Long userId = 1L;
        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("기존닉네임")
                .isPublic(true)
                .build();
        NicknameChangeHistory history = NicknameChangeHistory.builder()
                .user(user)
                .actor(user)
                .oldNickname("이전닉네임")
                .newNickname("기존닉네임")
                .changeType(NicknameChangeType.USER)
                .reason("사용자 직접 변경")
                .build();

        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));
        given(userProfileRepository.existsByNickname("새닉네임")).willReturn(false);
        given(nicknameChangeHistoryRepository.findFirstByUserIdAndChangeTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                any(), any(), any()
        )).willReturn(Optional.of(history));

        assertThatThrownBy(() -> userService.updateProfile(userId, new UpdateProfileRequest("새닉네임", null)))
                .isInstanceOf(NicknameChangeTooSoonException.class);
    }

    @Test
    @DisplayName("현재 비밀번호 확인 후 비밀번호를 변경하고 재설정 토큰을 폐기한다")
    void changePassword_validCurrentPassword_updatesCredential() {
        Long userId = 1L;
        User user = User.builder()
                .email("user@test.com")
                .password("old-encoded")
                .status(UserStatus.ACTIVE)
                .build();
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userOAuthAccountRepository.existsByUserId(userId)).willReturn(false);
        given(passwordEncoder.matches("Current-password-123!", "old-encoded")).willReturn(true);
        given(passwordEncoder.matches("New-password-456!", "old-encoded")).willReturn(false);
        given(passwordEncoder.encode("New-password-456!")).willReturn("new-encoded");

        userService.changePassword(
                userId,
                new ChangePasswordRequest("Current-password-123!", "New-password-456!")
        );

        assertThat(user.getPassword()).isEqualTo("new-encoded");
        assertThat(user.getCredentialVersion()).isEqualTo(1);
        verify(passwordResetTokenRepository).deleteAllByUserId(userId);
        verify(currentPasswordLockoutService).clearFailures(userId);
    }

    @Test
    @DisplayName("현재 비밀번호가 틀리면 비밀번호를 변경하지 않는다")
    void changePassword_invalidCurrentPassword_rejected() {
        Long userId = 1L;
        User user = User.builder()
                .email("user@test.com")
                .password("old-encoded")
                .status(UserStatus.ACTIVE)
                .build();
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("Wrong-password-123!", "old-encoded")).willReturn(false);

        assertThatThrownBy(() -> userService.changePassword(
                userId,
                new ChangePasswordRequest("Wrong-password-123!", "New-password-456!")
        )).isInstanceOf(InvalidCurrentPasswordException.class);

        verify(currentPasswordLockoutService).recordFailure(userId);

        assertThat(user.getPassword()).isEqualTo("old-encoded");
        verify(passwordResetTokenRepository, never()).deleteAllByUserId(any());
    }

    @Test
    @DisplayName("현재 비밀번호를 새 비밀번호로 다시 사용할 수 없다")
    void changePassword_samePassword_rejected() {
        Long userId = 1L;
        User user = User.builder()
                .email("user@test.com")
                .password("encoded")
                .status(UserStatus.ACTIVE)
                .build();
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(passwordEncoder.matches("Same-password-123!", "encoded")).willReturn(true);

        assertThatThrownBy(() -> userService.changePassword(
                userId,
                new ChangePasswordRequest("Same-password-123!", "Same-password-123!")
        )).isInstanceOf(SamePasswordException.class);
    }

    @Test
    @DisplayName("소셜 전용 계정은 로컬 비밀번호 변경을 사용할 수 없다")
    void changePassword_oauthUser_rejected() {
        Long userId = 1L;
        User user = User.builder()
                .email("social@test.com")
                .password("oauth-random-encoded")
                .status(UserStatus.ACTIVE)
                .build();
        given(userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)).willReturn(Optional.of(user));
        given(userOAuthAccountRepository.existsByUserId(userId)).willReturn(true);

        assertThatThrownBy(() -> userService.changePassword(
                userId,
                new ChangePasswordRequest("Unknown-password-123!", "New-password-456!")
        )).isInstanceOf(PasswordChangeNotAvailableException.class);

        verify(passwordEncoder, never()).matches(any(), any());
    }
}
