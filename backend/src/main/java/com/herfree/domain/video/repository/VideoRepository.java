package com.herfree.domain.video.repository;

import com.herfree.domain.video.entity.Video;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VideoRepository extends JpaRepository<Video, Long> {

    // 노출 중인 영상만 최신순으로 조회한다
    Page<Video> findByIsVisibleTrueOrderByCreatedAtDesc(Pageable pageable);

    Optional<Video> findByIdAndIsVisibleTrue(Long id);
}
