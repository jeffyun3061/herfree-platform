import { expect,test } from '@playwright/test';
test('share crawlers receive post metadata in the HTML head and private posts remain generic',async({request})=>{
  for(const userAgent of ['kakaotalk-scrap/1.0','facebookexternalhit/1.1','Twitterbot/1.0']){
    const response=await request.get('/community/posts/11',{headers:{'User-Agent':userAgent}});
    expect(response.status()).toBe(200);
    const head=(await response.text()).match(/<head>[\s\S]*?<\/head>/)?.[0]||'';
    expect(head).toContain('property="og:title" content="같은 고민을 나눠요"');
    expect(head).toContain('property="og:description" content="로그인 후 게시글을 확인해 주세요."');
    expect(head).not.toContain('혼자 고민했던 이야기를 나눕니다.');
    expect(head).toContain('property="og:url" content="https://www.herpfree.co.kr/community/posts/11"');
    expect(head).toContain('property="og:image" content="https://www.herpfree.co.kr/brand/logo-hfree-on-primary.png"');
  }
  const protectedResponse=await request.get('/community/posts/12',{headers:{'User-Agent':'kakaotalk-scrap/1.0'}});
  expect(await protectedResponse.text()).not.toContain('같은 고민을 나눠요');
});
