package com.herfree.domain.post.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostImage;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserRepository;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PostImageAccessServiceTest {

    private static final String OBJECT_KEY = "posts/10/123e4567-e89b-12d3-a456-426614174000.png";

    @Mock
    private PostImageRepository postImageRepository;
    @Mock
    private ContentRepository contentRepository;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostImageAccessService postImageAccessService;

    @Test
    @DisplayName("Public post image is public-cacheable for guests")
    void check_publicBoardImage_guestAllowed() {
        givenAttachedPost("FREE", 10L, PostVisibility.PUBLIC);

        var access = postImageAccessService.check(OBJECT_KEY, null);

        assertThat(access.allowed()).isTrue();
        assertThat(access.privateScope()).isFalse();
    }

    @Test
    @DisplayName("Private board image denies guests and other users")
    void check_privateBoardImage_guestAndOtherUserDenied() {
        givenAttachedPost("PRIVATE_CONSULT", 10L, PostVisibility.MEMBERS_ONLY);

        assertThat(postImageAccessService.check(OBJECT_KEY, null).allowed()).isFalse();
        assertThat(postImageAccessService.check(OBJECT_KEY, 99L).allowed()).isFalse();
    }

    @Test
    @DisplayName("Private board image allows owner and staff with private cache scope")
    void check_privateBoardImage_ownerAndStaffAllowed() {
        givenAttachedPost("PRIVATE_CONSULT", 10L, PostVisibility.MEMBERS_ONLY);

        var ownerAccess = postImageAccessService.check(OBJECT_KEY, 10L);
        assertThat(ownerAccess.allowed()).isTrue();
        assertThat(ownerAccess.privateScope()).isTrue();

        User adminUser = userWithRole(UserRole.ADMIN);
        given(userRepository.findById(2L)).willReturn(Optional.of(adminUser));
        assertThat(postImageAccessService.check(OBJECT_KEY, 2L).allowed()).isTrue();
    }

    @Test
    @DisplayName("Members-only image requires an authenticated viewer")
    void check_membersOnlyImage_requiresLogin() {
        givenAttachedPost("FREE", 10L, PostVisibility.MEMBERS_ONLY);

        assertThat(postImageAccessService.check(OBJECT_KEY, null).allowed()).isFalse();

        var memberAccess = postImageAccessService.check(OBJECT_KEY, 99L);
        assertThat(memberAccess.allowed()).isTrue();
        assertThat(memberAccess.privateScope()).isTrue();
    }

    @Test
    @DisplayName("Secret-story image is staff-only, including against its author")
    void check_secretStoryImage_staffOnly() {
        givenAttachedPost("SECRET_STORY", 10L, PostVisibility.MEMBERS_ONLY);

        assertThat(postImageAccessService.check(OBJECT_KEY, 10L).allowed()).isFalse();

        User adminUser = userWithRole(UserRole.ADMIN);
        given(userRepository.findById(2L)).willReturn(Optional.of(adminUser));
        assertThat(postImageAccessService.check(OBJECT_KEY, 2L).allowed()).isTrue();
    }

    @Test
    @DisplayName("Hidden public post image is limited to its author and staff")
    void check_hiddenPublicPostImage_notPublic() {
        Post post = givenAttachedPost("FREE", 10L, PostVisibility.PUBLIC);
        post.hide();

        assertThat(postImageAccessService.check(OBJECT_KEY, null).allowed()).isFalse();
        assertThat(postImageAccessService.check(OBJECT_KEY, 99L).allowed()).isFalse();

        var ownerAccess = postImageAccessService.check(OBJECT_KEY, 10L);
        assertThat(ownerAccess.allowed()).isTrue();
        assertThat(ownerAccess.privateScope()).isTrue();
    }

    @Test
    @DisplayName("Active content image is public")
    void check_contentImage_publiclyVisible() {
        given(postImageRepository.findAllByImageUrlEndingWith(anyString())).willReturn(List.of());
        Content content = Mockito.mock(Content.class);
        given(content.getStatus()).willReturn(ContentStatus.ACTIVE);
        given(contentRepository.findAllByImageUrlEndingWith(OBJECT_KEY)).willReturn(List.of(content));

        var access = postImageAccessService.check(OBJECT_KEY, null);

        assertThat(access.allowed()).isTrue();
        assertThat(access.privateScope()).isFalse();
    }

    @Test
    @DisplayName("Hidden content image is limited to its author and staff")
    void check_hiddenContentImage_ownerAndStaffOnly() {
        given(postImageRepository.findAllByImageUrlEndingWith(anyString())).willReturn(List.of());
        Content content = Mockito.mock(Content.class);
        given(content.getStatus()).willReturn(ContentStatus.HIDDEN);
        User author = Mockito.mock(User.class);
        given(author.getId()).willReturn(10L);
        given(content.getAuthor()).willReturn(author);
        given(contentRepository.findAllByImageUrlEndingWith(OBJECT_KEY)).willReturn(List.of(content));

        assertThat(postImageAccessService.check(OBJECT_KEY, null).allowed()).isFalse();
        assertThat(postImageAccessService.check(OBJECT_KEY, 99L).allowed()).isFalse();
        assertThat(postImageAccessService.check(OBJECT_KEY, 10L).allowed()).isTrue();

        User adminUser = userWithRole(UserRole.ADMIN);
        given(userRepository.findById(2L)).willReturn(Optional.of(adminUser));
        assertThat(postImageAccessService.check(OBJECT_KEY, 2L).allowed()).isTrue();
    }

    @Test
    @DisplayName("Unattached upload preview is visible only to its uploader")
    void check_unattachedImage_uploaderOnly() {
        given(postImageRepository.findAllByImageUrlEndingWith(anyString())).willReturn(List.of());
        given(contentRepository.findAllByImageUrlEndingWith(OBJECT_KEY)).willReturn(List.of());

        assertThat(postImageAccessService.check(OBJECT_KEY, 10L).allowed()).isTrue();
        assertThat(postImageAccessService.check(OBJECT_KEY, 99L).allowed()).isFalse();
        assertThat(postImageAccessService.check(OBJECT_KEY, null).allowed()).isFalse();
    }

    private Post givenAttachedPost(String boardType, long authorId, PostVisibility visibility) {
        Board board = Mockito.mock(Board.class);
        given(board.getBoardType()).willReturn(boardType);

        User author = Mockito.mock(User.class);
        Mockito.lenient().when(author.getId()).thenReturn(authorId);

        Post post = Post.builder()
                .board(board)
                .user(author)
                .title("title")
                .content("content")
                .visibility(visibility)
                .isAnonymous(true)
                .build();

        PostImage image = Mockito.mock(PostImage.class);
        given(image.getPost()).willReturn(post);
        given(postImageRepository.findAllByImageUrlEndingWith(OBJECT_KEY)).willReturn(List.of(image));
        given(contentRepository.findAllByImageUrlEndingWith(OBJECT_KEY)).willReturn(List.of());
        return post;
    }

    private User userWithRole(UserRole role) {
        User user = Mockito.mock(User.class);
        given(user.getRole()).willReturn(role);
        return user;
    }
}
