package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.UserProfile;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    // 닉네임 중복 체크 — 회원가입과 프로필 수정 시 모두 사용된다
    boolean existsByNickname(String nickname);

    // userId로 프로필 조회 — UserProfile이 User와 1:1이므로 Optional 반환
    Optional<UserProfile> findByUserId(Long userId);

    List<UserProfile> findByUser_IdIn(Collection<Long> userIds);
}
