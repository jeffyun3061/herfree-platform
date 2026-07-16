package com.herfree.global.persistence;

import static org.assertj.core.api.Assertions.assertThat;

import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.repository.PostRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import java.sql.Timestamp;
import java.time.Instant;
import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@ActiveProfiles("test")
class ListQueryCountIntegrationTest {

    private static final long BOARD_ID = 9200L;
    private static final long POST_ID = 9200L;

    @Autowired
    private JdbcTemplate jdbcTemplate;
    @Autowired
    private EntityManager entityManager;
    @Autowired
    private EntityManagerFactory entityManagerFactory;
    @Autowired
    private PostRepository postRepository;
    @Autowired
    private CommentRepository commentRepository;
    @Autowired
    private ContentRepository contentRepository;

    private Statistics statistics;

    @BeforeEach
    void setUp() {
        Instant now = Instant.now();
        for (long id = 9201L; id <= 9205L; id++) {
            jdbcTemplate.update("""
                    INSERT INTO users (id, email, password, role, status, created_at, updated_at)
                    VALUES (?, ?, 'encoded', 'USER', 'ACTIVE', ?, ?)
                    """, id, "query-" + id + "@herfree.local", Timestamp.from(now), Timestamp.from(now));
        }
        jdbcTemplate.update("""
                INSERT INTO boards (id, name, description, board_type, sort_order, is_active, created_at, updated_at)
                VALUES (?, 'query-board', '', 'QUERY_COUNT_TEST', 1, true, ?, ?)
                """, BOARD_ID, Timestamp.from(now), Timestamp.from(now));
        jdbcTemplate.update("""
                INSERT INTO posts (
                    id, board_id, user_id, title, content, view_count, comment_count,
                    status, visibility, is_anonymous, sort_order, is_pinned, created_at, updated_at
                ) VALUES (?, ?, 9201, 'query-post', 'content', 0, 5,
                          'ACTIVE', 'PUBLIC', false, 0, false, ?, ?)
                """, POST_ID, BOARD_ID, Timestamp.from(now), Timestamp.from(now));
        for (long id = 9201L; id <= 9205L; id++) {
            jdbcTemplate.update("""
                    INSERT INTO comments (
                        id, post_id, user_id, parent_id, content, status, is_anonymous, created_at, updated_at
                    ) VALUES (?, ?, ?, NULL, ?, 'ACTIVE', false, ?, ?)
                    """, id, POST_ID, id, "comment-" + id, Timestamp.from(now), Timestamp.from(now));
            jdbcTemplate.update("""
                    INSERT INTO contents (
                        id, author_id, title, content, image_url, category, content_type,
                        status, sort_order, is_pinned, created_at, updated_at
                    ) VALUES (?, ?, ?, 'content', NULL, 'guide', 'ADMIN',
                              'ACTIVE', 0, false, ?, ?)
                    """, id, id, "content-" + id, Timestamp.from(now), Timestamp.from(now));
        }

        entityManager.clear();
        statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        statistics.clear();
    }

    @Test
    void commentListLoadsAuthorsWithoutNPlusOne() {
        var page = commentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(
                POST_ID, CommentStatus.ACTIVE, PageRequest.of(0, 20));
        page.forEach(comment -> {
            comment.getUser().getEmail();
            comment.getPost().getTitle();
        });

        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(2);
    }

    @Test
    void contentListLoadsAuthorsWithoutNPlusOne() {
        var page = contentRepository.findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
                ContentStatus.ACTIVE, PageRequest.of(0, 20));
        page.forEach(content -> content.getAuthor().getEmail());

        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(2);
    }

    @Test
    void postListLoadsBoardAndAuthorWithoutNPlusOne() {
        var page = postRepository.findByBoardIdAndStatusOrderByCreatedAtDesc(
                BOARD_ID, PostStatus.ACTIVE, PageRequest.of(0, 20));
        page.forEach(post -> {
            post.getBoard().getName();
            post.getUser().getEmail();
        });

        assertThat(statistics.getPrepareStatementCount()).isLessThanOrEqualTo(2);
    }
}
