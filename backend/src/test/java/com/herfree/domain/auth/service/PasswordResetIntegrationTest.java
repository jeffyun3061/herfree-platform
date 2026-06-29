package com.herfree.domain.auth.service;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetIntegrationTest {

    private static final Pattern TOKEN_PATTERN = Pattern.compile("token=([0-9a-f-]+)");

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private PasswordResetMailService passwordResetMailService;

    @Test
    @DisplayName("비밀번호 재설정 요청·확인 후 새 비밀번호로 로그인할 수 있다")
    void passwordReset_confirmFlow_success() throws Exception {
        String email = "reset-flow@example.com";
        String nickname = "resetuser01";
        String oldPassword = "Oldpass123!";
        String newPassword = "Newpass456!";

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s","nickname":"%s"}
                                """.formatted(email, oldPassword, nickname)))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value(PasswordResetService.REQUEST_SUCCESS_MESSAGE));

        ArgumentCaptor<String> urlCaptor = ArgumentCaptor.forClass(String.class);
        verify(passwordResetMailService).sendPasswordResetEmail(eq(email), urlCaptor.capture());
        String rawToken = extractToken(urlCaptor.getValue());

        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"%s","newPassword":"%s"}
                                """.formatted(rawToken, newPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, oldPassword)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"%s"}
                                """.formatted(email, newPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("유효하지 않은 재설정 토큰은 400을 반환한다")
    void passwordReset_invalidToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"not-a-valid-token","newPassword":"Newpass456!"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("유효하지 않거나 만료된 재설정 링크입니다."));
    }

    @Test
    @DisplayName("존재하지 않는 이메일 재설정 요청도 동일한 성공 메시지를 반환한다")
    void passwordReset_unknownEmail_sameSuccessMessage() throws Exception {
        mockMvc.perform(post("/api/auth/password-reset/request")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"unknown-reset@example.com"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(PasswordResetService.REQUEST_SUCCESS_MESSAGE));

        verify(passwordResetMailService, org.mockito.Mockito.never())
                .sendPasswordResetEmail(anyString(), anyString());
    }

    private String extractToken(String resetUrl) {
        Matcher matcher = TOKEN_PATTERN.matcher(resetUrl);
        if (!matcher.find()) {
            throw new IllegalStateException("reset URL에 token이 없습니다: " + resetUrl);
        }
        return matcher.group(1);
    }
}
