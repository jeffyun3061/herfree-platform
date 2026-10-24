package com.herfree.domain.operations;

import static org.assertj.core.api.Assertions.assertThat;
import com.herfree.domain.board.entity.Board;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserRole;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class OperatorQueueIntegrationTest {
    @Autowired EntityManager em;
    @Autowired PostRepository posts;
    @Autowired com.herfree.domain.post.service.PostService postService;
    @Autowired com.herfree.domain.audit.controller.AdminAuditController audit;

    @Test void queueExcludesHiddenPostsAndOnlyCountsAnActiveOtherStaffReply() {
        var board = BeanUtils.instantiateClass(Board.class);
        ReflectionTestUtils.setField(board, "name", "이용 문의");
        ReflectionTestUtils.setField(board, "boardType", "INQUIRY");
        em.persist(board);
        var author = User.builder().email("queue-author@example.test").password("test-only").build();
        var developer = User.builder().email("queue-developer@example.test").password("test-only").role(UserRole.DEVELOPER).build();
        var staff = User.builder().email("queue-staff@example.test").password("test-only").role(UserRole.ADMIN).build();
        em.persist(author); em.persist(developer); em.persist(staff);
        var waiting = Post.builder().board(board).user(author).title("private title").content("private body").build();
        var answered = Post.builder().board(board).user(author).title("answered").content("private body").build();
        var hidden = Post.builder().board(board).user(author).title("hidden").content("private body").build();
        hidden.hide();
        em.persist(waiting); em.persist(answered); em.persist(hidden); em.flush();
        // The developer's ordinary comment and a hidden staff comment must not close an operator task.
        em.persist(Comment.builder().post(waiting).user(developer).content("developer reply").build());
        var hiddenReply = Comment.builder().post(waiting).user(staff).content("hidden reply").build();
        hiddenReply.hide(); em.persist(hiddenReply);
        em.persist(Comment.builder().post(answered).user(staff).content("staff answer").build());
        em.flush();
        var summary = posts.summarizeWaitingReplies(Instant.now().plusSeconds(1));
        assertThat(summary).hasSize(1);
        assertThat(summary.get(0).getPending()).isEqualTo(1);
        assertThat(summary.get(0).getOverdue()).isEqualTo(1);
        var tasks = posts.findWaitingReplies(PageRequest.of(0, 5));
        assertThat(tasks).hasSize(1);
        assertThat(tasks.get(0).getId()).isEqualTo(waiting.getId());
        assertThat(tasks.get(0).getBoardType()).isEqualTo("INQUIRY");
    }

    @Test void formattedPostsPersistThroughCreateAndUpdateWithoutLegacyFormattingLoss() {
        var board = BeanUtils.instantiateClass(Board.class);
        ReflectionTestUtils.setField(board, "name", "자유방");
        ReflectionTestUtils.setField(board, "boardType", "FREE");
        ReflectionTestUtils.setField(board, "isActive", true);
        em.persist(board);
        var author = User.builder().email("rich-persistence@example.test").password("test-only").build(); em.persist(author);
        em.persist(com.herfree.domain.user.entity.UserProfile.builder().user(author).nickname("서식 작성자").build()); em.flush();
        String rich = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"저장 테스트\",\"marks\":[{\"type\":\"bold\"}]}]}]}";
        var created = postService.createPost(author.getId(), new com.herfree.domain.post.dto.request.PostCreateRequest(
                board.getId(), "제목", "저장 테스트", false, com.herfree.domain.post.entity.PostVisibility.PUBLIC, null, false, rich),
                new org.springframework.mock.web.MockHttpServletRequest());
        em.flush(); em.clear();
        assertThat(posts.findById(created.id()).orElseThrow().getRichContent()).contains("bold");
        assertThat(created.richContent()).contains("bold");
        var edited = postService.updatePost(author.getId(), created.id(), new com.herfree.domain.post.dto.request.PostUpdateRequest(
                "제목 수정", "저장 테스트", false, null, rich));
        assertThat(edited.richContent()).contains("bold");
        var plain = postService.updatePost(author.getId(), created.id(), new com.herfree.domain.post.dto.request.PostUpdateRequest(
                "텍스트 수정", "서식 없이 수정", false, null));
        assertThat(plain.richContent()).isNull();
        assertThat(plain.content()).isEqualTo("서식 없이 수정");
    }

    @Test void auditResponsesExcludeFreeformSensitiveModerationNotes() throws Exception {
        em.persist(com.herfree.domain.user.entity.RoleAuditLog.builder().actorId(1L).targetUserId(2L)
                .action(com.herfree.domain.user.entity.RoleAuditAction.STATUS_CHANGE)
                .previousStatus(com.herfree.domain.user.entity.UserStatus.ACTIVE)
                .newStatus(com.herfree.domain.user.entity.UserStatus.SUSPENDED)
                .reason("health-context-must-not-leak").note("private-memo-must-not-leak").build());
        em.persist(com.herfree.domain.audit.entity.AdminAuditLog.create(1L, "PATCH", "/api/admin/users/private@example.test/status", 403, "safe-id"));
        em.flush();
        var json = new com.fasterxml.jackson.databind.ObjectMapper().findAndRegisterModules();
        assertThat(json.writeValueAsString(audit.members(0, 7, null).getBody())).doesNotContain("health-context", "private-memo", "reason", "note");
        assertThat(json.writeValueAsString(audit.actions(0, 7, null).getBody())).doesNotContain("private@example");
    }
}
