package com.herfree.domain.comment.repository;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("select c.post.id from Comment c where c.id=:id")
    Optional<Long> findPostIdById(@Param("id") Long id);
    interface WithdrawalTarget { Long getId(); Long getPostId(); }
    @Query("select c.id as id,c.post.id as postId from Comment c where c.user.id=:userId and c.communityHealthConsent is not null and c.status<>'CONSENT_WITHDRAWN' order by c.post.id,c.id")
    List<WithdrawalTarget> findConsentBackedTargetsForWithdrawal(@Param("userId") Long userId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from Comment c where c.id in :ids order by c.id")
    List<Comment> lockAllByIdIn(@Param("ids") java.util.Collection<Long> ids);

    // 상태 전이는 같은 댓글 행을 잠근 뒤 현재 상태를 다시 확인해야 카운터가 한 번만 바뀐다.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            select c from Comment c
            where c.id = :id
            """)
    Optional<Comment> findByIdForUpdate(@Param("id") Long id);

    // 특정 게시글의 활성 댓글을 등록순(오름차순)으로 조회한다
    // 댓글은 게시글과 달리 등록 순서대로 읽는 것이 자연스럽다
    @EntityGraph(attributePaths = {"user", "post", "parent"})
    Page<Comment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, CommentStatus status, Pageable pageable);

    // 탈퇴 처리 시 작성 댓글 익명화 대상 조회
    List<Comment> findByUserIdAndStatusNot(Long userId, CommentStatus status);

    long countByStatus(CommentStatus status);

    long countByStatusAndCreatedAtAfter(CommentStatus status, Instant since);

    @Query("""
            SELECT c FROM Comment c
            JOIN FETCH c.post p
            JOIN FETCH p.board b
            JOIN FETCH c.user u
            WHERE c.status IN :statuses
            AND p.status <> 'CONSENT_WITHDRAWN'
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(c.content) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY c.createdAt DESC
            """)
    Page<Comment> searchForAdmin(
            @Param("statuses") java.util.Collection<CommentStatus> statuses,
            @Param("keyword") String keyword,
            Pageable pageable);

    java.util.Optional<Comment> findByIdAndStatusIn(Long id, java.util.Collection<CommentStatus> statuses);

    @EntityGraph(attributePaths = {"user", "post"})
    List<Comment> findByIdInAndStatusIn(
            java.util.Collection<Long> ids, java.util.Collection<CommentStatus> statuses);

    @Query("""
            SELECT DISTINCT c.post.id FROM Comment c
            JOIN c.user u
            WHERE c.post.id IN :postIds
            AND c.status = :status
            AND u.role IN ('MODERATOR', 'ADMIN', 'SUPER_ADMIN')
            AND (c.post.board.boardType <> 'ANONYMOUS_QUESTION'
                OR (c.user.id <> c.post.user.id AND u.status = 'ACTIVE'))
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
            AND (c.post.board.boardType <> 'ANONYMOUS_QUESTION'
                OR (c.user.id <> c.post.user.id AND u.status = 'ACTIVE'))
            """)
    boolean existsStaffReplyOnPost(@Param("postId") Long postId, @Param("status") CommentStatus status);
}
