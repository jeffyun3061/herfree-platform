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
import com.herfree.domain.post.entity.PostVisibility;
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

    // 게시글 작성 — 게시판·사용자 존재 여부를 먼저 검증한 뒤 엔티티를 생성한다.
    // 엔티티 생성 책임은 Builder에 두고, Service는 "무엇을 조합하는가"만 담당한다.
    @Transactional
    public PostResponse createPost(Long userId, PostCreateRequest request) {
        Board board = boardRepository.findById(request.boardId())
                .orElseThrow(BoardNotFoundException::new);

        User user = userRepository.findById(userId)
                .orElseThrow(UserNotFoundException::new);

        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        PostVisibility visibility = parseVisibility(request.visibility());

        Post post = Post.builder()
                .board(board)
                .user(user)
                .title(request.title())
                .content(request.content())
                .visibility(visibility)
                .isAnonymous(request.isAnonymous())
                .build();

        postRepository.save(post);

        return PostResponse.of(post, profile.getNickname());
    }

    // 게시판별 게시글 목록 — ACTIVE 게시글만 반환한다.
    // 익명 글은 "익명"으로 마스킹되므로 PostResponse.of() 내부에서 처리된다.
    @Transactional(readOnly = true)
    public Page<PostResponse> getPosts(Long boardId, Pageable pageable) {
        return postRepository.findByBoardIdAndStatusOrderByCreatedAtDesc(boardId, PostStatus.ACTIVE, pageable)
                .map(post -> {
                    // 게시글의 작성자 닉네임을 조회한다 — N+1 주의: 목록 조회 성능은 추후 fetch join으로 개선 예정
                    UserProfile profile = userProfileRepository.findByUserId(post.getUser().getId())
                            .orElse(null);
                    String nickname = (profile != null) ? profile.getNickname() : "알 수 없음";
                    return PostResponse.of(post, nickname);
                });
    }

    // 게시글 단건 조회 — 조회 시 viewCount를 증가시킨다.
    // userId가 null이면 비로그인 사용자이므로 isMyPost는 항상 false다.
    @Transactional
    public PostDetailResponse getPost(Long postId, Long userId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        post.increaseViewCount();

        UserProfile profile = userProfileRepository.findByUserId(post.getUser().getId())
                .orElse(null);
        String nickname = (profile != null) ? profile.getNickname() : "알 수 없음";

        // 로그인 사용자이고 작성자 ID가 일치할 때만 isMyPost = true
        boolean isMyPost = userId != null && post.getUser().getId().equals(userId);

        return PostDetailResponse.of(post, nickname, isMyPost);
    }

    // 게시글 수정 — 소유권 검증 후 엔티티 도메인 메서드에 수정 책임을 위임한다.
    @Transactional
    public void updatePost(Long userId, Long postId, PostUpdateRequest request) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        // 본인 글이 아니면 403 — 관리자도 수정은 불가, 숨김만 가능하다
        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.update(request.title(), request.content(), request.isAnonymous());
    }

    // 게시글 삭제 — soft delete 방식으로 status를 DELETED로 전환한다.
    @Transactional
    public void deletePost(Long userId, Long postId) {
        Post post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);

        if (!post.getUser().getId().equals(userId)) {
            throw new PostAccessDeniedException();
        }

        post.delete();
    }

    // 관리자 숨김 처리 — 신고 수락 또는 직접 운영 조치 시 AdminPostController에서 호출한다.
    @Transactional
    public void hidePost(Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(PostNotFoundException::new);
        post.hide();
    }

    // 내가 작성한 게시글 — ACTIVE 게시글만 반환하며 익명 마스킹 없이 실제 닉네임을 표시한다.
    @Transactional(readOnly = true)
    public Page<PostResponse> getMyPosts(Long userId, Pageable pageable) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(UserNotFoundException::new);

        String nickname = profile.getNickname();

        return postRepository
                .findByUserIdAndStatusOrderByCreatedAtDesc(userId, PostStatus.ACTIVE, pageable)
                .map(post -> new PostResponse(
                        post.getId(),
                        post.getBoard().getId(),
                        post.getBoard().getName(),
                        post.getTitle(),
                        // 본인 조회이므로 익명 여부와 상관없이 실제 닉네임을 반환한다
                        nickname,
                        post.getViewCount(),
                        post.getCreatedAt()
                ));
    }

    // visibility 문자열을 enum으로 변환한다 — 잘못된 값이 들어오면 PUBLIC으로 처리한다.
    private PostVisibility parseVisibility(String visibility) {
        if (visibility == null) {
            return PostVisibility.PUBLIC;
        }
        try {
            return PostVisibility.valueOf(visibility.toUpperCase());
        } catch (IllegalArgumentException e) {
            return PostVisibility.PUBLIC;
        }
    }
}
