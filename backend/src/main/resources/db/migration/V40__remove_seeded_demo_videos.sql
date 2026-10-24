-- Remove only the six historical demo records seeded by V11.
-- Videos created later by operators are intentionally untouched.
DELETE FROM videos
WHERE youtube_video_id IN (
    'rsAUMxmTB-A',
    '4XZnSW3LS44',
    'Ma-PC7906GI',
    'jmIgRlkPzSU',
    '1URXXFjjFxg',
    'svhFe5BE95c'
);
