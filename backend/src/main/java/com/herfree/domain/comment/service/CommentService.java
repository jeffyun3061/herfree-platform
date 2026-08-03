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
import com.herfree.global.util.PrivateBoardPolicy;
import com.herfree.global.util.StaffRolePolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 게시글 댓글 CRUD·관리자 목록.
 * <p>
 * 숨김·삭제된 게시글에는 댓글을 달 수 없고, 비공개 게시판 댓글은 {@link com.herfree.global.util.PrivateBoardPolicy}와 동일한 마스킹을 따른다.
 */
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

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        PostVisibilityPolicy.assertReadable(post, userId, user.getRole());

        if (PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType())
                && !PrivateBoardPolicy.canStaffWriteCommentOnPrivateBoard(user.getRole())) {
            throw new CommentAccessDeniedException();
        }

        // parentId가 있으면 대댓글 — 부모 댓글이 ACTIVE 상태인지 확인한다
        Comment parent = null;
        if (request.parentId() != null) {
            parent = commentRepository.findById(request.parentId())
                    .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                    .orElseThrow(CommentNotFoundException::new);
            if (!java.util.Objects.equals(parent.getPost().getId(), postId)) {
                throw new CommentNotFoundException();
            }
        }

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .parent(parent)
                .content(request.content().trim())
                .isAnonymous(request.isAnonymous())
                .build();

        commentRepository.save(comment);
        postRepository.incrementCommentCount(postId);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        return CommentResponse.of(comment, profile.getNickname(), userId);
    }

    // 댓글 목록은 등록순으로 반환한다 — 대화의 흐름을 시간 순서대로 읽는 것이 자연스럽다
    @Transactional(readOnly = true)
    public Page<CommentResponse> getComments(Long postId, Long currentUserId, Pageable pageable) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        var viewerRole = currentUserId == null
                ? null
                : userRepository.findById(currentUserId).map(User::getRole).orElse(null);
        PostVisibilityPolicy.assertReadable(post, currentUserId, viewerRole);

        if (PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType())
                && !PrivateBoardPolicy.canViewerReadComments(post, currentUserId, viewerRole)) {
            throw new CommentAccessDeniedException();
        }

        Page<Comment> comments = commentRepository
                .findByPostIdAndStatusOrderByCreatedAtAsc(postId, CommentStatus.ACTIVE, pageable);
        Map<Long, UserProfile> profileMap = resolveProfileMap(comments.getContent());
        return comments.map(comment -> {
                    String nickname = resolveNickname(profileMap, comment.getUser().getId());
                    return CommentResponse.of(comment, nickname, currentUserId);
                });
    }

    // soft delete — 물리 삭제 대신 DELETED 상태로 전환한다
    @Transactional
    public void deleteComment(Long commentId, Long userId) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                .orElseThrow(CommentNotFoundException::new);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);
        Post post = comment.getPost();
        boolean privateBoard = PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType());

        if (privateBoard) {
            if (!StaffRolePolicy.isStaff(user.getRole())) {
                throw new CommentAccessDeniedException();
            }
        } else if (!comment.getUser().getId().equals(userId)) {
            throw new CommentAccessDeniedException();
        }

        comment.delete();
        postRepository.decrementCommentCount(post.getId());
    }

    // 관리자 전용 숨김 처리 — AdminCommentController에서 호출한다
    @Transactional
    public void hideComment(Long commentId) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getStatus() == CommentStatus.ACTIVE)
                .orElseThrow(CommentNotFoundException::new);

        comment.hide();
        postRepository.decrementCommentCount(comment.getPost().getId());
    }

    @Transactional
    public void restoreComment(Long commentId) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getStatus() == CommentStatus.HIDDEN)
                .orElseThrow(CommentNotFoundException::new);

        comment.restore();
        postRepository.incrementCommentCount(comment.getPost().getId());
    }

    @Transactional
    public void adminDeleteComment(Long commentId) {
        Comment comment = commentRepository.findByIdForUpdate(commentId)
                .filter(c -> c.getStatus() == CommentStatus.ACTIVE || c.getStatus() == CommentStatus.HIDDEN)
                .orElseThrow(CommentNotFoundException::new);
        boolean wasActive = comment.getStatus() == CommentStatus.ACTIVE;

        comment.delete();
        if (wasActive) {
            postRepository.decrementCommentCount(comment.getPost().getId());
        }
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

        Page<Comment> comments = commentRepository.searchForAdmin(statuses, normalizeKeyword(keyword), pageable);
        Map<Long, UserProfile> profileMap = resolveProfileMap(comments.getContent());
        return comments.map(comment -> {
                    String nickname = resolveNickname(profileMap, comment.getUser().getId());
                    return AdminCommunityCommentResponse.from(comment, nickname);
                });
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private Map<Long, UserProfile> resolveProfileMap(java.util.List<Comment> comments) {
        if (comments.isEmpty()) {
            return Map.of();
        }
        Set<Long> userIds = comments.stream()
                .map(comment -> comment.getUser().getId())
                .collect(Collectors.toSet());
        return userProfileRepository.findByUser_IdIn(userIds).stream()
                .collect(Collectors.toMap(profile -> profile.getUser().getId(), profile -> profile));
    }

    private String resolveNickname(Map<Long, UserProfile> profileMap, Long userId) {
        UserProfile profile = profileMap.get(userId);
        return profile == null ? "(알 수 없음)" : profile.getNickname();
    }
}
