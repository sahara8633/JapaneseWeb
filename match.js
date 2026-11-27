/* 글자 쓰기 일치율: 내가 쓴 그림과 폰트로 그린 정답 글자를 같은 크기로 맞춘 뒤, 잉크가 얼마나 겹치는지 계산해요.
   - 둘 다 잉크가 있는 영역만 잘라서 G×G 칸 가운데에 비율을 유지한 채 맞춰요(위치·크기 차이 제거).
   - 선 굵기와 손떨림 차이를 봐주려고 TOL 칸만큼 넓혀서 비교해요.
   - precision: 내가 쓴 잉크 중 정답 근처에 있는 비율, recall: 정답 잉크 중 내가 쓴 선 근처에 있는 비율, 둘의 조화평균이 raw 점수.
   획 순서와 방향은 보지 않아요.
   보정값(LO, HI)은 교과서체·명조체로 쓴 가나를 고딕체 정답과 비교해서 정했어요:
   같은 글자 raw 중앙값 0.90, 모양이 비슷한 다른 글자 0.75, 아무 다른 글자 0.58, 낙서 0.45. */
window.KanaMatch=(()=>{
 const G=64,TOL=3,LO=.5,HI=.92,FONT='"Noto Sans JP","Hiragino Sans","Yu Gothic","Meiryo",sans-serif';
 const off=document.createElement('canvas');off.width=off.height=G;
 const octx=off.getContext('2d',{willReadFrequently:true});
 const refC=document.createElement('canvas');refC.width=refC.height=360;
 const rctx=refC.getContext('2d',{willReadFrequently:true});
 const REF=new Map();

 function inkBox(c,w,h){
  const d=c.getImageData(0,0,w,h).data;let x0=w,y0=h,x1=-1,y1=-1;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  return x1<0?null:{x:x0,y:y0,w:x1-x0+1,h:y1-y0+1};
 }
 function norm(src,box){
  octx.clearRect(0,0,G,G);
  const s=(G-8)/Math.max(box.w,box.h),w=box.w*s,h=box.h*s;
  octx.drawImage(src,box.x,box.y,box.w,box.h,(G-w)/2,(G-h)/2,w,h);
  const d=octx.getImageData(0,0,G,G).data,b=new Uint8Array(G*G);
  for(let i=0;i<G*G;i++)b[i]=d[i*4+3]>30?1:0;
  return b;
 }
 function dilate(b){
  const o=new Uint8Array(G*G);
  for(let y=0;y<G;y++)for(let x=0;x<G;x++){if(!b[y*G+x])continue;
   for(let dy=-TOL;dy<=TOL;dy++)for(let dx=-TOL;dx<=TOL;dx++){if(dx*dx+dy*dy>TOL*TOL+1)continue;const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<G&&Y<G)o[Y*G+X]=1}}
  return o;
 }
 const shape=b=>({b,d:dilate(b)});
 function fromCanvas(cv){const c=cv.getContext('2d',{willReadFrequently:true}),box=inkBox(c,cv.width,cv.height);return box?shape(norm(cv,box)):null}
 function refOf(ch){
  if(REF.has(ch))return REF.get(ch);
  rctx.clearRect(0,0,360,360);rctx.fillStyle='#000';rctx.textAlign='center';rctx.textBaseline='middle';
  rctx.font=`500 ${[...ch].length>1?160:240}px ${FONT}`;rctx.fillText(ch,180,185);
  const box=inkBox(rctx,360,360),v=box?shape(norm(refC,box)):null;REF.set(ch,v);return v;
 }
 function raw(u,r){
  if(!u||!r)return 0;let ui=0,un=0,ri=0,rn=0;
  for(let i=0;i<G*G;i++){if(u.b[i]){un++;if(r.d[i])ui++}if(r.b[i]){rn++;if(u.d[i])ri++}}
  const p=un?ui/un:0,q=rn?ri/rn:0;return p+q?2*p*q/(p+q):0;
 }
 const pct=x=>Math.round(100*Math.min(1,Math.max(0,(x-LO)/(HI-LO))));
 /* answers: 정답으로 인정하는 글자들, others: 비교해 볼 다른 글자들. 그림이 비어 있으면 null */
 function compare(cv,answers,others=[]){
  const u=fromCanvas(cv);if(!u)return null;
  const best=Math.max(...answers.map(a=>raw(u,refOf(a))));
  const rival=others.filter(o=>!answers.includes(o)).map(ch=>({ch,raw:raw(u,refOf(ch))})).sort((a,b)=>b.raw-a.raw)[0]||null;
  return {raw:best,pct:pct(best),rival:rival&&{...rival,pct:pct(rival.raw)}};
 }
 // 웹폰트가 늦게 오면 그 전에 만든 정답 모양은 버리고 다시 그려요
 if(document.fonts&&document.fonts.load)document.fonts.load(`500 100px ${FONT}`,'あア').then(()=>REF.clear()).catch(()=>{});
 return {compare,fromCanvas,refOf,raw,pct};
})();
