package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 회원 인증 정보 엔티티
// 이메일·비밀번호·역할·상태만 보관한다.
// 커뮤니티 노출 정보(닉네임 등)는 UserProfile에 분리한다 — erd.md 설계 원칙 #1 참고.
@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
// JPA가 요구하는 기본 생성자를 protected로 제한해 직접 생성을 막는다.
// 엔티티 생성은 반드시 정적 팩토리 메서드나 Builder를 통하도록 강제한다.
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 로그인 식별자 — 변경 불가 정책이므로 updatable = false
    @Column(nullable = false, unique = true, updatable = false)
    private String email;

    // BCrypt 해시값이 저장된다. 평문 비밀번호를 절대 넣지 않는다.
    @Column(nullable = false)
    private String password;

    // DB에는 문자열("USER", "ADMIN" 등)로 저장하되,
    // 코드에서는 enum 타입으로 다뤄 오타로 인한 오류를 방지한다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserRole role;

    // 계정 상태 — soft delete를 위해 DELETED 상태를 별도로 관리한다.
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private UserStatus status;

    @Builder
    private User(String email, String password, UserRole role, UserStatus status) {
        this.email = email;
        this.password = password;
        // 기본값을 Builder 안에서 처리하면 호출 측 코드가 훨씬 단순해진다.
        this.role = (role != null) ? role : UserRole.USER;
        this.status = (status != null) ? status : UserStatus.ACTIVE;
    }

    // --- 도메인 메서드 ---
    // setter가 아닌 도메인 메서드를 사용하는 이유:
    // "비밀번호를 변경하다"는 비즈니스 행위를 코드로 명시적으로 표현하기 위함이다.
    // setPassword()라고 쓰면 단순 값 주입과 구별이 되지 않아 의도가 흐려진다.

    // 비밀번호 변경 — 호출 전 반드시 새 비밀번호를 BCrypt로 인코딩해야 한다
    public void changePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    // 관리자에 의한 계정 정지 — 로그인은 막히지만 데이터는 보존된다
    public void suspend() {
        this.status = UserStatus.SUSPENDED;
    }

    // 회원 탈퇴 처리 — 물리 삭제 대신 DELETED 상태로 전환한다
    // 게시글·댓글 등 연관 데이터를 익명 처리하는 로직은 Service에서 담당한다
    public void withdraw() {
        this.status = UserStatus.DELETED;
    }

    // 계정 활성화 — 정지 해제 또는 관리자 복구 시 사용
    public void activate() {
        this.status = UserStatus.ACTIVE;
    }
}
