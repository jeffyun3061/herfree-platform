package com.herfree.domain.comment.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.dto.response.CommentResponse;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private CommentService commentService;

    @Test
    @DisplayName("답글은 선택한 부모 댓글 ID를 유지해 저장하고 응답한다")
    void createComment_reply_keepsParentId() {
        Long postId = 1L;
        Long userId = 2L;
        Long parentId = 10L;
        Board board = mock(Board.class);
        given(board.getBoardType()).willReturn("FREE");
        Post post = mock(Post.class);
        given(post.getId()).willReturn(postId);
        given(post.getBoard()).willReturn(board);
        given(post.getVisibility()).willReturn(PostVisibility.PUBLIC);
        User user = mock(User.class);
        given(user.getId()).willReturn(userId);
        given(user.getRole()).willReturn(UserRole.USER);
        UserProfile profile = mock(UserProfile.class);
        given(profile.getNickname()).willReturn("답글작성자");

        Comment parent = mock(Comment.class);
        given(parent.getId()).willReturn(parentId);
        given(parent.getStatus()).willReturn(CommentStatus.ACTIVE);
        given(parent.getPost()).willReturn(post);

        given(postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)).willReturn(Optional.of(post));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentRepository.findById(parentId)).willReturn(Optional.of(parent));
        given(commentRepository.save(any(Comment.class))).willAnswer(invocation -> invocation.getArgument(0));
        given(userProfileRepository.findByUserId(userId)).willReturn(Optional.of(profile));

        CommentResponse response = commentService.createComment(
                postId, userId, new CommentCreateRequest("  답글 내용  ", false, parentId));

        ArgumentCaptor<Comment> captor = ArgumentCaptor.forClass(Comment.class);
        verify(commentRepository).save(captor.capture());
        assertThat(captor.getValue().getParent()).isSameAs(parent);
        assertThat(captor.getValue().getContent()).isEqualTo("답글 내용");
        assertThat(response.parentId()).isEqualTo(parentId);
    }

    @Test
    @DisplayName("다른 게시글의 댓글을 부모로 지정한 대댓글은 거부한다")
    void createComment_parentFromDifferentPost_rejected() {
        Long postId = 1L;
        Long userId = 2L;
        Board board = mock(Board.class);
        given(board.getBoardType()).willReturn("FREE");
        Post post = mock(Post.class);
        given(post.getBoard()).willReturn(board);
        given(post.getVisibility()).willReturn(PostVisibility.PUBLIC);
        User user = mock(User.class);
        given(user.getRole()).willReturn(UserRole.USER);

        Post otherPost = mock(Post.class);
        given(otherPost.getId()).willReturn(99L);
        Comment parent = mock(Comment.class);
        given(parent.getStatus()).willReturn(CommentStatus.ACTIVE);
        given(parent.getPost()).willReturn(otherPost);

        given(postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)).willReturn(Optional.of(post));
        given(userRepository.findById(userId)).willReturn(Optional.of(user));
        given(commentRepository.findById(10L)).willReturn(Optional.of(parent));

        assertThatThrownBy(() -> commentService.createComment(
                postId, userId, new CommentCreateRequest("답글", false, 10L)))
                .isInstanceOf(CommentNotFoundException.class);
        verify(commentRepository, never()).save(org.mockito.ArgumentMatchers.any(Comment.class));
    }
}
