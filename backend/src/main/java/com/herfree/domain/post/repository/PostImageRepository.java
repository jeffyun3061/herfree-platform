package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.PostImage;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

public interface PostImageRepository extends JpaRepository<PostImage, Long> {

    Optional<PostImage> findFirstByPostIdOrderBySortOrderAsc(Long postId);

    // 저장 URL이 프록시 경로(/api/...)든 S3 직링크든 object key는 항상 포함된다
    // 같은 object가 재사용돼도 첫 연결 하나만 보고 공개 여부를 결정하지 않는다.
    @EntityGraph(attributePaths = {"post", "post.board", "post.user"})
    List<PostImage> findAllByImageUrlEndingWith(String objectKey);

    List<PostImage> findAllByPostIdIn(Collection<Long> postIds);

    @Modifying
    void deleteByPostId(Long postId);

    @Modifying
    void deleteByPostIdIn(Collection<Long> postIds);
}
