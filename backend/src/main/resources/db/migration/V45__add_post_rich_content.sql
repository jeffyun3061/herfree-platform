-- Preserve existing plain text; optional validated document data is only added for newly formatted posts.
ALTER TABLE posts ADD COLUMN rich_content LONGTEXT NULL;
