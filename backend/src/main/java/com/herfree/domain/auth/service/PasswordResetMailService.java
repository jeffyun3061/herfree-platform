package com.herfree.domain.auth.service;

import com.herfree.global.config.MailProperties;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordResetMailService {

    private final MailProperties mailProperties;
    private final ObjectProvider<JavaMailSender> mailSenderProvider;

    public void sendPasswordResetEmail(String toEmail, String resetUrl) {
        if ("smtp".equalsIgnoreCase(mailProperties.mode())) {
            sendViaSmtp(toEmail, resetUrl);
        } else {
            logPasswordResetLink(toEmail, resetUrl);
        }
    }

    private void sendViaSmtp(String toEmail, String resetUrl) {
        JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
        if (mailSender == null) {
            log.warn("SMTP mode이지만 JavaMailSender가 설정되지 않았습니다. 콘솔 모드로 대체합니다.");
            logPasswordResetLink(toEmail, resetUrl);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
            helper.setFrom(mailProperties.from());
            helper.setTo(toEmail);
            helper.setSubject("[헤르프리] 비밀번호 재설정 안내");
            helper.setText(buildEmailBody(resetUrl), false);
            mailSender.send(message);
        } catch (MessagingException e) {
            log.error("비밀번호 재설정 메일 발송 실패: {}", toEmail, e);
            throw new IllegalStateException("비밀번호 재설정 메일을 보내지 못했습니다.", e);
        }
    }

    private void logPasswordResetLink(String toEmail, String resetUrl) {
        log.info("[password-reset] to={} resetUrl={}", toEmail, resetUrl);
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
