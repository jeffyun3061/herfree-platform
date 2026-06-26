package com.herfree.domain.user.service;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
import com.herfree.domain.user.dto.response.UserActivityResponse;
import com.herfree.domain.user.dto.response.UserResponse;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.ReservedNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.ReservedNicknamePolicy;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReactionRepository reactionRepository;
    private final BoardRepository boardRepository;

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

        // 현재 닉네임과 다를 때만 중복 검사 — 같은 닉네임으로 수정 요청 시 통과
        if (!profile.getNickname().equals(request.nickname())) {
            if (ReservedNicknamePolicy.isReserved(request.nickname())) {
                throw new ReservedNicknameException();
            }
            if (userProfileRepository.existsByNickname(request.nickname())) {
                throw new DuplicateNicknameException();
            }
            profile.updateNickname(request.nickname());
        }

        profile.updateBio(request.bio());

        return UserResponse.of(user, profile);
    }

    // 회원 탈퇴 — 물리 삭제 대신 DELETED 상태로 전환하고 작성 콘텐츠를 익명 처리한다.
    // requirements.md §6: 계정 상태 DELETED 처리 + 커뮤니티 맥락 보존
    @Transactional
    public void withdraw(Long userId) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        for (Post post : postRepository.findByUserIdAndStatusNot(userId, PostStatus.DELETED)) {
            post.anonymize();
        }

        for (Comment comment : commentRepository.findByUserIdAndStatusNot(userId, CommentStatus.DELETED)) {
            comment.anonymize();
        }

        profile.maskOnWithdraw(userId);
        user.withdraw();
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
        LocalDateTime lastPostAt = postRepository
                .findFirstByUserIdAndStatusOrderByCreatedAtDesc(userId, PostStatus.ACTIVE)
                .map(Post::getCreatedAt)
                .orElse(null);
        LocalDateTime memberSince = userRepository.findById(userId)
                .map(User::getCreatedAt)
                .orElse(null);

        return new UserActivityResponse(totalPosts, symptomPosts, receivedReactions, lastPostAt, memberSince);
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
        return posts.map(post -> PostResponse.of(post, profile.getNickname(), userId, user.getRole()));
    }
}
