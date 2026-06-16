package com.herfree.domain.journal.dto.response;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.user.entity.User;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class JournalRecordResponseJsonTest {

    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    @Test
    @DisplayName("recordDate는 JSON에서 YYYY-MM-DD 문자열로 직렬화된다")
    void serializesRecordDateAsIsoString() throws Exception {
        User user = User.builder().email("a@b.com").password("pw").build();
        JournalRecord record = JournalRecord.builder()
                .user(user)
                .recordDate(LocalDate.of(2026, 6, 16))
                .hadSymptoms(false)
                .stressLevel(StressLevel.LOW)
                .medicationStatus(MedicationStatus.NORMAL)
                .supplementTaken(false)
                .exerciseDone(false)
                .build();

        String json = objectMapper.writeValueAsString(JournalRecordResponse.from(record));
        JsonNode node = objectMapper.readTree(json);

        assertThat(node.get("recordDate").isTextual()).isTrue();
        assertThat(node.get("recordDate").asText()).isEqualTo("2026-06-16");
        if (node.hasNonNull("createdAt")) {
            assertThat(node.get("createdAt").isTextual()).isTrue();
        }
    }
}
