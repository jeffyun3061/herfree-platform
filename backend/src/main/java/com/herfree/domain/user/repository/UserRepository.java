package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    // 로그인 시 이메일로 사용자를 조회한다
    Optional<User> findByEmail(String email);

    // 회원가입 전 이메일 중복 여부를 확인한다
    boolean existsByEmail(String email);

    // 특정 상태의 사용자만 조회한다 — 탈퇴 계정을 API 응답에서 걸러낼 때 사용
    Optional<User> findByIdAndStatus(Long id, UserStatus status);
}
