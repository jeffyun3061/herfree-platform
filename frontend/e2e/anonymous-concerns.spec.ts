import { expect, test, type Page } from '@playwright/test';

const boards=[{id:1,name:'공지',boardType:'NOTICE'},{id:2,name:'자유게시판',boardType:'FREE'},{id:23,name:'익명 고민·질문',boardType:'ANONYMOUS_QUESTION'}];
const detail={id:11,boardId:23,boardName:'익명 고민·질문',title:'같은 고민을 나눠요',content:'혼자 고민했던 이야기를 나눕니다.\n경험을 듣고 싶어요.',authorNickname:'익명',viewCount:1,visibility:'PUBLIC',isAnonymous:true,isMyPost:false,readable:true,imageUrl:null,staffReplied:true,authorIpMasked:null,createdAt:'2026-10-14T01:00:00Z',updatedAt:'2026-10-14T01:00:00Z'};
const post={...detail,boardType:'ANONYMOUS_QUESTION',contentPreview:'혼자 고민했던 이야기를 나눕니다.',commentCount:2,reactionCount:0};
const paged=(content:unknown[])=>({content,totalElements:content.length,totalPages:content.length?1:0,number:0,size:20,first:true,last:true});

async function fixtures(page:Page,role?:'USER'|'ADMIN') {
  let submitted:Record<string,unknown>|null=null;
  let currentDetail={...detail};
  await page.addInitScript(()=>{
    Object.defineProperty(navigator,'share',{configurable:true,value:undefined});
    Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as unknown as {sharedText:string}).sharedText=text;}}});
  });
  await page.route('**/api/**',async route=>{
    const path=new URL(route.request().url()).pathname;
    if(path==='/api/users/me'&&!role){await route.fulfill({status:401,contentType:'application/json',body:JSON.stringify({success:false,message:'인증이 필요합니다.'})});return;}
    let data:unknown={};
    if(path==='/api/users/me')data={id:1,nickname:'실제 닉네임',email:'fixture@example.invalid',role,status:'ACTIVE'};
    else if(path==='/api/boards')data=boards;
    else if(path==='/api/posts'&&route.request().method()==='POST'){
      submitted=route.request().postDataJSON();
      currentDetail={...detail,title:String(submitted?.title),content:String(submitted?.content),isMyPost:true};
      data=currentDetail;
    }
    else if(path==='/api/posts')data=paged([post]);
    else if(path==='/api/posts/11')data=currentDetail;
    else if(path==='/api/posts/11/comments')data=paged([{id:1,postId:11,authorNickname:'익명',content:'저도 비슷한 고민을 했어요.',isAnonymous:true,isMyComment:false,parentId:null,operatorReply:false,createdAt:detail.createdAt},{id:2,postId:11,authorNickname:'운영팀',content:'함께 경험을 나눠 주세요.',isAnonymous:true,isMyComment:false,parentId:null,operatorReply:true,createdAt:detail.createdAt}]);
    else if(path==='/api/admin/concerns')data=paged([post]);
    else if(path==='/api/admin/stats/overview')data={topEvents7d:[],pendingReports:0,journalRecords7d:0};
    else if(path==='/api/journal/public/home-stats')data={activeMemberCount:0,postsToday:1};
    else if(path==='/api/reactions/summary')data={totalCount:0,reactions:[]};
    await route.fulfill({status:path==='/api/posts'&&route.request().method()==='POST'?201:200,contentType:'application/json',body:JSON.stringify({success:true,data})});
  });
  return ()=>submitted;
}

test('anonymous concerns are readable without login and show genuine operator badges',async({page})=>{
  await fixtures(page);
  await page.goto('/community/23');
  await expect(page.getByRole('heading',{name:'익명 고민·질문'})).toBeVisible();
  await expect(page.getByLabel('고민·질문 검색')).toBeVisible();
  await expect(page.locator('.community-feed-row__title')).toHaveText('같은 고민을 나눠요');
  await page.getByRole('link',{name:/같은 고민을 나눠요/}).click();
  await expect(page.getByText('혼자 고민했던 이야기를 나눕니다.',{exact:false})).toBeVisible();
  await expect(page.getByText('운영자 답변',{exact:true})).toBeVisible();
  await expect(page.getByText('실제 닉네임')).toHaveCount(0);
  await expect(page.getByText('댓글을 남기려면 로그인이 필요합니다.')).toBeVisible();
  await page.getByRole('button',{name:'게시글 공유'}).click();
  await expect.poll(()=>page.evaluate(()=>(window as unknown as {sharedText:string}).sharedText)).toContain('같은 고민을 나눠요\n혼자 고민했던 이야기를 나눕니다. 경험을 듣고 싶어요.');
});

test('writing preview keeps exact line breaks and wrapping on the published post',async({page})=>{
  await fixtures(page,'USER');
  await page.goto('/community/write?boardId=23');
  const content='긴 고민을 아이폰에서 읽을 때도 입력한 줄과 문단이 그대로 보이길 바랍니다. '.repeat(3)+'\n\n\n마지막 문단도 그대로 보여야 합니다.';
  await page.locator('#title').fill('모바일 글 보기');
  await page.locator('#content').fill(content);
  const metrics=async(selector:string)=>page.locator(selector).evaluate(element=>{
    const style=getComputedStyle(element);
    return {width:element.clientWidth,fontFamily:style.fontFamily,fontSize:style.fontSize,lineHeight:style.lineHeight,letterSpacing:style.letterSpacing};
  });
  const editorMetrics=await metrics('#content');
  expect(editorMetrics.fontSize).toBe('16px');
  await page.getByRole('button',{name:'미리보기'}).click();
  const preview=page.locator('[data-testid="community-post-preview"] .hf-readable-content--community');
  await expect(preview).toHaveText(content);
  expect(await metrics('[data-testid="community-post-preview"] .hf-readable-content--community')).toEqual(editorMetrics);
  await page.getByLabel('본문이 공개되는 것을 확인했습니다.').check();
  await page.locator('button[type=submit]').last().click();
  await expect(page).toHaveURL(/\/community\/posts\/11$/);
  const published=page.locator('.hf-readable-content--community');
  await expect(published).toHaveText(content);
  expect(await metrics('.hf-readable-content--community')).toEqual(editorMetrics);
  await expect(page.getByRole('button',{name:'게시글 공유'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('narrow phones can read the thread without horizontal scrolling',async({page})=>{
  await fixtures(page);
  await page.setViewportSize({width:320,height:568});
  await page.goto('/community/23');
  await expect(page.getByRole('link',{name:'같은 고민을 나눠요'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('link',{name:'같은 고민을 나눠요'}).click();
  await expect(page.getByRole('button',{name:'게시글 공유'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

test('concern writing acknowledges public content and forces hidden nicknames',async({page})=>{
  const submitted=await fixtures(page,'USER');
  await page.goto('/community/write?boardId=23');
  await page.locator('#title').fill('나누고 싶은 고민');
  await page.locator('#content').fill('경험을 나누고 싶습니다.');
  await page.locator('button[type=submit]').last().click();
  await expect(page.getByText('본문이 공개되는 것을 확인해 주세요.')).toBeVisible();
  expect(submitted()).toBeNull();
  await expect(page.getByText('닉네임 비공개로 작성됩니다.')).toBeVisible();
  await page.getByLabel('본문이 공개되는 것을 확인했습니다.').check();
  await page.locator('button[type=submit]').last().click();
  await expect.poll(submitted).toMatchObject({isAnonymous:true,visibility:'PUBLIC',publicDisclosureAccepted:true});
});

test('operators have a concern queue and can open the public reply thread',async({page})=>{
  await fixtures(page,'ADMIN');
  await page.goto('/admin?tab=concerns');
  await expect(page.getByRole('button',{name:'운영자 답변 완료',exact:true})).toBeVisible();
  await page.getByRole('link',{name:/글 열고 답변하기/}).click();
  await expect(page.getByText('닉네임은 비공개이며 댓글 내용은 공개됩니다.',{exact:false})).toBeVisible();
});
