package com.herfree.domain.report.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;

import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.exception.SelfReportException;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ReportServiceTest {

    @Mock
    private ReportRepository reportRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private PostRepository postRepository;
    @Mock
    private CommentRepository commentRepository;

    @InjectMocks
    private ReportService reportService;

    @Test
    @DisplayName("본인이 작성한 게시글은 신고할 수 없다")
    void createReport_ownPost_throws() {
        Long userId = 1L;
        ReportCreateRequest request = new ReportCreateRequest(ReportTargetType.POST, 6L, "SPAM", null);

        User author = org.mockito.Mockito.mock(User.class);
        given(author.getId()).willReturn(userId);
        Post post = Post.builder()
                .user(author)
                .title("t")
                .content("c")
                .visibility(PostVisibility.PUBLIC)
                .isAnonymous(true)
                .build();

        given(reportRepository.existsByReporterIdAndTargetTypeAndTargetId(userId, request.targetType(), 6L))
                .willReturn(false);
        given(postRepository.findByIdAndStatus(6L, PostStatus.ACTIVE)).willReturn(Optional.of(post));

        assertThatThrownBy(() -> reportService.createReport(userId, request))
                .isInstanceOf(SelfReportException.class);
    }

    @Test
    @DisplayName("본인 계정은 신고할 수 없다")
    void createReport_selfUser_throws() {
        Long userId = 5L;
        ReportCreateRequest request = new ReportCreateRequest(ReportTargetType.USER, userId, "SPAM", null);

        given(reportRepository.existsByReporterIdAndTargetTypeAndTargetId(userId, request.targetType(), userId))
                .willReturn(false);

        assertThatThrownBy(() -> reportService.createReport(userId, request))
                .isInstanceOf(SelfReportException.class);
    }
}
