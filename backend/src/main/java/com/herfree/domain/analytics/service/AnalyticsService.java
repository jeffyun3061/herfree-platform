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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    // 허용 목록 밖 이벤트는 저장하지 않는다. 프론트 버그나 임의 호출로 로그 스키마가 오염되는 것을 막기 위함이다.
    private static final Set<String> ALLOWED_EVENTS = Set.of(
            "page_view",
            "signup_click",
            "login_click",
            "consult_click",
            "journal_start_click",
            "community_open",
            "qna_open",
            "content_open",
            "video_open",
            "signup_completed",
            "login_completed"
    );

    private final AppEventLogRepository eventLogRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ReportRepository reportRepository;
    private final JournalRecordRepository journalRecordRepository;
    private final ContentRepository contentRepository;
    private final VideoRepository videoRepository;

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
        LocalDateTime sevenDaysAgo = LocalDateTime.now().minusDays(7);
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();

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
                .ipHash(hashNullable(extractClientIp(httpRequest)))
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

    private String extractClientIp(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        String forwardedFor = request.getHeader("X-Forwarded-For");
        if (StringUtils.hasText(forwardedFor)) {
            return forwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
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
