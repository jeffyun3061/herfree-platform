package com.herfree.domain.auth.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.auth.exception.PasswordResetDeliveryException;
import com.herfree.global.config.MailProperties;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.javamail.JavaMailSender;

class PasswordResetMailServiceTest {

    @Test
    @DisplayName("개발 콘솔 모드에서는 원문 reset URL을 발송/로그 대체하지 않고 억제한다")
    void sendPasswordResetEmail_consoleMode_suppressesDelivery() {
        MailProperties properties = new MailProperties("console", "noreply@herfree.test");
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> mailSenderProvider = org.mockito.Mockito.mock(ObjectProvider.class);
        Environment environment = org.mockito.Mockito.mock(Environment.class);
        given(environment.getActiveProfiles()).willReturn(new String[]{"test"});

        PasswordResetMailService service = new PasswordResetMailService(properties, mailSenderProvider, environment);

        service.sendPasswordResetEmail("user@test.com", "https://app.test/reset-password?token=secret-token");

        verify(mailSenderProvider, never()).getIfAvailable();
    }

    @Test
    @DisplayName("운영환경에서 SMTP가 아니면 재설정 요청을 안전하게 실패시킨다")
    void sendPasswordResetEmail_prodWithoutSmtp_throwsDomainException() {
        MailProperties properties = new MailProperties("console", "noreply@herfree.test");
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> mailSenderProvider = org.mockito.Mockito.mock(ObjectProvider.class);
        Environment environment = org.mockito.Mockito.mock(Environment.class);
        given(environment.getActiveProfiles()).willReturn(new String[]{"prod"});

        PasswordResetMailService service = new PasswordResetMailService(properties, mailSenderProvider, environment);

        assertThatThrownBy(() -> service.sendPasswordResetEmail(
                "user@test.com",
                "https://app.test/reset-password?token=secret-token"))
                .isInstanceOf(PasswordResetDeliveryException.class);
    }

    @Test
    @DisplayName("스테이징 환경에서도 SMTP가 아니면 재설정 요청을 안전하게 실패시킨다")
    void sendPasswordResetEmail_stagingWithoutSmtp_throwsDomainException() {
        MailProperties properties = new MailProperties("console", "noreply@herfree.test");
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> mailSenderProvider = org.mockito.Mockito.mock(ObjectProvider.class);
        Environment environment = org.mockito.Mockito.mock(Environment.class);
        given(environment.getActiveProfiles()).willReturn(new String[]{"staging"});

        PasswordResetMailService service = new PasswordResetMailService(properties, mailSenderProvider, environment);

        assertThatThrownBy(() -> service.sendPasswordResetEmail(
                "user@test.com",
                "https://app.test/reset-password?token=secret-token"))
                .isInstanceOf(PasswordResetDeliveryException.class);
    }

    @Test
    @DisplayName("SMTP 모드인데 JavaMailSender가 없으면 도메인 예외로 실패한다")
    void sendPasswordResetEmail_smtpWithoutSender_throwsDomainException() {
        MailProperties properties = new MailProperties("smtp", "noreply@herfree.test");
        @SuppressWarnings("unchecked")
        ObjectProvider<JavaMailSender> mailSenderProvider = org.mockito.Mockito.mock(ObjectProvider.class);
        Environment environment = org.mockito.Mockito.mock(Environment.class);
        given(mailSenderProvider.getIfAvailable()).willReturn(null);

        PasswordResetMailService service = new PasswordResetMailService(properties, mailSenderProvider, environment);

        assertThatThrownBy(() -> service.sendPasswordResetEmail(
                "user@test.com",
                "https://app.test/reset-password?token=secret-token"))
                .isInstanceOf(PasswordResetDeliveryException.class);
    }
}
