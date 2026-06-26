package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.exception.BusinessException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ContentWritePolicy")
class ContentWritePolicyTest {

    @Test
    @DisplayName("운영자·전문가·크리에이터만 칼럼을 작성할 수 있다")
    void canWrite_permittedRoles() {
        assertThat(ContentWritePolicy.canWrite(UserRole.USER)).isFalse();
        assertThat(ContentWritePolicy.canWrite(UserRole.MODERATOR)).isTrue();
        assertThat(ContentWritePolicy.canWrite(UserRole.ADMIN)).isTrue();
        assertThat(ContentWritePolicy.canWrite(UserRole.SUPER_ADMIN)).isTrue();
        assertThat(ContentWritePolicy.canWrite(UserRole.DOCTOR)).isTrue();
        assertThat(ContentWritePolicy.canWrite(UserRole.CREATOR)).isTrue();
    }

    @Test
    @DisplayName("일반 회원은 칼럼 작성이 거부된다")
    void assertCanWrite_userDenied() {
        assertThatThrownBy(() -> ContentWritePolicy.assertCanWrite(UserRole.USER))
                .isInstanceOf(BusinessException.class);
    }
}
