package com.herfree.global.config;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
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

    private static final int TARGET_COUNT = 30;

    private final UserRepository userRepository;
    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
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
        topUpCommunityPosts(author);
    }

    private void topUpContents(User author) {
        long activeCount = contentRepository
                .findByStatusOrderByIsPinnedDescSortOrderDescCreatedAtDesc(ContentStatus.ACTIVE, PageRequest.of(0, 1))
                .getTotalElements();
        if (activeCount >= TARGET_COUNT) {
            return;
        }

        String[] categories = {"의학정보", "생활관리", "영양관리", "심리케어"};
        for (int i = (int) activeCount + 1; i <= TARGET_COUNT; i++) {
            String category = categories[(i - 1) % categories.length];
            contentRepository.save(Content.builder()
                    .author(author)
                    .title(String.format("페이지 테스트 칼럼 %02d", i))
                    .category(category)
                    .contentType(i % 2 == 0 ? "DOCTOR" : "ADMIN")
                    .content("""
                            로컬 페이지네이션과 상세 화면 확인을 위한 테스트 칼럼입니다.

                            증상 기록, 생활 패턴, 상담 전 확인할 정보가 목록과 상세 화면에서 자연스럽게 읽히는지 점검합니다.

                            이 글은 local 프로필의 데모 시드에서만 생성되며, 실제 운영 데이터로 사용하지 않습니다.
                            """)
                    .build());
        }
        log.info("Local content page data topped up to {} active rows.", TARGET_COUNT);
    }

    private void topUpCommunityPosts(User author) {
        Board board = boardRepository.findByBoardType("FREE").orElse(null);
        if (board == null) {
            log.info("Local community page data top-up skipped: FREE board missing.");
            return;
        }

        long activeCount = postRepository
                .findByBoardIdAndStatusOrderByCreatedAtDesc(board.getId(), PostStatus.ACTIVE, PageRequest.of(0, 1))
                .getTotalElements();
        if (activeCount >= TARGET_COUNT) {
            return;
        }

        for (int i = (int) activeCount + 1; i <= TARGET_COUNT; i++) {
            postRepository.save(Post.builder()
                    .board(board)
                    .user(author)
                    .title(String.format("페이지 테스트 커뮤니티 글 %02d", i))
                    .content("""
                            로컬 페이지네이션과 게시글 상세 화면을 확인하기 위한 테스트 글입니다.

                            목록에서 제목, 작성자, 날짜, 댓글/공감 영역이 안정적으로 보이는지 확인하고,
                            상세 페이지에서는 문단 간격과 뒤로가기 흐름을 함께 점검합니다.
                            """)
                    .visibility(PostVisibility.PUBLIC)
                    .isAnonymous(false)
                    .build());
        }
        log.info("Local community page data topped up to {} active FREE posts.", TARGET_COUNT);
    }
}
