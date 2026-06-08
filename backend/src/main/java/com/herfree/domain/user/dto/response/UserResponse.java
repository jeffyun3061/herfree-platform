package com.herfree.domain.user.dto.response;

import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;

// API 응답 전용 DTO — Entity를 직접 노출하지 않는 이유:
// 1. 이메일·비밀번호 같은 민감 정보가 실수로 직렬화될 위험을 막는다.
// 2. API 계약과 DB 스키마를 독립적으로 변경할 수 있다.
public record UserResponse(
        Long id,
        String nickname,
        String profileImageUrl,
        UserRole role
) {
    // User와 UserProfile을 조합해 DTO를 만드는 팩토리 메서드
    // Service에서 이 메서드 한 줄로 변환이 끝나므로 매핑 로직이 흩어지지 않는다.
    public static UserResponse of(User user, UserProfile profile) {
        return new UserResponse(
                user.getId(),
                profile.getNickname(),
                profile.getProfileImageUrl(),
                user.getRole()
        );
    }
}
