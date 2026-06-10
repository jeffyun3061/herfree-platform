package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.response.PostDetailResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostAccessDeniedException;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

// PostService의 핵심 비즈니스 로직만 격리해 검증한다.
// DB·Spring 컨텍스트 없이 Mockito Mock만으로 테스트하므로 실행 속도가 빠르다.
@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private PostService postService;

    @Test
    @DisplayName("정상적인 게시글 작성 요청 시 PostDetailResponse가 반환된다")
    void createPost_success() {
        // given
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest(1L, "제목", "내용", false, PostVisibility.PUBLIC);

        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        Board board = buildTestBoard();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("작성자닉네임")
                .isPublic(true)
                .build();

        given(boardRepository.findById(request.boardId())).willReturn(Optional.of(board));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(postRepository.save(any(Post.class))).willAnswer(inv -> inv.getArgument(0));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

        // when
        PostDetailResponse response = postService.createPost(userId, request);

        // then — 작성된 게시글의 제목과 내용이 요청과 일치하는지 확인한다
        assertThat(response.title()).isEqualTo(request.title());
        assertThat(response.content()).isEqualTo(request.content());
        assertThat(response.isMyPost()).isTrue();
    }

    @Test
    @DisplayName("익명으로 작성한 게시글의 작성자 닉네임은 '익명'으로 표시된다")
    void createPost_anonymousPost_nicknameHidden() {
        // given — isAnonymous=true로 요청
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest(1L, "제목", "내용", true, PostVisibility.PUBLIC);

        User user = User.builder()
                .email("test@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        Board board = buildTestBoard();

        UserProfile profile = UserProfile.builder()
                .user(user)
                .nickname("작성자닉네임")
                .isPublic(true)
                .build();

        given(boardRepository.findById(request.boardId())).willReturn(Optional.of(board));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(postRepository.save(any(Post.class))).willAnswer(inv -> inv.getArgument(0));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

        // when
        PostDetailResponse response = postService.createPost(userId, request);

        // then — 본인 조회이므로 isMyPost=true이고 익명 글이어도 실제 닉네임이 표시된다.
        // PostDetailResponse.of()에서 isMyPost=true이면 마스킹을 적용하지 않는다.
        assertThat(response.isMyPost()).isTrue();
        assertThat(response.isAnonymous()).isTrue();
    }

    @Test
    @DisplayName("본인 글이 아닌 게시글을 삭제하면 PostAccessDeniedException이 발생한다")
    void deletePost_notOwner_throws() {
        // given — 다른 사람(userId=2)의 글을 userId=1이 삭제하려는 상황
        Long requestUserId = 1L;
        Long postOwnerId = 2L;

        User postOwner = User.builder()
                .email("owner@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        // Reflection으로 ID를 설정할 수 없으므로 Mockito를 활용해 User mock을 생성한다
        User mockUser = org.mockito.Mockito.mock(User.class);
        given(mockUser.getId()).willReturn(postOwnerId);

        Board board = buildTestBoard();

        Post post = Post.builder()
                .board(board)
                .user(mockUser)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();

        given(postRepository.findByIdAndStatus(1L, PostStatus.ACTIVE)).willReturn(Optional.of(post));

        // when & then — 작성자가 다를 때 403 예외가 발생해야 한다
        assertThatThrownBy(() -> postService.deletePost(requestUserId, 1L))
                .isInstanceOf(PostAccessDeniedException.class);
    }

    @Test
    @DisplayName("게시글 상세 조회 시 viewCount가 1 증가한다")
    void getPost_incrementsViewCount() {
        // given
        Long postId = 1L;
        Long userId = 1L;

        User mockUser = org.mockito.Mockito.mock(User.class);
        given(mockUser.getId()).willReturn(userId);

        Board board = buildTestBoard();

        Post post = Post.builder()
                .board(board)
                .user(mockUser)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(mockUser)
                .nickname("닉네임")
                .isPublic(true)
                .build();

        given(postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)).willReturn(Optional.of(post));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

        int viewCountBefore = post.getViewCount();

        // when
        postService.getPost(postId, userId);

        // then — increaseViewCount() 도메인 메서드가 호출되었는지 viewCount 값으로 검증한다
        assertThat(post.getViewCount()).isEqualTo(viewCountBefore + 1);
    }

    // 테스트용 Board 객체를 생성하는 헬퍼 메서드 — 여러 테스트에서 공통으로 사용한다
    private Board buildTestBoard() {
        return org.mockito.Mockito.mock(Board.class);
    }
}
