import { expect, test, type Page } from '@playwright/test';

const boards=[{id:1,name:'공지',boardType:'NOTICE'},{id:2,name:'자유게시판',boardType:'FREE'},{id:23,name:'익명 고민',boardType:'ANONYMOUS_QUESTION'}];
const detail={id:11,boardId:23,boardName:'익명 고민',title:'같은 고민을 나눠요',content:'혼자 고민했던 이야기를 나눕니다.\n경험을 듣고 싶어요.',authorNickname:'익명',viewCount:1,visibility:'PUBLIC',isAnonymous:true,isMyPost:false,readable:true,imageUrl:null,staffReplied:true,createdAt:'2026-10-14T01:00:00Z',updatedAt:'2026-10-14T01:00:00Z'};
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
  await expect(page.getByRole('heading',{name:'익명 고민'})).toBeVisible();
  await expect(page.getByLabel('고민 검색')).toBeVisible();
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
  await expect(page.getByRole('tab',{name:'익명 고민'})).toBeVisible();
  await expect(page.getByRole('link',{name:'같은 고민을 나눠요'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  await page.getByRole('link',{name:'같은 고민을 나눠요'}).click();
  await expect(page.getByRole('button',{name:'게시글 공유'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
});

for (const width of [320, 390, 768, 1280]) {
  test(`community tabs and rows stay compact at ${width}px`,async({page})=>{
    await fixtures(page);
    await page.setViewportSize({width,height:800});
    await page.goto('/community/23');
    const tab=page.getByRole('tab',{name:'익명 고민'});
    await expect(tab).toBeVisible();
    expect(await tab.evaluate(element=>element.scrollHeight<=element.clientHeight)).toBe(true);
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
    const row=page.locator('.community-feed-row').first();
    const tag=row.locator('.community-feed-tag');
    const title=row.locator('.community-feed-row__title');
    await expect(title).toBeVisible();
    const tagBox=await tag.boundingBox();
    const titleBox=await title.boundingBox();
    expect(tagBox).not.toBeNull();
    expect(titleBox).not.toBeNull();
    expect(Math.abs(tagBox!.y-titleBox!.y)).toBeLessThan(12);
    if(process.env.UI_CAPTURE) await page.screenshot({path:`test-results/community-${width}.png`,fullPage:true});
    await expect(tab).toHaveAttribute('aria-selected','true');
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  });
}

test('mixed-board mobile feed remains readable with several posts',async({page})=>{
  await fixtures(page,'USER');
  const titles=['개인일지 이용 안내','커뮤니티 이용수칙 함께 지켜주세요','헤르프리 홈페이지를 시작합니다','국내 라이신 영양제 3종 비교표','고지 성공했습니다','고지 두려움','가입인사','첫글은 제가 올려볼게요'];
  await page.route('**/api/posts?**',async route=>{
    const content=titles.map((title,index)=>({...post,id:index+20,title,boardType:index<3?'NOTICE':index===3?'EXPERIENCE':'FREE',boardName:index<3?'공지':index===3?'정보공유':'자유게시판',authorNickname:index<4?'헤르프리':'익명'}));
    await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:paged(content)})});
  });
  await page.setViewportSize({width:390,height:844});
  await page.goto('/community');
  await expect(page.locator('.community-feed-row__title')).toHaveCount(titles.length);
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
  if(process.env.UI_CAPTURE) await page.screenshot({path:'test-results/community-feed-390.png',fullPage:true});
});

test('later board tabs scroll into view when selected on a phone',async({page})=>{
  await fixtures(page,'USER');
  await page.route('**/api/boards',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:[
    ...boards,
    {id:24,name:'정보공유',boardType:'EXPERIENCE'},
    {id:25,name:'연애고지',boardType:'RELATIONSHIP'},
    {id:26,name:'검사대기',boardType:'PHOBIA'},
  ]})}));
  await page.setViewportSize({width:320,height:700});
  await page.goto('/community/23');
  const lastTab=page.getByRole('tab',{name:'검사대기'});
  await lastTab.click();
  await expect(lastTab).toHaveAttribute('aria-selected','true');
  expect(await lastTab.evaluate(element=>{
    const bounds=element.getBoundingClientRect();
    const viewport=element.parentElement!.getBoundingClientRect();
    return bounds.left>=viewport.left && bounds.right<=viewport.right;
  })).toBe(true);
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

test('any signed-in member can choose anonymous or named answers',async({page})=>{
  await fixtures(page,'USER');
  const answers:Record<string,unknown>[]=[];
  await page.route('**/api/posts/11/comments',async route=>{
    if(route.request().method()!=='POST') return route.fallback();
    const answer=route.request().postDataJSON() as Record<string,unknown>;
    answers.push(answer);
    await route.fulfill({status:201,contentType:'application/json',body:JSON.stringify({success:true,data:{id:answers.length+2,postId:11,authorNickname:answer.isAnonymous?'익명(나)':'실제 닉네임',content:answer.content,isAnonymous:answer.isAnonymous,parentId:null,isMyComment:true,operatorReply:false,createdAt:detail.createdAt}})});
  });
  await page.goto('/community/posts/11');
  await expect(page.getByRole('radio',{name:'익명'})).toBeChecked();
  await page.getByPlaceholder('답변을 남겨 주세요.').fill('익명 답변');
  await page.getByRole('button',{name:'답변 등록'}).click();
  await expect.poll(()=>answers.length).toBe(1);
  expect(answers[0]).toMatchObject({content:'익명 답변',isAnonymous:true});
  await page.getByText('닉네임 공개',{exact:true}).click();
  await expect(page.getByRole('radio',{name:'닉네임 공개'})).toBeChecked();
  await page.getByPlaceholder('답변을 남겨 주세요.').fill('공개 답변');
  await page.getByRole('button',{name:'답변 등록'}).click();
  await expect.poll(()=>answers.length).toBe(2);
  expect(answers[1]).toMatchObject({content:'공개 답변',isAnonymous:false});
  await page.getByRole('button',{name:'답글',exact:true}).first().click();
  await expect(page.getByRole('radio',{name:'익명'})).toBeChecked();
  await page.getByText('닉네임 공개',{exact:true}).click();
  await page.getByPlaceholder(/답글을 남겨 주세요/).fill('공개 대댓글');
  await page.getByRole('button',{name:'답글 등록'}).click();
  await expect.poll(()=>answers.length).toBe(3);
  expect(answers[2]).toMatchObject({content:'공개 대댓글',isAnonymous:false,parentId:1});
});

test('question author cannot reveal their nickname in comments or nested replies',async({page})=>{
  await fixtures(page,'USER');
  await page.route('**/api/posts/11',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify({success:true,data:{...detail,isMyPost:true}})}));
  await page.goto('/community/posts/11');
  await expect(page.getByText('글쓴이의 답변과 대댓글은 닉네임 비공개로 표시됩니다.',{exact:false})).toBeVisible();
  await expect(page.getByRole('radio',{name:'닉네임 공개'})).toHaveCount(0);
  await page.getByRole('button',{name:'답글',exact:true}).first().click();
  await expect(page.getByRole('radio',{name:'닉네임 공개'})).toHaveCount(0);
});

test('operators have a concern queue and can open the public reply thread',async({page})=>{
  await fixtures(page,'ADMIN');
  await page.goto('/admin?tab=concerns');
  await expect(page.getByRole('button',{name:'운영자 답변 완료',exact:true})).toBeVisible();
  await page.getByRole('link',{name:/글 열고 답변하기/}).click();
  await expect(page.getByRole('radio',{name:'익명'})).toBeChecked();
  await expect(page.getByRole('radio',{name:'닉네임 공개'})).toBeVisible();
});
