package com.herfree.domain.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.herfree.global.security.JwtTokenProvider;
import java.sql.Timestamp;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AnonymousConcernIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired JdbcTemplate db;
    @Autowired JwtTokenProvider jwt;
    @Autowired jakarta.persistence.EntityManager entityManager;

    @BeforeEach void fixtures() {
        var now = Timestamp.from(Instant.now());
        for (int i = 1; i <= 4; i++) {
            db.update("INSERT INTO users (id,email,password,role,status,credential_version,created_at,updated_at) VALUES (?,?,?,?,'ACTIVE',0,?,?)",
                    93000+i, "concern-"+i+"@example.invalid", "test-encoded", i==1||i==4?"USER":i==2?"ADMIN":"DOCTOR", now,now);
            db.update("INSERT INTO user_profiles (user_id,nickname,is_public,created_at,updated_at) VALUES (?, ?, true, ?, ?)",
                    93000+i, "private-real-nickname-"+i, now,now);
        }
        String[] types={"ANONYMOUS_QUESTION","FREE","INQUIRY","PRIVATE_CONSULT","SECRET_STORY"};
        for(int i=0;i<types.length;i++) db.update("INSERT INTO boards(id,name,description,board_type,sort_order,is_active,created_at,updated_at) VALUES (?,?,'',?,0,true,?,?)", 94001+i,types[i],types[i],now,now);
        for(int i=1;i<=7;i++) db.update("INSERT INTO posts(id,board_id,user_id,title,content,view_count,comment_count,status,visibility,is_anonymous,sort_order,is_pinned,created_at,updated_at) VALUES (?,?,93001,?,?,0,0,?,?,false,0,false,?,?)",
                95000+i, i==1?94001:i>=3&&i<=5?94000+i:94002, "title-"+i,"body-"+i, i==7?"HIDDEN":"ACTIVE", i==6?"MEMBERS_ONLY":"PUBLIC",now,now);
    }

    String token(int id,String role) { return "Bearer "+jwt.createAccessToken(String.valueOf(id),role,0); }

    @Test void publicPreviewHasNoIdentityAndDoesNotIncreaseViews() throws Exception {
        mvc.perform(get("/api/posts/95002/share-preview"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control","no-store"))
                .andExpect(jsonPath("$.data.title").value("title-2"))
                .andExpect(jsonPath("$.data.description").value("body-2"))
                .andExpect(jsonPath("$.data.authorNickname").doesNotExist())
                .andExpect(jsonPath("$.data.authorIpMasked").doesNotExist());
        assertThat(db.queryForObject("SELECT view_count FROM posts WHERE id=95002",Integer.class)).isZero();
    }

    @Test void legacyPostIpIsAbsentFromListAndDetailResponses() throws Exception {
        db.update("UPDATE posts SET author_ip_masked='172.20.*' WHERE id=95002");
        mvc.perform(get("/api/posts").param("boardId", "94002").param("period", "all"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].authorIpMasked").doesNotExist());
        mvc.perform(get("/api/posts/95002"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.authorIpMasked").doesNotExist());
    }

    @Test void privateMemberOnlyHiddenAndDeletedPreviewsStayUnavailableToEveryone() throws Exception {
        for(long id=95003;id<=95007;id++) {
            mvc.perform(get("/api/posts/"+id+"/share-preview")).andExpect(status().isNotFound());
            mvc.perform(get("/api/posts/"+id+"/share-preview").header("Authorization",token(93002,"ADMIN"))).andExpect(status().isNotFound());
        }
        mvc.perform(get("/api/posts/999999/share-preview")).andExpect(status().isNotFound());
    }

    @Test void concernCreationRequiresPublicAcknowledgementAndCannotExposeNickname() throws Exception {
        String request="{\"boardId\":94001,\"title\":\"new concern\",\"content\":\"shared experience\",\"isAnonymous\":false,\"visibility\":\"PUBLIC\",\"publicDisclosureAccepted\":%s}";
        mvc.perform(post("/api/posts").header("Authorization",token(93001,"USER")).contentType(MediaType.APPLICATION_JSON).content(request.formatted(false))).andExpect(status().isBadRequest());
        mvc.perform(post("/api/posts").header("Authorization",token(93001,"USER")).contentType(MediaType.APPLICATION_JSON).content(request.formatted(true)))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(true))
                .andExpect(jsonPath("$.data.authorNickname").value("익명(나)"))
                .andExpect(jsonPath("$.data.authorIpMasked").doesNotExist());
        assertThat(db.queryForObject("SELECT is_anonymous FROM posts WHERE title='new concern'",Boolean.class)).isTrue();
    }

    @Test void questionAnonymitySurvivesGuestReadEditWhileAnAnswerCanShowItsNickname() throws Exception {
        mvc.perform(get("/api/posts/95001")).andExpect(status().isOk()).andExpect(jsonPath("$.data.authorNickname").value("익명"));
        mvc.perform(patch("/api/posts/95001").header("Authorization",token(93001,"USER")).contentType(MediaType.APPLICATION_JSON).content("{\"title\":\"edited\",\"content\":\"edited content\",\"isAnonymous\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.isAnonymous").value(true));
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93004,"USER")).contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"experience\",\"isAnonymous\":false}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(false))
                .andExpect(jsonPath("$.data.authorNickname").value("private-real-nickname-4"))
                .andExpect(jsonPath("$.data.operatorReply").value(false));
        mvc.perform(get("/api/posts/95001/comments")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].authorNickname").value("private-real-nickname-4"));
    }

    @Test void aMemberCanAnswerAnonymouslyWithoutExposingTheirNicknameToGuests() throws Exception {
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93004,"USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"anonymous answer\",\"isAnonymous\":true}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(true))
                .andExpect(jsonPath("$.data.authorNickname").value("익명(나)"));
        mvc.perform(get("/api/posts/95001/comments")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].authorNickname").value("익명"));
    }

    @Test void questionAuthorStaysAnonymousInNestedRepliesWhileOtherMembersChooseTheirIdentity() throws Exception {
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93004,"USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"named answer\",\"isAnonymous\":false}"))
                .andExpect(status().isCreated());
        Long parentId = db.queryForObject("SELECT id FROM comments WHERE content='named answer'", Long.class);
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93001,"USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"author follow-up\",\"isAnonymous\":false,\"parentId\":"+parentId+"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(true))
                .andExpect(jsonPath("$.data.authorNickname").value("익명(나)"));
        Long followUpId = db.queryForObject("SELECT id FROM comments WHERE content='author follow-up'", Long.class);
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93004,"USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"named follow-up\",\"isAnonymous\":false,\"parentId\":"+followUpId+"}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(false))
                .andExpect(jsonPath("$.data.authorNickname").value("private-real-nickname-4"));
        mvc.perform(get("/api/posts/95001/comments")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].authorNickname").value("private-real-nickname-4"))
                .andExpect(jsonPath("$.data.content[1].authorNickname").value("익명"))
                .andExpect(jsonPath("$.data.content[1].parentId").value(parentId))
                .andExpect(jsonPath("$.data.content[2].authorNickname").value("private-real-nickname-4"))
                .andExpect(jsonPath("$.data.content[2].parentId").value(followUpId));
    }

    @Test void onlyVerifiedOtherOperatorsResolveTheQueueAndPublicBadge() throws Exception {
        String body="{\"content\":\"reply\",\"isAnonymous\":false}";
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93003,"DOCTOR")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.operatorReply").value(false));
        mvc.perform(get("/api/admin/concerns").header("Authorization",token(93002,"ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        mvc.perform(get("/api/admin/concerns").header("Authorization",token(93001,"USER"))).andExpect(status().isForbidden());
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93002,"ADMIN")).contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.operatorReply").value(true))
                .andExpect(jsonPath("$.data.authorNickname").value("private-real-nickname-2"));
        mvc.perform(get("/api/admin/concerns").header("Authorization",token(93002,"ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(0));
        mvc.perform(get("/api/posts/95001")).andExpect(status().isOk()).andExpect(jsonPath("$.data.staffReplied").value(true));
        db.update("UPDATE comments SET status='HIDDEN' WHERE post_id=95001 AND user_id=93002");
        mvc.perform(get("/api/admin/concerns").header("Authorization",token(93002,"ADMIN"))).andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
    }

    @Test void anOperatorCanKeepTheirNicknameHiddenWhileAnswering() throws Exception {
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93002,"ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"content\":\"private operator reply\",\"isAnonymous\":true}"))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.isAnonymous").value(true))
                .andExpect(jsonPath("$.data.authorNickname").value("익명(나)"))
                .andExpect(jsonPath("$.data.operatorReply").value(true));
        mvc.perform(get("/api/posts/95001/comments")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].authorNickname").value("익명"))
                .andExpect(jsonPath("$.data.content[0].operatorReply").value(true));
    }

    @Test void adminReviewCanReadHiddenContentButNeverMakesItPublicOrShowsDeletedPosts() throws Exception {
        mvc.perform(get("/api/posts/95007").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/posts/95007/review").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control",org.hamcrest.Matchers.containsString("no-store")))
                .andExpect(jsonPath("$.data.status").value("HIDDEN"))
                .andExpect(jsonPath("$.data.title").value("title-7"))
                .andExpect(jsonPath("$.data.content").value("body-7"))
                .andExpect(jsonPath("$.data.authorNickname").doesNotExist());
        mvc.perform(get("/api/admin/posts/95007/review")).andExpect(status().is4xxClientError());
        mvc.perform(get("/api/admin/posts/95007/review").header("Authorization",token(93001,"USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/admin/posts/95007/review").header("Authorization",token(93003,"DOCTOR")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/posts/95007/share-preview")).andExpect(status().isNotFound());
        db.update("UPDATE posts SET status='HIDDEN' WHERE id=95003");
        mvc.perform(get("/api/admin/posts/95003/review").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content").value("body-3"));
        mvc.perform(get("/api/admin/posts/95003/review").header("Authorization",token(93004,"USER")))
                .andExpect(status().isForbidden());
        mvc.perform(get("/api/posts/95003").header("Authorization",token(93004,"USER")))
                .andExpect(status().isNotFound());
        db.update("UPDATE posts SET status='DELETED' WHERE id=95007");
        mvc.perform(get("/api/admin/posts/95007/review").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isNotFound());
        assertThat(db.queryForObject("SELECT COUNT(*) FROM admin_audit_logs WHERE actor_user_id=93002 AND http_method='GET' AND request_path='/api/admin/posts/95007/review' AND response_status=200",Integer.class))
                .isGreaterThanOrEqualTo(1);
        db.update("UPDATE users SET role='USER' WHERE id=93002");
        entityManager.clear();
        mvc.perform(get("/api/admin/posts/95003/review").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isForbidden());
    }

    @Test void anOperatorsOwnReplyAndAnInactiveOperatorDoNotResolveTheQueue() throws Exception {
        db.update("UPDATE posts SET user_id=93002 WHERE id=95001");
        mvc.perform(post("/api/posts/95001/comments").header("Authorization",token(93002,"ADMIN"))
                .contentType(MediaType.APPLICATION_JSON).content("{\"content\":\"own reply\",\"isAnonymous\":false}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/admin/concerns").header("Authorization",token(93002,"ADMIN")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.totalElements").value(1));
        db.update("UPDATE posts SET user_id=93001 WHERE id=95001");
        db.update("UPDATE users SET status='SUSPENDED' WHERE id=93002");
        mvc.perform(get("/api/posts/95001"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.staffReplied").value(false));
        mvc.perform(get("/api/posts/95001/comments"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.content[0].operatorReply").value(false))
                .andExpect(jsonPath("$.data.content[0].authorNickname").value("익명"));
    }
}
