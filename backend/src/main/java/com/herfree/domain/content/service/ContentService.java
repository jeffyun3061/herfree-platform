package com.herfree.domain.content.service;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.dto.request.ContentUpdateRequest;
import com.herfree.domain.content.dto.response.ContentResponse;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.entity.ContentType;
import com.herfree.domain.content.exception.ContentNotFoundException;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.exception.UserNotFoundException;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final UserRepository userRepository;

    // 콘텐츠 목록 — ACTIVE 상태만 비로그인 사용자에게 노출한다.
    @Transactional(readOnly = true)
    public Page<ContentResponse> getContents(Pageable pageable) {
        return contentRepository.findByStatusOrderByCreatedAtDesc(ContentStatus.ACTIVE, pageable)
                .map(ContentResponse::from);
    }

    // 콘텐츠 단건 조회 — ACTIVE 상태만 조회 허용
    @Transactional(readOnly = true)
    public ContentResponse getContent(Long contentId) {
        Content content = contentRepository.findByIdAndStatus(contentId, ContentStatus.ACTIVE)
                .orElseThrow(ContentNotFoundException::new);
        return ContentResponse.from(content);
    }

    // 콘텐츠 등록 — 관리자·크리에이터·전문가만 호출 가능(SecurityConfig에서 제어)
    @Transactional
    public ContentResponse createContent(Long authorId, ContentCreateRequest request) {
        User author = userRepository.findById(authorId)
                .orElseThrow(UserNotFoundException::new);

        ContentType contentType = ContentType.valueOf(request.contentType().toUpperCase());

        Content content = Content.builder()
                .author(author)
                .title(request.title())
                .content(request.content())
                .category(request.category())
                .contentType(contentType)
                .build();

        contentRepository.save(content);
        return ContentResponse.from(content);
    }

    // 콘텐츠 수정
    @Transactional
    public ContentResponse updateContent(Long contentId, ContentUpdateRequest request) {
        Content content = contentRepository.findByIdAndStatus(contentId, ContentStatus.ACTIVE)
                .orElseThrow(ContentNotFoundException::new);
        content.update(request.title(), request.content(), request.category());
        return ContentResponse.from(content);
    }

    // 콘텐츠 숨김 처리
    @Transactional
    public void hideContent(Long contentId) {
        Content content = contentRepository.findById(contentId)
                .orElseThrow(ContentNotFoundException::new);
        content.hide();
    }
}
