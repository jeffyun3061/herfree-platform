package com.herfree.domain.comment.repository;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 특정 게시글의 활성 댓글을 등록순(오름차순)으로 조회한다
    // 댓글은 게시글과 달리 등록 순서대로 읽는 것이 자연스럽다
    Page<Comment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, CommentStatus status, Pageable pageable);

    // 탈퇴 처리 시 작성 댓글 익명화 대상 조회
    List<Comment> findByUserIdAndStatusNot(Long userId, CommentStatus status);

    long countByStatus(CommentStatus status);

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.post p
            JOIN FETCH p.board b
            JOIN FETCH c.user u
            WHERE c.status IN :statuses
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY c.createdAt DESC
            """)
    Page<Comment> searchForAdmin(
            @Param("statuses") java.util.Collection<CommentStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable);

    java.util.Optional<Comment> findByIdAndStatusIn(Long id, java.util.Collection<CommentStatus> statuses);

    @Query("""
            SELECT DISTINCT c.post.id FROM Comment c
            JOIN c.user u
            WHERE c.post.id IN :postIds
            AND c.status = :status
            AND u.role IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN')
            """)
    java.util.Set<Long> findPostIdsWithStaffReplies(
            @Param("postIds") java.util.Collection<Long> postIds,
            @Param("status") CommentStatus status);

    @Query("""
            SELECT CASE WHEN COUNT(c) > 0 THEN true ELSE false END FROM Comment c
            JOIN c.user u
            WHERE c.post.id = :postId
            AND c.status = :status
            AND u.role IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN')
            """)
    boolean existsStaffReplyOnPost(@Param("postId") Long postId, @Param("status") CommentStatus status);
}
