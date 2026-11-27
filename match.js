/* 글자 쓰기 일치율: 내가 쓴 그림과 정답 글자를 같은 크기로 맞춘 뒤, 선이 얼마나 겹치는지 계산해요.
   - 정답 모양은 손글씨 획순 데이터(KanjiVG, kana-strokes.js)를 펜 선으로 그려서 만들어요. 데이터가 없으면 폰트로 그려요.
   - 둘 다 잉크가 있는 영역만 잘라서 G×G 칸 가운데에 비율을 유지한 채 맞춰요(위치·크기 차이 제거).
   - 선 굵기와 손떨림 차이를 봐주려고 TOL 칸만큼 넓혀서 비교해요.
   - precision: 내가 쓴 선 중 정답 근처에 있는 비율, recall: 정답 선 중 내가 쓴 선 근처에 있는 비율, 둘의 조화평균이 raw 점수.
   획 순서와 방향은 보지 않아요.
   보정값은 획마다 위치·크기·기울기를 흔들고 가로세로 비율도 ±30% 바꾼 '손글씨 흉내'(히라가나 71자)와
   인쇄체처럼 쓴 글씨(교과서체·고딕체)로 정했어요. 정답 모양은 손글씨 획과 인쇄체 두 가지 중 더 닮은 쪽을 써요.
   손글씨는 폭이 제각각이라(넓적한 う, 납작한 と) 가로세로를 각각 칸에 꽉 채워서 비교해요(asp 1).
   tol 4.2칸, 정답 펜 굵기 24(327px 글자 기준), raw 0.62 → 0%, 0.95 → 100%. 통과 기준은 script.js에 있어요. */
window.KanaMatch=(()=>{
 const G=64,FONT='"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';
 const P={tol:4.2,tol2:4.21,lo:.62,hi:.95,w:24,asp:1,font:true,beta:1};
 // 탁점·반탁점(゛゜)을 뗀 글자: が → か
 const plain=s=>s.normalize('NFD').replace(/[゙゚]/g,'').normalize('NFC');
 const off=document.createElement('canvas');off.width=off.height=G;
 const octx=off.getContext('2d',{willReadFrequently:true});
 const refC=document.createElement('canvas');
 const rctx=refC.getContext('2d',{willReadFrequently:true});
 const REF=new Map();

 function inkBox(c,w,h){
  const d=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
 }
 /* 가로세로 비율: asp 0이면 비율 유지, 1이면 가로세로를 각각 칸에 꽉 채워요. 손글씨는 폭이 제각각이라 중간쯤이 잘 맞아요. */
 function norm(src,box){
  octx.clearRect(0,0,G,G);
  const s=(G-8)/Math.max(box.w,box.h),fx=(G-8)/box.w,fy=(G-8)/box.h,a=P.asp,w=box.w*s*Math.pow(fx/s,a),h=box.h*s*Math.pow(fy/s,a);
  octx.drawImage(src,box.x,box.y,box.w,box.h,(G-w)/2,(G-h)/2,w,h);
  const d=octx.getImageData(0,0,G,G).data,b=new Uint8Array(G*G);
  for(let i=0;i<G*G;i++)b[i]=d[i*4+3]>30?1:0;
  return b;
 }
 /* 칸마다 가장 가까운 잉크까지의 거리(두 번 훑는 chamfer 거리, 단위: 칸). 거리가 tol 이하면 만점,
    tol2까지 점점 줄어서 0점이 돼요. 딱 잘라 자르지 않으니 조금 비껴 쓴 선도 부분 점수를 받아요. */
 function distMap(b){
  const INF=1e4,d=new Float32Array(G*G);for(let i=0;i<G*G;i++)d[i]=b[i]?0:INF;
  const at=(x,y)=>x<0||y<0||x>=G||y>=G?INF:d[y*G+x];
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){const i=y*G+x;d[i]=Math.min(d[i],at(x-1,y)+1,at(x,y-1)+1,at(x-1,y-1)+1.414,at(x+1,y-1)+1.414)}
  for(let y=G-1;y>=0;y--)for(let x=G-1;x>=0;x--){const i=y*G+x;d[i]=Math.min(d[i],at(x+1,y)+1,at(x,y+1)+1,at(x+1,y+1)+1.414,at(x-1,y+1)+1.414)}
  return d;
 }
 const credit=d=>d<=P.tol?1:d>=P.tol2?0:(P.tol2-d)/(P.tol2-P.tol);
 const shape=b=>({b,d:distMap(b)});
 function fromCanvas(cv){const c=cv.getContext('2d',{willReadFrequently:true}),box=inkBox(c,cv.width,cv.height);return box?shape(norm(cv,box)):null}
 /* 획순 데이터로 글자를 펜 선처럼 그려요. jitter(획 번호)를 주면 획마다 조금씩 흔들어 그려요(보정용). */
 function drawStrokes(ctx,ch,{scale=3,width=8,jitter=null}={}){
  const S=window.STROKES||{},chars=[...ch];
  if(!chars.every(c=>S[c]))return false;
  ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle='#000';ctx.lineWidth=width;
  chars.forEach((c,ci)=>{
   S[c].p.forEach((d,si)=>{
    ctx.save();ctx.translate(ci*109*scale*.92,0);ctx.scale(scale,scale);
    if(jitter){const j=jitter(si);ctx.translate(54.5+j.dx,54.5+j.dy);ctx.rotate(j.rot);ctx.scale(j.sx,j.sy);ctx.translate(-54.5,-54.5)}
    ctx.lineWidth=width/scale;ctx.stroke(new Path2D(d));ctx.restore();
   });
  });
  return true;
 }
 /* 정답 모양은 두 가지예요: 손글씨 획(KanjiVG)과 인쇄체(폰트). さ·き·そ·ふ처럼 손글씨와 인쇄체가 다른 글자는
    사람마다 쓰는 방식이 달라서, 둘 중 더 닮은 쪽으로 채점해요. */
 function shapeOfCanvas(){const box=inkBox(rctx,refC.width,refC.height);return box?shape(norm(refC,box)):null}
 function refOf(ch){
  if(REF.has(ch))return REF.get(ch);
  const n=[...ch].length,out=[];refC.width=Math.ceil(109*3*(1+.92*(n-1)))+20;refC.height=109*3+20;
  rctx.clearRect(0,0,refC.width,refC.height);rctx.save();rctx.translate(10,10);
  const ok=drawStrokes(rctx,ch,{width:P.w});rctx.restore();
  if(ok)out.push(shapeOfCanvas());
  if(P.font||!ok){
   rctx.clearRect(0,0,refC.width,refC.height);rctx.fillStyle='#000';rctx.textAlign='center';rctx.textBaseline='middle';
   rctx.font=`500 ${n>1?150:240}px ${FONT}`;rctx.fillText(ch,refC.width/2,refC.height/2+5);out.push(shapeOfCanvas());
  }
  const v=out.filter(Boolean);REF.set(ch,v);return v;
 }
 function raw(u,r){
  if(Array.isArray(r))return r.reduce((m,x)=>Math.max(m,raw(u,x)),0);
  if(!u||!r)return 0;let ui=0,un=0,ri=0,rn=0;
  for(let i=0;i<G*G;i++){if(u.b[i]){un++;ui+=credit(r.d[i])}if(r.b[i]){rn++;ri+=credit(u.d[i])}}
  const p=un?ui/un:0,q=rn?ri/rn:0,b2=P.beta*P.beta;return p+q?(1+b2)*p*q/(b2*p+q):0;
 }
 const pct=x=>Math.round(100*Math.min(1,Math.max(0,(x-P.lo)/(P.hi-P.lo))));
 /* answers: 정답으로 인정하는 글자들, others: 비교해 볼 다른 글자들. 그림이 비어 있으면 null */
 /* rival.close: 그 글자가 정답과 탁점·반탁점만 다른 글자인지 (と↔ど). 점은 작아서 흔들림에 크게 좌우돼요.
    noDot: 정답에 ゛゜가 있는데, 점을 뗀 글자(か)와 더 닮았으면 true. 손글씨 흉내에서 점을 빼먹은 경우는 모두 -0.05 아래였어요. */
 function compare(cv,answers,others=[]){
  const u=fromCanvas(cv);if(!u)return null;
  const scored=answers.map(a=>({a,raw:raw(u,refOf(a))})).sort((x,y)=>y.raw-x.raw),top=scored[0];
  // 정답에 ゛゜가 없으면 ゛゜가 있는 글자(だ 등)와는 비교하지 않아요. 점 없이 쓴 글씨가 점 있는 글자로 보일 이유가 없어서요.
  const dotted=plain(top.a)!==top.a;
  const rival=others.filter(o=>!answers.includes(o)&&(dotted||plain(o)===o)).map(ch=>({ch,raw:raw(u,refOf(ch))})).sort((a,b)=>b.raw-a.raw)[0]||null;
  const bare=plain(top.a),noDot=bare!==top.a&&top.raw-raw(u,refOf(bare))< -.03;
  return {raw:top.raw,pct:pct(top.raw),noDot,rival:rival&&{...rival,pct:pct(rival.raw),close:plain(rival.ch)===bare}};
 }
 if(document.fonts&&document.fonts.load)document.fonts.load(`500 100px ${FONT}`,'あア').then(()=>REF.clear()).catch(()=>{});
 /* 정답 모양을 미리 만들어 둬요(폰에서 처음 채점할 때 멈추지 않게). 조금씩 나눠서 해요. */
 function warm(chars){let i=0;const step=()=>{const t=performance.now();while(i<chars.length&&performance.now()-t<12)refOf(chars[i++]);if(i<chars.length)setTimeout(step,0)};step()}
 return {compare,fromCanvas,refOf,raw,pct,drawStrokes,warm,_tune:o=>{Object.assign(P,o);REF.clear()}};
})();
