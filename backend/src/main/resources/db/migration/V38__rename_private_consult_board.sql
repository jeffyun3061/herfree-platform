-- Public copy already calls this board "상담문의". Keep the persisted board
-- label consistent and make the non-medical scope explicit for new installs and
-- existing production databases.
UPDATE boards
SET name = '상담문의',
    description = '서비스 이용·운영·신고 등 운영팀에 전달하는 비공개 문의입니다. 의료 진단·처방·치료 상담은 제공하지 않습니다.',
    updated_at = NOW(6)
WHERE board_type = 'PRIVATE_CONSULT';
