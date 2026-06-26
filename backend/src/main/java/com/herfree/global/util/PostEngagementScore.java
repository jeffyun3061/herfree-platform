package com.herfree.global.util;

/** 커뮤니티 인기순 복합 점수 — 반응(공감)·댓글·조회·최근성 가중치 */
public final class PostEngagementScore {

    static final int REACTION_WEIGHT = 3;
    static final int COMMENT_WEIGHT = 2;
    static final int VIEW_DIVISOR = 5;
    static final int RECENCY_MAX_DAYS = 7;

    private PostEngagementScore() {
    }

    /**
     * MySQL 표현식 — since가 null이면 전체 기간 반응·댓글, 아니면 최근 7일만 집계.
     * 최근성: 작성 후 7일 이내일수록 0~7점 (일 단위).
     */
    public static String mysqlExpression(String reactionSinceClause, String commentSinceClause) {
        return """
                (
                  (SELECT COUNT(*) FROM reactions r
                   WHERE r.target_type = 'POST' AND r.target_id = p.id%s) * %d
                  + (SELECT COUNT(*) FROM comments c
                     WHERE c.post_id = p.id AND c.status = 'ACTIVE'%s) * %d
                  + FLOOR(p.view_count / %d)
                  + GREATEST(0, %d - LEAST(%d, DATEDIFF(CURDATE(), DATE(p.created_at))))
                )
                """
                .formatted(
                        reactionSinceClause,
                        REACTION_WEIGHT,
                        commentSinceClause,
                        COMMENT_WEIGHT,
                        VIEW_DIVISOR,
                        RECENCY_MAX_DAYS,
                        RECENCY_MAX_DAYS);
    }

    public static String mysqlExpressionAllTime() {
        return mysqlExpression("", "");
    }

    public static String mysqlExpressionWeekly() {
        return mysqlExpression(" AND r.created_at >= :since", " AND c.created_at >= :since");
    }

    /**
     * JPQL 표현식 — H2 테스트·JPA 목록 정렬용 (최근성은 createdAt 보조 정렬로 보완).
     */
    public static String jpqlExpression(String reactionSincePredicate, String commentSincePredicate) {
        return """
                (
                  (SELECT COUNT(r) FROM Reaction r
                   WHERE r.targetType = com.herfree.domain.reaction.entity.ReactionTargetType.POST
                   AND r.targetId = p.id%s) * %d
                  + (SELECT COUNT(c) FROM Comment c
                     WHERE c.post.id = p.id AND c.status = com.herfree.domain.comment.entity.CommentStatus.ACTIVE%s) * %d
                  + p.viewCount / %d
                )
                """
                .formatted(
                        reactionSincePredicate,
                        REACTION_WEIGHT,
                        commentSincePredicate,
                        COMMENT_WEIGHT,
                        VIEW_DIVISOR);
    }

    public static String jpqlAllTime() {
        return jpqlExpression("", "");
    }

    public static String jpqlWeekly() {
        return jpqlExpression(" AND r.createdAt >= :since", " AND c.createdAt >= :since");
    }
}
