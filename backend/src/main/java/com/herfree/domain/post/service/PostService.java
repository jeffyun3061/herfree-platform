package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.exception.BoardNotFoundException;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.request.PostUpdateRequest;
import com.herfree.domain.post.dto.response.PostDetailResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostAccessDeniedException;
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
public class PostService {

    private final PostRepository postRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;

    // 게시글 작성 — Board와 User 엔티티를 조회한 후 Post를 생성한다.
    // 빌더를 통해 생성함으로써 불변성을 유지하고, setter 없이 초기 상태를 명확히 표현한다.
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

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        return PostDetailResponse.of(post, profile.getNickname(), true);
    }

    // 게시글 목록 조회 — ACTIVE 상태 게시글만 반환한다.
    // 닉네임 조회를 위해 user_id로 UserProfile을 조회하는 N+1 문제가 발생할 수 있다.
    // 현재는 단순 구조를 유지하고, 성능 이슈 발생 시 JPQL fetch join 또는 Projections으로 최적화한다.
    @Transactional(readOnly = true)
    public Page<PostResponse> getPosts(Long boardId, Pageable pageable) {
        return postRepository
                .findByBoardIdAndStatusOrderByCreatedAtDesc(boardId, PostStatus.ACTIVE, pageable)
                .map(post -> {
                    String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                            .map(UserProfile::getNickname)
                            .orElse("(알 수 없음)");
                    return PostResponse.of(post, nickname);
                });
    }

    // 게시글 상세 조회 — 조회 시마다 viewCount를 증가시킨다.
    // @Transactional(readOnly=false)를 사용해 viewCount 변경이 DB에 반영된다.
    // userId가 null이면 비로그인 사용자이므로 isMyPost는 항상 false다.
    @Transactional
    public PostDetailResponse getPost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        post.increaseViewCount();

        String nickname = userProfileRepository.findByUserId(post.getUser().getId())
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        // userId가 null이거나 작성자가 다른 경우 isMyPost=false
        boolean isMyPost = userId != null && post.getUser().getId().equals(userId);

        return PostDetailResponse.of(post, nickname, isMyPost);
    }

    // 게시글 수정 — 본인 글인지 확인 후 도메인 메서드를 호출한다.
    // @Transactional이 있으면 영속성 컨텍스트의 더티 체킹으로 save() 없이 UPDATE가 실행된다.
    @Transactional
    public PostDetailResponse updatePost(Long userId, Long postId, PostUpdateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.update(request.title(), request.content(), request.isAnonymous());

        String nickname = userProfileRepository.findByUserId(userId)
                .map(UserProfile::getNickname)
                .orElse("(알 수 없음)");

        return PostDetailResponse.of(post, nickname, true);
    }

    // 게시글 soft delete — 물리 삭제를 하지 않는 이유는 연관 댓글·신고 데이터를 보존하고,
    // 추후 복구 또는 감사(audit) 목적으로 이력을 남기기 위함이다.
    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.delete();
    }

    // 관리자 전용 숨김 처리 — 신고 처리 결과로 게시글을 숨길 때도 이 메서드를 재사용한다
    @Transactional
    public void hidePost(Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        post.hide();
    }
}
