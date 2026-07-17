package com.herfree.domain.content.service;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.dto.request.ContentCurationRequest;
import com.herfree.domain.content.dto.request.ContentUpdateRequest;
import com.herfree.domain.content.dto.request.ContentVisibilityRequest;
import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.entity.ContentType;
import com.herfree.domain.content.exception.ContentNotFoundException;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.util.ContentWritePolicy;
import com.herfree.global.util.StaffRolePolicy;
import com.herfree.global.storage.PostImageStorageService;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.util.List;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * 운영자 정보글 CMS — 카테고리·고정·순서·공개/숨김.
 * <p>
 * 커뮤니티 {@link com.herfree.domain.post.service.PostService}와 분리되어 운영자만 작성한다.
 * 본문 이미지는 {@link com.herfree.global.storage.PostImageStorageService} 경유 업로드.
 */
@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;
    private final PostImageStorageService postImageStorageService;

    @Transactional(readOnly = true)
    public Page<ContentResponse> getContents(String category, Pageable pageable) {
        // category가 있으면 필터링, 없으면 전체 조회
        if (StringUtils.hasText(category)) {
            return contentRepository
                    .findByCategoryAndStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(
                            category, ContentStatus.ACTIVE, pageable)
                    .map(this::toResponse);
        }
        return contentRepository
                .findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(ContentStatus.ACTIVE, pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public Page<ContentResponse> getAdminContents(
            Long actorId,
            String keyword,
            ContentStatus statusFilter,
            String category,
            Pageable pageable
    ) {
        User actor = findContentWriter(actorId);
        Long authorScope = StaffRolePolicy.isStaff(actor.getRole()) ? null : actorId;
        List<ContentStatus> statuses = statusFilter != null
                ? List.of(statusFilter)
                : List.of(ContentStatus.ACTIVE, ContentStatus.HIDDEN);

        return contentRepository.searchAdminContents(
                        statuses,
                        authorScope,
                        StringUtils.hasText(category) ? category.trim() : null,
                        StringUtils.hasText(keyword) ? keyword.trim() : null,
                        pageable)
                .map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public ContentResponse getContent(Long contentId) {
        Content content = contentRepository.findByIdAndStatus(contentId, ContentStatus.ACTIVE)
                .orElseThrow(ContentNotFoundException::new);
        return toResponse(content);
    }

    @Transactional
    public ContentResponse createContent(Long authorId, ContentCreateRequest request) {
        User author = findContentWriter(authorId);
        String imageUrl = normalizeImageUrl(request.imageUrl());
        postImageStorageService.assertImageUrlAllowed(authorId, imageUrl);

        Content content = Content.builder()
                .author(author)
                .title(request.title().trim())
                .content(request.content().trim())
                .imageUrl(imageUrl)
                .category(request.category().trim())
                .contentType(resolveContentType(author, request.contentType()))
                .build();
        content.updateSortOrder(
                contentRepository.findTopByOrderBySortOrderDesc()
                        .map(c -> c.getSortOrder() + 1)
                        .orElse(1));

        return toResponse(contentRepository.save(content));
    }

    @Transactional
    public ContentResponse updateContent(Long actorId, Long contentId, ContentUpdateRequest request) {
        Content content = findContentForManager(actorId, contentId);
        String imageUrl = normalizeImageUrl(request.imageUrl());
        if (StringUtils.hasText(imageUrl) && !Objects.equals(content.getImageUrl(), imageUrl)) {
            postImageStorageService.assertImageUrlAllowed(actorId, imageUrl);
        }
        if (!Objects.equals(content.getImageUrl(), imageUrl)) {
            postImageStorageService.deleteManagedImageIfPresent(content.getImageUrl());
        }
        content.update(request.title().trim(), request.content().trim(), request.category().trim(), imageUrl);
        return toResponse(content);
    }

    @Transactional
    public void hideContent(Long actorId, Long contentId) {
        Content content = findContentForManager(actorId, contentId);
        content.hide();
    }

    @Transactional
    public ContentResponse updateVisibility(Long actorId, Long contentId, ContentVisibilityRequest request) {
        Content content = findContentForManager(actorId, contentId);
        if (Boolean.TRUE.equals(request.isVisible())) {
            content.show();
        } else {
            content.hide();
        }
        return toResponse(content);
    }

    @Transactional
    public ContentResponse updateCuration(Long actorId, Long contentId, ContentCurationRequest request) {
        Content content = findContentForManager(actorId, contentId);
        if (request.sortOrder() != null) {
            content.updateSortOrder(request.sortOrder());
        }
        if (request.isPinned() != null) {
            content.setPinned(request.isPinned());
        }
        return toResponse(content);
    }

    @Transactional
    public void deleteContent(Long actorId, Long contentId) {
        Content content = findContentForManager(actorId, contentId);
        postImageStorageService.deleteManagedImageIfPresent(content.getImageUrl());
        content.delete();
    }

    private Content findContentForManager(Long actorId, Long contentId) {
        User actor = findContentWriter(actorId);
        Content content = contentRepository.findById(contentId)
                .filter(item -> item.getStatus() != ContentStatus.DELETED)
                .orElseThrow(ContentNotFoundException::new);
        if (!StaffRolePolicy.isStaff(actor.getRole()) && !content.getAuthor().getId().equals(actorId)) {
            throw new BusinessException(ErrorCode.UNAUTHORIZED_ACCESS);
        }
        return content;
    }

    private User findContentWriter(Long userId) {
        User user = userRepository.findById(userId).orElseThrow(UserNotFoundException::new);
        ContentWritePolicy.assertCanWrite(user.getRole());
        return user;
    }

    private String resolveContentType(User author, String requestedType) {
        return switch (author.getRole()) {
            case DOCTOR -> ContentType.DOCTOR.name();
            case CREATOR -> ContentType.CREATOR.name();
            default -> {
                if (!StringUtils.hasText(requestedType)) {
                    throw new BusinessException(ErrorCode.INVALID_INPUT);
                }
                try {
                    yield ContentType.valueOf(requestedType.trim().toUpperCase()).name();
                } catch (IllegalArgumentException ex) {
                    throw new BusinessException(ErrorCode.INVALID_INPUT);
                }
            }
        };
    }

    private String normalizeImageUrl(String imageUrl) {
        return StringUtils.hasText(imageUrl) ? imageUrl.trim() : null;
    }

    private ContentResponse toResponse(Content content) {
        return ContentResponse.from(
                content,
                postImageStorageService.toDisplayUrl(content.getImageUrl()));
    }
}
