package com.herfree.schema;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@Testcontainers(disabledWithoutDocker = true)
@SpringBootTest(properties = {
        "spring.flyway.enabled=true",
        "spring.jpa.hibernate.ddl-auto=validate",
        "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect"
})
@ActiveProfiles("test")
class MySqlSchemaValidationIntegrationTest {

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.4.10")
            .withDatabaseName("herfree_schema_test")
            .withUsername("herfree_test")
            .withPassword("test-only-password");

    @DynamicPropertySource
    static void configureMySql(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    @Autowired
    private DataSource dataSource;
    @Autowired private com.herfree.domain.operations.DeveloperOperationsService operations;
    @Autowired private com.herfree.domain.post.repository.PostRepository posts;
    @Autowired private com.herfree.domain.post.repository.PostFulltextSearchRepository fulltext;

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Test
    void flywaySchemaMatchesHibernateMappings() {
        assertThat(dataSource).isNotNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM boards WHERE board_type='ANONYMOUS_QUESTION' AND is_active=1",Integer.class)).isEqualTo(1);
        var diagnostic = operations.overview();
        assertThat(diagnostic.database().state()).isEqualTo("UP");
        assertThat(diagnostic.database().version()).startsWith("8.4.10");
        assertThat(diagnostic.database().migrationVersion()).isEqualTo("47");
        assertThat(diagnostic.database().migrationsSuccessful()).isTrue();
        assertThat(diagnostic.database().tables()).extracting(com.herfree.domain.operations.DeveloperOperationsService.TableSize::name)
                .contains("users", "posts", "admin_mfa_factors");
        // Execute the production MySQL queue queries as well as the H2 behavior fixtures.
        assertThat(posts.summarizeWaitingReplies(java.time.Instant.now())).isNotNull();
        assertThat(posts.findWaitingReplies(org.springframework.data.domain.PageRequest.of(0, 5))).isNotNull();
    }

    @Test
    void guestConcernSearchNeverReturnsLegacyMemberOnlyRows() {
        var now = java.sql.Timestamp.from(java.time.Instant.now());
        Long boardId = jdbc.queryForObject("SELECT id FROM boards WHERE board_type='ANONYMOUS_QUESTION'", Long.class);
        jdbc.update("INSERT INTO users(id,email,password,role,status,credential_version,created_at,updated_at) VALUES (97001,'search-scope@example.invalid','test-only','USER','ACTIVE',0,?,?)", now, now);
        try {
            // MySQL FULLTEXT indexes see committed rows, so these JDBC fixtures
            // use autocommit and are explicitly removed after the assertions.
            for (int i = 0; i < 2; i++) {
                jdbc.update("INSERT INTO posts(id,board_id,user_id,title,content,view_count,comment_count,status,visibility,is_anonymous,sort_order,is_pinned,created_at,updated_at) VALUES (?,?,97001,?,'searchscope body',0,0,'ACTIVE',?,true,0,false,?,?)",
                        97002 + i, boardId, "searchscope " + i, i == 0 ? "PUBLIC" : "MEMBERS_ONLY", now, now);
            }
            var pageable = org.springframework.data.domain.PageRequest.of(0, 20);
            var guest = fulltext.searchBoardPosts(boardId, "searchscope", null,
                    com.herfree.global.util.PostListSort.LATEST, com.herfree.global.util.PostListPeriod.ALL, pageable);
            assertThat(guest.getContent()).extracting(com.herfree.domain.post.entity.Post::getId).containsExactly(97002L);
            assertThat(guest.getTotalElements()).isEqualTo(1);
            var member = fulltext.searchBoardPosts(boardId, "searchscope", 97001L,
                    com.herfree.global.util.PostListSort.LATEST, com.herfree.global.util.PostListPeriod.ALL, pageable);
            assertThat(member.getContent()).extracting(com.herfree.domain.post.entity.Post::getId).containsExactlyInAnyOrder(97002L, 97003L);
            assertThat(member.getTotalElements()).isEqualTo(2);
        } finally {
            jdbc.update("DELETE FROM posts WHERE id IN (97002,97003)");
            jdbc.update("DELETE FROM users WHERE id=97001");
        }
    }
}
