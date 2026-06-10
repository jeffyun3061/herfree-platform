package com.herfree.domain.post.repository;

import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostRepository extends JpaRepository<Post, Long> {

    // 특정 게시판의 활성 게시글을 최신순으로 페이징 조회한다
    // 복합 인덱스 (board_id, status, created_at)를 활용한다
    Page<Post> findByBoardIdAndStatusOrderByCreatedAtDesc(Long boardId, PostStatus status, Pageable pageable);

    // 게시글 상세 조회 — 삭제/숨김 상태 게시글은 404로 처리하기 위해 status도 함께 조회한다
    Optional<Post> findByIdAndStatus(Long id, PostStatus status);

    // 내 게시글 목록 조회에 사용 — 삭제된 글도 관리자 목적으로 조회할 수 있도록 상태를 파라미터로 받는다
    Page<Post> findByUserIdAndStatusOrderByCreatedAtDesc(Long userId, PostStatus status, Pageable pageable);

    // 탈퇴 처리 시 작성 글 익명화 대상 조회 — DELETED 글은 이미 노출되지 않으므로 제외한다
    List<Post> findByUserIdAndStatusNot(Long userId, PostStatus status);
}
