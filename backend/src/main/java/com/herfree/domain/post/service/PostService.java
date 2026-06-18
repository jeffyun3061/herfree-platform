package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.exception.BoardNotFoundException;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.request.PostUpdateRequest;
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
import com.herfree.global.util.PostVisibilityPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    @Transactional
    public PostDetailResponse createPost(Long userId, PostCreateRequest request) {
        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(BoardNotFoundException::new);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        Post post = Post.builder()
                .board(board)
                .user(user)
                .title(request.title())
                .content(request.content())
                .visibility(request.visibility())
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
        String normalizedKeyword = keyword != null ? keyword.trim() : null;
        return postRepository
                .searchActivePosts(PostStatus.ACTIVE, boardId, normalizedKeyword, userId, pageable)
                .map(post -> {
                    String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                            .map(UserProfile::getNickname)
                            .orElse("(알 수 없음)");
                    return PostResponse.of(post, nickname, userId);
                });
    }

    @Transactional
    public PostDetailResponse getPost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        PostVisibilityPolicy.assertReadable(post, userId);

        post.increaseViewCount();

        String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        boolean isMyPost = userId != null && post.getUser().getId().equals(userId);
        String imageUrl = resolveImageUrl(post.getId());

        return PostDetailResponse.of(post, nickname, isMyPost, imageUrl);
    }

    @Transactional
    public PostDetailResponse updatePost(Long userId, Long postId, PostUpdateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.update(request.title(), request.content(), request.isAnonymous());
        updatePostImage(post, request.imageUrl());

        String nickname = userProfileRepository.findByUserId(userId)
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        String imageUrl = resolveImageUrl(post.getId());
        return PostDetailResponse.of(post, nickname, true, imageUrl);
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

        post.hide();
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
                .orElse(null);
    }
}
