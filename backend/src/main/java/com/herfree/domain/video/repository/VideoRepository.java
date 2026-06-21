package com.herfree.domain.video.repository;

import com.herfree.domain.video.entity.Video;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VideoRepository extends JpaRepository<Video, Long> {

    // 공개 목록: 노출 영상 — 추천 우선, sort_order → created_at (최대 page size만큼)
    @Query("""
            SELECT v FROM Video v
            WHERE v.isVisible = true
            ORDER BY v.isFeatured DESC, v.sortOrder DESC, v.createdAt DESC
            """)
    Page<Video> findPublicVideos(Pageable pageable);

    Optional<Video> findByIdAndIsVisibleTrue(Long id);

    Optional<Video> findTopByOrderBySortOrderDesc();

    @Query("""
            SELECT v FROM Video v
            WHERE (:visible IS NULL OR v.isVisible = :visible)
            AND (:keyword IS NULL OR :keyword = '' OR LOWER(v.title) LIKE LOWER(CONCAT('%', :keyword, '%')))
            ORDER BY v.isFeatured DESC, v.sortOrder DESC, v.createdAt DESC
            """)
    Page<Video> searchAdminVideos(
            @Param("visible") Boolean visible,
            @Param("keyword") String keyword,
            Pageable pageable);
}
