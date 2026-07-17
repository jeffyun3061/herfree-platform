package com.herfree.domain.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.report.dto.request.ReportCreateRequest;
import com.herfree.domain.report.dto.request.ReportProcessRequest;
import com.herfree.domain.report.entity.Report;
import com.herfree.domain.report.entity.ReportStatus;
import com.herfree.domain.report.entity.ReportTargetType;
import com.herfree.domain.report.exception.SelfReportException;
import com.herfree.domain.report.repository.ReportRepository;
import com.herfree.domain.report.repository.ReportTargetSummary;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.analytics.service.AnalyticsService;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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
    @Mock
    private UserProfileRepository userProfileRepository;
    @Mock
    private AnalyticsService analyticsService;

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

    @Test
    @DisplayName("신고 대상 목록은 게시글과 닉네임을 건별 조회하지 않고 일괄 조회한다")
    void getPendingTargets_loadsTargetsInBatches() {
        ReportTargetSummary firstSummary = summary(101L);
        ReportTargetSummary secondSummary = summary(102L);
        User firstAuthor = user(11L);
        User secondAuthor = user(12L);
        Post firstPost = post(101L, firstAuthor);
        Post secondPost = post(102L, secondAuthor);
        UserProfile firstProfile = profile(firstAuthor, "첫번째");
        UserProfile secondProfile = profile(secondAuthor, "두번째");

        given(reportRepository.findTargetSummaries(
                org.mockito.ArgumentMatchers.eq(com.herfree.domain.report.entity.ReportStatus.PENDING),
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any()))
                .willReturn(List.of(firstSummary, secondSummary));
        given(postRepository.findByIdInAndStatusIn(
                Set.of(101L, 102L), List.of(PostStatus.ACTIVE, PostStatus.HIDDEN)))
                .willReturn(List.of(firstPost, secondPost));
        given(userProfileRepository.findByUser_IdIn(Set.of(11L, 12L)))
                .willReturn(List.of(firstProfile, secondProfile));

        var result = reportService.getPendingTargets(1, 20);

        org.assertj.core.api.Assertions.assertThat(result).hasSize(2);
        verify(postRepository).findByIdInAndStatusIn(
                Set.of(101L, 102L), List.of(PostStatus.ACTIVE, PostStatus.HIDDEN));
        verify(userProfileRepository).findByUser_IdIn(Set.of(11L, 12L));
        verify(userProfileRepository, never()).findByUserId(org.mockito.ArgumentMatchers.anyLong());
    }

    @Test
    @DisplayName("회원 신고 대상 스냅샷에는 이메일 원문 대신 마스킹 값이 담긴다")
    void getPendingTargets_userTarget_masksEmail() {
        ReportTargetSummary summary = org.mockito.Mockito.mock(ReportTargetSummary.class);
        given(summary.getTargetType()).willReturn(ReportTargetType.USER);
        given(summary.getTargetId()).willReturn(11L);
        given(summary.getReportCount()).willReturn(2L);
        given(summary.getLastReportedAt()).willReturn(Instant.now());

        User reported = user(11L);
        given(reported.getEmail()).willReturn("reported-user@example.com");
        given(reported.getStatus()).willReturn(com.herfree.domain.user.entity.UserStatus.ACTIVE);

        given(reportRepository.findTargetSummaries(
                org.mockito.ArgumentMatchers.eq(com.herfree.domain.report.entity.ReportStatus.PENDING),
                org.mockito.ArgumentMatchers.eq(1L),
                org.mockito.ArgumentMatchers.any()))
                .willReturn(List.of(summary));
        UserProfile reportedProfile = profile(reported, "신고대상");
        given(userRepository.findAllById(Set.of(11L))).willReturn(List.of(reported));
        given(userProfileRepository.findByUser_IdIn(Set.of(11L)))
                .willReturn(List.of(reportedProfile));

        var result = reportService.getPendingTargets(1, 20);

        org.assertj.core.api.Assertions.assertThat(result).hasSize(1);
        org.assertj.core.api.Assertions.assertThat(result.get(0).targetPreview())
                .isEqualTo("re***@example.com");
    }

    @Test
    @DisplayName("신고 처리 사유는 승인 결과에 보존된다")
    void processReport_preservesProcessNote() {
        Long adminId = 90L;
        Long reportId = 30L;
        User reporter = user(10L);
        User admin = user(adminId);
        Report report = Report.builder()
                .reporter(reporter)
                .targetType(ReportTargetType.POST)
                .targetId(50L)
                .reason("개인정보 노출")
                .detail("전화번호가 포함되어 있음")
                .build();
        ReportProcessRequest request = new ReportProcessRequest(
                ReportStatus.ACCEPTED,
                "개인정보 노출 확인 후 숨김 처리");

        given(reportRepository.findById(reportId)).willReturn(Optional.of(report));
        given(userRepository.findById(adminId)).willReturn(Optional.of(admin));

        var result = reportService.processReport(adminId, reportId, request);

        assertThat(result.status()).isEqualTo(ReportStatus.ACCEPTED);
        assertThat(result.processNote()).isEqualTo("개인정보 노출 확인 후 숨김 처리");
        assertThat(report.getProcessNote()).isEqualTo("개인정보 노출 확인 후 숨김 처리");
    }

    private ReportTargetSummary summary(Long targetId) {
        ReportTargetSummary summary = org.mockito.Mockito.mock(ReportTargetSummary.class);
        given(summary.getTargetType()).willReturn(ReportTargetType.POST);
        given(summary.getTargetId()).willReturn(targetId);
        given(summary.getReportCount()).willReturn(2L);
        given(summary.getLastReportedAt()).willReturn(Instant.now());
        return summary;
    }

    private User user(Long id) {
        User user = org.mockito.Mockito.mock(User.class);
        given(user.getId()).willReturn(id);
        return user;
    }

    private Post post(Long id, User author) {
        Post post = org.mockito.Mockito.mock(Post.class);
        given(post.getId()).willReturn(id);
        given(post.getUser()).willReturn(author);
        given(post.getTitle()).willReturn("신고 대상");
        given(post.getContent()).willReturn("본문");
        given(post.getStatus()).willReturn(PostStatus.ACTIVE);
        return post;
    }

    private UserProfile profile(User user, String nickname) {
        UserProfile profile = org.mockito.Mockito.mock(UserProfile.class);
        given(profile.getUser()).willReturn(user);
        given(profile.getNickname()).willReturn(nickname);
        return profile;
    }
}
