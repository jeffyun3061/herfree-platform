package com.herfree.domain.post.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.herfree.global.exception.BusinessException;
import com.herfree.global.exception.ErrorCode;
import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.Set;

/** A small document schema, never HTML. The canonical plain text remains searchable and backwards compatible. */
public final class RichPostContent {
    private static final ObjectMapper JSON = new ObjectMapper();
    private static final Set<String> BLOCKS = Set.of("paragraph", "heading", "blockquote", "bulletList", "orderedList");
    private RichPostContent() {}

    public static String validate(String plain, String document) {
        if (document == null) return null;
        try {
            if (document.length() > 200000 || plain.getBytes(StandardCharsets.UTF_8).length > 60000) throw new IllegalArgumentException();
            JsonNode root = JSON.readTree(document);
            int[] count = {0};
            String extracted = node(root, "root", 0, count);
            if (!extracted.equals(plain.replace("\r\n", "\n").replace('\r', '\n'))) throw new IllegalArgumentException();
            return JSON.writeValueAsString(root);
        } catch (Exception ignored) { throw new BusinessException(ErrorCode.INVALID_INPUT); }
    }

    private static String node(JsonNode n, String parent, int depth, int[] count) {
        if (depth > 12 || ++count[0] > 3000 || !n.isObject()) throw new IllegalArgumentException();
        n.fieldNames().forEachRemaining(key -> { if (!Set.of("type", "content", "attrs", "text", "marks").contains(key)) throw new IllegalArgumentException(); });
        String type = n.path("type").asText();
        boolean inlineParent = Set.of("paragraph", "heading").contains(parent);
        if (parent.equals("root") ? !type.equals("doc")
                : inlineParent ? !Set.of("text", "hardBreak").contains(type)
                : Set.of("bulletList", "orderedList").contains(parent) ? !type.equals("listItem") : !BLOCKS.contains(type))
            throw new IllegalArgumentException();
        JsonNode attrs = n.get("attrs");
        if (type.equals("heading")) {
            if (attrs == null || !attrs.isObject() || attrs.size() != 1 || !attrs.path("level").isInt()
                    || (attrs.path("level").intValue() != 2 && attrs.path("level").intValue() != 3)) throw new IllegalArgumentException();
        } else if (type.equals("orderedList")) {
            if (attrs != null && (!attrs.isObject() || attrs.size() != 1 || !attrs.path("start").isInt()
                    || attrs.path("start").intValue() < 1 || attrs.path("start").intValue() > 1000)) throw new IllegalArgumentException();
        } else if (attrs != null) throw new IllegalArgumentException();
        JsonNode marks = n.get("marks");
        if (marks != null) {
            if (!type.equals("text") || !marks.isArray() || marks.size() > 2) throw new IllegalArgumentException();
            var types = new java.util.HashSet<String>();
            for (JsonNode mark : marks) {
                String markType = mark.path("type").asText();
                if (!types.add(markType) || !mark.isObject()) throw new IllegalArgumentException();
                if (markType.equals("bold")) { if (mark.size() != 1) throw new IllegalArgumentException(); }
                else if (markType.equals("link")) {
                    if (mark.size() != 2 || !mark.path("attrs").isObject() || mark.path("attrs").size() != 1
                            || !mark.path("attrs").path("href").isTextual()) throw new IllegalArgumentException();
                    String href = mark.path("attrs").path("href").asText();
                    URI uri = URI.create(href);
                    if (href.length() > 2048 || !Set.of("https", "http").contains(uri.getScheme())
                            || uri.getHost() == null || uri.getUserInfo() != null || href.chars().anyMatch(c -> c <= 32 || c == 127)) throw new IllegalArgumentException();
                } else throw new IllegalArgumentException();
            }
        }
        if (type.equals("text")) {
            if (!n.path("text").isTextual() || n.has("content")) throw new IllegalArgumentException();
            return n.path("text").asText();
        }
        if (n.has("text")) throw new IllegalArgumentException();
        if (type.equals("hardBreak")) {
            if (n.has("content")) throw new IllegalArgumentException();
            return "\n";
        }
        JsonNode children = n.get("content");
        boolean textBlock = Set.of("paragraph", "heading").contains(type);
        if (children == null && textBlock) return "";
        if (children == null || !children.isArray() || (!textBlock && children.isEmpty())) throw new IllegalArgumentException();
        var parts = new java.util.ArrayList<String>();
        for (JsonNode child : children) parts.add(node(child, type, depth + 1, count));
        return String.join(Set.of("paragraph", "heading").contains(type) ? "" : "\n", parts);
    }
}
