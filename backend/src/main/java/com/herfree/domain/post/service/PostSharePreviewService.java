package com.herfree.domain.post.service;

import com.herfree.domain.post.dto.response.PostSharePreviewResponse;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.exception.PostNotFoundException;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.global.util.PostVisibilityPolicy;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class PostSharePreviewService {
    private final PostRepository postRepository;

    // Always apply anonymous public access, even when the requester is signed in.
    // Crawlers must not increment the reader's view count or see member-only/private data.
    @Transactional(readOnly = true)
    public PostSharePreviewResponse getPreview(Long postId) {
        var post = postRepository.findByIdAndStatus(postId, PostStatus.ACTIVE)
                .orElseThrow(PostNotFoundException::new);
        if (!PostVisibilityPolicy.isPublicShareable(post)) {
            throw new PostNotFoundException();
        }
        return PostSharePreviewResponse.from(post);
    }
}
