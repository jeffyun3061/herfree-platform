package com.herfree.domain.content.repository;

import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentRepository extends JpaRepository<Content, Long> {

    Page<Content> findByCategoryAndStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
            String category, ContentStatus status, Pageable pageable);

    Page<Content> findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
            ContentStatus status, Pageable pageable);

    Optional<Content> findByIdAndStatus(Long id, ContentStatus status);

    Optional<Content> findTopByOrderBySortOrderDesc();

    long countByCreatedAtAfter(LocalDateTime since);

    @Query("""
            SELECT c FROM Content c
            WHERE c.status IN :statuses
            AND (:category IS NULL OR :category = '' OR c.category = :category)
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY c.isPinned DESC, c.sortOrder DESC, c.createdAt DESC
            """)
    Page<Content> searchAdminContents(
            @Param("statuses") Collection<ContentStatus> statuses,
            @Param("category") String category,
            @Param("keyword") String keyword,
            Pageable pageable);
}
