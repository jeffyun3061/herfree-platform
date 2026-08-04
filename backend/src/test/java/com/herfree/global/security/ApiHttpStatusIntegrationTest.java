package com.herfree.global.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.herfree.domain.auth.service.LoginLockoutService;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ApiHttpStatusIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("헬스체크는 200을 반환한다")
    void health_returns200() throws Exception {
        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("UP"));
    }

    @Test
    @DisplayName("Actuator 헬스체크는 직렬화 오류 없이 200을 반환한다")
    void actuatorHealth_returns200() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("비로그인 사용자도 허용된 분석 이벤트를 기록할 수 있다")
    void recordEvent_withoutAuth_returns200() throws Exception {
        mockMvc.perform(post("/api/events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"eventName":"page_view","route":"/login","sessionId":"anonymous-session"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("비로그인 게시글 작성은 401을 반환한다")
    void createPost_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"boardId":1,"title":"t","content":"c","isAnonymous":false,"visibility":"PUBLIC"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("인증이 필요합니다."));
    }

    @Test
    @DisplayName("비로그인 일지 작성은 401을 반환한다")
    void createJournal_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/journal/records")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"recordDate":"2026-06-16","hadSymptoms":false,"medicationStatus":"NORMAL","avgSleep":"H6_7","stressLevel":"LOW"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("로그인 실패는 401을 반환한다")
    void login_invalidCredentials_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nobody@example.com","password":"wrong-password-123"}
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호가 올바르지 않습니다."));
    }

    @Test
    @DisplayName("로그인 요청 값 누락은 400을 반환한다")
    void login_missingFields_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"","password":""}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("공개 공지·칼럼·영상·일지 집계 조회는 비로그인 상태에서도 허용한다")
    void publicContent_withoutAuth_returns200() throws Exception {
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/contents"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/videos"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/journal/insights"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("비로그인 사용자는 모든 운영 콘텐츠 작성 API에 접근할 수 없다")
    void adminContentWrite_withoutAuth_returns401() throws Exception {
        mockMvc.perform(post("/api/admin/notices").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/contents").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/admin/videos").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("비회원도 닉네임 중복 확인 API를 호출할 수 있다")
    void nicknameCheck_withoutAuth_returns200() throws Exception {
        mockMvc.perform(get("/api/auth/nickname/check")
                        .param("nickname", "publicnick01"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.available").isBoolean());
    }

    @Test
    @DisplayName("비회원도 이메일 중복 확인 API를 호출할 수 있다")
    void emailCheck_withoutAuth_returns200() throws Exception {
        mockMvc.perform(get("/api/auth/email/check")
                        .param("email", "public@test.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.available").isBoolean());
    }

    @Test
    @DisplayName("로그인 10회 연속 실패 시 429를 반환한다")
    void login_tooManyFailures_returns429() throws Exception {
        for (int i = 0; i < LoginLockoutService.MAX_FAILURES - 1; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("""
                                    {"email":"lockout-test@example.com","password":"wrong-password-123"}
                                    """))
                    .andExpect(status().isUnauthorized());
        }

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"lockout-test@example.com","password":"wrong-password-123"}
                                """))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("로그인 시도 횟수를 초과했습니다. 30분 후 다시 시도해 주세요."));
    }

    @Test
    @DisplayName("회원가입 이메일 형식 오류는 400을 반환한다")
    void signup_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"not-an-email","password":"Test-password-123!","nickname":"tester01","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("민감정보 처리에 동의하지 않아도 커뮤니티 가입은 성공한다")
    void signup_withoutSensitiveInformationConsent_succeedsForCommunity() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"no-sensitive-consent@example.com","password":"Test-password-123!","nickname":"consentcheck","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":false,"agreeAge":true,"agreeMarketing":false}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("회원가입 이메일 중복은 409를 반환한다")
    void signup_duplicateEmail_returns409() throws Exception {
        String body = """
                {"email":"dup-status@example.com","password":"Test-password-123!","nickname":"dupnick01","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                """;

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("dupnick01", "dupnick02")))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("이미 사용 중인 이메일입니다."));
    }

    @Test
    @DisplayName("예약 닉네임 가입은 400을 반환한다")
    void signup_reservedNickname_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"newuser@example.com","password":"Test-password-123!","nickname":"admin","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("회원가입 이메일이 254자를 초과하면 400을 반환한다")
    void signup_tooLongEmail_returns400() throws Exception {
        String email = "a".repeat(243) + "@example.com";

        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"Test-password-123!","nickname":"longemail","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """.formatted(email)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("신규 비밀번호가 10자보다 짧으면 400을 반환한다")
    void signup_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"short-password@example.com","password":"Short1!","nickname":"shortpassword","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("신규 비밀번호가 24자를 초과하면 400을 반환한다")
    void signup_tooLongPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"long-password@example.com","password":"%s","nickname":"longpassword","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """.formatted("p".repeat(25))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("신규 비밀번호에 특수문자가 없으면 400을 반환한다")
    void signup_passwordWithoutSpecialChar_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nospecial@example.com","password":"Password1234","nickname":"nospecial","agreeTerms":true,"agreePrivacy":true,"agreeSensitive":true,"agreeAge":true,"agreeMarketing":false}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
