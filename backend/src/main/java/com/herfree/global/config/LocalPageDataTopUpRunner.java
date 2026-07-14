package com.herfree.global.config;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.entity.CommentStatus;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.entity.ContentStatus;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostStatus;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@Profile("local")
@ConditionalOnProperty(prefix = "app.demo-seed", name = "enabled", havingValue = "true")
@Order(30)
@RequiredArgsConstructor
public class LocalPageDataTopUpRunner implements ApplicationRunner {

    private static final int TARGET_CONTENT_COUNT = 80;
    private static final int TARGET_POST_COUNT = 120;
    private static final int TARGET_COMMENT_COUNT = 120;

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ContentRepository contentRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        User author = userRepository.findByEmail("admin@herfree.local")
                .or(() -> userRepository.findAll(PageRequest.of(0, 1)).stream().findFirst())
                .orElse(null);

        if (author == null) {
            log.info("Local page data top-up skipped: no user exists.");
            return;
        }

        topUpContents(author);
        Post pageTestPost = topUpCommunityPosts(author);
        if (pageTestPost != null) {
            topUpComments(author, pageTestPost);
        }
    }

    private void topUpContents(User author) {
        long activeCount = contentRepository
                .findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(ContentStatus.ACTIVE, PageRequest.of(0, 1))
                .getTotalElements();
        if (activeCount >= TARGET_CONTENT_COUNT) {
            return;
        }

        String[] categories = {"의학정보", "생활관리", "영양관리", "심리케어"};
        for (int i = (int) activeCount + 1; i <= TARGET_CONTENT_COUNT; i++) {
            String category = categories[(i - 1) % categories.length];
            contentRepository.save(Content.builder()
                    .author(author)
                    .title(String.format("페이지 테스트 칼럼 %02d", i))
                    .category(category)
                    .contentType(i % 2 == 0 ? "DOCTOR" : "ADMIN")
                    .content("""
                            로컬 페이지네이션과 상세 화면 확인을 위한 테스트 칼럼입니다.

                            증상 기록, 생활 패턴, 상담 전 확인할 정보가 목록과 상세 화면에서 자연스럽게 읽히는지 점검합니다.

                            아주긴단어테스트aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
                            긴 URL 테스트 https://example.com/local-page-test/very/long/path/that/should/wrap/inside/the/content/card

                            이 글은 local 프로필의 데모 시드에서만 생성되며, 실제 운영 데이터로 사용하지 않습니다.
                            """)
                    .build());
        }
        log.info("Local content page data topped up to {} active rows.", TARGET_CONTENT_COUNT);
    }

    private Post topUpCommunityPosts(User author) {
        Board board = boardRepository.findByBoardType("FREE").orElse(null);
        if (board == null) {
            log.info("Local community page data top-up skipped: FREE board missing.");
            return null;
        }

        long activeCount = postRepository
                .findByBoardIdAndStatusOrderByCreatedAtDesc(board.getId(), PostStatus.ACTIVE, PageRequest.of(0, 1))
                .getTotalElements();
        if (activeCount < TARGET_POST_COUNT) {
            for (int i = (int) activeCount + 1; i <= TARGET_POST_COUNT; i++) {
                postRepository.save(Post.builder()
                        .board(board)
                        .user(author)
                        .title(buildPostTitle(i))
                        .content("""
                                로컬 페이지네이션과 게시글 상세 화면을 확인하기 위한 테스트 글입니다.

                                목록에서 제목, 작성자, 날짜, 댓글/공감 영역이 안정적으로 보이는지 확인하고,
                                상세 페이지에서는 문단 간격과 뒤로가기 흐름을 함께 점검합니다.

                                아주긴단어테스트bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
                                긴 URL 테스트 https://example.com/community/local-load-test/posts/long-url-that-should-not-break-mobile-layout
                                """)
                        .visibility(PostVisibility.PUBLIC)
                        .isAnonymous(false)
                        .build());
            }
            log.info("Local community page data topped up to {} active FREE posts.", TARGET_POST_COUNT);
        }

        return postRepository
                .findByBoardIdAndStatusOrderByCreatedAtDesc(board.getId(), PostStatus.ACTIVE, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElse(null);
    }

    private void topUpComments(User author, Post post) {
        long activeCount = commentRepository
                .findByPostIdAndStatusOrderByCreatedAtAsc(post.getId(), CommentStatus.ACTIVE, PageRequest.of(0, 1))
                .getTotalElements();
        if (activeCount >= TARGET_COMMENT_COUNT) {
            return;
        }

        for (int i = (int) activeCount + 1; i <= TARGET_COMMENT_COUNT; i++) {
            commentRepository.save(Comment.builder()
                    .post(post)
                    .user(author)
                    .content(buildCommentBody(i))
                    .isAnonymous(i % 3 == 0)
                    .build());
        }
        log.info("Local comment page data topped up to {} active comments on post {}.", TARGET_COMMENT_COUNT, post.getId());
    }

    private String buildPostTitle(int index) {
        if (index % 10 == 0) {
            return String.format("페이지 테스트 커뮤니티 글 %03d - 모바일에서 아주 긴 제목이 두 줄 안에서 안정적으로 잘리는지 확인합니다", index);
        }
        return String.format("페이지 테스트 커뮤니티 글 %03d", index);
    }

    private String buildCommentBody(int index) {
        if (index % 10 == 0) {
            return String.format("""
                    페이지 테스트 댓글 %03d입니다.
                    긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글긴댓글
                    https://example.com/comments/local-load-test/very-long-url-that-should-wrap-inside-comment-area
                    """, index);
        }
        return String.format("페이지 테스트 댓글 %03d입니다. 댓글 페이지 이동과 버튼 줄바꿈을 확인합니다.", index);
    }
}
