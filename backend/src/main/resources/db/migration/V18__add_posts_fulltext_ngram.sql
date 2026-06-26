-- 한국어 2글자 단위 검색: MySQL ngram FULLTEXT (ADR-016)
ALTER TABLE posts
    ADD FULLTEXT INDEX ft_posts_title_content_ngram (title, content) WITH PARSER ngram;
