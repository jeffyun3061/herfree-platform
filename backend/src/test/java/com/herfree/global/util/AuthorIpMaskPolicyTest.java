package com.herfree.global.util;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class AuthorIpMaskPolicyTest {

    @Test
    @DisplayName("IPv4는 앞 두 옥텟만 노출한다")
    void mask_ipv4() {
        assertThat(AuthorIpMaskPolicy.mask("203.0.113.10")).isEqualTo("203.0.*");
    }

    @Test
    @DisplayName("로컬호스트는 local로 표시한다")
    void mask_localhost() {
        assertThat(AuthorIpMaskPolicy.mask("127.0.0.1")).isEqualTo("local");
    }

    @Test
    @DisplayName("빈 값은 null을 반환한다")
    void mask_blank() {
        assertThat(AuthorIpMaskPolicy.mask(" ")).isNull();
    }
}
