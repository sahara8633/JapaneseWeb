{
const P=s=>s.split(' ').map(x=>{const [k,r]=x.split(':');return {k,r}});
const BASE=P('あ:아 い:이 う:우 え:에 お:오 か:카 き:키 く:쿠 け:케 こ:코 さ:사 し:시 す:스 せ:세 そ:소 た:타 ち:치 つ:츠 て:테 と:토 な:나 に:니 ぬ:누 ね:네 の:노 は:하 ひ:히 ふ:후 へ:헤 ほ:호 ま:마 み:미 む:무 め:메 も:모 や:야 ゆ:유 よ:요 ら:라 り:리 る:루 れ:레 ろ:로 わ:와 を:오 ん:응');
const DAK=P('が:가 ぎ:기 ぐ:구 げ:게 ご:고 ざ:자 じ:지 ず:즈 ぜ:제 ぞ:조 だ:다 ぢ:지 づ:즈 で:데 ど:도 ば:바 び:비 ぶ:부 べ:베 ぼ:보 ぱ:파 ぴ:피 ぷ:푸 ぺ:페 ぽ:포');
const YOON=P('きゃ:캬 きゅ:큐 きょ:쿄 しゃ:샤 しゅ:슈 しょ:쇼 ちゃ:차 ちゅ:추 ちょ:초 にゃ:냐 にゅ:뉴 にょ:뇨 ひゃ:햐 ひゅ:휴 ひょ:효 みゃ:먀 みゅ:뮤 みょ:묘 りゃ:랴 りゅ:류 りょ:료 ぎゃ:갸 ぎゅ:규 ぎょ:교 じゃ:쟈 じゅ:쥬 じょ:죠 びゃ:뱌 びゅ:뷰 びょ:뵤 ぴゃ:퍄 ぴゅ:퓨 ぴょ:표');
/* kana that look alike, separately for each script */
const LOOK={'ぬ':'めね','め':'ぬあの','ね':'れわぬ','れ':'ねわ','わ':'ねれ','る':'ろ','ろ':'る','さ':'ちき','ち':'さら','き':'さ','は':'ほけ','ほ':'はま','い':'りこ','り':'い','あ':'おめ','お':'あ','し':'つ','つ':'しう','う':'つら','ら':'うち','ま':'もほ','も':'ま','こ':'い','け':'は','な':'た','た':'な','の':'め','ぱ':'ば','ば':'ぱ','ぴ':'び','び':'ぴ','ぷ':'ぶ','ぶ':'ぷ','ぺ':'べ','べ':'ぺ','ぽ':'ぼ','ぼ':'ぽ','ず':'づ','づ':'ず','じ':'ぢ','ぢ':'じ','そ':'て','て':'そ','く':'へ','へ':'く'};
const LOOKK={'シ':'ツミ','ツ':'シソ','ソ':'ンリ','ン':'ソノ','ノ':'ンメ','ク':'ケタワ','ケ':'ク','タ':'ク','ワ':'ウクフ','ウ':'ワラ','フ':'ワヲ','ヲ':'フヨ','ラ':'ウヲ','ヨ':'ユコ','ユ':'ヨコ','コ':'ユロ','ロ':'コ','ア':'マヤ','マ':'アム','ム':'マ','ヤ':'セア','セ':'ヤサ','サ':'セキ','キ':'サチ','チ':'テキ','テ':'チナ','ナ':'メテ','メ':'ナノヌ','ヌ':'メス','ス':'ヌネ','ネ':'スホ','ホ':'ネオ','オ':'ホ','ハ':'ル','ル':'レハ','レ':'ル','エ':'ユコ','ニ':'コエ','イ':'ト','ト':'イヒ','ヒ':'ト','リ':'ソ','パ':'バ','バ':'パ','ピ':'ビ','ビ':'ピ','プ':'ブ','ブ':'プ','ペ':'ベ','ベ':'ペ','ポ':'ボ','ボ':'ポ','ズ':'ヅ','ヅ':'ズ','ジ':'ヂ','ヂ':'ジ'};
const ALL=[...BASE,...DAK,...YOON];
const RD={};ALL.forEach(x=>{if(!RD[x.k])RD[x.k]=x.r});
const YOON_R=new Set(YOON.map(x=>x.r));
/* kana that sound the same: お·を 오, じ·ぢ 지, ず·づ 즈. The first one is the usual spelling. */
const SAME={};ALL.forEach(x=>{(SAME[x.r]=SAME[x.r]||[]).push(x.k)});
const toK=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x3041&&n<=0x3096?String.fromCharCode(n+0x60):c}).join('');
const toH=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x30A1&&n<=0x30F6?String.fromCharCode(n-0x60):c}).join('');
const isKata=s=>/[ァ-ヶ]/.test(s);
const WORDS=window.WORDS||{},LV=['N5','N4','N3','N2','N1'];
const WMAP={};LV.forEach(l=>(WORDS[l]||[]).forEach(x=>{WMAP[x.w]=x}));
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toLocaleDateString('sv');

/* records */
const KEY='kana-daily-v1';
let store={days:{},miss:{},wmiss:{},known:{},resets:{}};
try{const t=JSON.parse(localStorage.getItem(KEY)||'null');if(t&&t.days)store=Object.assign({miss:{},wmiss:{},known:{},resets:{}},t)}catch(e){}
let cloud=null,wTimer=0,writing=Promise.resolve();
const pushCloud=()=>{if(!cloud)return;clearTimeout(wTimer);wTimer=setTimeout(()=>{const body=JSON.parse(JSON.stringify(store));writing=writing.then(()=>cloud.set(body)).catch(()=>{})},1500)};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}pushCloud()};
/* 두 기록 합치기. resets에는 종류별로 마지막으로 지운 시각이 있어요:
   한쪽이 더 나중에 지웠으면 그 종류는 그쪽 기록만 남겨서, 지운 기록이 다른 기기나 계정에서 되살아나지 않아요. */
const CATS={days:()=>true,miss:k=>k.length<=3,wmiss:k=>k.length<=20,known:k=>k.length<=20};
const merge=(a,b)=>{
 const o={days:{},miss:{},wmiss:{},known:{},resets:{}};
 for(const [cat,ok] of Object.entries(CATS)){
  const ra=(a.resets||{})[cat]||0,rb=(b.resets||{})[cat]||0;o.resets[cat]=Math.max(ra,rb);
  for(const s of [a,b]){
   // 이쪽이 지우기 전 기록이면, 지운 뒤에 생긴 것(날짜가 지운 날 이후인 기록, 지운 뒤에 익힌 단어)만 남겨요
   const stale=((s===a)?ra:rb)<o.resets[cat],cut=o.resets[cat],cutDay=new Date(cut).toLocaleDateString('sv');
   if(stale&&(cat==='miss'||cat==='wmiss'))continue;
   for(const [k,v] of Object.entries(s[cat]||{})){
    if(typeof v!=='number'||!ok(k))continue;
    if(stale&&(cat==='days'?k<=cutDay:Math.abs(v)<=cut))continue;
    if(cat==='known'){if(Math.abs(v)>Math.abs(o.known[k]||0))o.known[k]=v}
    else o[cat][k]=Math.max(o[cat][k]||0,v);
   }
  }
 }
 return o;
};

/* settings */
const SCRIPTS=['h','k','mix'],MODES=['pick','type','draw'],WMODES=['mean','word'],PRESETS=[10,20,30];
const SAMPLE={base:'あ',dak:'が',yoon:'きゃ'},SETS={base:BASE,dak:DAK,yoon:YOON};
let cfg={n:10,all:false,base:true,dak:false,yoon:false,script:'h',mode:'pick'};
try{const c=JSON.parse(localStorage.getItem(KEY+'-cfg')||'null');if(c){if(!c.script)c.script=c.kata?'k':'h';delete c.kata;if(c.all===undefined)c.all=c.n===46;cfg=Object.assign(cfg,c)}}catch(e){}
if(!SCRIPTS.includes(cfg.script))cfg.script='h';
if(!MODES.includes(cfg.mode))cfg.mode='pick';
let wcfg={lv:'N5',mode:'mean',n:10,all:false};
try{const c=JSON.parse(localStorage.getItem(KEY+'-wcfg')||'null');if(c)wcfg=Object.assign(wcfg,c)}catch(e){}
if(!LV.includes(wcfg.lv))wcfg.lv='N5';
if(!WMODES.includes(wcfg.mode))wcfg.mode='mean';
let furi=true;
try{const f=localStorage.getItem(KEY+'-furi');if(f)furi=f==='on'}catch(e){}
const ruby=(w,y)=>furi&&y&&y!==w?`<ruby>${esc(w)}<rt>${esc(y)}</rt></ruby>`:esc(w);
const saveCfg=()=>{try{localStorage.setItem(KEY+'-cfg',JSON.stringify(cfg));localStorage.setItem(KEY+'-wcfg',JSON.stringify(wcfg))}catch(e){}};

/* every kana question knows how it is shown (d); "섞어서" puts each kana in twice, once per script */
const forms=x=>cfg.script==='h'?[{...x,d:x.k}]:cfg.script==='k'?[{...x,d:toK(x.k)}]:[{...x,d:x.k},{...x,d:toK(x.k)}];
/* 글자 쓰기 asks by sound, so a sound shared by two kana is asked once and either kana counts */
const asked=o=>SETS[o].filter(x=>cfg.mode!=='draw'||SAME[x.r][0]===x.k);
const kanaList=()=>['base','dak','yoon'].filter(o=>cfg[o]).flatMap(asked).flatMap(forms).map(x=>({t:'kana',...x}));
const altsOf=q=>(SAME[q.r]||[q.k]).map(k=>isKata(q.d)?toK(k):k);
const wordList=()=>(WORDS[wcfg.lv]||[]).map(x=>({t:'word',...x}));
const listOf=s=>s==='kana'?kanaList():s==='word'?wordList():fcWords();
const confOf=s=>s==='kana'?cfg:s==='word'?wcfg:fc;
const count=s=>{const c=confOf(s);return c.all?listOf(s).length:c.n};
const key=q=>q.t==='word'?q.w:q.d;
const sample=k=>cfg.script==='k'?toK(k):cfg.script==='mix'?k+toK(k):k;

let subject='kana',quizMode='pick',qs=[],qi=0,score=0,wrong=[],locked=false,idleItem=null,run=0;
const show=k=>{['vSetup','vWSetup','vQuiz','vDone'].forEach(v=>$(v).hidden=v!==k)};
const setupView=()=>subject==='kana'?'vSetup':'vWSetup';
const setCard=(t,lang='ja',rt='')=>{const el=$('kana'),n=[...t].length;if(rt&&rt!==t)el.innerHTML=`<ruby>${esc(t)}<rt>${esc(rt)}</rt></ruby>`;else el.textContent=t;el.lang=lang;el.className='kana'+(lang==='ko'?' ko':'')+(n<=1?'':n<=2?' small':n<=4?' w3':n<=7?' w5':' w8')};
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* slide el out to one side, swap its content, slide it back in from the other side */
const slide=(el,dir,swap)=>{
 if(still()||!el.animate){swap();return}
 el.getAnimations().forEach(a=>a.finish());
 const out=el.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*40}px)`,opacity:0}],{duration:140,easing:'ease-in'});
 out.onfinish=()=>{swap();el.animate([{transform:`translateX(${dir*40}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'})};
};
const slideIn=(el,dir)=>{if(still()||!el.animate)return;el.animate([{transform:`translateX(${dir*32}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'})};
const paintSw=(el,i)=>{el.style.setProperty('--n',[...el.children].filter(c=>!c.hidden).length);el.style.setProperty('--i',i)};
const chip=(b,t,extra='')=>`<span class="chip"><b lang="ja">${esc(b)}</b>${esc(t)}${extra}</span>`;

function stats(){
 const t=today();$('sToday').textContent=store.days[t]||0;
 let d=new Date(),n=0;if(!store.days[t])d.setDate(d.getDate()-1);
 while(store.days[d.toLocaleDateString('sv')]){n++;d.setDate(d.getDate()-1)}
 $('sStreak').textContent=n+'일';
 const W='일월화수목금토',days=[];const s=new Date();s.setDate(s.getDate()-6);
 for(let i=0;i<7;i++){const k=s.toLocaleDateString('sv'),c=store.days[k]||0;days.push(`<div class="day${c?' on':''}">${W[s.getDay()]}<b>${c}</b></div>`);s.setDate(s.getDate()+1)}
 $('week').innerHTML=days.join('');
 const top=o=>Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).slice(0,10);
 const none=t=>`<span style="color:var(--muted)">아직 틀린 ${t}가 없어요.</span>`;
 const m=top(store.miss);$('misses').innerHTML=m.length?m.map(([k,c])=>chip(k,RD[k]||RD[toH(k)]||'',`<i>${c}번</i>`)).join(''):none('글자');
 const w=top(store.wmiss);$('wMisses').innerHTML=w.length?w.map(([k,c])=>chip(k,WMAP[k]?WMAP[k].m:'',`<i>${c}번</i>`)).join(''):none('단어');
}

/* count pills follow the chosen range: 10/20/30 below the total, then "전체 N" */
const NUM={kana:{btns:'nBtns',inp:'nIn',start:'start'},word:{btns:'wBtns',inp:'wIn',start:'wStart'},cards:{btns:'fBtns',inp:'fIn',start:'fcStart'}};
function paintCount(s){
 const c=confOf(s),ids=NUM[s],T=listOf(s).length,pre=PRESETS.filter(n=>n<T),box=$(ids.btns);
 if(!c.all&&PRESETS.includes(c.n)&&c.n>=T)c.all=true;
 const had=new Set([...box.children].map(b=>b.dataset.n));
 box.innerHTML=[...pre.map(n=>`<button type="button" data-n="${n}">${n}</button>`),`<button type="button" data-n="all">전체 <b>${T}</b></button>`].join('');
 [...box.children].forEach(b=>{if(had.size&&!had.has(b.dataset.n))b.classList.add('pop')});
 paintPressed(s);
}
function paintPressed(s){
 const c=confOf(s),ids=NUM[s],custom=!c.all&&!PRESETS.includes(c.n);
 [...$(ids.btns).children].forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.n==='all'?c.all:!c.all&&+b.dataset.n===c.n)));
 $(ids.inp).classList.toggle('on',custom);
 if(document.activeElement!==$(ids.inp))$(ids.inp).value=custom?c.n:'';
 $(ids.start).textContent=s==='cards'?`단어 ${count(s)}개로 시작하기`:`${count(s)}문제 시작하기`;
 saveCfg();
 if(s==='cards')try{localStorage.setItem(KEY+'-fc',JSON.stringify(fc))}catch(e){}
}
function paintCfg(){
 $$('#kSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===cfg.script)));
 paintSw($('kSw'),SCRIPTS.indexOf(cfg.script));
 $$('#mSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===cfg.mode)));
 paintSw($('mSw'),MODES.indexOf(cfg.mode));
 $$('.tile').forEach(t=>{
  const b=t.querySelector('b'),txt=sample(SAMPLE[t.dataset.o]);
  t.setAttribute('aria-pressed',String(cfg[t.dataset.o]));
  b.textContent=txt;b.classList.toggle('long',[...txt].length>2);
  t.querySelectorAll('[data-h]').forEach(el=>el.textContent=cfg.script==='k'?toK(el.dataset.h):el.dataset.h);
  t.querySelector('small').textContent=asked(t.dataset.o).length*(cfg.script==='mix'?2:1)+'자';
 });
 paintCount('kana');
}
function paintW(){
 $$('#lvSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===wcfg.lv)));
 paintSw($('lvSw'),LV.indexOf(wcfg.lv));
 $$('#wmSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===wcfg.mode)));
 paintSw($('wmSw'),WMODES.indexOf(wcfg.mode));
 $('lvNote').textContent=`${wcfg.lv} 필수 단어 ${(WORDS[wcfg.lv]||[]).length}개`;
 paintCount('word');
}

/* the card shows a different kana or word every few seconds while nothing is running */
function showIdle(dir){
 const L=listOf(subject);if(!L.length)return;
 let x;do{x=L[Math.floor(Math.random()*L.length)]}while(L.length>1&&idleItem&&idleItem.t===x.t&&key(idleItem)===key(x));
 idleItem=x;
 const paint=()=>{if(x.t==='kana'){setCard(x.d);$('cBot').textContent=x.r}else{setCard(x.w,'ja',furi?x.y:'');$('cBot').textContent=`${x.y} · ${x.m}`}$('cBot').style.color='var(--muted)'};
 dir?slide($('kana'),dir,paint):paint();
}
setInterval(()=>{if(!document.hidden&&!$('pPractice').hidden&&!$(setupView()).hidden)showIdle(1)},3500);
function idle(){
 show(setupView());$('bar').style.width='0';$('stamp').classList.remove('on');
 $('cTL').textContent='';$('cTR').textContent='';showIdle();stats();
}

function build(list,n){
 const out=[];
 while(out.length<n){const s=shuf(list);if(out.length&&s.length>1&&key(s[0])===key(out[out.length-1]))[s[0],s[1]]=[s[1],s[0]];out.push(...s)}
 return out.slice(0,n);
}
function start(list,n,mode){
 if(!list.length)return;
 run++;quizMode=mode;qs=build(list,n);qi=0;score=0;wrong=[];show('vQuiz');ask();
}

/* wrong answers that are worth falling for: look-alike kana, then same row or same vowel sound */
const JM=s=>{const c=s.charCodeAt(0)-0xAC00;return c>=0&&c<11172?{i:Math.floor(c/588),v:Math.floor(c%588/28),f:c%28}:null};
const IG=[[0,1,15],[3,4,16],[7,8,17],[9,10,12,13,14],[11,18],[2,5,6]],VG=[[0,2],[8,12],[13,17,18],[1,5],[4,6]];
const fam=(G,x)=>G.findIndex(g=>g.includes(x));
function soundSim(a,b){
 const A=JM(a),B=JM(b);if(!A||!B)return 0;
 const fi=fam(IG,A.i),fv=fam(VG,A.v),famI=fi>=0&&fi===fam(IG,B.i),famV=fv>=0&&fv===fam(VG,B.v);
 let s=A.i===B.i&&famV?4:famI&&A.v===B.v?3.5:A.i===B.i?2:A.v===B.v?1.5:famI?.5:0;
 if(A.f!==B.f)s-=1;
 return s;
}
function lookReadings(q){
 const [first,...rest]=[...q.k],tail=rest.join(''),kata=isKata(q.d);
 const alike=kata?[...(LOOKK[toK(first)]||'')].map(toH):[...(LOOK[first]||'')];
 return alike.map(c=>RD[c+tail]).filter(Boolean);
}
const wpick=(c,n)=>{c=c.slice();const out=[];while(out.length<n&&c.length){let x=Math.random()*c.reduce((a,y)=>a+y.w,0),i=0;for(;i<c.length-1;i++){x-=c[i].w;if(x<=0)break}out.push(c[i].v);c.splice(i,1)}return out};
function kanaOptions(q){
 const look=new Set(lookReadings(q)),yq=YOON_R.has(q.r);
 const cand=[...new Set(ALL.map(x=>x.r))].filter(r=>r!==q.r).map(r=>{let s=soundSim(q.r,r)+(look.has(r)?5:0);if(YOON_R.has(r)!==yq)s-=1.5;return {v:r,w:Math.pow(Math.max(s,0)+.25,2)}});
 return shuf([q.r,...wpick(cand,3)]);
}
const kanji=s=>new Set([...s].filter(c=>/[一-鿿]/.test(c)));
function wordOptions(q,field){
 const kq=kanji(q.w),seen=new Set([q.m,q.w]);
 const cand=(WORDS[q.lv]||[]).filter(x=>{if(x.w===q.w||seen.has(x.m)||seen.has(x[field]))return false;seen.add(x[field]);return true}).map(x=>{
  let s=(x.p===q.p?3:0)+([...kanji(x.w)].some(c=>kq.has(c))?3:0)+(x.y[0]===q.y[0]?1.5:0)+(Math.abs([...x.w].length-[...q.w].length)<=1?.5:0);
  return {v:x[field],w:Math.pow(s+.5,2)};
 });
 return shuf([q[field],...wpick(cand,3)]);
}
const answerOf=q=>quizMode==='mean'?q.m:quizMode==='word'?q.w:q.r;
const scriptName=q=>isKata(q.d)?'가타카나':'히라가나';
/* Korean particle after a reading: 을/를, 은/는 depend on a final consonant (응 has one) */
const fin=s=>{const c=s.charCodeAt(s.length-1)-0xAC00;return c>=0&&c<11172&&c%28>0};
const eul=s=>fin(s)?'을':'를',eun=s=>fin(s)?'은':'는',ye=s=>fin(s)?'이에요':'예요';

/* drawing pads (글자 쓰기, 쓰기 연습) */
function makePad(cv){
 let ctx=null,drawing=false,last=null;
 const size=()=>{const r=cv.getBoundingClientRect(),dpr=window.devicePixelRatio||1;if(!r.width)return;cv.width=r.width*dpr;cv.height=r.height*dpr;ctx=cv.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=Math.max(6,r.width/30)};
 const at=e=>{const r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}};
 cv.addEventListener('pointerdown',e=>{if(!ctx)size();if(!ctx)return;e.preventDefault();cv.setPointerCapture(e.pointerId);drawing=true;last=at(e);ctx.strokeStyle=getComputedStyle(cv).color;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(last.x+.01,last.y);ctx.stroke()});
 cv.addEventListener('pointermove',e=>{if(!drawing)return;const q=at(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(q.x,q.y);ctx.stroke();last=q});
 ['pointerup','pointercancel','pointerleave'].forEach(t=>cv.addEventListener(t,()=>{drawing=false}));
 return {clear:()=>{size();if(ctx)ctx.clearRect(0,0,cv.width,cv.height)},wipe:()=>{if(ctx)ctx.clearRect(0,0,cv.width,cv.height)}};
}
const pad=$('padC'),quizPad=makePad(pad),clearPad=quizPad.clear;
$('padClear').addEventListener('click',quizPad.wipe);

const TITLE={pick:'이 글자는 뭐라고 읽을까요?',type:'이 글자는 뭐라고 읽을까요?',mean:'이 단어의 뜻은?',word:'이 뜻의 단어는?'};
function ask(){
 locked=false;const q=qs[qi];
 const face=quizMode==='draw'?[q.r,'ko']:quizMode==='mean'?[q.w,'ja',furi?q.y:'']:quizMode==='word'?[q.m,'ko']:[q.d,'ja'];
 if(qi>0)slide($('kana'),1,()=>setCard(...face));else setCard(...face);
 $('cBot').textContent='';$('stamp').classList.remove('on');
 $('cTL').textContent=`${qi+1} / ${qs.length}`;$('cTR').textContent=`맞힘 ${score}`;
 $('bar').style.width=(qi/qs.length*100)+'%';
 $('qTitle').textContent=quizMode==='draw'?`${scriptName(q)}로 써 보세요`:TITLE[quizMode];
 const choose=['pick','mean','word'].includes(quizMode);
 $('opts').hidden=!choose;$('typeForm').hidden=quizMode!=='type';$('draw').hidden=quizMode!=='draw';
 $('opts').classList.toggle('txt',quizMode==='mean');$('opts').classList.toggle('jp',quizMode==='word');
 if(choose){
  const o=quizMode==='pick'?kanaOptions(q):wordOptions(q,quizMode==='mean'?'m':'w');
  $('opts').innerHTML=o.map((a,i)=>`<button type="button" class="opt" data-a="${esc(a)}"${quizMode==='word'?' lang="ja"':''}><span>${i+1}</span>${esc(a)}</button>`).join('');
  $('msg').textContent='숫자 키 1~4로도 고를 수 있어요.';
 }else if(quizMode==='type'){
  const i=$('typeIn');i.value='';i.disabled=false;i.classList.remove('ok','bad');i.focus();
  $('msg').textContent='읽는 법을 한글로 적고 Enter를 누르세요.';
 }else{
  $('padGuide').textContent='';$('pad').classList.remove('shown');$('padScore').hidden=true;$('reveal').hidden=false;$('gradeFlip').hidden=true;
  clearPad();
  const alts=altsOf(q);
  $('msg').textContent=`'${q.r}'${eul(q.r)} ${scriptName(q)}로 쓰고 채점하기를 누르세요.`+(alts.length>1?` '${q.r}' 소리가 나는 글자는 ${alts.length}개라 어느 것을 써도 맞아요.`:'');
 }
 $('next').hidden=true;
}
/* 글자 쓰기 채점 (기준은 match.js의 손글씨 흉내로 정했어요):
   일치율 PASS% 이상이고, 다른 글자가 확실히 더 닮지 않았고(+0.06, ゛゜만 다른 글자는 +0.1), ゛゜를 빼먹지 않았으면 정답.
   이 기준으로 흉내 낸 손글씨는 깔끔하면 100%, 많이 흐트러져도 86%, 인쇄체처럼 써도 98%가 통과했고, 닮은 다른 글자는 7%, 아무 글자는 0% 통과했어요. */
const PASS=45;
let drawOk=null;
/* 정답 칸에 겹쳐 보여 줄 손글씨 모양(획순 데이터)을 SVG로 만들어요 */
function strokeGuide(ch){
 const S=window.STROKES||{},cs=[...ch];
 if(!cs.every(c=>S[c]))return esc(ch);
 const W=109*(1+.92*(cs.length-1));
 return `<svg viewBox="0 0 ${W} 109" aria-hidden="true">${cs.map((c,i)=>`<g transform="translate(${i*109*.92} 0)">${S[c].p.map(d=>`<path d="${d}"/>`).join('')}</g>`).join('')}</svg>`;
}
function reveal(){
 const q=qs[qi];if(locked||quizMode!=='draw')return;
 const alts=altsOf(q),single=[...q.d].length===1;
 const others=[...new Set(ALL.filter(x=>([...x.k].length===1)===single).map(x=>isKata(q.d)?toK(x.k):x.k))];
 const m=window.KanaMatch?window.KanaMatch.compare(pad,alts,others):undefined;
 if(m===null){$('msg').textContent='먼저 칸에 글자를 써 주세요.';return}
 const rivalWins=!!(m&&m.rival&&m.rival.raw>m.raw+(m.rival.close?.1:.06));
 const ok=m?m.pct>=PASS&&!rivalWins&&!m.noDot:true;
 slide($('kana'),1,()=>setCard(alts.join(' · ')));
 $('padGuide').innerHTML=strokeGuide(alts[0]);$('pad').classList.add('shown');
 $('reveal').hidden=true;
 if(m){const sc=$('padScore');sc.textContent=`일치율 ${m.pct}%`;sc.className='padScore '+(ok?'ok':'bad');sc.hidden=false}
 judge(ok);
 drawOk=ok;
 const both=alts.length>1?` (${alts.join('와 ')} 둘 다 '${q.r}'${ye(q.r)})`:'';
 $('msg').textContent=ok?`잘 썼어요!${both}`:(m&&m.noDot?'탁점(゛)이나 반탁점(゜)이 빠진 것 같아요. ':rivalWins?`${m.rival.ch}처럼 보여요. `:m&&m.pct<PASS?'모양이 많이 달라요. ':'')+`'${q.r}'${eun(q.r)} ${alts.join(' 또는 ')}${ye(alts[alts.length-1])}.`;
 $('gradeFlip').textContent=ok?'채점 바꾸기: 사실 틀렸어요':'채점 바꾸기: 사실 맞게 썼어요';$('gradeFlip').hidden=false;
 $('next').hidden=false;$('next').focus();
}
/* 자동 채점이 틀렸을 때 결과를 뒤집어요 */
function flipGrade(){
 if(quizMode!=='draw'||!locked||drawOk===null)return;
 const q=qs[qi];
 if(drawOk){score--;wrong.push(q);store.miss[q.d]=(store.miss[q.d]||0)+1;$('stamp').classList.add('on');$('cBot').style.color='var(--bad)'}
 else{score++;const i=wrong.lastIndexOf(q);if(i>=0)wrong.splice(i,1);store.miss[q.d]=Math.max(0,(store.miss[q.d]||0)-1);if(!store.miss[q.d])Reflect.deleteProperty(store.miss,q.d);$('stamp').classList.remove('on');$('cBot').style.color='var(--ok)'}
 drawOk=!drawOk;
 $('padScore').classList.toggle('ok',drawOk);$('padScore').classList.toggle('bad',!drawOk);
 $('gradeFlip').textContent=drawOk?'채점 바꾸기: 사실 틀렸어요':'채점 바꾸기: 사실 맞게 썼어요';
 $('msg').textContent=drawOk?'맞은 걸로 바꿨어요.':'틀린 걸로 바꿨어요.';
 $('cTR').textContent=`맞힘 ${score}`;save();stats();
}
function judge(ok,btn){
 if(locked)return;locked=true;
 const q=qs[qi],t=today(),ans=answerOf(q);
 store.days[t]=(store.days[t]||0)+1;
 $$('.opt').forEach(b=>{if(b.dataset.a===ans)b.classList.add('ok')});
 if(btn&&!ok)btn.classList.add('bad');
 if(quizMode==='type'){const i=$('typeIn');i.disabled=true;i.classList.add(ok?'ok':'bad')}
 $('cBot').textContent=q.t==='word'?(quizMode==='word'?`${q.w} · ${q.y}`:`${q.y} · ${q.m}`):q.r;
 if(quizMode==='word')slide($('kana'),1,()=>setCard(q.w,'ja',q.y));
 if(ok){score++;$('cBot').style.color='var(--ok)';$('msg').textContent='정답!';
  // 글자 쓰기는 일치율을 볼 수 있게 자동으로 넘기지 않아요
  if(quizMode!=='draw'){const r=run,i=qi;setTimeout(()=>{if(r===run&&i===qi&&!$('vQuiz').hidden)nextQ()},q.t==='word'?1100:650)}}
 else{
  wrong.push(q);
  if(q.t==='word')store.wmiss[q.w]=(store.wmiss[q.w]||0)+1;else store.miss[q.d]=(store.miss[q.d]||0)+1;
  $('cBot').style.color='var(--bad)';$('stamp').classList.add('on');
  $('msg').textContent=(q.t==='word'?`${q.w}(${q.y})는 '${q.m}'${ye(q.m)}.`:`${q.d}는 '${q.r}'${ye(q.r)}.`)+' 다음으로 넘어가려면 Enter.';
  $('next').hidden=false;$('next').focus();
 }
 $('cTR').textContent=`맞힘 ${score}`;save();stats();
}
function nextQ(){
 qi++;if(qi<qs.length){ask();return}
 $('bar').style.width='100%';$('stamp').classList.remove('on');show('vDone');
 setCard(`${score}/${qs.length}`,'ko');
 $('cTL').textContent='결과';$('cTR').textContent='';
 const pct=Math.round(score/qs.length*100);
 $('cBot').style.color=pct>=80?'var(--ok)':'var(--bad)';$('cBot').textContent=pct===100?'다 맞혔어요!':pct+'%';
 $('dTitle').textContent=pct===100?'완벽해요! 내일도 만나요.':pct>=80?'거의 다 왔어요.':'틀린 문제를 한 번 더 봐요.';
 const uniq=[...new Map(wrong.map(w=>[key(w),w])).values()];
 $('dWrongLab').hidden=!uniq.length;
 $('dWrong').innerHTML=uniq.map(w=>w.t==='word'?chip(w.w,w.m):chip(w.d,w.r)).join('');
 $('retry').hidden=!uniq.length;
}

/* events: settings */
for(const s of ['kana','word','cards']){
 const ids=NUM[s];
 $(ids.btns).addEventListener('click',e=>{const b=e.target.closest('button'),c=confOf(s);if(!b)return;if(b.dataset.n==='all')c.all=true;else{c.all=false;c.n=+b.dataset.n}paintPressed(s)});
 $(ids.inp).addEventListener('input',e=>{const v=Math.max(1,Math.min(300,parseInt(e.target.value,10)||0)),c=confOf(s);if(v){c.all=false;c.n=v;paintPressed(s)}});
 $(ids.inp).addEventListener('blur',()=>paintPressed(s));
}
$$('.tile').forEach(t=>t.addEventListener('click',()=>{
 const o=t.dataset.o;cfg[o]=!cfg[o];
 if(!cfg.base&&!cfg.dak&&!cfg.yoon){cfg[o]=true;t.classList.remove('no');void t.offsetWidth;t.classList.add('no');return}
 paintCfg();
}));
$$('#kSw button').forEach(b=>b.addEventListener('click',()=>{
 const from=SCRIPTS.indexOf(cfg.script),to=SCRIPTS.indexOf(b.dataset.v);if(from===to)return;
 cfg.script=b.dataset.v;paintCfg();
 if(!$('vSetup').hidden)showIdle(to>from?1:-1);
}));
$$('#mSw button').forEach(b=>b.addEventListener('click',()=>{cfg.mode=b.dataset.v;paintCfg()}));
$$('#lvSw button').forEach(b=>b.addEventListener('click',()=>{
 const from=LV.indexOf(wcfg.lv),to=LV.indexOf(b.dataset.v);if(from===to)return;
 wcfg.lv=b.dataset.v;paintW();if(!$('vWSetup').hidden)showIdle(to>from?1:-1);
}));
$$('#wmSw button').forEach(b=>b.addEventListener('click',()=>{wcfg.mode=b.dataset.v;paintW()}));

/* 한자 위 히라가나 스위치 (설정값 furi는 위쪽에 있어요) */
const paintFuri=()=>$$('.furiSw').forEach(sw=>{[...sw.children].forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.v==='on')===furi)));paintSw(sw,furi?0:1)});
$$('.furiSw button').forEach(b=>b.addEventListener('click',()=>{furi=b.dataset.v==='on';try{localStorage.setItem(KEY+'-furi',furi?'on':'off')}catch(e){}paintFuri();if(!$('vWSetup').hidden||!$('vFcSetup').hidden)showIdle();fcIdle()}));

/* 획순 보기: KanjiVG 획을 한 획씩 그려요. 쓰기 탭과 '써 보며 외우기'가 같이 써요. */
const STROKES=window.STROKES||{},SVGNS='http://www.w3.org/2000/svg';
const svgEl=(tag,attrs)=>{const el=document.createElementNS(SVGNS,tag);for(const k in attrs)el.setAttribute(k,attrs[k]);return el};
function makeStrokeView(ids){
 const svg=$(ids.svg),guide=$(ids.guide);let timers=[],step=0,inks=[],nums=[];
 const stop=()=>{timers.forEach(clearTimeout);timers=[]};
 const show=n=>{stop();step=n;inks.forEach((el,i)=>{el.style.transition='none';el.classList.remove('now');el.style.strokeDashoffset=i<n?0:el.dataset.len});nums.forEach((t,i)=>{t.classList.remove('on');t.classList.toggle('done',i<n)})};
 const draw=(i,delay=0)=>{
  const el=inks[i],t=nums[i];if(!el)return 0;const dur=Math.max(320,el.dataset.len*8);
  timers.push(setTimeout(()=>{el.style.transition='none';el.style.strokeDashoffset=el.dataset.len;el.getBoundingClientRect();
   el.classList.add('now');if(t){t.classList.remove('done');t.classList.add('on')}
   el.style.transition=`stroke-dashoffset ${dur}ms cubic-bezier(.4,0,.6,1)`;el.style.strokeDashoffset=0;step=Math.max(step,i+1)},delay));
  timers.push(setTimeout(()=>{el.classList.remove('now');if(t){t.classList.remove('on');t.classList.add('done')}},delay+dur));
  return dur;
 };
 const play=()=>{show(0);if(still()){show(inks.length);return}let t=250;inks.forEach((_,i)=>{t+=draw(i,t)+260})};
 const load=(ch,d)=>{
  stop();svg.innerHTML='';guide.innerHTML='';inks=[];nums=[];step=0;
  $(ids.print).textContent=ch;$(ids.count).textContent=d?`${d.p.length}획`:'획순 정보 없음';
  if(!d)return;
  d.p.forEach(p=>{svg.append(svgEl('path',{d:p,class:'bg'}));guide.append(svgEl('path',{d:p}))});
  inks=d.p.map(p=>{const el=svgEl('path',{d:p,class:'ink'});svg.append(el);const L=el.getTotalLength()||100;el.dataset.len=L;el.style.strokeDasharray=L;el.style.strokeDashoffset=L;return el});
  nums=d.n.map((xy,i)=>{const t=svgEl('text',{x:xy[0],y:xy[1]});t.textContent=i+1;svg.append(t);const t2=svgEl('text',{x:xy[0],y:xy[1]});t2.textContent=i+1;guide.append(t2);return t});
 };
 $(ids.play).addEventListener('click',play);
 $(ids.fwd).addEventListener('click',()=>{if(step>=inks.length)return;show(step);draw(step)});
 $(ids.back).addEventListener('click',()=>show(Math.max(0,step-1)));
 return {load,play,stop};
}
function hookPad(padId,canvasId,clearId,guideBtnId){
 const p=makePad($(canvasId));
 $(clearId).addEventListener('click',p.wipe);
 $(guideBtnId).addEventListener('click',()=>{const off=$(padId).classList.toggle('noGuide');$(guideBtnId).textContent=off?'가이드 켜기':'가이드 끄기'});
 return p;
}

/* 쓰기 탭: 가나 획순 보고 큰 칸에 따라 쓰기 (채점 없음) */
const WS_BASE=[...'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん'],WS_DAK=[...'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ'],WS_SMALL=[...'ゃゅょ'];
let ws={script:'h',ch:'あ'};
try{const c=JSON.parse(localStorage.getItem(KEY+'-ws')||'null');if(c)ws=Object.assign(ws,c)}catch(e){}
const wsSave=()=>{try{localStorage.setItem(KEY+'-ws',JSON.stringify(ws))}catch(e){}};
const wsList=()=>[...WS_BASE,...WS_DAK,...WS_SMALL].map(c=>ws.script==='k'?toK(c):c);
if(!STROKES[ws.ch])ws.ch=wsList()[0];
const SMALL_R={'ゃ':'작은 야','ゅ':'작은 유','ょ':'작은 요'};
const readingOf=ch=>RD[toH(ch)]||SMALL_R[toH(ch)]||'';
const wsView=makeStrokeView({svg:'wsSvg',guide:'wGuide',print:'wsPrint',count:'wsCount',play:'wsPlay',fwd:'wsFwd',back:'wsBack'});
const wPad=hookPad('wPad','wPadC','wClear','wGuideBtn');
const wsStop=()=>wsView.stop();
function wsRender(){
 $$('#kGrid button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.ch===ws.ch)));
 $('wsName').textContent=`${ws.ch} · ${readingOf(ws.ch)}`;
 wsView.load(ws.ch,STROKES[ws.ch]);
}
function wsGrid(){
 const L=wsList(),cut=[WS_BASE.length,WS_BASE.length+WS_DAK.length];
 $('kGrid').innerHTML=L.map((c,i)=>(cut.includes(i)?'<i class="gap"></i>':'')+`<button type="button" data-ch="${c}" lang="ja" aria-label="${c} ${readingOf(c)}" aria-pressed="${c===ws.ch}">${c}</button>`).join('');
 $$('#wsSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===ws.script)));
 paintSw($('wsSw'),ws.script==='k'?1:0);
}
function wsSelect(ch,dir){
 if(!STROKES[ch])return;ws.ch=ch;wsSave();wsRender();wsEnds();wPad.clear();wsView.play();
 if(dir)slideIn($('wsSvg'),dir);
 const b=$('kGrid').querySelector(`[data-ch="${ch}"]`);if(b)b.scrollIntoView({block:'nearest'});
}
const wsMove=d=>{const L=wsList(),i=L.indexOf(ws.ch),j=i+d;if(j<0||j>=L.length)return;wsSelect(L[j],d)};
const wsEnds=()=>{const L=wsList(),i=L.indexOf(ws.ch);$('wsPrevK').disabled=i<=0;$('wsNextK').disabled=i>=L.length-1};
$('kGrid').addEventListener('click',e=>{const b=e.target.closest('button');if(b){const L=wsList();wsSelect(b.dataset.ch,L.indexOf(b.dataset.ch)>L.indexOf(ws.ch)?1:-1)}});
$$('#wsSw button').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.v===ws.script)return;ws.script=b.dataset.v;const ch=ws.script==='k'?toK(ws.ch):toH(ws.ch);wsGrid();wsSelect(ch,ws.script==='k'?1:-1)}));
$('wsPrevK').addEventListener('click',()=>wsMove(-1));
$('wsNextK').addEventListener('click',()=>wsMove(1));

/* 외우기 탭 설정 */
let fc={lv:'N5',mode:'card',face:'word',n:10,all:false};
try{const c=JSON.parse(localStorage.getItem(KEY+'-fc')||'null');if(c)fc=Object.assign(fc,c)}catch(e){}
if(!LV.includes(fc.lv))fc.lv='N5';
if(fc.mode!=='write')fc.mode='card';
const fcWords=()=>(WORDS[fc.lv]||[]).map(x=>({t:'word',...x}));
const isKnown=w=>(store.known[w]||0)>0;
let studyView='cards';   // 'cards' (pCards) or 'study' (pStudy, 써 보며 외우기 중)
function fcPaint(){
 $$('#fcLvSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===fc.lv)));paintSw($('fcLvSw'),LV.indexOf(fc.lv));
 $$('#fcModeSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===fc.mode)));paintSw($('fcModeSw'),fc.mode==='write'?1:0);
 $$('#fcFaceSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===fc.face)));paintSw($('fcFaceSw'),fc.face==='mean'?1:0);
 $('fcFaceBox').hidden=fc.mode==='write';$('fcFuriBox').hidden=fc.mode==='write';
 const T=fcWords().length,n=fcWords().filter(w=>isKnown(w.w)).length;
 $('fcProgLab').textContent=`${fc.lv} 익힌 단어 ${n} / ${T}`;$('fcProg').style.width=(T?n/T*100:0)+'%';
 paintCount('cards');
}
/* 카드 앞면/뒷면 그리기 */
let fcCur=null;
function fcFace(x,dir){
 const flip=$('flip');
 const paint=()=>{
  flip.classList.add('instant');flip.classList.remove('on');void flip.offsetWidth;flip.classList.remove('instant');
  $('fcLv').textContent=$('fcLv2').textContent=fc.lv;
  const f=$('fcFront');
  if(!x){f.textContent='';return}
  const word=fc.face==='word'||fc.mode==='write';
  f.innerHTML=word?ruby(x.w,x.y):esc(x.m);f.className='fcMain'+(word?'':' ko');f.lang=word?'ja':'ko';
  $('fcWord').innerHTML=esc(x.w);$('fcRead').textContent=x.y===x.w?'':x.y;$('fcMean').textContent=x.m;
 };
 dir?slide(flip,dir,paint):paint();
}
/* 설정 화면에서는 카드에 단어가 몇 초마다 바뀌어요 */
function fcIdle(dir){
 if($('vFcSetup').hidden)return;
 const L=fcWords();fcCur=L[Math.floor(Math.random()*L.length)];
 $('fcPos').textContent=$('fcPos2').textContent='';$('fcHint').textContent='눌러서 뒤집기';
 fcFace(fcCur,dir);
}
setInterval(()=>{if(!document.hidden&&view==='cards'&&studyView==='cards'&&!$('vFcSetup').hidden&&!$('flip').classList.contains('on'))fcIdle(1)},4000);

/* 카드로 외우기: 고른 수만큼 단어를 뽑아서, 알아요를 누를 때까지 다시 나와요 */
let queue=[],tries=new Map(),fcTotal=0,fcLearned=0,fcRunId=0;
function pickWords(n){
 const L=fcWords(),fresh=shuf(L.filter(w=>!isKnown(w.w))),old=shuf(L.filter(w=>isKnown(w.w)));
 return [...fresh,...old].slice(0,Math.min(n,L.length));
}
function fcStart(list){
 fcRunId++;
 if(fc.mode==='write'){studyStart(list);return}
 queue=shuf(list);tries=new Map(queue.map(w=>[w.w,0]));fcTotal=queue.length;fcLearned=0;fcHist=[];fcBack=0;
 ['vFcSetup','vFcDone'].forEach(v=>$(v).hidden=true);$('vFcRun').hidden=false;
 fcNext(0);
}
function fcRunPaint(){
 $('fcRunLab').textContent=`외운 단어 ${fcLearned} / ${fcTotal}`;$('fcRunProg').style.width=(fcTotal?fcLearned/fcTotal*100:0)+'%';
 $('fcPos').textContent=$('fcPos2').textContent=`남은 카드 ${queue.length}장`;
}
function fcNext(dir){
 fcBack=0;fcNavPaint();
 fcCur=queue[0]||null;
 if(!fcCur){fcDone();return}
 $('fcShow').hidden=false;$('fcJudge').hidden=true;$('fcHint').textContent='눌러서 뒤집기';
 $('fcQ').textContent=fc.face==='word'?'이 단어의 뜻은?':'이 뜻의 단어는?';
 const seen=tries.get(fcCur.w)||0;$('fcMsg').textContent=seen?`${seen}번 헷갈렸던 단어예요. Space로 뒤집기 · 1 몰라요 · 2 알아요`:'Space로 뒤집기 · 1 몰라요 · 2 알아요';
 fcRunPaint();fcFace(fcCur,dir);
}
const fcFlipped=()=>$('flip').classList.contains('on');
/* ←/→: 지나간 카드를 다시 봐요. 이번에 시작한 첫 카드에서 멈추고, →로 지금 카드까지 돌아와요. */
let fcHist=[],fcBack=0;
function fcNavPaint(){$('fcPrev').disabled=fcBack>=fcHist.length;$('fcFwd').disabled=fcBack===0}
function fcNav(d){
 if($('vFcRun').hidden)return;
 if(d<0&&fcBack>=fcHist.length){$('fcMsg').textContent=fcHist.length?'이번에 본 첫 카드예요. 더 뒤로는 없어요.':'아직 지나간 카드가 없어요.';return}
 if(d>0&&fcBack===0)return;
 fcBack-=d;
 if(fcBack===0){fcNext(1);return}
 fcCur=fcHist[fcHist.length-fcBack];
 $('fcShow').hidden=true;$('fcJudge').hidden=true;$('fcHint').textContent='눌러서 뒤집기';
 $('fcQ').textContent='지나간 카드';
 $('fcMsg').textContent=`지나간 카드 ${fcHist.length-fcBack+1} / ${fcHist.length} · →로 지금 카드에 돌아가요`;
 $('fcPos').textContent=$('fcPos2').textContent='지나간 카드';
 fcNavPaint();fcFace(fcCur,d);
}
function fcFlip(){
 if(!fcCur)return;
 const on=$('flip').classList.toggle('on');
 if(!$('vFcRun').hidden&&on&&!fcBack){$('fcShow').hidden=true;$('fcJudge').hidden=false}
}
function fcAnswer(knew){
 if($('vFcRun').hidden||!fcCur||fcBack)return;
 // 뒤집어서 뜻을 보기 전에는 고를 수 없어요
 if(!fcFlipped()){const b=$('fcShow');b.classList.remove('no');void b.offsetWidth;b.classList.add('no');$('fcMsg').textContent='먼저 카드를 뒤집어서 뜻을 확인하세요. (Space)';return}
 const w=queue.shift();fcHist.push(w);
 if(knew){fcLearned++;store.known[w.w]=Date.now()}
 else{tries.set(w.w,(tries.get(w.w)||0)+1);if((store.known[w.w]||0)>0)store.known[w.w]=-Date.now();queue.splice(Math.min(queue.length,2+Math.floor(Math.random()*3)),0,w)}
 save();fcNext(1);
}
function fcDone(){
 $('vFcRun').hidden=true;$('vFcDone').hidden=false;
 const hard=[...tries].filter(([,n])=>n>0).sort((a,b)=>b[1]-a[1]);
 $('fcDoneTitle').textContent=hard.length?`${fcTotal}개 단어를 다 외웠어요!`:`${fcTotal}개 모두 한 번에 알았어요!`;
 $('fcDoneNote').textContent=hard.length?`처음부터 알았던 단어 ${fcTotal-hard.length}개, 다시 본 단어 ${hard.length}개`:'';
 $('fcHardLab').textContent='헷갈렸던 단어';$('fcHardLab').hidden=!hard.length;$('fcAgainHard').hidden=!hard.length;
 $('fcHard').innerHTML=hard.map(([w,n])=>chip(w,(WMAP[w]||{}).m||'',`<i>${n}번</i>`)).join('');
 $('fcPos').textContent=$('fcPos2').textContent='';
 fcFace(null);$('fcFront').textContent='다 외웠어요!';$('fcFront').className='fcMain ko';$('fcHint').textContent='';
 stats();
}
function fcHome(){fcRunId++;studyView='cards';tabPanels();['vFcRun','vFcDone'].forEach(v=>$(v).hidden=true);$('vFcSetup').hidden=false;fcPaint();fcIdle()}
$('flip').addEventListener('click',fcFlip);
$('fcShow').addEventListener('click',fcFlip);
$('fcYes').addEventListener('click',()=>fcAnswer(true));
$('fcPrev').addEventListener('click',()=>fcNav(-1));
$('fcFwd').addEventListener('click',()=>fcNav(1));
$('fcNo').addEventListener('click',()=>fcAnswer(false));
$('fcQuit').addEventListener('click',fcHome);
$('fcHome').addEventListener('click',fcHome);
$('fcAgainHard').addEventListener('click',()=>{const hard=[...tries].filter(([,n])=>n>0).map(([w])=>fcWords().find(x=>x.w===w)).filter(Boolean);if(hard.length)fcStart(hard)});
$('fcStart').addEventListener('click',()=>fcStart(pickWords(count('cards'))));
$$('#fcLvSw button').forEach(b=>b.addEventListener('click',()=>{const from=LV.indexOf(fc.lv),to=LV.indexOf(b.dataset.v);if(from===to)return;fc.lv=b.dataset.v;fcPaint();fcIdle(to>from?1:-1)}));
$$('#fcModeSw button').forEach(b=>b.addEventListener('click',()=>{if(fc.mode===b.dataset.v)return;fc.mode=b.dataset.v;fcPaint();fcIdle()}));
$$('#fcFaceSw button').forEach(b=>b.addEventListener('click',()=>{if(fc.face===b.dataset.v)return;fc.face=b.dataset.v;fcPaint();fcIdle()}));

/* 써 보며 외우기: 단어의 한자(와 가나)를 한 글자씩 획순 보고 따라 써요. 위에는 읽기와 뜻이 나와요. 채점 없음. */
const KANJI={};
async function kanjiFor(lv){
 if(KANJI[lv])return KANJI[lv];
 try{const r=await fetch(`strokes/${lv}.json`);KANJI[lv]=r.ok?await r.json():{}}catch(e){KANJI[lv]={}}
 return KANJI[lv];
}
const sView=makeStrokeView({svg:'sSvg',guide:'sGuide',print:'sPrint',count:'sCount',play:'sPlay',fwd:'sFwd',back:'sBack'});
const sPad=hookPad('sPad','sPadC','sClear','sGuideBtn');
let study={list:[],wi:0,ci:0,data:{}};
async function studyStart(list){
 const id=fcRunId;
 study={list,wi:0,ci:0,data:await kanjiFor(fc.lv)};
 if(id!==fcRunId)return;
 studyView='study';tabPanels();studyRender(0);
}
const studyChars=()=>[...study.list[study.wi].w];
function studyRender(dir){
 const x=study.list[study.wi],chars=studyChars(),ch=chars[study.ci];
 $('sWord').innerHTML=x.y!==x.w?`<ruby>${esc(x.w)}<rt>${esc(x.y)}</rt></ruby>`:esc(x.w);
 $('sMean').textContent=x.m;
 $('sPos').textContent=`단어 ${study.wi+1} / ${study.list.length}`;
 $('sChars').innerHTML=chars.map((c,i)=>`<button type="button" data-i="${i}" lang="ja" aria-pressed="${i===study.ci}">${esc(c)}</button>`).join('');
 const kana=readingOf(ch);
 $('sName').textContent=kana?`${ch} · ${kana}`:`${ch} (${x.w}의 ${study.ci+1}번째 글자)`;
 sView.load(ch,STROKES[ch]||study.data[ch]);
 sPad.clear();sView.play();
 if(dir)slideIn($('sSvg'),dir);
 const last=study.ci===chars.length-1,lastWord=study.wi===study.list.length-1;
 $('sNext').textContent=last?(lastWord?'다 했어요':'다음 단어'):'다음 글자';
 $('sPrev').disabled=study.wi===0&&study.ci===0;
}
function studyMove(d){
 const n=studyChars().length;
 if(d>0){
  if(study.ci<n-1)study.ci++;
  else if(study.wi<study.list.length-1){study.wi++;study.ci=0}
  else{studyFinish();return}
 }else{
  if(study.ci>0)study.ci--;
  else if(study.wi>0){study.wi--;study.ci=studyChars().length-1}
  else return;
 }
 studyRender(d);
}
function studyFinish(){
 sView.stop();studyView='cards';tabPanels();
 ['vFcSetup','vFcRun'].forEach(v=>$(v).hidden=true);$('vFcDone').hidden=false;
 $('fcDoneTitle').textContent=`${study.list.length}개 단어를 다 써 봤어요!`;$('fcDoneNote').textContent='';
 $('fcHardLab').hidden=false;$('fcHardLab').textContent='써 본 단어';$('fcAgainHard').hidden=true;
 $('fcHard').innerHTML=study.list.map(x=>chip(x.w,x.m)).join('');
 fcFace(null);$('fcFront').textContent='수고했어요!';$('fcFront').className='fcMain ko';$('fcHint').textContent='';
}
$('sChars').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;if(i===study.ci)return;const d=i>study.ci?1:-1;study.ci=i;studyRender(d)});
$('sNext').addEventListener('click',()=>studyMove(1));
$('sPrev').addEventListener('click',()=>studyMove(-1));
$('sQuit').addEventListener('click',()=>{sView.stop();fcHome()});


/* events: tabs */
const TABS=['kana','write','word','cards','records','admin'],PANEL={kana:'pPractice',word:'pPractice',write:'pWrite',cards:'pCards',records:'pRecords',admin:'pAdmin'};
let view='kana';
const panelOf=name=>name==='cards'&&studyView==='study'?'pStudy':PANEL[name];
function tabPanels(){for(const id of ['pPractice','pWrite','pCards','pStudy','pRecords','pAdmin'])$(id).hidden=id!==panelOf(view)}
const tab=(name,first)=>{
 if(name==='admin'&&!adminFind)name='kana';
 const prev=view;view=name;document.body.dataset.view=name;
 tabPanels();
 $$('#tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===name)));
 paintSw($('tabs'),TABS.indexOf(name));
 if(name==='kana'||name==='word')$('pPractice').setAttribute('aria-labelledby',name==='word'?'tWord':'tKana');
 history.replaceState(null,'',name==='kana'?location.pathname+location.search:'#'+name);
 if(name==='records')stats();
 if(name==='admin'&&!adminUsers)adminLoad();
 if((name==='kana'||name==='word')&&name!==subject){run++;subject=name;idle()}
 if(name==='write'&&prev!=='write'){wsRender();wsEnds();wPad.clear();wsView.play()}
 if(name!=='write')wsStop();
 if(name==='cards'&&prev!=='cards'){if(studyView==='study'){sView.load(studyChars()[study.ci],STROKES[studyChars()[study.ci]]||study.data[studyChars()[study.ci]]);sPad.clear();sView.play()}else fcIdle()}
 if(name!=='cards')sView.stop();
 if(!first&&prev!==name)slideIn($(panelOf(name)),TABS.indexOf(name)>TABS.indexOf(prev)?1:-1);
};
$$('#tabs button').forEach(b=>b.addEventListener('click',()=>tab(b.dataset.tab)));

/* events: quiz */
$('start').addEventListener('click',()=>start(kanaList(),count('kana'),cfg.mode));
$('wStart').addEventListener('click',()=>start(wordList(),count('word'),wcfg.mode));
$('opts').addEventListener('click',e=>{const b=e.target.closest('.opt');if(b)judge(b.dataset.a===answerOf(qs[qi]),b)});
$('typeForm').addEventListener('submit',e=>{e.preventDefault();const v=$('typeIn').value.replace(/\s/g,'');if(!v||locked)return;judge(v===qs[qi].r)});
$('reveal').addEventListener('click',reveal);
$('gradeFlip').addEventListener('click',flipGrade);
$('next').addEventListener('click',nextQ);
$('quit').addEventListener('click',()=>{run++;idle()});
$('again').addEventListener('click',idle);
$('retry').addEventListener('click',()=>{const u=[...new Map(wrong.map(w=>[key(w),w])).values()];start(u,u.length,quizMode)});
document.addEventListener('keydown',e=>{
 const tg=e.target instanceof Element?e.target:null;
 if(e.isComposing||(tg&&tg.closest('input,textarea')))return;
 if(view==='cards'){
  if(studyView==='study'){if(e.key==='ArrowRight')studyMove(1);else if(e.key==='ArrowLeft')studyMove(-1);return}
  const onOther=!!(tg&&tg.closest('button'))&&tg!==$('flip');
  if((e.key===' '||e.key==='Enter')&&!onOther){e.preventDefault();fcFlip()}
  else if(e.key==='1')fcAnswer(false);
  else if(e.key==='2')fcAnswer(true);
  else if(e.key==='ArrowLeft'){e.preventDefault();fcNav(-1)}
  else if(e.key==='ArrowRight'){e.preventDefault();fcNav(1)}
  return;
 }
 if(view==='write'){if(e.key==='ArrowRight')wsMove(1);else if(e.key==='ArrowLeft')wsMove(-1);return}
 if($('vQuiz').hidden||$('pPractice').hidden)return;
 if(!locked&&!$('opts').hidden&&/^[1-4]$/.test(e.key)){const b=$$('.opt')[+e.key-1];if(b)judge(b.dataset.a===answerOf(qs[qi]),b)}
 else if(e.key==='Enter'&&!$('next').hidden){e.preventDefault();nextQ()}
});

/* events: moving records by code */
$('exp').addEventListener('click',async()=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(store))));$('moveTxt').value=code;try{await navigator.clipboard.writeText(code);$('moveMsg').textContent='복사했어요. 새 브라우저에서 붙여 넣으세요.'}catch(e){$('moveTxt').select();$('moveMsg').textContent='칸에 나온 코드를 직접 복사하세요 (Ctrl+C).'}});
$('imp').addEventListener('click',()=>{try{const d=JSON.parse(decodeURIComponent(escape(atob($('moveTxt').value.trim()))));if(!d||typeof d!=='object')throw 0;store=merge(store,d);save();stats();$('moveMsg').textContent='불러왔어요. 기록이 합쳐졌어요.'}catch(e){$('moveMsg').textContent='코드가 올바르지 않아요. 다시 복사해 주세요.'}});

/* 기록 초기화: 고른 종류만 지우고, 지운 시각을 남겨서 계정·다른 기기와 합칠 때 되살아나지 않게 해요 */
const RESET_NAME={days:'푼 문제 수·연속 일수',miss:'자주 틀린 글자',wmiss:'자주 틀린 단어',known:'익힌 단어'};
const resetPicked=()=>[...$$('#resetSeg button')].filter(b=>b.getAttribute('aria-pressed')==='true').map(b=>b.dataset.k);
function resetPaint(){const n=resetPicked().length;$('resetBtn').disabled=!n;$('resetAll').textContent=n===4?'전체 해제':'전체 선택'}
$('resetSeg').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;b.setAttribute('aria-pressed',String(b.getAttribute('aria-pressed')!=='true'));$('resetMsg').textContent='';resetPaint()});
$('resetAll').addEventListener('click',()=>{const all=resetPicked().length===4;$$('#resetSeg button').forEach(b=>b.setAttribute('aria-pressed',String(!all)));$('resetMsg').textContent='';resetPaint()});
$('resetBtn').addEventListener('click',()=>{
 const picked=resetPicked();if(!picked.length)return;
 $('resetText').textContent=`${picked.map(k=>RESET_NAME[k]).join(', ')} 기록을 지워요. 지운 기록은 되돌릴 수 없어요.`+(cloud?' 로그인한 계정에 저장된 기록도 같이 지워져요.':'');
 const d=$('resetDlg');if(d.showModal)d.showModal();else if(confirm($('resetText').textContent))doReset(picked);
});
$('resetDlg').addEventListener('close',()=>{const d=$('resetDlg');if(d.returnValue==='ok')doReset(resetPicked());d.returnValue=''});
$('resetDlg').addEventListener('click',e=>{if(e.target===$('resetDlg'))$('resetDlg').close('cancel')});
function doReset(picked){
 const t=Date.now();store.resets=store.resets||{};
 picked.forEach(k=>{store[k]={};store.resets[k]=t});
 save();stats();fcPaint();
 $$('#resetSeg button').forEach(b=>b.setAttribute('aria-pressed','false'));resetPaint();
 $('resetMsg').textContent=`지웠어요: ${picked.map(k=>RESET_NAME[k]).join(', ')}`+(cloud?'. 계정 기록도 곧 같이 지워져요.':'.');
}

/* 관리: sync.js가 관리자 계정이라고 알려 주면 '관리' 탭이 보여요. 이메일로 다른 사용자의 기록을 읽기만 해요. */
let adminFind=null;
function setAdmin(api){
 adminFind=api||null;$('tAdmin').hidden=!adminFind;
 adminUsers=null;adminPick=null;$('userList').innerHTML='';$('adminOut').hidden=true;
 if(adminFind&&view==='admin')adminLoad();
 if(!adminFind&&view==='admin')tab('kana');
 paintSw($('tabs'),TABS.indexOf(view));
}
function streakOf(days){
 const t=today();let d=new Date(),n=0;if(!days[t])d.setDate(d.getDate()-1);
 while(days[d.toLocaleDateString('sv')]){n++;d.setDate(d.getDate()-1)}
 return n;
}
function weekHTML(days){
 const W='일월화수목금토',out=[];const s=new Date();s.setDate(s.getDate()-6);
 for(let i=0;i<7;i++){const k=s.toLocaleDateString('sv'),c=days[k]||0;out.push(`<div class="day${c?' on':''}">${W[s.getDay()]}<b>${c}</b></div>`);s.setDate(s.getDate()+1)}
 return out.join('');
}
function adminRender(d){
 const days=d.days||{},top=o=>Object.entries(o||{}).sort((a,b)=>b[1]-a[1]).slice(0,20),none=t=>`<span style="color:var(--muted)">${t}</span>`;
 $('aName').textContent=d.name||'(이름 없음)';$('aEmail').textContent=d.email||'';
 $('aUpdated').textContent=d.updated?`마지막 저장 ${new Date(d.updated).toLocaleString('ko-KR')}`:'';
 $('aStreak').textContent=streakOf(days)+'일';$('aToday').textContent=days[today()]||0;
 $('aTotal').textContent=Object.values(days).reduce((a,v)=>a+(+v||0),0);$('aDays').textContent=Object.values(days).filter(v=>v>0).length+'일';
 $('aWeek').innerHTML=weekHTML(days);
 const m=top(d.miss);$('aMiss').innerHTML=m.length?m.map(([k,c])=>chip(k,RD[k]||RD[toH(k)]||'',`<i>${c}번</i>`)).join(''):none('틀린 글자가 없어요.');
 const w=top(d.wmiss);$('aWmiss').innerHTML=w.length?w.map(([k,c])=>chip(k,WMAP[k]?WMAP[k].m:'',`<i>${c}번</i>`)).join(''):none('틀린 단어가 없어요.');
 const known=Object.entries(d.known||{}).filter(([,v])=>v>0).map(([k])=>k);
 $('aKnown').innerHTML=LV.map(l=>{const T=(WORDS[l]||[]).length,n=(WORDS[l]||[]).filter(x=>known.includes(x.w)).length;return `<span class="chip"><b>${l}</b>${n} / ${T}</span>`}).join('');
 $('adminOut').hidden=false;
}
/* 전체 사용자 목록: 이메일 abc순(이메일이 없는 예전 기록은 맨 뒤), 입력한 글자로 걸러 보기 */
let adminUsers=null,adminPick=null;
const userKey=u=>(u.email||'').toLowerCase();
async function adminLoad(){
 if(!adminFind||!adminFind.list)return;
 $('adminMsg').textContent='사용자 목록을 불러오는 중이에요…';
 try{
  adminUsers=(await adminFind.list()).sort((a,b)=>{const x=userKey(a),y=userKey(b);if(!x!==!y)return x?-1:1;return x.localeCompare(y,'en')||String(a.id).localeCompare(String(b.id))});
  $('adminMsg').textContent='';adminList();
 }catch(err){console.error(err);adminUsers=null;$('userList').innerHTML='';$('adminMsg').textContent='목록을 읽지 못했어요. Firestore 보안 규칙에 관리자 읽기 권한이 들어갔는지 확인해 주세요.'}
}
function adminList(){
 if(!adminUsers)return;
 const q=$('adminEmail').value.trim().toLowerCase();
 const shown=adminUsers.filter(u=>!q||userKey(u).includes(q)||(u.name||'').toLowerCase().includes(q));
 const total=d=>Object.values(d.days||{}).reduce((a,v)=>a+(+v||0),0);
 $('userList').innerHTML=shown.length?shown.map(u=>`<button type="button" role="listitem" class="userRow" data-id="${esc(u.id)}" aria-pressed="${u.id===adminPick}"><b>${u.email?esc(u.email):'(이메일 없음)'}</b><span>${esc(u.name||'')}</span><small>${total(u)}문제${u.updated?' · '+new Date(u.updated).toLocaleDateString('ko-KR'):''}</small></button>`).join(''):`<p class="note">${q?'맞는 사용자가 없어요.':'아직 기록을 저장한 사용자가 없어요.'}</p>`;
 $('adminMsg').textContent=`사용자 ${adminUsers.length}명`+(q?` 중 ${shown.length}명`:'');
}
$('userList').addEventListener('click',e=>{
 const b=e.target.closest('.userRow');if(!b||!adminUsers)return;
 const u=adminUsers.find(x=>x.id===b.dataset.id);if(!u)return;
 adminPick=u.id;$$('.userRow').forEach(r=>r.setAttribute('aria-pressed',String(r===b)));
 adminRender(u);$('adminOut').scrollIntoView({behavior:still()?'auto':'smooth',block:'start'});
});
$('adminEmail').addEventListener('input',adminList);
$('adminForm').addEventListener('submit',e=>{e.preventDefault();const rows=$$('.userRow');if(rows.length===1)rows[0].click()});
$('adminReload').addEventListener('click',adminLoad);

/* theme: follows the system until the user picks one */
const dark=matchMedia('(prefers-color-scheme: dark)');
const theme=()=>document.documentElement.dataset.theme||(dark.matches?'dark':'light');
const paintTheme=()=>{const t=theme();$$('#themeSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===t)));paintSw($('themeSw'),['light','dark','mix'].indexOf(t))};
$$('#themeSw button').forEach(b=>b.addEventListener('click',()=>{document.documentElement.dataset.theme=b.dataset.v;try{localStorage.setItem('kana-theme',b.dataset.v)}catch(e){}paintTheme()}));
dark.addEventListener('change',paintTheme);
paintTheme();

paintCfg();paintW();idle();wsGrid();paintFuri();fcPaint();fcIdle();
const h=location.hash.slice(1);tab(TABS.includes(h)?h:'kana',true);
$('syncMsg').textContent='기록은 이 브라우저에 저장돼요. 다른 브라우저로 옮기려면 아래 기록 옮기기를 쓰세요.';

/* hook for sync.js: it reads the store, merges in what the account has, and receives every later save */
window.kanaSync={
 get:()=>JSON.parse(JSON.stringify(store)),
 mergeIn:d=>{store=merge(store,d||{});try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}stats();fcPaint();return JSON.parse(JSON.stringify(store))},
 attach:c=>{cloud=c},
 detach:()=>{cloud=null;clearTimeout(wTimer)},
 status:t=>{$('syncMsg').textContent=t},
 admin:setAdmin
};
}
