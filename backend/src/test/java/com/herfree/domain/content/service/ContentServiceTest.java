package com.herfree.domain.content.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.herfree.domain.content.dto.request.ContentCreateRequest;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.storage.PostImageStorageService;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ContentService 권한")
class ContentServiceTest {

    @Mock
    private ContentRepository contentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostImageStorageService postImageStorageService;

    private ContentService contentService;

    @BeforeEach
    void setUp() {
        contentService = new ContentService(contentRepository, userRepository, postImageStorageService);
    }

    @Test
    @DisplayName("크리에이터는 다른 작성자의 칼럼을 관리할 수 없다")
    void hideContent_otherCreatorDenied() {
        User actor = user(10L, UserRole.CREATOR);
        User owner = user(20L, UserRole.CREATOR);
        Content content = mock(Content.class);
        when(content.getStatus()).thenReturn(ContentStatus.ACTIVE);
        when(content.getAuthor()).thenReturn(owner);
        when(userRepository.findById(10L)).thenReturn(Optional.of(actor));
        when(contentRepository.findById(100L)).thenReturn(Optional.of(content));

        assertThatThrownBy(() -> contentService.hideContent(10L, 100L))
                .isInstanceOf(BusinessException.class);
    }

    @Test
    @DisplayName("전문가가 작성한 칼럼은 요청값과 무관하게 전문가 유형으로 저장된다")
    void createContent_doctorTypeCannotBeSpoofed() {
        User doctor = user(10L, UserRole.DOCTOR);
        when(userRepository.findById(10L)).thenReturn(Optional.of(doctor));
        when(contentRepository.findTopByOrderBySortOrderDesc()).thenReturn(Optional.empty());
        when(contentRepository.save(any(Content.class))).thenAnswer(invocation -> invocation.getArgument(0));

        contentService.createContent(10L, new ContentCreateRequest(
                "제목", "본문", null, "의학정보", "ADMIN"));

        ArgumentCaptor<Content> captor = ArgumentCaptor.forClass(Content.class);
        verify(contentRepository).save(captor.capture());
        assertThat(captor.getValue().getContentType()).isEqualTo("DOCTOR");
    }

    private User user(Long id, UserRole role) {
        User user = mock(User.class);
        lenient().when(user.getId()).thenReturn(id);
        lenient().when(user.getRole()).thenReturn(role);
        return user;
    }
}
