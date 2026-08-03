package com.herfree.global.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;

import com.herfree.global.config.ForwardedHeaderProperties;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ClientIpExtractorTest {

    @Test
    @DisplayName("신뢰 프록시에서 온 요청이면 X-Forwarded-For의 원 클라이언트 IP를 사용한다")
    void extract_trustedProxy_usesForwardedFor() {
        ClientIpExtractor extractor = new ClientIpExtractor(
                new ForwardedHeaderProperties("10.0.0.0/8,127.0.0.1/32"));
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(request.getRemoteAddr()).willReturn("10.1.2.3");
        given(request.getHeader("X-Forwarded-For")).willReturn("203.0.113.10, 10.1.2.3");

        assertThat(extractor.extract(request)).isEqualTo("203.0.113.10");
    }

    @Test
    @DisplayName("신뢰하지 않는 원격 주소가 보낸 X-Forwarded-For는 무시한다")
    void extract_untrustedRemote_ignoresForwardedFor() {
        ClientIpExtractor extractor = new ClientIpExtractor(
                new ForwardedHeaderProperties("10.0.0.0/8"));
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(request.getRemoteAddr()).willReturn("198.51.100.20");
        given(request.getHeader("X-Forwarded-For")).willReturn("203.0.113.10");

        assertThat(extractor.extract(request)).isEqualTo("198.51.100.20");
    }

    @Test
    @DisplayName("X-Forwarded-For 값이 IP 형식이 아니면 원격 주소로 되돌아간다")
    void extract_invalidForwardedFor_fallsBackToRemote() {
        ClientIpExtractor extractor = new ClientIpExtractor(
                new ForwardedHeaderProperties("127.0.0.1/32"));
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(request.getRemoteAddr()).willReturn("127.0.0.1");
        given(request.getHeader("X-Forwarded-For")).willReturn("not-an-ip");

        assertThat(extractor.extract(request)).isEqualTo("127.0.0.1");
    }

    @Test
    @DisplayName("IPv6 신뢰 프록시도 CIDR로 판정한다")
    void extract_ipv6TrustedProxy_usesForwardedFor() {
        ClientIpExtractor extractor = new ClientIpExtractor(
                new ForwardedHeaderProperties("::1/128"));
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(request.getRemoteAddr()).willReturn("::1");
        given(request.getHeader("X-Forwarded-For")).willReturn("2001:db8::10");

        assertThat(extractor.extract(request)).isEqualTo("2001:db8::10");
    }

    @Test
    @DisplayName("관리자 CIDR 게이트는 literal IP만 허용한다")
    void matchesAnyCidr_rejectsHostnameAndAcceptsConfiguredRange() {
        ClientIpExtractor extractor = new ClientIpExtractor(
                new ForwardedHeaderProperties("127.0.0.1/32"));

        assertThat(extractor.matchesAnyCidr("10.20.3.4", "10.20.0.0/16")).isTrue();
        assertThat(extractor.matchesAnyCidr("10.21.3.4", "10.20.0.0/16")).isFalse();
        assertThat(extractor.matchesAnyCidr("admin.example", "10.20.0.0/16")).isFalse();
    }
}
