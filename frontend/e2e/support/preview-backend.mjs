import { createServer } from 'node:http';
const server=createServer((request,response)=>{
  const publicPost=request.url==='/api/posts/11/share-preview';
  response.writeHead(publicPost?200:404,{'Content-Type':'application/json','Cache-Control':'no-store'});
  response.end(JSON.stringify(publicPost?{success:true,data:{id:11,title:'같은 고민을 나눠요',description:'혼자 고민했던 이야기를 나눕니다. 경험을 듣고 싶어요.',boardType:'ANONYMOUS_QUESTION'}}:{success:false}));
});
server.listen(Number(process.env.PREVIEW_BACKEND_PORT||3199),'127.0.0.1');
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>server.close(()=>process.exit(0)));
