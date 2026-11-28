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

/* 획 단위 인식: 내가 그은 선 하나하나를 손글씨 획순 데이터(KanjiVG)의 획과 비교해요.
   - 글자 전체를 같은 칸에 맞춘 뒤(가로세로 비율은 절반만 맞춰요), 획마다 같은 간격으로 N개 점을 찍어요.
   - 두 획의 거리 = 점끼리 평균 거리 + 방향 차이. 거꾸로 그은 획도 조금만 감점해요.
   - 획 순서가 달라도 되도록, 내 획과 정답 획을 가장 잘 맞는 짝으로 묶어요(남거나 빠진 획은 감점).
   - 모든 후보 글자와 비교해서 정답이 가장 가깝거나 거의 같으면 정답이에요.
   픽셀이 얼마나 겹치는지 보는 방식보다 글자 비율·간격 차이(넓적한 く, 떨어진 ら의 점, 멀리 찍은 ゛)에 훨씬 덜 민감해요. */
window.StrokeMatch=(()=>{
 const N=20,Q={asp:1,wDir:.35,miss:.5,rev:.08,lo:.1,hi:.45};
 const NS='http://www.w3.org/2000/svg';let host=null;
 const pathEl=d=>{if(!host){host=document.createElementNS(NS,'svg');host.setAttribute('width','0');host.setAttribute('height','0');host.setAttribute('aria-hidden','true');host.style.cssText='position:absolute;left:-9999px;top:0;visibility:hidden';document.body.append(host)}const p=document.createElementNS(NS,'path');p.setAttribute('d',d);host.append(p);return p};
 const len=pts=>{let L=0;for(let i=1;i<pts.length;i++)L+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);return L};
 function resample(pts){
  if(pts.length<2)return Array.from({length:N},()=>pts[0].slice());
  const L=len(pts);if(!L)return Array.from({length:N},()=>pts[0].slice());
  const out=[pts[0].slice()],step=L/(N-1);let acc=0,i=1,prev=pts[0];
  while(out.length<N-1&&i<pts.length){
   const cur=pts[i],d=Math.hypot(cur[0]-prev[0],cur[1]-prev[1]);
   if(acc+d>=step&&d>0){const t=(step-acc)/d,q=[prev[0]+t*(cur[0]-prev[0]),prev[1]+t*(cur[1]-prev[1])];out.push(q);prev=q;acc=0}
   else{acc+=d;prev=cur;i++}
  }
  while(out.length<N)out.push(pts[pts.length-1].slice());
  return out;
 }
 /* 획 묶음을 글자 단위로 정규화: 가운데를 0으로, 긴 변 기준 크기 1, 가로세로 비율은 asp만큼만 맞춰요 */
 function prep(strokes){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  strokes.forEach(s=>s.forEach(([x,y])=>{if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}));
  const w=x1-x0,h=y1-y0,M=Math.max(w,h)||1,a=Q.asp,cx=(x0+x1)/2,cy=(y0+y1)/2;
  const sx=1/((1-a)*M+a*Math.max(w,M*.2)),sy=1/((1-a)*M+a*Math.max(h,M*.2));
  return strokes.map(s=>{const p=resample(s.map(([x,y])=>[(x-cx)*sx,(y-cy)*sy]));return {p,w:Math.min(1,Math.max(.3,len(p)/.8))}});
 }
 const REF=new Map();
 function ref(ch){
  if(REF.has(ch))return REF.get(ch);
  const S=window.STROKES||{},cs=[...ch];
  if(!cs.every(c=>S[c])){REF.set(ch,null);return null}
  const raw=[];
  cs.forEach((c,ci)=>S[c].p.forEach(d=>{const el=pathEl(d),L=el.getTotalLength(),pts=[];for(let i=0;i<=40;i++){const q=el.getPointAtLength(L*i/40);pts.push([q.x+ci*109*.92,q.y])}el.remove();raw.push(pts)}));
  const v=prep(raw);REF.set(ch,v);return v;
 }
 function sdist(u,r){
  let pos=0,dir=0;
  for(let i=0;i<N;i++)pos+=Math.hypot(u[i][0]-r[i][0],u[i][1]-r[i][1]);
  for(let i=0;i<N-1;i++){
   const ux=u[i+1][0]-u[i][0],uy=u[i+1][1]-u[i][1],rx=r[i+1][0]-r[i][0],ry=r[i+1][1]-r[i][1],nu=Math.hypot(ux,uy),nr=Math.hypot(rx,ry);
   dir+=nu&&nr?(1-(ux*rx+uy*ry)/(nu*nr))/2:.25;
  }
  return pos/N+Q.wDir*dir/(N-1);
 }
 const pairCost=(u,r)=>Math.min(sdist(u.p,r.p),sdist(u.p.slice().reverse(),r.p)+Q.rev);
 /* 획 짝짓기: 정답 획 집합(비트마스크)에 대한 동적 계획법. 남는 내 획, 빠진 정답 획은 miss×획 길이 가중치만큼 감점 */
 function dist(U,R){
  // 획 길이 가중치(w)로 비용을 매겨서, 탁점 같은 짧은 획은 조금만 영향을 줘요
  const n=U.length,m=R.length,C=U.map(u=>R.map(r=>pairCost(u,r)*(u.w+r.w)/2));
  let dp=new Map([[0,0]]);
  for(let i=0;i<n;i++){
   const nx=new Map(),put=(k,v)=>{if(!nx.has(k)||nx.get(k)>v)nx.set(k,v)};
   for(const [mask,c] of dp){put(mask,c+Q.miss*U[i].w);for(let j=0;j<m;j++)if(!(mask&1<<j))put(mask|1<<j,c+C[i][j])}
   dp=nx;
  }
  let best=1e9;for(const [mask,c] of dp){let t=c;for(let j=0;j<m;j++)if(!(mask&1<<j))t+=Q.miss*R[j].w;if(t<best)best=t}
  return best/Math.max(U.reduce((a,x)=>a+x.w,0),R.reduce((a,x)=>a+x.w,0));
 }
 const pct=d=>Math.round(100*Math.min(1,Math.max(0,(Q.hi-d)/(Q.hi-Q.lo))));
 /* userStrokes: [[[x,y],...],...]. answers: 정답으로 인정하는 글자들, others: 함께 비교할 글자들 */
 function recognize(userStrokes,answers,others=[]){
  const strokes=userStrokes.filter(s=>s.length);
  if(!strokes.length)return null;
  if(!answers.every(a=>ref(a)))return undefined;
  const U=prep(strokes),score=ch=>{const R=ref(ch);return R?dist(U,R):1e9};
  const top=answers.map(a=>({ch:a,d:score(a)})).sort((x,y)=>x.d-y.d)[0];
  const rival=others.filter(o=>!answers.includes(o)).map(ch=>({ch,d:score(ch)})).sort((x,y)=>x.d-y.d)[0]||null;
  return {d:top.d,pct:pct(top.d),answer:top.ch,rival:rival&&{...rival,pct:pct(rival.d)}};
 }
 function warm(chars){let i=0;const step=()=>{const t=performance.now();while(i<chars.length&&performance.now()-t<12)ref(chars[i++]);if(i<chars.length)setTimeout(step,0)};step()}
 return {recognize,ref,prep,dist,pct,warm,_tune:o=>{Object.assign(Q,o)}};
})();
