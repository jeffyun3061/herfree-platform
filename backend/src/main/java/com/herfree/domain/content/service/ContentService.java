package com.herfree.domain.content.service;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.dto.request.ContentUpdateRequest;
import com.herfree.domain.content.dto.request.ContentVisibilityRequest;
import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.exception.ContentNotFoundException;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<ContentResponse> getContents(String category, Pageable pageable) {
        // category가 있으면 필터링, 없으면 전체 조회
        if (StringUtils.hasText(category)) {
            return contentRepository
                    .findByCategoryAndStatusOrderByCreatedAtDesc(category, ContentStatus.ACTIVE, pageable)
                    .map(ContentResponse::from);
        }
        return contentRepository
                .findByStatusOrderByCreatedAtDesc(ContentStatus.ACTIVE, pageable)
                .map(ContentResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getAdminContents(Pageable pageable) {
        return contentRepository
                .findByStatusInOrderByCreatedAtDesc(
                        List.of(ContentStatus.ACTIVE, ContentStatus.HIDDEN), pageable)
                .map(ContentResponse::from);
    }

    @Transactional(readOnly = true)
    public ContentResponse getContent(Long contentId) {
        Content content = contentRepository.findByIdAndStatus(contentId, ContentStatus.ACTIVE)
                .orElseThrow(ContentNotFoundException::new);
        return ContentResponse.from(content);
    }

    @Transactional
    public ContentResponse createContent(Long authorId, ContentCreateRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(UserNotFoundException::new);

        Content content = Content.builder()
                .author(author)
                .title(request.title())
                .content(request.content())
                .category(request.category())
                .contentType(request.contentType())
                .build();

        return ContentResponse.from(contentRepository.save(content));
    }

    @Transactional
    public ContentResponse updateContent(Long contentId, ContentUpdateRequest request) {
        Content content = findContentForAdmin(contentId);
        content.update(request.title(), request.content(), request.category());
        return ContentResponse.from(content);
    }

    @Transactional
    public void hideContent(Long contentId) {
        Content content = findContentForAdmin(contentId);
        content.hide();
    }

    @Transactional
    public ContentResponse updateVisibility(Long contentId, ContentVisibilityRequest request) {
        Content content = findContentForAdmin(contentId);
        if (Boolean.TRUE.equals(request.isVisible())) {
            content.show();
        } else {
            content.hide();
        }
        return ContentResponse.from(content);
    }

    private Content findContentForAdmin(Long contentId) {
        return contentRepository.findById(contentId)
                .filter(content -> content.getStatus() != ContentStatus.DELETED)
                .orElseThrow(ContentNotFoundException::new);
    }
}
