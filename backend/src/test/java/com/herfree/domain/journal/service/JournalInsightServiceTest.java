package com.herfree.domain.journal.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.common.AppTimeZone;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class JournalInsightServiceTest {

    @Mock
    private JournalRecordRepository journalRecordRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private PostRepository postRepository;

    @Spy
    private HealthInsightPublicationPolicy publicationPolicy = new HealthInsightPublicationPolicy();

    @InjectMocks
    private JournalInsightService journalInsightService;

    @Test
    void requiresDistinctParticipantsInsteadOfRepeatedRecordsFromOneMember() {
        List<JournalRecord> records = new ArrayList<>();
        for (int i = 0; i < 20; i++) {
            records.add(symptomRecord(1L, List.of("STRESS"), List.of("ITCHING")));
        }
        given(journalRecordRepository.findRecentConsentedSymptomRecords(
                any(LocalDate.class), any(PageRequest.class))).willReturn(records);

        var response = journalInsightService.getCommunityInsights();

        assertThat(response.sufficientData()).isFalse();
        assertThat(response.sampleSize()).isNull();
    }

    @Test
    void suppressesCellsMentionedByFewerThanFiveParticipants() {
        List<JournalRecord> records = new ArrayList<>();
        for (long userId = 1; userId <= 20; userId++) {
            List<String> triggers = userId <= 5
                    ? List.of("SLEEP_DEFICIT")
                    : userId <= 9 ? List.of("STRESS") : List.of();
            List<String> symptoms = userId <= 5 ? List.of("ITCHING") : List.of("NONE");
            records.add(symptomRecord(userId, triggers, symptoms));
        }
        given(journalRecordRepository.findRecentConsentedSymptomRecords(
                any(LocalDate.class), any(PageRequest.class))).willReturn(records);

        var response = journalInsightService.getCommunityInsights();

        assertThat(response.sufficientData()).isTrue();
        assertThat(response.sampleSize()).isEqualTo(20);
        assertThat(response.topTriggers())
                .anySatisfy(item -> {
                    assertThat(item.code()).isEqualTo("SLEEP_DEFICIT");
                    assertThat(item.percentage()).isEqualTo(25);
                })
                .noneMatch(item -> item.code().equals("STRESS"));
        assertThat(response.topProdromalSymptoms())
                .anyMatch(item -> item.code().equals("ITCHING"));
    }

    @Test
    void publicHomeStatsExposeLiveAggregateCounts() {
        given(userRepository.countByStatus(UserStatus.ACTIVE)).willReturn(7L);
        given(postRepository.countByStatusAndCreatedAtAfter(any(), any())).willReturn(3L);

        var response = journalInsightService.getPublicHomeStats();

        assertThat(response.activeMemberCount()).isEqualTo(7L);
        assertThat(response.postsToday()).isEqualTo(3L);
        then(userRepository).should().countByStatus(UserStatus.ACTIVE);
        then(postRepository).should().countByStatusAndCreatedAtAfter(
                org.mockito.ArgumentMatchers.eq(PostStatus.ACTIVE), any());
        then(journalRecordRepository).shouldHaveNoInteractions();
    }

    @Test
    void refusesToPublishAQuietlyTruncatedSample() {
        List<JournalRecord> records = new ArrayList<>();
        for (long userId = 1; userId <= 501; userId++) {
            records.add(symptomRecord(userId, List.of("STRESS"), List.of("ITCHING")));
        }
        given(journalRecordRepository.findRecentConsentedSymptomRecords(
                any(LocalDate.class), any(PageRequest.class))).willReturn(records);

        var response = journalInsightService.getCommunityInsights();

        assertThat(response.sufficientData()).isFalse();
        assertThat(response.sampleSize()).isNull();
        assertThat(response.topTriggers()).isEmpty();
    }

    @Test
    void roundsPublishedPercentagesToFivePercentBuckets() {
        List<JournalRecord> records = new ArrayList<>();
        for (long userId = 1; userId <= 21; userId++) {
            records.add(symptomRecord(
                    userId,
                    userId <= 6 ? List.of("STRESS") : List.of(),
                    List.of("NONE")));
        }
        given(journalRecordRepository.findRecentConsentedSymptomRecords(
                any(LocalDate.class), any(PageRequest.class))).willReturn(records);

        var response = journalInsightService.getCommunityInsights();

        assertThat(response.topTriggers()).singleElement()
                .satisfies(item -> assertThat(item.percentage()).isEqualTo(30));
    }

    @Test
    void excludesUnknownHistoricValuesFromPublicInsightItems() {
        List<JournalRecord> records = new ArrayList<>();
        for (long userId = 1; userId <= 20; userId++) {
            records.add(symptomRecord(userId, List.of("LEGACY_TRIGGER"), List.of("LEGACY_SYMPTOM")));
        }
        given(journalRecordRepository.findRecentConsentedSymptomRecords(
                any(LocalDate.class), any(PageRequest.class))).willReturn(records);

        var response = journalInsightService.getCommunityInsights();

        assertThat(response.sufficientData()).isTrue();
        assertThat(response.topTriggers()).isEmpty();
        assertThat(response.topProdromalSymptoms()).isEmpty();
    }

    private JournalRecord symptomRecord(
            Long userId,
            List<String> triggers,
            List<String> prodromalSymptoms
    ) {
        User user = User.builder()
                .email("user-" + userId + "@example.invalid")
                .password("password")
                .build();
        ReflectionTestUtils.setField(user, "id", userId);
        return JournalRecord.builder()
                .user(user)
                .recordDate(AppTimeZone.todayKst())
                .hadSymptoms(true)
                .triggers(triggers)
                .prodromalSymptoms(prodromalSymptoms)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();
    }
}
