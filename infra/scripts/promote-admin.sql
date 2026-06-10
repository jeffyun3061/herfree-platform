-- 운영자 이메일로 바꾼 뒤 실행한다.
-- 사용 전: 해당 계정으로 앱에서 회원가입이 완료되어 있어야 한다.

UPDATE users
SET role = 'ADMIN'
WHERE email = 'CHANGE_ME@example.com';

SELECT id, email, role, status
FROM users
WHERE email = 'CHANGE_ME@example.com';
