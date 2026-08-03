package com.herfree.domain.reaction.service;

import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.exception.CommentNotFoundException;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.reaction.entity.ReactionTargetType;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.global.util.PrivateBoardPolicy;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** 반응 대상의 존재 여부와 열람 권한을 한곳에서 확인한다. */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReactionTargetAccessService {

    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public void assertReadable(
            ReactionTargetType targetType,
            Long targetId,
            Long viewerId,
            UserRole viewerRole
    ) {
        Post post = switch (targetType) {
            case POST -> postRepository.findByIdAndStatus(targetId, PostStatus.ACTIVE)
                    .orElseThrow(PostNotFoundException::new);
            case COMMENT -> findPostOfActiveComment(targetId);
        };

        boolean memberOnlyForGuest = post.getVisibility() == PostVisibility.MEMBERS_ONLY && viewerId == null;
        boolean privateBoardDenied = !PrivateBoardPolicy.canViewerReadPost(post, viewerId, viewerRole);
        if (memberOnlyForGuest || privateBoardDenied) {
            throwTargetNotFound(targetType);
        }
    }

    private Post findPostOfActiveComment(Long commentId) {
        Comment comment = commentRepository.findByIdAndStatusIn(commentId, List.of(CommentStatus.ACTIVE))
                .orElseThrow(CommentNotFoundException::new);
        if (comment.getPost().getStatus() != PostStatus.ACTIVE) {
            throw new CommentNotFoundException();
        }
        return comment.getPost();
    }

    private void throwTargetNotFound(ReactionTargetType targetType) {
        if (targetType == ReactionTargetType.POST) {
            throw new PostNotFoundException();
        }
        throw new CommentNotFoundException();
    }
}
