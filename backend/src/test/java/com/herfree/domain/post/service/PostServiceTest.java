package com.herfree.domain.post.service;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.dto.response.PostDetailResponse;
import com.herfree.domain.post.dto.response.PostResponse;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostAccessDeniedException;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostFulltextSearchRepository;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.post.repository.PostBookmarkRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.entity.UserStatus;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.reaction.repository.ReactionRepository;
import com.herfree.global.util.ClientIpExtractor;
import com.herfree.global.util.PostListPeriod;
import com.herfree.global.util.PostListSort;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.storage.PostImageStorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

// PostService의 핵심 비즈니스 로직만 격리해 검증한다.
// DB·Spring 컨텍스트 없이 Mockito Mock만으로 테스트하므로 실행 속도가 빠르다.
@ExtendWith(MockitoExtension.class)
class PostServiceTest {

    @Mock
    private PostRepository postRepository;

    @Mock
    private PostBookmarkRepository postBookmarkRepository;

    @Mock
    private PostFulltextSearchRepository postFulltextSearchRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private PostImageRepository postImageRepository;

    @Mock
    private PostImageStorageService postImageStorageService;

    @Mock
    private PostImageCleanupService postImageCleanupService;

    @Mock
    private ReactionRepository reactionRepository;

    @Mock
    private ClientIpExtractor clientIpExtractor;

    @InjectMocks
    private PostService postService;

    @Test
    @DisplayName("정상적인 게시글 작성 요청 시 PostDetailResponse가 반환된다")
    void createPost_success() {
        // given
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest(1L, "제목", "내용", false, PostVisibility.PUBLIC, null);

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
        HttpServletRequest httpRequest = mock(HttpServletRequest.class);
        given(clientIpExtractor.extract(httpRequest)).willReturn("203.0.113.10");
        PostDetailResponse response = postService.createPost(userId, request, httpRequest);

        // then — 작성된 게시글의 제목과 내용이 요청과 일치하는지 확인한다
        assertThat(response.title()).isEqualTo(request.title());
        assertThat(response.content()).isEqualTo(request.content());
        assertThat(response.isMyPost()).isTrue();
        assertThat(response.authorIpMasked()).isEqualTo("203.0.*");
    }

    @Test
    @DisplayName("익명으로 작성한 게시글의 작성자 닉네임은 '익명'으로 표시된다")
    void createPost_anonymousPost_nicknameHidden() {
        // given — isAnonymous=true로 요청
        Long userId = 1L;
        PostCreateRequest request = new PostCreateRequest(1L, "제목", "내용", true, PostVisibility.PUBLIC, null);

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
        PostDetailResponse response = postService.createPost(userId, request, null);

        // then — 본인 익명 글은 '익명(나)'로 표시한다
        assertThat(response.isMyPost()).isTrue();
        assertThat(response.isAnonymous()).isTrue();
        assertThat(response.authorNickname()).isEqualTo("익명(나)");
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

        Board board = org.mockito.Mockito.mock(Board.class);

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
    @DisplayName("본인 게시글 삭제 시 저장된 이미지도 함께 삭제한다")
    void deletePost_owner_deletesStoredImage() {
        Long userId = 1L;
        Long postId = 10L;
        User owner = mock(User.class);
        given(owner.getId()).willReturn(userId);
        Post post = Post.builder()
                .board(mock(Board.class))
                .user(owner)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();
        given(postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)).willReturn(Optional.of(post));

        postService.deletePost(userId, postId);

        verify(postImageCleanupService).deleteImagesForPostIds(List.of(postId));
        assertThat(post.getStatus()).isEqualTo(PostStatus.DELETED);
    }

    @Test
    @DisplayName("관리자 영구 삭제도 저장된 이미지를 함께 삭제한다")
    void adminDeletePost_deletesStoredImage() {
        Long postId = 11L;
        Post post = Post.builder()
                .board(mock(Board.class))
                .user(mock(User.class))
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();
        given(postRepository.findByIdAndStatusIn(
                postId, List.of(PostStatus.ACTIVE, PostStatus.HIDDEN))).willReturn(Optional.of(post));

        postService.adminDeletePost(postId);

        verify(postImageCleanupService).deleteImagesForPostIds(List.of(postId));
        assertThat(post.getStatus()).isEqualTo(PostStatus.DELETED);
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

    @Test
    @DisplayName("익명 게시글 상세 조회 시 타인에게는 닉네임이 '익명'으로 표시된다")
    void getPost_anonymousPost_masksNicknameForOthers() {
        Long postId = 1L;
        Long authorId = 2L;
        Long viewerId = 99L;

        User mockAuthor = org.mockito.Mockito.mock(User.class);
        given(mockAuthor.getId()).willReturn(authorId);

        Board board = buildTestBoard();

        Post post = Post.builder()
                .board(board)
                .user(mockAuthor)
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(true)
                .build();

        UserProfile profile = UserProfile.builder()
                .user(mockAuthor)
                .nickname("비밀닉네임")
                .isPublic(true)
                .build();

        given(postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)).willReturn(Optional.of(post));
        given(userProfileRepository.findByUserId(authorId)).willReturn(Optional.of(profile));

        PostDetailResponse response = postService.getPost(postId, viewerId);

        assertThat(response.authorNickname()).isEqualTo("익명");
        assertThat(response.isAnonymous()).isTrue();
        assertThat(response.isMyPost()).isFalse();
    }

    @Test
    @DisplayName("인기순(engagementScore) 조회 시 repository에는 sort 없는 Pageable만 전달한다")
    void getPosts_popularSort_passesUnsortedPageableToRepository() {
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "engagementScore"));
        Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        Board noticeBoard = org.mockito.Mockito.mock(Board.class);
        User user = User.builder()
                .email("user@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        given(boardRepository.findById(1L)).willReturn(Optional.of(noticeBoard));
        given(noticeBoard.getBoardType()).willReturn("NOTICE");
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(postRepository.searchActivePostsByEngagementScoreThisWeek(
                        eq(PostStatus.ACTIVE),
                        eq(1L),
                        isNull(),
                        eq(userId),
                        any(),
                        argThat(p -> p.getPageNumber() == 0 && p.getPageSize() == 20 && p.getSort().isEmpty())))
                .willReturn(emptyPage);

        postService.getPosts(1L, null, pageable, userId, "week");

        verify(postRepository).searchActivePostsByEngagementScoreThisWeek(
                eq(PostStatus.ACTIVE),
                eq(1L),
                isNull(),
                eq(userId),
                any(),
                argThat(p -> p.getSort().isEmpty()));
    }

    @Test
    @DisplayName("게시글 목록 조회 시 keyword는 trim 후 FULLTEXT 검색에 전달된다")
    void getPosts_withKeyword_delegatesToFulltextSearch() {
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 15);
        Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        Board board = buildWritableBoard();
        User user = User.builder()
                .email("user@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        given(boardRepository.findById(1L)).willReturn(Optional.of(board));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(postFulltextSearchRepository.searchBoardPosts(eq(1L), eq("검색어"), any(), any(), eq(pageable)))
                .willReturn(emptyPage);

        postService.getPosts(1L, "  검색어  ", pageable, userId, "week");

        verify(postFulltextSearchRepository).searchBoardPosts(
                1L, "검색어", PostListSort.LATEST, PostListPeriod.WEEK, pageable);
    }

    @Test
    @DisplayName("비회원 keyword 검색은 빈 목록을 반환한다")
    void getPosts_guestKeywordSearch_returnsEmpty() {
        Pageable pageable = PageRequest.of(0, 15);

        Page<PostResponse> result = postService.getPosts(null, "재발", pageable, null, "week");

        assertThat(result.getTotalElements()).isZero();
        verifyNoInteractions(postFulltextSearchRepository);
    }

    @Test
    @DisplayName("문의 게시판 목록은 일반 사용자에게 본인 글 범위로만 조회한다")
    void getPosts_inquiryBoard_limitsToOwnerForUser() {
        Long boardId = 10L;
        Long userId = 1L;
        Pageable pageable = PageRequest.of(0, 15);
        Board board = buildBoard("INQUIRY");
        User user = User.builder()
                .email("user@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();
        Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        given(boardRepository.findById(boardId)).willReturn(Optional.of(board));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(postRepository.searchInquiryPosts(
                eq(PostStatus.ACTIVE), eq(boardId), eq("문의"), eq(userId), eq(false), any()))
                .willReturn(emptyPage);

        postService.getPosts(boardId, "문의", pageable, userId, "week");

        verify(postRepository).searchInquiryPosts(
                eq(PostStatus.ACTIVE), eq(boardId), eq("문의"), eq(userId), eq(false), any());
        verifyNoInteractions(postFulltextSearchRepository);
    }

    @Test
    @DisplayName("비공개 상담 게시판 목록은 운영자에게 전체 범위 조회를 허용한다")
    void getPosts_privateConsultBoard_allowsStaffScope() {
        Long boardId = 11L;
        Long staffId = 2L;
        Pageable pageable = PageRequest.of(0, 15);
        Board board = buildBoard("PRIVATE_CONSULT");
        User staff = User.builder()
                .email("admin@test.com")
                .password("pw")
                .role(UserRole.ADMIN)
                .status(UserStatus.ACTIVE)
                .build();
        Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);

        given(boardRepository.findById(boardId)).willReturn(Optional.of(board));
        given(userRepository.findById(staffId)).willReturn(Optional.of(staff));
        given(postRepository.searchSecretConsultPosts(
                eq(PostStatus.ACTIVE), eq(boardId), isNull(), eq(staffId), eq(true), any()))
                .willReturn(emptyPage);

        postService.getPosts(boardId, null, pageable, staffId, "week");

        verify(postRepository).searchSecretConsultPosts(
                eq(PostStatus.ACTIVE), eq(boardId), isNull(), eq(staffId), eq(true), any());
    }

    @Test
    @DisplayName("비밀사연 일반 사용자 키워드 검색은 원문 추론을 막기 위해 빈 결과를 반환한다")
    void getPosts_secretStoryKeywordForUser_returnsEmpty() {
        Long boardId = 12L;
        Long userId = 3L;
        Pageable pageable = PageRequest.of(0, 15);
        Board board = buildBoard("SECRET_STORY");
        User user = User.builder()
                .email("user2@test.com")
                .password("pw")
                .role(UserRole.USER)
                .status(UserStatus.ACTIVE)
                .build();

        given(boardRepository.findById(boardId)).willReturn(Optional.of(board));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));

        Page<PostResponse> result = postService.getPosts(boardId, "원문단서", pageable, userId, "week");

        assertThat(result.getTotalElements()).isZero();
        verifyNoInteractions(postFulltextSearchRepository);
    }

    @Test
    @DisplayName("검색어가 한 글자이면 BusinessException이 발생한다")
    void getPosts_withSingleCharKeyword_throws() {
        Pageable pageable = PageRequest.of(0, 15);

        assertThatThrownBy(() -> postService.getPosts(null, "재", pageable, null, "week"))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("관리자 숨김 처리 시 ACTIVE 게시글이 HIDDEN 상태로 변경된다")
    void hidePost_activePost_becomesHidden() {
        Board board = buildWritableBoard();
        Post post = Post.builder()
                .board(board)
                .user(org.mockito.Mockito.mock(User.class))
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();

        given(postRepository.findByIdAndStatus(1L, PostStatus.ACTIVE)).willReturn(Optional.of(post));

        postService.hidePost(1L);

        assertThat(post.getStatus()).isEqualTo(PostStatus.HIDDEN);
    }

    @Test
    @DisplayName("관리자 복구 처리 시 HIDDEN 게시글이 ACTIVE 상태로 변경된다")
    void restorePost_hiddenPost_becomesActive() {
        Board board = buildWritableBoard();
        Post post = Post.builder()
                .board(board)
                .user(org.mockito.Mockito.mock(User.class))
                .title("제목")
                .content("내용")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(false)
                .build();
        post.hide();

        given(postRepository.findByIdAndStatus(1L, PostStatus.HIDDEN)).willReturn(Optional.of(post));

        postService.restorePost(1L);

        assertThat(post.getStatus()).isEqualTo(PostStatus.ACTIVE);
    }

    @Test
    @DisplayName("관리자 목록 조회 시 keyword는 trim 후 repository에 전달된다")
    void getAdminCommunityPosts_withKeyword_delegatesToRepository() {
        Pageable pageable = PageRequest.of(0, 20);
        Page<Post> emptyPage = new PageImpl<>(List.of(), pageable, 0);
        given(postRepository.searchCommunityPostsForAdmin(
                        eq(List.of(PostStatus.ACTIVE, PostStatus.HIDDEN)), eq("모더"), eq(pageable)))
                .willReturn(emptyPage);

        postService.getAdminCommunityPosts("  모더  ", null, pageable);

        verify(postRepository)
                .searchCommunityPostsForAdmin(List.of(PostStatus.ACTIVE, PostStatus.HIDDEN), "모더", pageable);
    }

    // 테스트용 Board 객체를 생성하는 헬퍼 메서드 — 여러 테스트에서 공통으로 사용한다
    private Board buildTestBoard() {
        Board board = org.mockito.Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn("FREE");
        return board;
    }

    private Board buildWritableBoard() {
        Board board = org.mockito.Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn("FREE");
        return board;
    }

    private Board buildBoard(String boardType) {
        Board board = org.mockito.Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn(boardType);
        return board;
    }
}
