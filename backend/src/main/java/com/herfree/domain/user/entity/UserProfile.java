package com.herfree.domain.user.entity;

import com.herfree.global.common.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 사용자 커뮤니티 노출 정보 엔티티
// User와 1:1 관계이며, 닉네임·프로필 이미지·소개 등 커뮤니티 활동에 필요한 정보를 담는다.
// 인증 테이블(User)과 분리한 덕분에 프로필 수정이 인증 정보에 영향을 주지 않는다.
@Getter
@Entity
@Table(name = "user_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // FetchType.LAZY: 프로필 조회 시 User 전체를 불필요하게 로딩하지 않기 위해 지연 로딩 사용
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    // 커뮤니티에서 사용하는 표시명 — unique 제약은 DB와 코드 양쪽에서 보장한다
    @Column(nullable = false, unique = true, length = 50)
    private String nickname;

    // NULL 허용 — 프로필 이미지를 설정하지 않은 경우 기본 이미지를 클라이언트에서 처리한다
    @Column(length = 500)
    private String profileImageUrl;

    // NULL 허용 — 자기소개 미작성이 일반적인 상황
    @Column(length = 500)
    private String bio;

    // 프로필 공개 여부 — 기본값은 공개(true)
    @Column(nullable = false)
    private boolean isPublic;

    @Builder
    private UserProfile(User user, String nickname, String profileImageUrl, String bio, boolean isPublic) {
        this.user = user;
        this.nickname = nickname;
        this.profileImageUrl = profileImageUrl;
        this.bio = bio;
        this.isPublic = isPublic;
    }

    // --- 도메인 메서드 ---

    // 닉네임 변경 — 중복 검증은 Service에서 먼저 수행한 뒤 이 메서드를 호출해야 한다
    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    // 자기소개 수정 — null 허용, 비어있으면 소개 삭제로 처리된다
    public void updateBio(String bio) {
        this.bio = bio;
    }

    // 프로필 이미지 URL 변경 — 파일 업로드 완료 후 반환된 URL을 넘긴다
    public void updateProfileImage(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl;
    }

    // 프로필 공개 여부 전환
    public void togglePublic(boolean isPublic) {
        this.isPublic = isPublic;
    }

    // 탈퇴 시 닉네임 unique 제약을 풀고 개인정보를 비운다.
    // userId 기반 접두사를 쓰면 재가입 시 이전 닉네임을 다른 회원이 사용할 수 있다.
    public void maskOnWithdraw(Long userId) {
        this.nickname = "withdrawn_" + userId;
        this.profileImageUrl = null;
        this.bio = null;
        this.isPublic = false;
    }
}
