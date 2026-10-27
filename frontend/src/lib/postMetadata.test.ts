import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadPublicPostPreview, publicPostMetadata } from './postMetadata';

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });
describe('anonymous server share metadata', () => {
  it('fetches only the public preview without visitor credentials or caching', async () => {
    vi.stubEnv('API_REWRITE_TARGET', 'https://api.example.test');
    const fetchMock = vi.fn().mockResolvedValue({ok: true, json: async () => ({success: true, data: {id:11,title:'고민 제목',description:'본문 첫 부분',boardType:'FREE',mode:'FULL',authorNickname:'must-not-be-exported'}})});
    vi.stubGlobal('fetch', fetchMock);
    const preview = await loadPublicPostPreview('11');
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/api/posts/11/share-preview', expect.objectContaining({cache:'no-store',headers:{Accept:'application/json'},redirect:'error'}));
    const metadata = publicPostMetadata('11', preview);
    expect(metadata.openGraph).toMatchObject({title:'고민 제목',description:'본문 첫 부분',url:'https://www.herpfree.co.kr/community/posts/11'});
    expect(JSON.stringify(metadata)).not.toContain('must-not-be-exported');
    expect(metadata.openGraph).toMatchObject({ images: [{ url: '/brand/logo-hfree-on-primary.png', width: 512, height: 512 }] });
  });
  it('exposes only the opted-in member title and keeps its content out of social metadata', async () => {
    vi.stubEnv('API_REWRITE_TARGET', 'https://api.example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async()=>({success:true,data:{id:12,title:'선택한 제목',description:'민감한 본문',boardType:'FREE',mode:'TITLE_ONLY'}})}));
    const metadata = publicPostMetadata('12', await loadPublicPostPreview('12'));
    expect(metadata.openGraph).toMatchObject({title:'선택한 제목',description:'로그인하면 글을 볼 수 있어요.'});
    expect(JSON.stringify(metadata)).not.toContain('민감한 본문');
    expect(metadata.robots).toEqual({index:false,follow:false});
  });
  it.each(['INQUIRY','PRIVATE_CONSULT','SECRET_STORY'])('refuses private %s data even from a malformed upstream response', async boardType => {
    vi.stubEnv('API_REWRITE_TARGET', 'https://api.example.test');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ok:true,json:async()=>({success:true,data:{id:1,title:'private-title',description:'private-body',boardType,mode:'TITLE_ONLY'}})}));
    const preview = await loadPublicPostPreview('1'); expect(preview).toBeNull();
    expect(JSON.stringify(publicPostMetadata('1', preview))).not.toContain('private-');
  });
  it('fails closed for invalid identifiers and unavailable/deleted posts', async () => {
    const fetchMock=vi.fn().mockRejectedValue(new Error('unavailable'));vi.stubGlobal('fetch', fetchMock);
    expect(await loadPublicPostPreview('../private')).toBeNull();expect(fetchMock).not.toHaveBeenCalled();
    vi.stubEnv('API_REWRITE_TARGET', 'https://api.example.test');expect(await loadPublicPostPreview('1')).toBeNull();
    expect(publicPostMetadata('1', null).robots).toEqual({index:false,follow:false});
    expect(publicPostMetadata('1', null).title).toEqual({absolute:'헤르프리'});
  });
});
