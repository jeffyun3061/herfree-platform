package com.herfree.domain.user.service;

import static org.assertj.core.api.Assertions.*;
import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.dto.request.CommentCreateRequest;
import com.herfree.domain.comment.entity.*;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.comment.service.CommentService;
import com.herfree.domain.journal.dto.request.JournalRecordUpsertRequest;
import com.herfree.domain.journal.service.JournalRecordService;
import com.herfree.domain.post.dto.request.PostCreateRequest;
import com.herfree.domain.post.entity.*;
import com.herfree.domain.post.repository.*;
import com.herfree.domain.post.service.*;
import com.herfree.domain.user.entity.*;
import com.herfree.domain.user.repository.*;
import com.herfree.global.exception.BusinessException;
import java.time.LocalDate;
import java.util.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

@SpringBootTest(properties="spring.datasource.url=jdbc:h2:mem:community_consent;MODE=MySQL;DB_CLOSE_DELAY=-1")
@ActiveProfiles("test")
class CommunityHealthConsentIntegrationTest {
    @Autowired CommunityHealthConsentService consent;
    @Autowired CommunityDeletionRequestService deletion;
    @Autowired HealthDataConsentService journalConsent;
    @Autowired JournalRecordService journals;
    @Autowired PostService postService;
    @Autowired CommentService commentService;
    @Autowired PostSharePreviewService share;
    @Autowired PostImageAccessService imageAccess;
    @Autowired UserRepository users;
    @Autowired UserProfileRepository profiles;
    @Autowired BoardRepository boards;
    @Autowired PostRepository posts;
    @Autowired CommentRepository comments;
    @Autowired PostImageRepository images;
    @Autowired CommunityHealthConsentRepository decisions;
    @Autowired CommunityDeletionRequestRepository requests;
    @Autowired PlatformTransactionManager manager;
    private Board concern, free;

    @BeforeEach void boards() throws Exception {
        concern=board("ANONYMOUS_QUESTION"); free=board("FREE");
    }
    private Board board(String type) throws Exception {
        var existing=boards.findByBoardType(type); if(existing.isPresent()) return existing.get();
        var constructor=Board.class.getDeclaredConstructor(); constructor.setAccessible(true);
        Board b=constructor.newInstance();
        ReflectionTestUtils.setField(b,"name",type); ReflectionTestUtils.setField(b,"boardType",type);
        ReflectionTestUtils.setField(b,"isActive",true); return boards.save(b);
    }
    private User user(UserRole role) {
        String nonce=UUID.randomUUID().toString();
        User u=users.save(User.builder().email(nonce+"@example.invalid").password("test-only").role(role).build());
        profiles.save(UserProfile.builder().user(u).nickname("fixture"+nonce.substring(0,8)).isPublic(false).build());
        return u;
    }
    private void grant(User user) { consent.updateConsent(user.getId(),true,CommunityHealthConsentService.POLICY_VERSION); }
    private Long create(User u,Board b) {
        return postService.createPost(u.getId(),new PostCreateRequest(b.getId(),"synthetic concern","synthetic body",true,
                PostVisibility.PUBLIC,null,true),null).id();
    }
    private Post legacy(User u) {
        return posts.save(Post.builder().user(u).board(concern).title("legacy fixture").content("legacy body")
                .visibility(PostVisibility.PUBLIC).isAnonymous(true).build());
    }

    @Test void withdrawalOnlyHidesNewOwnContentAndReceivesRequestWithoutDeletingOriginals() {
        User a=user(UserRole.USER), b=user(UserRole.USER), admin=user(UserRole.ADMIN);
        Post legacy=legacy(a);
        Comment oldComment=comments.save(Comment.builder().post(legacy).user(a).content("legacy comment").isAnonymous(true).build());
        new TransactionTemplate(manager).executeWithoutResult(s -> posts.incrementCommentCount(legacy.getId()));
        journalConsent.updateConsent(a.getId(),true);
        var journal=journals.upsertRecord(a.getId(),new JournalRecordUpsertRequest(LocalDate.now(),null,null,null,false,List.of(),null,
                List.of(),"synthetic private memo",null,null,false,false));
        grant(a); grant(b);
        Long id=create(a,concern);
        Long ownComment=commentService.createComment(legacy.getId(),a.getId(),new CommentCreateRequest("new own reply",true,null)).id();
        Long otherComment=commentService.createComment(id,b.getId(),new CommentCreateRequest("other reply",false,null)).id();
        String object="posts/"+a.getId()+"/fixture.png";
        images.save(PostImage.builder().post(posts.findById(id).orElseThrow()).imageUrl("https://example.invalid/"+object).build());
        assertThat(imageAccess.check(object,null).privateScope()).isTrue();

        var revoked=consent.updateConsent(a.getId(),false,null);
        assertThat(revoked.agreed()).isFalse(); assertThat(revoked.latestDecisionAgreed()).isFalse();
        assertThat(revoked.deletionRequestId()).isNotNull();
        assertThat(posts.findById(id).orElseThrow().getStatus()).isEqualTo(PostStatus.CONSENT_WITHDRAWN);
        assertThat(posts.findById(id).orElseThrow().getContent()).isEqualTo("synthetic body");
        assertThat(posts.findById(legacy.getId()).orElseThrow().getStatus()).isEqualTo(PostStatus.ACTIVE);
        assertThat(posts.findById(legacy.getId()).orElseThrow().getCommentCount()).isEqualTo(1);
        assertThat(comments.findById(oldComment.getId()).orElseThrow().getStatus()).isEqualTo(CommentStatus.ACTIVE);
        assertThat(comments.findById(ownComment).orElseThrow().getStatus()).isEqualTo(CommentStatus.CONSENT_WITHDRAWN);
        assertThat(comments.findById(otherComment).orElseThrow().getStatus()).isEqualTo(CommentStatus.ACTIVE);
        assertThat(journals.getRecord(a.getId(),journal.id()).memo()).isEqualTo("synthetic private memo");
        assertThat(journalConsent.getConsent(a.getId()).agreed()).isTrue();
        assertThatThrownBy(() -> postService.getPost(id,a.getId())).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> share.getPreview(id)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> postService.restorePost(id)).isInstanceOf(BusinessException.class);
        assertThat(imageAccess.check(object,a.getId()).allowed()).isFalse();
        assertThat(imageAccess.check(object,admin.getId()).allowed()).isFalse();
        var receipt=deletion.get(admin.getId(),revoked.deletionRequestId());
        assertThat(receipt.postCount()).isEqualTo(1); assertThat(receipt.commentCount()).isEqualTo(1);
        assertThat(receipt.items()).hasSize(2);
        assertThatThrownBy(() -> deletion.get(b.getId(),revoked.deletionRequestId())).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> postService.getAdminCommunityPosts(null,PostStatus.CONSENT_WITHDRAWN,PageRequest.of(0,20)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> commentService.getAdminComments(null,CommentStatus.CONSENT_WITHDRAWN,PageRequest.of(0,20)))
                .isInstanceOf(BusinessException.class);
        assertThat(commentService.getAdminComments(null,null,PageRequest.of(0,100)).getContent())
                .noneMatch(c -> c.id().equals(otherComment));
        long events=decisions.count(), receipts=requests.count();
        assertThat(consent.updateConsent(a.getId(),false,"old-version").deletionRequestId()).isEqualTo(revoked.deletionRequestId());
        assertThat(decisions.count()).isEqualTo(events); assertThat(requests.count()).isEqualTo(receipts);
        grant(a); Long second=create(a,concern);
        assertThat(posts.findById(id).orElseThrow().getStatus()).isEqualTo(PostStatus.CONSENT_WITHDRAWN);
        assertThat(posts.findById(second).orElseThrow().getStatus()).isEqualTo(PostStatus.ACTIVE);
        assertThat(consent.updateConsent(a.getId(),false,null).deletionRequestId()).isNotEqualTo(revoked.deletionRequestId());
    }

    @Test void refusalDoesNotBlockReadingSignupOrOtherBoardsAndOldGrantCanStillBeRevoked() {
        User a=user(UserRole.USER); Post old=legacy(a);
        consent.updateConsent(a.getId(),false,null);
        assertThat(create(a,free)).isNotNull();
        assertThat(postService.getPost(old.getId(),a.getId()).id()).isEqualTo(old.getId());
        assertThatThrownBy(() -> create(a,concern)).isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> commentService.createComment(old.getId(),a.getId(),new CommentCreateRequest("new",true,null)))
                .isInstanceOf(BusinessException.class);
        assertThatThrownBy(() -> consent.updateConsent(a.getId(),true,"stale-version")).isInstanceOf(BusinessException.class);
        decisions.save(new CommunityHealthConsent(a,true,"older-version",CommunityHealthConsentService.PURPOSE,java.time.Instant.now()));
        assertThat(consent.getConsent(a.getId()).agreed()).isFalse();
        assertThat(consent.getConsent(a.getId()).latestDecisionAgreed()).isTrue();
        assertThat(consent.updateConsent(a.getId(),false,"older-version").latestDecisionAgreed()).isFalse();
    }
}
