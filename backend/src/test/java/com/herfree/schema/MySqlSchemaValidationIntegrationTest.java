package com.herfree.schema;

import static org.assertj.core.api.Assertions.assertThat;

import javax.sql.DataSource;
import java.sql.Timestamp;
import java.time.Instant;
import com.herfree.domain.post.repository.PostRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.transaction.annotation.Transactional;
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

    @Autowired
    private org.springframework.jdbc.core.JdbcTemplate jdbc;

    @Autowired
    private PostRepository posts;

    @Test
    void flywaySchemaMatchesHibernateMappings() {
        assertThat(dataSource).isNotNull();
        assertThat(jdbc.queryForObject("SELECT COUNT(*) FROM boards WHERE board_type='ANONYMOUS_QUESTION' AND is_active=1",Integer.class)).isEqualTo(1);
    }

    @Test
    @Transactional
    void rollbackTitleEditRevokesExistingTitleSharingConsent() {
        Timestamp now = Timestamp.from(Instant.now());
        jdbc.update("INSERT INTO users (id,email,password,role,status,credential_version,created_at,updated_at) VALUES (96001,'rollback-test@example.invalid','test','USER','ACTIVE',0,?,?)", now, now);
        Long boardId = jdbc.queryForObject("SELECT id FROM boards WHERE board_type='FREE' LIMIT 1", Long.class);
        assertThat(boardId).isNotNull();
        jdbc.update("INSERT INTO posts (id,board_id,user_id,title,content,view_count,comment_count,status,visibility,is_anonymous,sort_order,is_pinned,share_title_publicly,created_at,updated_at) VALUES (96001,?,96001,'previous title','test body',0,0,'ACTIVE','MEMBERS_ONLY',false,0,false,true,?,?)", boardId, now, now);

        var post = posts.findById(96001L).orElseThrow();
        post.update("changed title", "test body", false);
        posts.flush();

        assertThat(jdbc.queryForObject("SELECT share_title_publicly FROM posts WHERE id=96001", Boolean.class)).isFalse();
    }
}
