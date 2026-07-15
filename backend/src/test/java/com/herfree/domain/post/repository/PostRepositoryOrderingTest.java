package com.herfree.domain.post.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

@DataJpaTest
@ActiveProfiles("test")
class PostRepositoryOrderingTest {

    private static final long BOARD_ID = 9101L;
    private static final long USER_ID = 9101L;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        Instant now = Instant.now();
        jdbcTemplate.update("""
                INSERT INTO users (id, email, password, role, status, created_at, updated_at)
                VALUES (?, ?, ?, 'USER', 'ACTIVE', ?, ?)
                """, USER_ID, "ordering-test@herfree.local", "encoded", Timestamp.from(now), Timestamp.from(now));
        jdbcTemplate.update("""
                INSERT INTO boards (id, name, description, board_type, sort_order, is_active, created_at, updated_at)
                VALUES (?, 'ordering-board', '', 'ORDERING_TEST', 1, true, ?, ?)
                """, BOARD_ID, Timestamp.from(now), Timestamp.from(now));
        insertPost(9101L, "older-curated-sample", 99, now.minusSeconds(3600));
        insertPost(9102L, "new-user-post", 0, now);
    }

    @Test
    @DisplayName("일반 게시판 최신순은 운영용 정렬값보다 작성시각을 우선한다")
    void searchActivePosts_ordersRegularPostsByCreatedAt() {
        Page<Post> result = postRepository.searchActivePosts(
                PostStatus.ACTIVE,
                BOARD_ID,
                null,
                USER_ID,
                PageRequest.of(0, 10)
        );

        assertThat(result.getContent())
                .extracting(Post::getTitle)
                .containsExactly("new-user-post", "older-curated-sample");
    }

    private void insertPost(long id, String title, int sortOrder, Instant createdAt) {
        jdbcTemplate.update("""
                INSERT INTO posts (
                    id, board_id, user_id, title, content, view_count, comment_count,
                    status, visibility, is_anonymous, sort_order, is_pinned, created_at, updated_at
                ) VALUES (?, ?, ?, ?, 'content', 0, 0, 'ACTIVE', 'PUBLIC', false, ?, false, ?, ?)
                """, id, BOARD_ID, USER_ID, title, sortOrder, Timestamp.from(createdAt), Timestamp.from(createdAt));
    }
}
