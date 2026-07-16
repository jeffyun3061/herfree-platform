package com.herfree.domain.content.repository;

import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ContentRepository extends JpaRepository<Content, Long> {

    @EntityGraph(attributePaths = "author")
    Page<Content> findByCategoryAndStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
            String category, ContentStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Page<Content> findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
            ContentStatus status, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    Optional<Content> findByIdAndStatus(Long id, ContentStatus status);

    Optional<Content> findTopByOrderBySortOrderDesc();

    // 칼럼 대표 이미지도 게시글과 같은 object 저장소를 쓴다 — 이미지 프록시 접근 판정용
    // 이미지 공개 여부는 연결된 콘텐츠의 숨김·삭제 상태까지 확인한다.
    @EntityGraph(attributePaths = "author")
    List<Content> findAllByImageUrlEndingWith(String objectKey);

    long countByCreatedAtAfter(Instant since);

    @Query(
            value = """
            SELECT c FROM Content c
            JOIN FETCH c.author a
            WHERE c.status IN :statuses
            AND (:authorId IS NULL OR a.id = :authorId)
            AND (:category IS NULL OR :category = '' OR c.category = :category)
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY c.isPinned DESC, c.sortOrder DESC, c.createdAt DESC
            """,
            countQuery = """
            SELECT COUNT(c) FROM Content c
            WHERE c.status IN :statuses
            AND (:authorId IS NULL OR c.author.id = :authorId)
            AND (:category IS NULL OR :category = '' OR c.category = :category)
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(c.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            """)
    Page<Content> searchAdminContents(
            @Param("statuses") Collection<ContentStatus> statuses,
            @Param("authorId") Long authorId,
            @Param("category") String category,
            @Param("keyword") String keyword,
            Pageable pageable);
}
