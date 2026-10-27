package com.herfree.global.operations;

import com.herfree.domain.auth.dto.request.LoginRequest;
import com.herfree.domain.auth.dto.request.SignupRequest;
import com.herfree.domain.auth.service.AuthService;
import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.service.CommentService;
import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.service.JournalRecordService;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.service.PostService;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Profile;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

/** Synthetic service checks against the isolated restore, always rolled back. */
@Component
@Profile("restore-drill")
public class RestoreCoreFunctionVerifier {
    private final AuthService auth;
    private final PostService posts;
    private final CommentService comments;
    private final JournalRecordService journals;
    private final JdbcTemplate jdbc;
    private final EntityManager entities;
    private final TransactionTemplate transaction;

    public RestoreCoreFunctionVerifier(AuthService auth, PostService posts, CommentService comments,
            JournalRecordService journals, JdbcTemplate jdbc, EntityManager entities, PlatformTransactionManager manager) {
        this.auth = auth; this.posts = posts; this.comments = comments; this.journals = journals;
        this.jdbc = jdbc; this.entities = entities; this.transaction = new TransactionTemplate(manager);
    }

    public void verify() {
        transaction.executeWithoutResult(status -> {
            status.setRollbackOnly();
            String nonce = UUID.randomUUID().toString().replace("-", "");
            String email = "restore-" + nonce + "@example.invalid";
            String password = "Drill!" + nonce.substring(0, 16);
            auth.signup(new SignupRequest(email, password, "복구검증" + nonce.substring(0, 10),
                    true, true, true, true, false, false));
            var login = auth.login(new LoginRequest(email, password));
            if (login.accessToken() == null || login.accessToken().isBlank()) fail();
            Long userId = login.userId();
            Long boardId = jdbc.queryForObject("SELECT id FROM boards WHERE board_type='FREE' AND is_active=TRUE", Long.class);
            var post = posts.createPost(userId, new PostCreateRequest(boardId, "복구 검증", "restore post",
                    true, PostVisibility.PUBLIC, null), null);
            comments.createComment(post.id(), userId, new CommentCreateRequest("restore comment", true, null));
            var record = journals.upsertRecord(userId, new JournalRecordUpsertRequest(
                    LocalDate.now().minusDays(1), null, null, null, false, List.of(), null, List.of(),
                    "restore journal", null, null, false, false));
            entities.flush();
            entities.clear();
            if (!"restore post".equals(posts.getPost(post.id(), userId).content())) fail();
            if (comments.getComments(post.id(), userId, PageRequest.of(0, 20)).getTotalElements() != 1) fail();
            String encrypted = jdbc.queryForObject("SELECT memo FROM journal_records WHERE id=?", String.class, record.id());
            if (encrypted == null || !encrypted.startsWith("v1:")) fail();
            if (!"restore journal".equals(journals.getRecord(userId, record.id()).memo())) fail();
        });
    }

    private static void fail() { throw new IllegalStateException("Restored core functionality failed"); }
}
