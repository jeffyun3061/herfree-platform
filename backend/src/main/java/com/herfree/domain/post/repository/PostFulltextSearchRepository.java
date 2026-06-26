package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.Post;
import com.herfree.global.util.PostEngagementScore;
import com.herfree.global.util.PostListPeriod;
import com.herfree.global.util.PostListSort;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;

/** MySQL FULLTEXT(ngram) 기반 게시글 검색 — keyword는 2글자 이상 전제 */
@Repository
@RequiredArgsConstructor
public class PostFulltextSearchRepository {

    private static final DateTimeFormatter MYSQL_DATETIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    private static final String NOTICE_PREFIX = """
            ORDER BY CASE WHEN b.board_type = 'NOTICE' THEN 0 ELSE 1 END,
                     CASE WHEN b.board_type = 'NOTICE' AND p.is_pinned = 1 THEN 0 ELSE 1 END,
                     p.sort_order DESC,
            """;

    private static final String CREATED_DESC_ORDER = "ORDER BY p.created_at DESC";

    private final EntityManager entityManager;

    public Page<Post> searchCommunityPosts(
            Long boardId,
            String keyword,
            Long viewerId,
            PostListSort sort,
            PostListPeriod period,
            Pageable pageable
    ) {
        StringBuilder where = new StringBuilder("""
                FROM posts p
                INNER JOIN boards b ON p.board_id = b.id
                WHERE p.status = 'ACTIVE'
                AND MATCH(p.title, p.content) AGAINST (:keyword IN NATURAL LANGUAGE MODE)
                """);

        Map<String, Object> params = new HashMap<>();
        params.put("keyword", keyword);

        if (boardId != null) {
            where.append(" AND b.id = :boardId");
            params.put("boardId", boardId);
        } else {
            where.append(" AND b.board_type NOT IN ('INQUIRY', 'PRIVATE_CONSULT', 'SECRET_STORY')");
        }

        if (viewerId == null) {
            where.append(" AND p.visibility = 'PUBLIC'");
        }

        applyWeeklySinceParam(sort, period, params);
        return executePaged(where.toString(), communityOrderBy(sort, period), params, pageable);
    }

    public Page<Post> searchBoardPosts(
            Long boardId,
            String keyword,
            PostListSort sort,
            PostListPeriod period,
            Pageable pageable
    ) {
        StringBuilder where = new StringBuilder("""
                FROM posts p
                INNER JOIN boards b ON p.board_id = b.id
                WHERE p.status = 'ACTIVE'
                AND b.id = :boardId
                AND MATCH(p.title, p.content) AGAINST (:keyword IN NATURAL LANGUAGE MODE)
                """);

        Map<String, Object> params = new HashMap<>();
        params.put("boardId", boardId);
        params.put("keyword", keyword);

        applyWeeklySinceParam(sort, period, params);

        String orderBy = sort == PostListSort.LATEST
                ? CREATED_DESC_ORDER
                : communityOrderBy(sort, period);
        return executePaged(where.toString(), orderBy, params, pageable);
    }

    private void applyWeeklySinceParam(PostListSort sort, PostListPeriod period, Map<String, Object> params) {
        if (period == PostListPeriod.WEEK && sort != PostListSort.LATEST) {
            params.put("since", MYSQL_DATETIME.format(period.weekSince()));
        }
    }

    private String communityOrderBy(PostListSort sort, PostListPeriod period) {
        if (sort == PostListSort.LATEST) {
            return NOTICE_PREFIX + " p.created_at DESC";
        }

        boolean weekly = period == PostListPeriod.WEEK;

        return switch (sort) {
            case POPULAR -> NOTICE_PREFIX
                    + (weekly ? PostEngagementScore.mysqlExpressionWeekly() : PostEngagementScore.mysqlExpressionAllTime())
                    + " DESC, p.created_at DESC";
            case COMMENTS -> weekly
                    ? NOTICE_PREFIX
                            + """
                             (SELECT COUNT(c.id) FROM comments c
                              WHERE c.post_id = p.id AND c.status = 'ACTIVE' AND c.created_at >= :since) DESC,
                            """
                            + " p.created_at DESC"
                    : NOTICE_PREFIX + " p.comment_count DESC, p.created_at DESC";
            default -> NOTICE_PREFIX + " p.created_at DESC";
        };
    }

    private Page<Post> executePaged(
            String whereClause,
            String orderBy,
            Map<String, Object> params,
            Pageable pageable
    ) {
        String selectSql = "SELECT p.* " + whereClause + " " + orderBy;
        String countSql = "SELECT COUNT(p.id) " + whereClause;

        Query dataQuery = entityManager.createNativeQuery(selectSql, Post.class);
        Query countQuery = entityManager.createNativeQuery(countSql);
        params.forEach((key, value) -> {
            dataQuery.setParameter(key, value);
            countQuery.setParameter(key, value);
        });

        dataQuery.setFirstResult((int) pageable.getOffset());
        dataQuery.setMaxResults(pageable.getPageSize());

        @SuppressWarnings("unchecked")
        List<Post> content = dataQuery.getResultList();
        long total = ((Number) countQuery.getSingleResult()).longValue();
        return new PageImpl<>(content, pageable, total);
    }
}
