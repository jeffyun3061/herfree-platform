package com.herfree.domain.comment.repository;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 특정 게시글의 활성 댓글을 등록순(오름차순)으로 조회한다
    // 댓글은 게시글과 달리 등록 순서대로 읽는 것이 자연스럽다
    Page<Comment> findByPostIdAndStatusOrderByCreatedAtAsc(Long postId, CommentStatus status, Pageable pageable);

    // 탈퇴 처리 시 작성 댓글 익명화 대상 조회
    List<Comment> findByUserIdAndStatusNot(Long userId, CommentStatus status);

    long countByStatus(CommentStatus status);
}
