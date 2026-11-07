package com.herfree.domain.post.service;

import com.herfree.domain.post.dto.response.PostSharePreviewResponse;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.global.util.PrivateBoardPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostSharePreviewService {
    private final PostRepository postRepository;

    // Never expose content or identity through crawler previews. Private support
    // boards stay excluded even when the requester is signed in.
    @Transactional(readOnly = true)
    public PostSharePreviewResponse getPreview(Long postId) {
        var post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);
        if (PrivateBoardPolicy.isAdminMaskedBoard(post.getBoard().getBoardType())) {
            throw new PostNotFoundException();
        }
        return PostSharePreviewResponse.from(post);
    }
}
