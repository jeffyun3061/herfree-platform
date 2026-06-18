package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.PostImage;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {

    Optional<PostImage> findFirstByPostIdOrderBySortOrderAsc(Long postId);

    @Modifying
    void deleteByPostId(Long postId);
}
