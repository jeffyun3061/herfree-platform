package com.herfree.domain.analytics.service;

import com.herfree.domain.analytics.dto.request.EventLogRequest;
import com.herfree.domain.analytics.dto.response.AdminStatsResponse;
import com.herfree.domain.analytics.dto.response.EventCountResponse;
import com.herfree.domain.analytics.entity.AppEventLog;
import com.herfree.domain.analytics.repository.AppEventLogRepository;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.video.repository.VideoRepository;
import jakarta.servlet.http.HttpServletRequest;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import com.herfree.global.common.AppTimeZone;
import com.herfree.global.util.ClientIpExtractor;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HexFormat;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 클라이언트 이벤트 수집·관리자 대시보드 집계.
 * <p>
 * userId·IP는 salt 해시로 저장해 원문 식별을 줄인다. 로그인·가입 등 주요 퍼널 이벤트 상수는 이 클래스에 정의한다.
 */
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    public static final String PAGE_VIEW = "page_view";
    public static final String SIGNUP_STARTED = "signup_started";
    public static final String LOGIN_CLICK = "login_click";
    public static final String CONSULT_CLICK = "consult_click";
    public static final String JOURNAL_START_CLICK = "journal_start_click";
    public static final String COMMUNITY_OPEN = "community_open";
    public static final String QNA_OPEN = "qna_open";
    public static final String CONTENT_OPEN = "content_open";
    public static final String VIDEO_OPEN = "video_open";
    public static final String SIGNUP_COMPLETED = "signup_completed";
    public static final String LOGIN_SUCCEEDED = "login_succeeded";
    public static final String POST_CREATED = "post_created";
    public static final String JOURNAL_CREATED = "journal_created";
    public static final String PASSWORD_RESET_REQUESTED = "password_reset_requested";
    public static final String ADMIN_ACTION = "admin_action";

    // 허용 목록 밖 이벤트는 저장하지 않는다. 프론트 버그나 임의 호출로 로그 스키마가 오염되는 것을 막기 위함이다.
    private static final Set<String> ALLOWED_EVENTS = Set.of(
            PAGE_VIEW,
            SIGNUP_STARTED,
            LOGIN_CLICK,
            CONSULT_CLICK,
            JOURNAL_START_CLICK,
            COMMUNITY_OPEN,
            QNA_OPEN,
            CONTENT_OPEN,
            VIDEO_OPEN,
            SIGNUP_COMPLETED,
            LOGIN_SUCCEEDED,
            POST_CREATED,
            JOURNAL_CREATED,
            PASSWORD_RESET_REQUESTED,
            ADMIN_ACTION
    );

    private final AppEventLogRepository eventLogRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final JournalRecordRepository journalRecordRepository;
    private final ContentRepository contentRepository;
    private final VideoRepository videoRepository;
    private final ClientIpExtractor clientIpExtractor;

    @Value("${app.analytics.hash-salt:${JWT_SECRET:local-analytics-salt}}")
    private String hashSalt;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFrontendEvent(EventLogRequest request, Long userId, HttpServletRequest httpRequest) {
        recordEvent(request.eventName(), "FRONTEND", request.route(), request.sessionId(), userId, httpRequest);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordBackendEvent(String eventName, Long userId) {
        recordEvent(eventName, "BACKEND", null, null, userId, null);
    }

    // 관리자 대시보드는 개인 데이터가 아니라 서비스 상태를 보는 화면이다.
    @Transactional(readOnly = true)
    public AdminStatsResponse getAdminStats() {
        Instant sevenDaysAgo = Instant.now().minus(7, ChronoUnit.DAYS);
        Instant todayStart = AppTimeZone.startOfTodayKst();

        var topEvents = eventLogRepository.countByEventNameSince(sevenDaysAgo).stream()
                .limit(8)
                .map(row -> new EventCountResponse(row.getEventName(), row.getCount()))
                .toList();

        return new AdminStatsResponse(
                userRepository.count(),
                userRepository.countByCreatedAtAfter(sevenDaysAgo),
                postRepository.countByStatus(PostStatus.ACTIVE),
                postRepository.countByStatusAndCreatedAtAfter(PostStatus.ACTIVE, sevenDaysAgo),
                commentRepository.countByStatus(CommentStatus.ACTIVE),
                reportRepository.countByStatus(ReportStatus.PENDING),
                journalRecordRepository.count(),
                journalRecordRepository.countByCreatedAtAfter(sevenDaysAgo),
                contentRepository.count(),
                videoRepository.count(),
                eventLogRepository.countByOccurredAtAfter(todayStart),
                eventLogRepository.countByOccurredAtAfter(sevenDaysAgo),
                topEvents
        );
    }

    private void recordEvent(
            String eventName,
            String source,
            String route,
            String sessionId,
            Long userId,
            HttpServletRequest httpRequest
    ) {
        if (!ALLOWED_EVENTS.contains(eventName)) {
            return;
        }

        // 이벤트 로그에는 민감한 본문·이메일·닉네임을 저장하지 않는다.
        User user = userId == null ? null : userRepository.findById(userId).orElse(null);
        eventLogRepository.save(AppEventLog.builder()
                .eventName(eventName)
                .source(source)
                .route(sanitizeRoute(route))
                .user(user)
                .sessionHash(hashNullable(sessionId))
                .ipHash(hashNullable(clientIpExtractor.extract(httpRequest)))
                .userAgentHash(hashNullable(httpRequest == null ? null : httpRequest.getHeader("User-Agent")))
                .build());
    }

    private String sanitizeRoute(String route) {
        if (!StringUtils.hasText(route)) {
            return null;
        }
        String value = route.trim();
        if (!value.startsWith("/")) {
            return null;
        }
        // 검색어·상담 맥락이 섞일 수 있어 쿼리스트링은 버린다.
        int queryIndex = value.indexOf('?');
        if (queryIndex >= 0) {
            value = value.substring(0, queryIndex);
        }
        return value.length() > 180 ? value.substring(0, 180) : value;
    }

    private String hashNullable(String value) {
        if (!StringUtils.hasText(value)) {
            return null;
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hashed = digest.digest((hashSalt + ":" + value.trim()).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hashed);
        } catch (Exception ignored) {
            return null;
        }
    }
}
