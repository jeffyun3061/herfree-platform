package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostBookmark;
import com.herfree.domain.post.entity.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PostBookmarkRepository extends JpaRepository<PostBookmark, Long> {

    boolean existsByUserIdAndPostId(Long userId, Long postId);

    @Modifying
    @Query(value = """
            INSERT IGNORE INTO post_bookmarks (user_id, post_id, created_at, updated_at)
            VALUES (:userId, :postId, NOW(6), NOW(6))
            """, nativeQuery = true)
    int insertIfAbsent(@Param("userId") Long userId, @Param("postId") Long postId);

    void deleteByUserIdAndPostId(Long userId, Long postId);

    void deleteAllByUserId(Long userId);

    void deleteAllByPostId(Long postId);

    @Query("""
            SELECT COUNT(b) FROM PostBookmark b
            JOIN b.post p
            WHERE b.user.id = :userId
            AND p.status = com.herfree.domain.post.entity.PostStatus.ACTIVE
            """)
    long countActiveByUserId(@Param("userId") Long userId);

    @Query(
            value = """
                    SELECT p FROM PostBookmark b
                    JOIN b.post p
                    JOIN FETCH p.board
                    JOIN FETCH p.user
                    WHERE b.user.id = :userId
                    AND p.status = :status
                    ORDER BY b.createdAt DESC
                    """,
            countQuery = """
                    SELECT COUNT(b) FROM PostBookmark b
                    JOIN b.post p
                    WHERE b.user.id = :userId
                    AND p.status = :status
                    """
    )
    Page<Post> findPostsByUserIdAndStatus(
            @Param("userId") Long userId,
            @Param("status") PostStatus status,
            Pageable pageable
    );
}
