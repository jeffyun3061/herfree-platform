package com.herfree.global.util;

/** 커뮤니티 인기글 정렬 점수. 실제 상호작용인 반응과 댓글만 합산한다. */
public final class PostEngagementScore {

    private PostEngagementScore() {
    }

    public static String mysqlExpression(String reactionSinceClause, String commentSinceClause) {
        return """
                (
                  (SELECT COUNT(*) FROM reactions r
                   WHERE r.target_type = 'POST' AND r.target_id = p.id%s)
                  + (SELECT COUNT(*) FROM comments c
                     WHERE c.post_id = p.id AND c.status = 'ACTIVE'%s)
                )
                """
                .formatted(reactionSinceClause, commentSinceClause);
    }

    public static String mysqlExpressionAllTime() {
        return mysqlExpression("", "");
    }

    public static String mysqlExpressionWeekly() {
        return mysqlExpression(" AND r.created_at >= :since", " AND c.created_at >= :since");
    }

    public static String jpqlExpression(String reactionSincePredicate, String commentSincePredicate) {
        return """
                (
                  (SELECT COUNT(r) FROM Reaction r
                   WHERE r.targetType = com.herfree.domain.reaction.entity.ReactionTargetType.POST
                   AND r.targetId = p.id%s)
                  + (SELECT COUNT(c) FROM Comment c
                     WHERE c.post.id = p.id AND c.status = com.herfree.domain.comment.entity.CommentStatus.ACTIVE%s)
                )
                """
                .formatted(reactionSincePredicate, commentSincePredicate);
    }

    public static String jpqlAllTime() {
        return jpqlExpression("", "");
    }

    public static String jpqlWeekly() {
        return jpqlExpression(" AND r.createdAt >= :since", " AND c.createdAt >= :since");
    }
}
