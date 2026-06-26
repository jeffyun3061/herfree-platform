package com.herfree.global.config;

import com.herfree.domain.board.entity.Board;
import com.herfree.domain.board.repository.BoardRepository;
import com.herfree.domain.comment.entity.Comment;
import com.herfree.domain.comment.repository.CommentRepository;
import com.herfree.domain.content.entity.Content;
import com.herfree.domain.content.repository.ContentRepository;
import com.herfree.domain.journal.entity.JournalRecord;
import com.herfree.domain.journal.entity.MedicationStatus;
import com.herfree.domain.journal.entity.MoodType;
import com.herfree.domain.journal.entity.SleepRange;
import com.herfree.domain.journal.entity.StressLevel;
import com.herfree.domain.journal.repository.JournalRecordRepository;
import com.herfree.domain.post.entity.Post;
import com.herfree.domain.post.entity.PostVisibility;
import com.herfree.domain.post.repository.PostRepository;
import com.herfree.domain.product.entity.Product;
import com.herfree.domain.product.repository.ProductRepository;
import com.herfree.domain.user.entity.User;
import com.herfree.domain.user.entity.UserProfile;
import com.herfree.domain.user.entity.UserRole;
import com.herfree.domain.user.repository.UserProfileRepository;
import com.herfree.domain.user.repository.UserRepository;
import com.herfree.domain.video.entity.Video;
import com.herfree.domain.video.repository.VideoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 로컬 전용 데모 데이터 — 게시판·정보·제품·일지 등 둘러보기용 샘플.
 * 재실행 시 demo1@herfree.local 이 있으면 스킵한다.
 */
@Slf4j
@Component
@Profile("local")
@ConditionalOnProperty(prefix = "app.demo-seed", name = "enabled", havingValue = "true")
@Order(20)
@EnableConfigurationProperties(DemoDataSeedProperties.class)
@RequiredArgsConstructor
public class DemoDataSeedRunner implements ApplicationRunner {

    private static final String DEMO_MARKER_EMAIL = "demo1@herfree.local";

    private static final String[] DEMO_NICKNAMES = {
            "햇살꽃", "조용한밤", "루틴지키미", "푸른바람", "별빛노트",
            "고요한숲", "따뜻한차", "바람결", "은하수", "새벽산책",
            "잔잔한파도", "희망한조각"
    };

    private static final Map<String, String[]> BOARD_POST_TITLES = Map.ofEntries(
            Map.entry("NOTICE", new String[]{
                    "헤르프리 커뮤니티 이용 안내",
                    "개인정보·익명 정책 안내",
                    "의료 정보 면책 및 상담 안내"
            }),
            Map.entry("FREE", new String[]{
                    "처음 가입했어요, 잘 부탁드려요",
                    "오늘 기분이 조금 가라앉네요",
                    "주말에 산책 다녀왔어요",
                    "요즘 읽고 있는 책 추천해 주세요",
                    "커뮤니티 분위기 너무 좋아요",
                    "작은 성취 하나 공유해요",
                    "날씨가 좋아서 기분이 나아졌어요",
                    "다들 오늘 하루 어떠셨나요",
                    "요즘 듣는 플레이리스트",
                    "가볍게 인사 올려봅니다"
            }),
            Map.entry("QUESTION", new String[]{
                    "재발 초기에 병원 가야 할까요?",
                    "수면 부족할 때 루틴 어떻게 하시나요?",
                    "연인에게 고지 타이밍 조언 부탁해요",
                    "영양제 복용 시간 추천 있을까요?",
                    "스트레스 많을 때 관리법이 궁금해요",
                    "피부 트러블 완화에 도움 된 경험 있나요?",
                    "직장에서 컨디션 관리 어떻게 하세요?",
                    "운동 후 피로감이 심할 때 팁 있을까요?",
                    "검사 전 불안할 때 어떻게 대처하셨나요?",
                    "커뮤니티 글쓰기 익명 설정이 궁금해요"
            }),
            Map.entry("PHOBIA", new String[]{
                    "검사 대기 중 불안이 커요",
                    "결과 나오기 전 밤에 잠이 안 와요",
                    "병원 앞에서 발걸음이 느려져요",
                    "검사 받은 지 일주일, 마음 정리 중",
                    "가족에게 말하기 전 마음가짐",
                    "대기실에서 만난 분들 이야기",
                    "재검사 예정인데 걱정돼요",
                    "검사 후 생활 루틴 어떻게 바꾸셨나요",
                    "혼자 버티기 힘들 때",
                    "검사 일정 연기했을 때 경험"
            }),
            Map.entry("SYMPTOM", new String[]{
                    "오늘 저림 증상이 있었어요",
                    "열감과 함께 피로감이 심했어요",
                    "가려움 증상 기록 남겨봐요",
                    "전조 증상 같은 묵직함이 느껴졌어요",
                    "증상 없이 지낸 날도 기록해요",
                    "수면 부족 후 증상이 올라왔어요",
                    "스트레스 받은 날 패턴",
                    "운동 후 컨디션 변화",
                    "생리 전후 증상 변화",
                    "증상 일지 쓰면서 느낀 점"
            }),
            Map.entry("RELATIONSHIP", new String[]{
                    "고지 전 마음가짐이 궁금해요",
                    "연인과 첫 대화 후기",
                    "가족에게 말했을 때 반응",
                    "고지 타이밍 고민 중이에요",
                    "거리두기 요청받았을 때",
                    "서로 이해하며 지내는 중",
                    "연애 초반에 어떻게 말했나요",
                    "친구에게 고지한 경험",
                    "고지 후 관계가 더 좋아졌어요",
                    "아직 말 못 한 상태에서의 고민"
            }),
            Map.entry("EXPERIENCE", new String[]{
                    "확진 후 첫 달 회고",
                    "병원 다니며 배운 점",
                    "재발 경험과 극복 과정",
                    "약 복용 루틴 정착 후기",
                    "직장 생활 병행 경험",
                    "가족 지지가 큰 힘이 됐어요",
                    "초기에 가장 힘들었던 순간",
                    "지금은 일상이 가능해졌어요",
                    "검사·치료 과정에서의 팁",
                    "다시 시작한다는 마음으로"
            }),
            Map.entry("SUPPORT", new String[]{
                    "오늘도 수고 많으셨어요",
                    "힘든 하루 보내신 분들께",
                    "작은 위로가 필요할 때",
                    "함께 버텨 보면 괜찮아질 거예요",
                    "응원 메시지 남겨요",
                    "혼자가 아니에요",
                    "오늘 하루도 잘 버텼어요",
                    "쉬어가도 괜찮아요",
                    "당신의 속도로 가도 돼요",
                    "따뜻한 말 한마디 전해요"
            }),
            Map.entry("PRODUCT_REVIEW", new String[]{
                    "수면에 도움 된 루틴 후기",
                    "바디로션 사용 후기",
                    "영양제 3개월 복용 소감",
                    "아침 스트레칭 루틴",
                    "샤워 후 케어 루틴",
                    "편한 잠옷 추천",
                    "가습기 써본 후기",
                    "카페인 줄인 후 변화",
                    "저자극 세제 바꾼 후",
                    "운동 보조제 써본 소감"
            }),
            Map.entry("SECRET_STORY", new String[]{
                    "말하기 어려운 고민이 있어요",
                    "가족에게는 못 하는 이야기",
                    "혼자만 알고 있는 불안",
                    "작은 사연 남겨봅니다",
                    "읽어주시면 감사하겠어요"
            }),
            Map.entry("INQUIRY", new String[]{
                    "닉네임 변경 문의드립니다",
                    "게시글 삭제 요청합니다"
            }),
            Map.entry("PRIVATE_CONSULT", new String[]{
                    "1:1 상담 요청드립니다",
                    "개인적인 고민 상담 부탁드려요"
            })
    );

    private final DemoDataSeedProperties properties;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final BoardRepository boardRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final ContentRepository contentRepository;
    private final ProductRepository productRepository;
    private final VideoRepository videoRepository;
    private final JournalRecordRepository journalRecordRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!properties.enabled()) {
            return;
        }
        if (userRepository.findByEmail(DEMO_MARKER_EMAIL).isPresent()) {
            log.info("Demo seed skipped — marker user already exists ({})", DEMO_MARKER_EMAIL);
            return;
        }

        List<User> demoUsers = seedDemoUsers();
        User admin = userRepository.findByEmail("admin@herfree.local").orElse(demoUsers.get(0));
        seedPosts(demoUsers);
        seedContents(admin);
        seedProducts();
        seedExtraVideos();
        seedJournalRecords(demoUsers);

        log.info("Demo seed completed — {} users, password: {}", demoUsers.size(), properties.resolvedPassword());
        log.info("Demo login example: {} / {}", DEMO_MARKER_EMAIL, properties.resolvedPassword());
    }

    private List<User> seedDemoUsers() {
        String encoded = passwordEncoder.encode(properties.resolvedPassword());
        List<User> users = new ArrayList<>();
        for (int i = 0; i < DEMO_NICKNAMES.length; i++) {
            String email = "demo" + (i + 1) + "@herfree.local";
            User user = User.builder()
                    .email(email)
                    .password(encoded)
                    .role(UserRole.USER)
                    .build();
            userRepository.save(user);
            userProfileRepository.save(UserProfile.builder()
                    .user(user)
                    .nickname(DEMO_NICKNAMES[i])
                    .isPublic(true)
                    .build());
            users.add(user);
        }
        return users;
    }

    private void seedPosts(List<User> users) {
        int userIndex = 0;
        for (Map.Entry<String, String[]> entry : BOARD_POST_TITLES.entrySet()) {
            String boardType = entry.getKey();
            Optional<Board> boardOpt = boardRepository.findByBoardType(boardType);
            if (boardOpt.isEmpty()) {
                continue;
            }
            Board board = boardOpt.get();
            PostVisibility visibility = isPrivateBoard(boardType)
                    ? PostVisibility.MEMBERS_ONLY
                    : PostVisibility.PUBLIC;
            boolean anonymous = "SECRET_STORY".equals(boardType)
                    || "INQUIRY".equals(boardType)
                    || "PRIVATE_CONSULT".equals(boardType);

            String[] titles = entry.getValue();
            Post firstPost = null;
            for (int i = 0; i < titles.length; i++) {
                User author = users.get(userIndex % users.size());
                userIndex++;
                Post post = Post.builder()
                        .board(board)
                        .user(author)
                        .title(titles[i])
                        .content(buildPostBody(boardType, titles[i]))
                        .visibility(visibility)
                        .isAnonymous(anonymous)
                        .build();
                if ("NOTICE".equals(boardType) && i == 0) {
                    post.pin();
                }
                postRepository.save(post);
                if (firstPost == null) {
                    firstPost = post;
                }
            }
            if (firstPost != null && !isPrivateBoard(boardType)) {
                seedComments(firstPost, users);
            }
        }
    }

    private void seedComments(Post post, List<User> users) {
        commentRepository.save(Comment.builder()
                .post(post)
                .user(users.get(1))
                .content("공감돼요. 저도 비슷한 경험이 있어요.")
                .isAnonymous(true)
                .build());
        commentRepository.save(Comment.builder()
                .post(post)
                .user(users.get(2))
                .content("응원합니다. 혼자가 아니에요.")
                .isAnonymous(false)
                .build());
    }

    private void seedContents(User admin) {
        String[][] rows = {
                {"헤르페스 기본 이해하기", "의학정보", "DOCTOR", "감염 경로·잠복기·재발 요인을 쉽게 정리했습니다."},
                {"재발 줄이는 생활 습관", "생활관리", "DOCTOR", "수면·스트레스·면역 관리가 왜 중요한지 설명합니다."},
                {"수면과 면역의 관계", "생활관리", "ADMIN", "수면 부족이 컨디션에 미치는 영향을 정리했습니다."},
                {"스트레스 관리 5가지", "심리케어", "DOCTOR", "호흡·산책·기록 등 실천 가능한 방법입니다."},
                {"영양제 선택 가이드", "영양관리", "ADMIN", "개인 차이가 크므로 전문의 상담을 권장합니다."},
                {"피부 관리 시 주의점", "생활관리", "DOCTOR", "자극을 줄이는 기본 루틴을 소개합니다."},
                {"검사 전후 마음 돌보기", "심리케어", "ADMIN", "불안할 때 도움이 되는 생각 정리법입니다."},
                {"연애·고지 대화 팁", "심리케어", "DOCTOR", "상대방과 나를 지키는 대화 방법입니다."},
                {"직장생활 컨디션 관리", "생활관리", "ADMIN", "업무 중 휴식·수분·루틴 체크 포인트입니다."},
                {"커뮤니티 안전하게 이용하기", "의학정보", "ADMIN", "익명·신고·개인정보 보호 안내입니다."}
        };
        for (String[] row : rows) {
            contentRepository.save(Content.builder()
                    .author(admin)
                    .title(row[0])
                    .category(row[1])
                    .contentType(row[2])
                    .content(row[3] + " 본 글은 일반 정보이며 진단·치료를 대체하지 않습니다.")
                    .build());
        }
    }

    private void seedProducts() {
        if (productRepository.count() >= 10) {
            return;
        }
        String[][] rows = {
                {"저자극 바디워시", "생활용품", "민감 피부용 순한 세정 제품입니다.", "29000"},
                {"수면 보조 베개", "생활용품", "목 부담을 줄이는 베개입니다.", "45000"},
                {"가습기 미니", "생활용품", "건조한 계절에 사용하기 좋습니다.", "39000"},
                {"비타민C", "영양제", "면역 관리 보조용입니다.", "18000"},
                {"마그네슘", "영양제", "수면·근육 이완에 도움을 줄 수 있습니다.", "22000"},
                {"저자극 보습크림", "스킨케어", "건조함 완화에 도움됩니다.", "24000"},
                {"릴랙스 티", "생활용품", "카페인 없는 허브티입니다.", "12000"},
                {"아로마 디퓨저", "생활용품", "가벼운 향으로 휴식 분위기를 만듭니다.", "35000"},
                {"요가 매트", "생활용품", "가벼운 스트레칭용입니다.", "28000"},
                {"수면 안대", "생활용품", "빛 차단으로 수면 질 개선에 도움됩니다.", "15000"}
        };
        for (String[] row : rows) {
            productRepository.save(Product.builder()
                    .name(row[0])
                    .category(row[1])
                    .description(row[2])
                    .price(Integer.parseInt(row[3]))
                    .externalUrl("https://example.com/products/demo")
                    .build());
        }
    }

    private void seedExtraVideos() {
        if (videoRepository.count() >= 10) {
            return;
        }
        String[][] rows = {
                {"스트레스 완화 호흡법", "dQw4w9WgXcQ"},
                {"수면 루틴 만들기", "9bZkp7q19f0"},
                {"가벼운 스트레칭 10분", "kffacxfA7G4"},
                {"마음챙김 입문", "inpok4MKVLM"}
        };
        for (String[] row : rows) {
            String videoId = row[1];
            videoRepository.save(Video.builder()
                    .title(row[0])
                    .youtubeUrl("https://www.youtube.com/watch?v=" + videoId)
                    .youtubeVideoId(videoId)
                    .thumbnailUrl("https://img.youtube.com/vi/" + videoId + "/mqdefault.jpg")
                    .description("데모 큐레이션 영상입니다.")
                    .build());
        }
    }

    private void seedJournalRecords(List<User> users) {
        LocalDate today = LocalDate.now();
        List<String> triggerPool = List.of("STRESS", "SLEEP_DEFICIT", "ALCOHOL", "OVERWORK", "MENSTRUATION");
        List<String> symptomPool = List.of("NUMBNESS", "FATIGUE", "WARMTH", "ITCHING");

        for (int userIdx = 0; userIdx < Math.min(8, users.size()); userIdx++) {
            User user = users.get(userIdx);
            for (int day = 1; day <= 14; day++) {
                LocalDate date = today.minusDays(day + userIdx);
                boolean relapse = day % 3 != 0;
                List<String> triggers = relapse
                        ? List.of(triggerPool.get(day % triggerPool.size()), triggerPool.get((day + 1) % triggerPool.size()))
                        : List.of();
                List<String> symptoms = relapse
                        ? List.of(symptomPool.get(day % symptomPool.size()))
                        : List.of("NONE");

                JournalRecord record = JournalRecord.builder()
                        .user(user)
                        .recordDate(date)
                        .hadSymptoms(relapse)
                        .build();
                record.update(
                        day % 4 == 0 ? MedicationStatus.IRREGULAR : MedicationStatus.NORMAL,
                        day % 2 == 0 ? SleepRange.H5_6 : SleepRange.H6_7,
                        day % 3 == 0 ? StressLevel.HIGH : StressLevel.MEDIUM,
                        relapse,
                        symptoms,
                        relapse ? 2 + (day % 3) : null,
                        triggers,
                        relapse ? "데모 기록 — " + date : "컨디션 괜찮았던 날",
                        day % 2 == 0 ? MoodType.PEACEFUL : MoodType.NORMAL,
                        BigDecimal.valueOf(5.5 + (day % 3)),
                        day % 2 == 0,
                        day % 5 == 0
                );
                journalRecordRepository.save(record);
            }
        }
    }

    private static boolean isPrivateBoard(String boardType) {
        return "INQUIRY".equals(boardType)
                || "PRIVATE_CONSULT".equals(boardType)
                || "SECRET_STORY".equals(boardType);
    }

    private static String buildPostBody(String boardType, String title) {
        return switch (boardType) {
            case "NOTICE" -> title + "에 대한 운영 안내입니다. 커뮤니티 이용 시 익명 정책과 의료 면책을 확인해 주세요.";
            case "QUESTION" -> title + " 궁금해서 질문 남깁니다. 경험 있으신 분들 답변 부탁드려요.";
            case "SECRET_STORY", "INQUIRY", "PRIVATE_CONSULT" -> title + " 관련 내용입니다. 운영팀/관리자만 전체 확인 가능한 비공개 글 예시입니다.";
            default -> title + " 관련 이야기를 나눠 보고 싶어서 글 올립니다. 비슷한 경험 있으시면 댓글로 이야기해 주세요.";
        };
    }
}
