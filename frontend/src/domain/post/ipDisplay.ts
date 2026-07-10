/** 커뮤니티 게시글 작성자 IP 마스킹 표시 */
export function formatAuthorIpLabel(authorIpMasked: string | null | undefined): string | null {
  if (!authorIpMasked?.trim()) return null;
  if (authorIpMasked === 'local') return 'IP local';
  return `IP ${authorIpMasked}`;
}
