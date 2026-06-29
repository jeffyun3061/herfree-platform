package com.herfree.domain.user.repository;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import java.time.LocalDateTime;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    // 로그인 시 이메일로 사용자를 조회한다
    Optional<User> findByEmail(String email);

    // 회원가입 전 이메일 중복 여부를 확인한다
    boolean existsByEmail(String email);

    // 특정 상태의 사용자만 조회한다 — 탈퇴 계정을 API 응답에서 걸러낼 때 사용
    Optional<User> findByIdAndStatus(Long id, UserStatus status);

    boolean existsByEmailAndStatusNot(String email, UserStatus status);

    org.springframework.data.domain.Page<User> findByStatusNotOrderByCreatedAtDesc(
            UserStatus status, org.springframework.data.domain.Pageable pageable);

    @Query("""
            select u
            from User u
            left join UserProfile p on p.user = u
            where u.status <> :deletedStatus
              and (
                (:userId is not null and u.id = :userId)
                or lower(u.email) like lower(concat('%', :keyword, '%'))
                or lower(p.nickname) like lower(concat('%', :keyword, '%'))
              )
            order by u.createdAt desc
            """)
    Page<User> searchAdminUsers(
            @Param("userId") Long userId,
            @Param("keyword") String keyword,
            @Param("deletedStatus") UserStatus deletedStatus,
            Pageable pageable);

    long countByCreatedAtAfter(LocalDateTime since);
}
