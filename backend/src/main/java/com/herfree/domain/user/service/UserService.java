package com.herfree.domain.user.service;

import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.dto.request.UpdateProfileRequest;
import com.herfree.domain.user.dto.response.UserResponse;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.DuplicateNicknameException;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
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

    // 회원 탈퇴 — User 도메인 메서드에 상태 전환 책임을 위임한다.
    // Service는 "누가 탈퇴하는가"를 검증하고, 상태를 어떻게 바꾸는지는 엔티티가 알고 있다.
    @Transactional
    public void withdraw(Long userId) {
        User user = userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
        user.withdraw();
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
            if (userProfileRepository.existsByNickname(request.nickname())) {
                throw new DuplicateNicknameException();
            }
            profile.updateNickname(request.nickname());
        }

        profile.updateBio(request.bio());

        return UserResponse.of(user, profile);
    }

    // 내가 작성한 게시글 목록 — 삭제된 글은 제외하고 ACTIVE 상태만 반환한다.
    // 익명으로 작성한 글도 본인 조회이므로 isAnonymous 마스킹 없이 실제 닉네임을 표시한다.
    // PostResponse.of()는 isAnonymous=true이면 "익명"으로 마스킹하므로,
    // 내 게시글 조회는 직접 생성자를 호출해 항상 실제 닉네임을 반환한다.
    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPosts(Long userId, Pageable pageable) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        String nickname = profile.getNickname();

        return postRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(userId, PostStatus.ACTIVE, pageable)
                .map(post -> new PostResponse(
                        post.getId(),
                        post.getBoard().getId(),
                        post.getBoard().getName(),
                        post.getTitle(),
                        nickname,
                        post.getViewCount(),
                        post.getCreatedAt()
                ));
    }
}
