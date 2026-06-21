package com.herfree.domain.comment.service;

import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.dto.response.AdminCommunityCommentResponse;
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
import com.herfree.global.util.PostVisibilityPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public CommentResponse createComment(Long postId, Long userId, CommentCreateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        PostVisibilityPolicy.assertReadable(post, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        // parentId가 있으면 대댓글 — 부모 댓글이 ACTIVE 상태인지 확인한다
        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                    .orElseThrow(CommentNotFoundException::new);
        }

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .parent(parent)
                .content(request.content())
                .isAnonymous(request.isAnonymous())
                .build();

        commentRepository.save(comment);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        return CommentResponse.of(comment, profile.getNickname(), userId);
    }

    // 댓글 목록은 등록순으로 반환한다 — 대화의 흐름을 시간 순서대로 읽는 것이 자연스럽다
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Long currentUserId, Pageable pageable) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        PostVisibilityPolicy.assertReadable(post, currentUserId);

        return commentRepository
                .findByPostIdAndStatusOrderByCreatedAtAsc(postId, CommentStatus.ACTIVE, pageable)
                .map(comment -> {
                    String nickname = userProfileRepository.findByUserId(comment.getUser().getId())
                            .map(UserProfile::getNickname)
                            .orElse("(알 수 없음)");
                    return CommentResponse.of(comment, nickname, currentUserId);
                });
    }

    // soft delete — 물리 삭제 대신 DELETED 상태로 전환한다
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                .orElseThrow(CommentNotFoundException::new);

        if (!comment.getUser().getId().equals(userId)) {
            throw new CommentAccessDeniedException();
        }

        comment.delete();
    }

    // 관리자 전용 숨김 처리 — AdminCommentController에서 호출한다
    @Transactional
    public void hideComment(Long commentId) {
        Comment comment = commentRepository.findById(commentId)
                .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                .orElseThrow(CommentNotFoundException::new);

        comment.hide();
    }

    @Transactional
    public void restoreComment(Long commentId) {
        Comment comment = commentRepository.findByIdAndStatusIn(
                        commentId, java.util.List.of(CommentStatus.HIDDEN))
                .orElseThrow(CommentNotFoundException::new);

        comment.restore();
    }

    @Transactional(readOnly = true)
    public Page<AdminCommunityCommentResponse> getAdminComments(
            String keyword,
            CommentStatus statusFilter,
            Pageable pageable
    ) {
        java.util.List<CommentStatus> statuses = statusFilter != null
                ? java.util.List.of(statusFilter)
                : java.util.List.of(CommentStatus.ACTIVE, CommentStatus.HIDDEN);

        return commentRepository.searchForAdmin(statuses, normalizeKeyword(keyword), pageable)
                .map(comment -> {
                    String nickname = userProfileRepository.findByUserId(comment.getUser().getId())
                            .map(UserProfile::getNickname)
                            .orElse("(알 수 없음)");
                    return AdminCommunityCommentResponse.from(comment, nickname);
                });
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }
}
