package com.herfree.domain.post.service;

import com.herfree.domain.post.entity.PostImage;
import com.herfree.domain.post.repository.PostImageRepository;
import com.herfree.global.storage.PostImageStorageService;
import java.util.Collection;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class PostImageCleanupService {

    private final PostImageRepository postImageRepository;
    private final PostImageStorageService postImageStorageService;

    public void deleteImagesForPostIds(Collection<Long> postIds) {
        List<Long> ids = postIds.stream().filter(java.util.Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return;
        }

        List<PostImage> images = postImageRepository.findAllByPostIdIn(ids);
        for (PostImage image : images) {
            postImageStorageService.deleteImage(image.getImageUrl());
        }
        postImageRepository.deleteByPostIdIn(ids);
    }
}
