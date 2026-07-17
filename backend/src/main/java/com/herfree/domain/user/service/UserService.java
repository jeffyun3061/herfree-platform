package com.herfree.domain.user.service;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.auth.repository.UserOAuthAccountRepository;
import com.herfree.domain.auth.repository.PasswordResetTokenRepository;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.post.repository.PostBookmarkRepository;
import com.herfree.domain.post.service.PostImageCleanupService;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
import com.herfree.domain.user.dto.response.UserActivityResponse;
import com.herfree.domain.user.dto.response.UserResponse;
import com.herfree.domain.user.entity.NicknameChangeHistory;
import com.herfree.domain.user.entity.NicknameChangeType;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.NicknameChangeTooSoonException;
import com.herfree.domain.user.exception.ReservedNicknameException;
import com.herfree.domain.user.exception.SameNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.NicknameChangeHistoryRepository;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.ReservedNicknamePolicy;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 회원 프로필·마이페이지·탈퇴.
 * <p>
 * 닉네임 변경은 쿨다운과 {@link com.herfree.global.util.ReservedNicknamePolicy}를 적용한다.
 * 탈퇴 시 이메일·비밀번호·OAuth·reset token·닉네임 이력 원문을 제거하고 게시글 이미지는 {@link PostImageCleanupService}로 정리한다.
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private static final int NICKNAME_CHANGE_COOLDOWN_DAYS = 30;

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final NicknameChangeHistoryRepository nicknameChangeHistoryRepository;
    private final PostRepository postRepository;
    private final PostBookmarkRepository postBookmarkRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BoardRepository boardRepository;
    private final JournalRecordRepository journalRecordRepository;
    private final UserOAuthAccountRepository userOAuthAccountRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final PostImageCleanupService postImageCleanupService;

    // 내 정보 조회 — DELETED 상태 계정은 조회 불가
    // 탈퇴한 회원의 JWT가 만료 전에 재사용될 경우를 방어하기 위해
    // findByIdAndStatus로 ACTIVE 계정만 허용한다.
    @Transactional(readOnly = true)
    public UserResponse getMyInfo(Long userId) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        return UserResponse.of(user, profile);
    }

    // 프로필 수정 — 닉네임 변경 시 중복 체크를 먼저 수행한다
    // 닉네임이 같으면 자기 자신과 비교되어 false가 나오므로,
    // 현재 닉네임과 다를 때만 중복 검사를 실행한다.
    @Transactional
    public UserResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        String nextNickname = request.nickname().trim();

        if (profile.getNickname().equals(nextNickname)) {
            throw new SameNicknameException();
        }

        // 닉네임은 커뮤니티 노출명이므로 악용 방지를 위해 일반 회원은 30일에 한 번만 변경한다.
        if (ReservedNicknamePolicy.isReserved(nextNickname)) {
            throw new ReservedNicknameException();
        }
        if (userProfileRepository.existsByNickname(nextNickname)) {
            throw new DuplicateNicknameException();
        }
        assertNicknameChangeAllowed(userId);
        String oldNickname = profile.getNickname();
        profile.updateNickname(nextNickname);
        nicknameChangeHistoryRepository.save(NicknameChangeHistory.builder()
                .user(user)
                .actor(user)
                .oldNickname(oldNickname)
                .newNickname(nextNickname)
                .changeType(NicknameChangeType.USER)
                .reason("사용자 직접 변경")
                .build());

        profile.updateBio(request.bio());

        return UserResponse.of(user, profile);
    }

    private void assertNicknameChangeAllowed(Long userId) {
        Instant cutoff = Instant.now().minus(NICKNAME_CHANGE_COOLDOWN_DAYS, ChronoUnit.DAYS);
        nicknameChangeHistoryRepository
                .findFirstByUserIdAndChangeTypeAndCreatedAtAfterOrderByCreatedAtDesc(
                        userId,
                        NicknameChangeType.USER,
                        cutoff
                )
                .ifPresent(history -> {
                    throw new NicknameChangeTooSoonException();
                });
    }

    // 회원 탈퇴 — 물리 삭제 대신 DELETED 상태로 전환하고 작성 콘텐츠를 익명 처리한다.
    // requirements.md §6: 계정 상태 DELETED 처리 + 커뮤니티 맥락 보존
    @Transactional
    public void withdraw(Long userId) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        java.util.List<Post> posts = postRepository.findByUserIdAndStatusNot(userId, PostStatus.DELETED);
        postImageCleanupService.deleteImagesForPostIds(posts.stream().map(Post::getId).toList());
        for (Post post : posts) {
            post.anonymize();
        }

        for (Comment comment : commentRepository.findByUserIdAndStatusNot(userId, CommentStatus.DELETED)) {
            comment.anonymize();
        }

        journalRecordRepository.deleteAllByUserId(userId);
        userOAuthAccountRepository.deleteAllByUserId(userId);
        passwordResetTokenRepository.deleteAllByUserId(userId);
        nicknameChangeHistoryRepository.anonymizeByUserId(userId);
        postBookmarkRepository.deleteAllByUserId(userId);

        profile.maskOnWithdraw(userId);
        user.withdraw(userId);
    }

    // 마이페이지 활동 요약
    @Transactional(readOnly = true)
    public UserActivityResponse getMyActivity(Long userId) {
        int totalPosts = (int) postRepository.countByUserIdAndStatus(userId, PostStatus.ACTIVE);
        int symptomPosts = boardRepository.findByBoardType("SYMPTOM")
                .map(board -> (int) postRepository.countByUserIdAndBoardIdAndStatus(
                        userId, board.getId(), PostStatus.ACTIVE))
                .orElse(0);
        long receivedReactions = reactionRepository.countReactionsOnUserPosts(userId);
        long bookmarkCount = postBookmarkRepository.countActiveByUserId(userId);
        Instant lastPostAt = postRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PostStatus.ACTIVE)
                .map(Post::getCreatedAt)
                .orElse(null);
        Instant memberSince = userRepository.findById(userId)
                .map(User::getCreatedAt)
                .orElse(null);

        return new UserActivityResponse(
                totalPosts,
                symptomPosts,
                receivedReactions,
                bookmarkCount,
                lastPostAt,
                memberSince
        );
    }

    // 내가 작성한 게시글 목록 — 삭제된 글은 제외하고 ACTIVE 상태만 반환한다.
    // 익명으로 작성한 글도 본인 조회이므로 실제 닉네임을 표시한다.
    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPosts(Long userId, Long boardId, Pageable pageable) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        Page<Post> posts = boardId != null
                ? postRepository.findByUserIdAndBoardIdAndStatusOrderByCreatedAtDesc(
                        userId, boardId, PostStatus.ACTIVE, pageable)
                : postRepository.findByUserIdAndStatusOrderByCreatedAtDesc(
                        userId, PostStatus.ACTIVE, pageable);

        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        Map<Long, Integer> reactions = resolveReactionCounts(posts);
        return posts.map(post -> PostResponse.of(
                post,
                profile.getNickname(),
                userId,
                user.getRole(),
                false,
                reactions.getOrDefault(post.getId(), 0)
        ));
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPostsWithReceivedReactions(Long userId, Pageable pageable) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
        Page<Post> posts = postRepository.findPostsWithReceivedReactions(
                userId,
                PostStatus.ACTIVE,
                pageable
        );
        Map<Long, Integer> reactions = resolveReactionCounts(posts);
        return posts.map(post -> PostResponse.of(
                post,
                profile.getNickname(),
                userId,
                user.getRole(),
                false,
                reactions.getOrDefault(post.getId(), 0)
        ));
    }

    private Map<Long, Integer> resolveReactionCounts(Page<Post> posts) {
        Set<Long> postIds = posts.getContent().stream().map(Post::getId).collect(Collectors.toSet());
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return reactionRepository.countReactionsByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).intValue()
                ));
    }
}
