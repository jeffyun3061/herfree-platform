package com.herfree.global.operations;

import static org.assertj.core.api.Assertions.assertThat;
import com.herfree.domain.auth.service.AuthService;
import com.herfree.domain.comment.service.CommentService;
import com.herfree.domain.journal.service.JournalRecordService;
import com.herfree.domain.post.service.PostService;
import jakarta.persistence.EntityManager;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.PlatformTransactionManager;

@SpringBootTest
@ActiveProfiles("test")
class RestoreCoreFunctionVerifierIntegrationTest {
    @Autowired AuthService auth;
    @Autowired PostService posts;
    @Autowired CommentService comments;
    @Autowired JournalRecordService journals;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager entities;
    @Autowired PlatformTransactionManager manager;

    @Test void realServicesVerifyCoreFunctionsAndLeaveNoSyntheticRecords() {
        boolean insertBoard = jdbc.queryForObject("SELECT COUNT(*) FROM boards WHERE board_type='FREE'", Long.class) == 0;
        if (insertBoard) jdbc.update("INSERT INTO boards(id,name,board_type,sort_order,is_active,created_at,updated_at) VALUES (98989,'restore','FREE',0,TRUE,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)");
        var tables = List.of("users", "user_profiles", "posts", "comments", "journal_records", "health_data_consents", "user_consent_agreements", "app_event_logs");
        var before = tables.stream().map(table -> jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class)).toList();
        try {
            new RestoreCoreFunctionVerifier(auth, posts, comments, journals, jdbc, entities, manager).verify();
            assertThat(tables.stream().map(table -> jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Long.class)).toList()).isEqualTo(before);
        } finally {
            if (insertBoard) jdbc.update("DELETE FROM boards WHERE id=98989");
        }
    }
}
