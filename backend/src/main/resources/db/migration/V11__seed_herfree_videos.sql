-- =====================================================
-- V11: Herfree 큐레이션 유튜브 영상 시드 (6건)
-- 썸네일은 img.youtube.com 기본 이미지를 사용한다.
-- =====================================================

INSERT INTO videos (title, youtube_url, youtube_video_id, thumbnail_url, description, related_board_id, is_visible, created_at, updated_at)
VALUES ('마음을 다스리는 영상 1', 'https://www.youtube.com/watch?v=rsAUMxmTB-A', 'rsAUMxmTB-A',
        'https://img.youtube.com/vi/rsAUMxmTB-A/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6)),
       ('마음을 다스리는 영상 2', 'https://www.youtube.com/watch?v=4XZnSW3LS44', '4XZnSW3LS44',
        'https://img.youtube.com/vi/4XZnSW3LS44/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6)),
       ('마음을 다스리는 영상 3', 'https://www.youtube.com/watch?v=Ma-PC7906GI', 'Ma-PC7906GI',
        'https://img.youtube.com/vi/Ma-PC7906GI/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6)),
       ('마음을 다스리는 영상 4', 'https://www.youtube.com/watch?v=jmIgRlkPzSU', 'jmIgRlkPzSU',
        'https://img.youtube.com/vi/jmIgRlkPzSU/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6)),
       ('마음을 다스리는 영상 5', 'https://www.youtube.com/watch?v=1URXXFjjFxg', '1URXXFjjFxg',
        'https://img.youtube.com/vi/1URXXFjjFxg/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6)),
       ('마음을 다스리는 영상 6', 'https://www.youtube.com/watch?v=svhFe5BE95c', 'svhFe5BE95c',
        'https://img.youtube.com/vi/svhFe5BE95c/mqdefault.jpg', NULL, NULL, 1, NOW(6), NOW(6));
