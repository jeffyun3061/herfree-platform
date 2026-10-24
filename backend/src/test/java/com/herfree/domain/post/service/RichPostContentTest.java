package com.herfree.domain.post.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import com.herfree.global.exception.BusinessException;
import org.junit.jupiter.api.Test;

class RichPostContentTest {
    private static final String DOC = """
            {"type":"doc","content":[
              {"type":"heading","attrs":{"level":2},"content":[{"type":"text","text":"제목"}]},
              {"type":"paragraph","content":[{"type":"text","text":"안내","marks":[{"type":"bold"},{"type":"link","attrs":{"href":"https://example.test/path"}}]}]},
              {"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"목록"}]}]}]},
              {"type":"blockquote","content":[{"type":"paragraph","content":[{"type":"text","text":"인용"}]}]}
            ]}
            """;

    @Test void acceptsStructuredFormattingWithMatchingSearchablePlainText() {
        assertThat(RichPostContent.validate("제목\n안내\n목록\n인용", DOC)).contains("heading", "bold", "https://example.test/path");
        assertThat(RichPostContent.validate("legacy <img onerror=alert(1)>", null)).isNull();
    }
    @Test void rejectsUnsafeLinksHtmlNodesUnknownAttributesAndMismatchedText() {
        for (String unsafe : java.util.List.of(
                DOC.replace("https://example.test/path", "javascript:alert(1)"),
                DOC.replace("https://example.test/path", "data:text/html,script"),
                DOC.replace("https://example.test/path", "https://user:secret@example.test/path"),
                DOC.replace("\"type\":\"heading\"", "\"type\":\"script\""),
                DOC.replace("\"level\":2", "\"level\":2,\"onclick\":\"alert(1)\""))) {
            assertThatThrownBy(() -> RichPostContent.validate("제목\n안내\n목록\n인용", unsafe)).isInstanceOf(BusinessException.class);
        }
        assertThatThrownBy(() -> RichPostContent.validate("different text", DOC)).isInstanceOf(BusinessException.class);
    }
    @Test void rejectsUnboundedDocumentSizeAndPreservesBlankLines() {
        assertThatThrownBy(() -> RichPostContent.validate("text", "x".repeat(200001))).isInstanceOf(BusinessException.class);
        String blankLines = "{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"one\"}]},{\"type\":\"paragraph\"},{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"two\"}]}]}";
        assertThat(RichPostContent.validate("one\n\ntwo", blankLines)).isNotNull();
    }

    @Test void privateDetailMasksRichDocumentForOtherMembersAndDevelopers() {
        var board = org.springframework.beans.BeanUtils.instantiateClass(com.herfree.domain.board.entity.Board.class);
        org.springframework.test.util.ReflectionTestUtils.setField(board, "id", 1L);
        org.springframework.test.util.ReflectionTestUtils.setField(board, "boardType", "INQUIRY");
        var author = com.herfree.domain.user.entity.User.builder().email("rich-owner@example.test").password("test-only").build();
        org.springframework.test.util.ReflectionTestUtils.setField(author, "id", 1L);
        var post = com.herfree.domain.post.entity.Post.builder().board(board).user(author).title("private title").content("제목\n안내\n목록\n인용").build();
        post.updateRichContent(RichPostContent.validate(post.getContent(), DOC));
        var result = com.herfree.domain.post.dto.response.PostDetailResponse.of(post, "private nickname", false, null,
                false, 2L, com.herfree.domain.user.entity.UserRole.DEVELOPER);
        assertThat(result.richContent()).isNull();
        assertThat(result.readable()).isFalse();
        assertThat(result.content()).doesNotContain("안내", "목록", "인용");
    }
}
