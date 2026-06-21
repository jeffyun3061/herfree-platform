package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.exception.BoardNotFoundException;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.request.AdminPostUpdateRequest;
import com.herfree.domain.post.dto.request.PostUpdateRequest;
import com.herfree.domain.post.dto.response.AdminCommunityPostResponse;
import com.herfree.domain.post.dto.response.PostDetailResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostImage;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostAccessDeniedException;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.util.PostVisibilityPolicy;
import com.herfree.global.storage.PostImageStorageService;
import com.herfree.global.util.BoardWritePolicy;
import com.herfree.global.util.PrivateBoardPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final BoardRepository boardRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PostImageStorageService postImageStorageService;

    @Transactional
    public PostDetailResponse createPost(Long userId, PostCreateRequest request) {
        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(BoardNotFoundException::new);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        BoardWritePolicy.assertCommunityWritable(board, user.getRole());

        postImageStorageService.assertImageUrlAllowed(userId, request.imageUrl());

        PostVisibility visibility = PrivateBoardPolicy.isPrivateBoard(board.getBoardType())
                ? PostVisibility.MEMBERS_ONLY
                : request.visibility();

        Post post = Post.builder()
                .board(board)
                .user(user)
                .title(request.title())
                .content(request.content())
                .visibility(visibility)
                .isAnonymous(request.isAnonymous())
                .build();

        postRepository.save(post);
        savePostImageIfPresent(post, request.imageUrl());

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        String imageUrl = resolveImageUrl(post.getId());
        return PostDetailResponse.of(post, profile.getNickname(), true, imageUrl);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getPosts(Long boardId, String keyword, Pageable pageable, Long userId) {
        String normalizedKeyword = normalizeKeyword(keyword);
        UserRole viewerRole = resolveViewerRole(userId);
        Page<Post> posts = fetchActivePosts(boardId, normalizedKeyword, userId, viewerRole, pageable);
        boolean trackStaffReplies = boardId != null
                && boardRepository.findById(boardId)
                        .map(board -> PrivateBoardPolicy.isPrivateBoard(board.getBoardType()))
                        .orElse(false);
        Map<Long, Boolean> staffRepliedMap = trackStaffReplies
                ? resolveStaffRepliedMap(posts.getContent())
                : Map.of();
        return posts.map(post -> {
            String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                    .map(UserProfile::getNickname)
                    .orElse("(알 수 없음)");
            boolean staffReplied = staffRepliedMap.getOrDefault(post.getId(), false);
            return PostResponse.of(post, nickname, userId, viewerRole, staffReplied);
        });
    }

    private Page<Post> fetchActivePosts(
            Long boardId,
            String keyword,
            Long userId,
            UserRole viewerRole,
            Pageable pageable
    ) {
        if (boardId != null) {
            Board board = boardRepository.findById(boardId).orElseThrow(BoardNotFoundException::new);
            if (PrivateBoardPolicy.isPrivateBoard(board.getBoardType()) && userId == null) {
                throw new PostAccessDeniedException();
            }
            if (PrivateBoardPolicy.isInquiryBoard(board.getBoardType())) {
                return postRepository.searchInquiryPosts(PostStatus.ACTIVE, boardId, keyword, pageable);
            }
            if (PrivateBoardPolicy.isSecretConsultBoard(board.getBoardType())) {
                return postRepository.searchSecretConsultPosts(PostStatus.ACTIVE, boardId, keyword, pageable);
            }
        }
        return postRepository.searchActivePosts(PostStatus.ACTIVE, boardId, keyword, userId, pageable);
    }

    @Transactional
    public PostDetailResponse getPost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        UserRole viewerRole = resolveViewerRole(userId);
        PostVisibilityPolicy.assertReadable(post, userId, viewerRole);

        post.increaseViewCount();

        String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        boolean isMyPost = userId != null && post.getUser().getId().equals(userId);
        String imageUrl = resolveImageUrl(post.getId());
        boolean staffReplied = resolveStaffReplied(post);

        return PostDetailResponse.of(post, nickname, isMyPost, imageUrl, staffReplied);
    }

    @Transactional
    public PostDetailResponse updatePost(Long userId, Long postId, PostUpdateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        BoardWritePolicy.assertCommunityWritable(post.getBoard());

        post.update(request.title(), request.content(), request.isAnonymous());
        postImageStorageService.assertImageUrlAllowed(userId, request.imageUrl());
        updatePostImage(post, request.imageUrl());

        String nickname = userProfileRepository.findByUserId(userId)
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        String imageUrl = resolveImageUrl(post.getId());
        return PostDetailResponse.of(post, nickname, true, imageUrl, resolveStaffReplied(post));
    }

    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.delete();
    }

    @Transactional
    public void hidePost(Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        BoardWritePolicy.assertCommunityWritable(post.getBoard());
        post.hide();
    }

    @Transactional
    public void restorePost(Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.HIDDEN)
                .orElseThrow(PostNotFoundException::new);

        BoardWritePolicy.assertCommunityWritable(post.getBoard());
        post.restore();
    }

    @Transactional
    public void adminUpdatePost(Long postId, AdminPostUpdateRequest request) {
        Post post = postRepository.findByIdAndStatusIn(
                        postId, java.util.List.of(PostStatus.ACTIVE, PostStatus.HIDDEN))
                .orElseThrow(PostNotFoundException::new);

        if ("NOTICE".equals(post.getBoard().getBoardType())) {
            throw new PostAccessDeniedException();
        }
        BoardWritePolicy.assertCommunityWritable(post.getBoard());
        post.update(request.title().trim(), request.content().trim(), post.isAnonymous());
    }

    @Transactional(readOnly = true)
    public Page<AdminCommunityPostResponse> getAdminCommunityPosts(
            String keyword,
            PostStatus statusFilter,
            Pageable pageable
    ) {
        java.util.List<PostStatus> statuses = statusFilter != null
                ? java.util.List.of(statusFilter)
                : java.util.List.of(PostStatus.ACTIVE, PostStatus.HIDDEN);

        return postRepository.searchCommunityPostsForAdmin(statuses, normalizeKeyword(keyword), pageable)
                .map(post -> {
                    String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                            .map(UserProfile::getNickname)
                            .orElse("(알 수 없음)");
                    return AdminCommunityPostResponse.from(post, nickname);
                });
    }

    private String normalizeKeyword(String keyword) {
        return StringUtils.hasText(keyword) ? keyword.trim() : null;
    }

    private boolean resolveStaffReplied(Post post) {
        if (!PrivateBoardPolicy.isPrivateBoard(post.getBoard().getBoardType())) {
            return false;
        }
        return commentRepository.existsStaffReplyOnPost(post.getId(), CommentStatus.ACTIVE);
    }

    private Map<Long, Boolean> resolveStaffRepliedMap(List<Post> posts) {
        if (posts.isEmpty()) {
            return Map.of();
        }
        List<Long> ids = posts.stream().map(Post::getId).toList();
        Set<Long> replied = commentRepository.findPostIdsWithStaffReplies(ids, CommentStatus.ACTIVE);
        return ids.stream().collect(Collectors.toMap(id -> id, replied::contains));
    }

    private UserRole resolveViewerRole(Long userId) {
        if (userId == null) {
            return null;
        }
        return userRepository.findById(userId)
                .map(User::getRole)
                .orElse(UserRole.USER);
    }

    private void savePostImageIfPresent(Post post, String imageUrl) {
        if (!StringUtils.hasText(imageUrl)) {
            return;
        }
        postImageRepository.save(PostImage.builder()
                .post(post)
                .imageUrl(imageUrl.trim())
                .sortOrder(0)
                .build());
    }

    private void updatePostImage(Post post, String imageUrl) {
        if (imageUrl == null) {
            return;
        }
        postImageRepository.deleteByPostId(post.getId());
        if (StringUtils.hasText(imageUrl)) {
            savePostImageIfPresent(post, imageUrl);
        }
    }

    private String resolveImageUrl(Long postId) {
        return postImageRepository.findFirstByPostIdOrderBySortOrderAsc(postId)
                .map(PostImage::getImageUrl)
                .map(postImageStorageService::toDisplayUrl)
                .orElse(null);
    }
}
