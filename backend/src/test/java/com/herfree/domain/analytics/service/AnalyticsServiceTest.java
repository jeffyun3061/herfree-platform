package com.herfree.domain.analytics.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.analytics.dto.request.EventLogRequest;
import com.herfree.domain.analytics.entity.AppEventLog;
import com.herfree.domain.analytics.repository.AppEventLogRepository;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.video.repository.VideoRepository;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.global.util.ClientIpExtractor;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@ExtendWith(MockitoExtension.class)
class AnalyticsServiceTest {

    @Mock
    private AppEventLogRepository eventLogRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private CommentRepository commentRepository;
    @Mock
    private ReportRepository reportRepository;
    @Mock
    private JournalRecordRepository journalRecordRepository;
    @Mock
    private ContentRepository contentRepository;
    @Mock
    private VideoRepository videoRepository;
    @Mock
    private ClientIpExtractor clientIpExtractor;
    @Mock
    private AnalyticsEventWriter analyticsEventWriter;

    @InjectMocks
    private AnalyticsService analyticsService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(analyticsService, "hashSalt", "test-salt");
    }

    @Test
    void recordBackendEvent_allowsPreLaunchFunnelEvents() {
        String[] events = {
                AnalyticsService.SIGNUP_STARTED,
                AnalyticsService.SIGNUP_COMPLETED,
                AnalyticsService.LOGIN_SUCCEEDED,
                AnalyticsService.POST_CREATED,
                AnalyticsService.JOURNAL_CREATED,
                AnalyticsService.PASSWORD_RESET_REQUESTED,
                AnalyticsService.ADMIN_ACTION
        };

        for (String event : events) {
            analyticsService.recordBackendEvent(event, null);
        }

        verify(analyticsEventWriter, org.mockito.Mockito.times(events.length)).write(any(), org.mockito.ArgumentMatchers.isNull());
    }

    @Test
    void recordFrontendEvent_sanitizesRouteAndHashesRequestValues() {
        HttpServletRequest request = org.mockito.Mockito.mock(HttpServletRequest.class);
        given(clientIpExtractor.extract(request)).willReturn("203.0.113.10");
        given(request.getHeader("User-Agent")).willReturn("Browser/1.0");
        ArgumentCaptor<AppEventLog> captor = ArgumentCaptor.forClass(AppEventLog.class);

        analyticsService.recordFrontendEvent(
                new EventLogRequest(AnalyticsService.PAGE_VIEW, "/search?q=private-note", "session-raw"),
                null,
                request);

        verify(eventLogRepository).save(captor.capture());
        AppEventLog saved = captor.getValue();
        assertThat(saved.getEventName()).isEqualTo(AnalyticsService.PAGE_VIEW);
        assertThat(saved.getRoute()).isEqualTo("/search");
        assertThat(saved.getSessionHash()).isNotBlank().isNotEqualTo("session-raw");
        assertThat(saved.getIpHash()).isNotBlank().isNotEqualTo("203.0.113.10");
        assertThat(saved.getUserAgentHash()).isNotBlank().isNotEqualTo("Browser/1.0");
    }

    @Test
    void recordFrontendEvent_ignoresUnknownEventNames() {
        analyticsService.recordFrontendEvent(
                new EventLogRequest("raw_email_leak", "/login", "session"),
                null,
                null);

        verify(eventLogRepository, never()).save(any(AppEventLog.class));
    }

    @Test
    void recordBackendEvent_defersUntilOuterTransactionCommits() {
        TransactionSynchronizationManager.initSynchronization();
        TransactionSynchronizationManager.setActualTransactionActive(true);
        try {
            analyticsService.recordBackendEvent(AnalyticsService.JOURNAL_CREATED, 42L);
            verify(analyticsEventWriter, never()).write(any(), any());

            TransactionSynchronizationManager.getSynchronizations()
                    .forEach(synchronization -> synchronization.afterCommit());
            verify(analyticsEventWriter).write(AnalyticsService.JOURNAL_CREATED, 42L);
        } finally {
            TransactionSynchronizationManager.clearSynchronization();
            TransactionSynchronizationManager.setActualTransactionActive(false);
        }
    }
}
