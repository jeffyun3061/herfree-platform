package com.herfree.domain.comment.service;

import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.dto.response.CommentResponse;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.exception.CommentAccessDeniedException;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    // 댓글 작성 — 게시글이 ACTIVE 상태여야 댓글을 달 수 있다.
    // 삭제·숨김된 게시글에 댓글이 달리면 운영 일관성이 깨진다.
    @Transactional
    public CommentResponse createComment(Long userId, Long postId, CommentCreateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        // 대댓글인 경우 부모 댓글을 조회한다 — parentId가 null이면 최상위 댓글
        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .orElseThrow(CommentNotFoundException::new);
        }

        // 정적 팩토리 메서드로 생성 — builder 대신 도메인 의도가 명확한 create() 사용
        Comment comment = Comment.create(post, user, request.content(), request.isAnonymous(), parent);

        commentRepository.save(comment);

        return CommentResponse.of(comment, profile.getNickname(), true);
    }

    // 댓글 목록 조회 — ACTIVE 댓글만 등록 순으로 반환한다.
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Long userId, Pageable pageable) {
        return commentRepository.findByPostIdAndStatusOrderByCreatedAtAsc(postId, CommentStatus.ACTIVE, pageable)
                .map(comment -> {
                    UserProfile profile = userProfileRepository.findByUserId(comment.getUser().getId())
                            .orElse(null);
                    String nickname = (profile != null) ? profile.getNickname() : "알 수 없음";
                    boolean isMyComment = userId != null && comment.getUser().getId().equals(userId);
                    return CommentResponse.of(comment, nickname, isMyComment);
                });
    }

    // 댓글 삭제 — 본인 댓글만 삭제 가능하다.
    @Transactional
    public void deleteComment(Long userId, Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(CommentNotFoundException::new);

        if (!comment.getUser().getId().equals(userId)) {
            throw new CommentAccessDeniedException();
        }

        comment.delete();
    }

    // 관리자 숨김 처리 — AdminCommentController에서 호출한다.
    @Transactional
    public void hideComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(CommentNotFoundException::new);
        comment.hide();
    }
}
