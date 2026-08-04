package com.herfree.domain.journal.controller;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.doThrow;

import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.service.JournalDashboardService;
import com.herfree.domain.journal.service.JournalInsightService;
import com.herfree.domain.journal.service.JournalRecordService;
import com.herfree.domain.journal.service.JournalReviewService;
import com.herfree.domain.user.service.HealthDataConsentRequiredException;
import com.herfree.domain.user.service.HealthDataConsentService;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class JournalControllerConsentTest {

    @Mock
    private JournalRecordService journalRecordService;

    @Mock
    private JournalDashboardService journalDashboardService;

    @Mock
    private JournalReviewService journalReviewService;

    @Mock
    private JournalInsightService journalInsightService;

    @Mock
    private HealthDataConsentService healthDataConsentService;

    @InjectMocks
    private JournalController controller;

    @Test
    void writeWithoutConsent_isRejectedBeforeJournalService() {
        doThrow(new HealthDataConsentRequiredException())
                .when(healthDataConsentService).assertAgreed(42L);

        JournalRecordUpsertRequest request = new JournalRecordUpsertRequest(
                LocalDate.of(2026, 8, 4), null, null, null, false,
                null, null, null, null, null, null, null, null);

        assertThatThrownBy(() -> controller.upsertRecord(42L, request))
                .isInstanceOf(HealthDataConsentRequiredException.class);
        verify(journalRecordService, never()).upsertRecord(42L, request);
    }
}
