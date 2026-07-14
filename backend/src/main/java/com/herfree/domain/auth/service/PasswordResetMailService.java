package com.herfree.domain.auth.service;

import com.herfree.domain.auth.exception.PasswordResetDeliveryException;
import com.herfree.global.config.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.Arrays;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.core.env.Environment;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetMailService {

    private final MailProperties mailProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;
    private final Environment environment;

    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        if ("smtp".equalsIgnoreCase(mailProperties.mode())) {
            sendViaSmtp(toEmail, resetUrl);
        } else {
            if (isProd()) {
                log.error("Password reset mail delivery blocked: SMTP is not configured in prod.");
                throw new PasswordResetDeliveryException();
            }
            // 운영 로그에는 이메일, token, reset URL을 남기지 않는다.
            log.info("[password-reset] reset email suppressed in {} mode.", mailProperties.mode());
        }
    }

    private void sendViaSmtp(String toEmail, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.error("Password reset mail delivery blocked: JavaMailSender is missing.");
            throw new PasswordResetDeliveryException();
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailProperties.from());
            helper.setTo(toEmail);
            helper.setSubject("[헤르프리] 비밀번호 재설정 안내");
            helper.setText(buildEmailBody(resetUrl), false);
            mailSender.send(message);
        } catch (MessagingException | MailException e) {
            log.error("Password reset mail delivery failed.", e);
            throw new PasswordResetDeliveryException();
        }
    }

    private boolean isProd() {
        return Arrays.asList(environment.getActiveProfiles()).contains("prod");
    }

    private String buildEmailBody(String resetUrl) {
        return """
                안녕하세요, 헤르프리입니다.

                아래 링크를 눌러 비밀번호를 재설정해 주세요. 링크는 30분 동안 유효합니다.

                %s

                본인이 요청하지 않았다면 이 메일을 무시해 주세요.
                """.formatted(resetUrl);
    }
}
