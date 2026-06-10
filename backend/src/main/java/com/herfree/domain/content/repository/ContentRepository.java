package com.herfree.domain.content.repository;

import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ContentRepository extends JpaRepository<Content, Long> {

    // 카테고리 필터가 있을 때 사용
    Page<Content> findByCategoryAndStatusOrderByCreatedAtDesc(
            String category, ContentStatus status, Pageable pageable);

    // 카테고리 필터 없이 전체 목록 조회
    Page<Content> findByStatusOrderByCreatedAtDesc(ContentStatus status, Pageable pageable);

    Optional<Content> findByIdAndStatus(Long id, ContentStatus status);
}
