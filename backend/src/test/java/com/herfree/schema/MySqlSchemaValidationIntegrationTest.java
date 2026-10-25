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
}
