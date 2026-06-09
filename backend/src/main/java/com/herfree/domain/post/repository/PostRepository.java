package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 게시판별 ACTIVE 게시글을 최신순으로 페이지네이션 조회한다.
    // status 조건을 Repository에 위임해 Service에서 별도 필터링 코드가 필요 없다.
    Page<Post> findByBoardIdAndStatusOrderByCreatedAtDesc(Long boardId, PostStatus status, Pageable pageable);

    // 단건 조회 시 status를 함께 검증해 삭제·숨김 게시글 노출을 방지한다
    Optional<Post> findByIdAndStatus(Long id, PostStatus status);

    // 내가 쓴 글 목록 — UserService에서 사용하며 ACTIVE 게시글만 반환한다
    Page<Post> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PostStatus status, Pageable pageable);
}
