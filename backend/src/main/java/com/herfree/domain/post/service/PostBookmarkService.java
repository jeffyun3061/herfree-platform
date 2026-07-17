package com.herfree.domain.post.service;

import com.herfree.domain.post.dto.response.PostBookmarkStatusResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostBookmarkRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.PostVisibilityPolicy;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 게시글 스크랩(북마크) — 회원별 DB 보존, 목록은 공개 범위 정책을 다시 적용한다.
 */
@Service
@RequiredArgsConstructor
public class PostBookmarkService {

    private final PostBookmarkRepository postBookmarkRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final ReactionRepository reactionRepository;

    @Transactional(readOnly = true)
    public PostBookmarkStatusResponse getStatus(Long userId, Long postId) {
        User user = requireActiveUser(userId);
        Post post = requireReadablePost(postId, user);
        return new PostBookmarkStatusResponse(
                postBookmarkRepository.existsByUserIdAndPostId(userId, post.getId())
        );
    }

    @Transactional
    public PostBookmarkStatusResponse bookmark(Long userId, Long postId) {
        User user = requireActiveUser(userId);
        Post post = requireReadablePost(postId, user);
        // DB 유니크 제약과 INSERT IGNORE를 함께 사용해 중복 클릭·재시도에도 한 건만 저장한다.
        postBookmarkRepository.insertIfAbsent(userId, post.getId());
        return new PostBookmarkStatusResponse(true);
    }

    @Transactional
    public PostBookmarkStatusResponse remove(Long userId, Long postId) {
        requireActiveUser(userId);
        postBookmarkRepository.deleteByUserIdAndPostId(userId, postId);
        return new PostBookmarkStatusResponse(false);
    }

    @Transactional(readOnly = true)
    public Page<PostResponse> getBookmarkedPosts(Long userId, Pageable pageable) {
        User user = requireActiveUser(userId);
        Page<Post> posts = postBookmarkRepository.findPostsByUserIdAndStatus(
                userId,
                PostStatus.ACTIVE,
                pageable
        );
        Map<Long, UserProfile> profiles = resolveProfiles(posts.getContent());
        Map<Long, Integer> reactions = resolveReactionCounts(posts.getContent());
        return posts.map(post -> PostResponse.of(
                post,
                profiles.containsKey(post.getUser().getId())
                        ? profiles.get(post.getUser().getId()).getNickname()
                        : "(알 수 없음)",
                userId,
                user.getRole(),
                false,
                reactions.getOrDefault(post.getId(), 0)
        ));
    }

    private User requireActiveUser(Long userId) {
        return userRepository.findByIdAndStatus(userId, UserStatus.ACTIVE)
                .orElseThrow(UserNotFoundException::new);
    }

    private Post requireReadablePost(Long postId, User user) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);
        PostVisibilityPolicy.assertReadable(post, user.getId(), user.getRole());
        return post;
    }

    private Map<Long, UserProfile> resolveProfiles(List<Post> posts) {
        Set<Long> userIds = posts.stream()
                .map(post -> post.getUser().getId())
                .collect(Collectors.toSet());
        if (userIds.isEmpty()) {
            return Map.of();
        }
        return userProfileRepository.findByUser_IdIn(userIds).stream()
                .collect(Collectors.toMap(profile -> profile.getUser().getId(), profile -> profile));
    }

    private Map<Long, Integer> resolveReactionCounts(List<Post> posts) {
        Set<Long> postIds = posts.stream().map(Post::getId).collect(Collectors.toSet());
        if (postIds.isEmpty()) {
            return Map.of();
        }
        return reactionRepository.countReactionsByPostIds(postIds).stream()
                .collect(Collectors.toMap(
                        row -> ((Number) row[0]).longValue(),
                        row -> ((Number) row[1]).intValue()
                ));
    }
}
