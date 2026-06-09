package com.herfree.domain.comment.repository;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    // 특정 게시글의 활성 댓글을 오래된 순으로 페이징 조회한다
    // status를 파라미터로 받으면 HIDDEN 댓글을 포함하는 관리자 조회에도 재사용할 수 있다
    Page<Comment> findByPostIdAndStatusOrderByCreatedAtAsc(
            Long postId, CommentStatus status, Pageable pageable);

    // id와 status를 동시에 확인해 DELETED 댓글을 수정·삭제 대상에서 자동으로 제외한다
    Optional<Comment> findByIdAndStatus(Long id, CommentStatus status);
}
