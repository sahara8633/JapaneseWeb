{
const P=s=>s.split(' ').map(x=>{const [k,r]=x.split(':');return {k,r}});
const BASE=P('あ:아 い:이 う:우 え:에 お:오 か:카 き:키 く:쿠 け:케 こ:코 さ:사 し:시 す:스 せ:세 そ:소 た:타 ち:치 つ:츠 て:테 と:토 な:나 に:니 ぬ:누 ね:네 の:노 は:하 ひ:히 ふ:후 へ:헤 ほ:호 ま:마 み:미 む:무 め:메 も:모 や:야 ゆ:유 よ:요 ら:라 り:리 る:루 れ:레 ろ:로 わ:와 を:오 ん:응');
const DAK=P('が:가 ぎ:기 ぐ:구 げ:게 ご:고 ざ:자 じ:지 ず:즈 ぜ:제 ぞ:조 だ:다 ぢ:지 づ:즈 で:데 ど:도 ば:바 び:비 ぶ:부 べ:베 ぼ:보 ぱ:파 ぴ:피 ぷ:푸 ぺ:페 ぽ:포');
const YOON=P('きゃ:캬 きゅ:큐 きょ:쿄 しゃ:샤 しゅ:슈 しょ:쇼 ちゃ:차 ちゅ:추 ちょ:초 にゃ:냐 にゅ:뉴 にょ:뇨 ひゃ:햐 ひゅ:휴 ひょ:효 みゃ:먀 みゅ:뮤 みょ:묘 りゃ:랴 りゅ:류 りょ:료 ぎゃ:갸 ぎゅ:규 ぎょ:교 じゃ:쟈 じゅ:쥬 じょ:죠 びゃ:뱌 びゅ:뷰 びょ:뵤 ぴゃ:퍄 ぴゅ:퓨 ぴょ:표');
const LOOK={'ぬ':'めね','め':'ぬあ','ね':'れわぬ','れ':'ねわ','わ':'ねれ','る':'ろ','ろ':'る','さ':'ちき','ち':'さら','き':'さ','は':'ほけ','ほ':'はま','い':'りこ','り':'い','あ':'おめ','お':'あ','し':'つ','つ':'しう','う':'つら','ら':'うち','ま':'もほ','も':'ま','こ':'い','け':'は','な':'た','た':'な','の':'め','ぱ':'ば','ば':'ぱ','ぴ':'び','び':'ぴ','ぷ':'ぶ','ぶ':'ぷ','ぺ':'べ','べ':'ぺ','ぽ':'ぼ','ぼ':'ぽ'};
const ALL=[...BASE,...DAK,...YOON];
const RD={};ALL.forEach(x=>{if(!RD[x.k])RD[x.k]=x.r});
const toK=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x3041&&n<=0x3096?String.fromCharCode(n+0x60):c}).join('');
const toH=s=>[...s].map(c=>{const n=c.charCodeAt(0);return n>=0x30A1&&n<=0x30F6?String.fromCharCode(n-0x60):c}).join('');
const $=id=>document.getElementById(id);
const $$=s=>document.querySelectorAll(s);
const shuf=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const today=()=>new Date().toLocaleDateString('sv');
const KEY='kana-daily-v1';
let store={days:{},miss:{}};
try{const t=JSON.parse(localStorage.getItem(KEY)||'null');if(t&&t.days)store=t}catch(e){}
let cloud=null,wTimer=0,writing=Promise.resolve();
const pushCloud=()=>{if(!cloud)return;clearTimeout(wTimer);wTimer=setTimeout(()=>{const body=JSON.parse(JSON.stringify(store));writing=writing.then(()=>cloud.set(body)).catch(()=>{})},1500)};
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}pushCloud()};
const merge=(a,b)=>{const o={days:{},miss:{}};for(const s of [a,b]){for(const [k,v] of Object.entries(s.days||{}))if(typeof v==='number')o.days[k]=Math.max(o.days[k]||0,v);for(const [k,v] of Object.entries(s.miss||{}))if(typeof v==='number'&&k.length<=3)o.miss[k]=Math.max(o.miss[k]||0,v)}return o};

/* settings: script h|k|mix, mode pick|type, all = "전체" follows the range size */
const SCRIPTS=['h','k','mix'],PRESETS=[10,20,30],SAMPLE={base:'あ',dak:'が',yoon:'きゃ'};
let cfg={n:10,all:false,base:true,dak:false,yoon:false,script:'h',mode:'pick'};
try{const c=JSON.parse(localStorage.getItem(KEY+'-cfg')||'null');if(c){if(!c.script)c.script=c.kata?'k':'h';delete c.kata;if(c.all===undefined)c.all=c.n===46;cfg=Object.assign(cfg,c)}}catch(e){}
if(!SCRIPTS.includes(cfg.script))cfg.script='h';
if(cfg.mode!=='type')cfg.mode='pick';
const saveCfg=()=>{try{localStorage.setItem(KEY+'-cfg',JSON.stringify(cfg))}catch(e){}};
const pickList=()=>[...(cfg.base?BASE:[]),...(cfg.dak?DAK:[]),...(cfg.yoon?YOON:[])];
const count=()=>cfg.all?pickList().length:cfg.n;
const asScript=k=>cfg.script==='k'||(cfg.script==='mix'&&Math.random()<.5)?toK(k):k;
const sample=k=>cfg.script==='k'?toK(k):cfg.script==='mix'?k+toK(k):k;

let qs=[],qi=0,score=0,wrong=[],locked=false,pool=[],idleK=BASE[0];
const show=k=>{['vSetup','vQuiz','vDone'].forEach(v=>$(v).hidden=v!==k)};
const setKana=d=>{const el=$('kana');el.textContent=d;el.classList.toggle('small',[...d].length>1)};
const still=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
/* slide el out to one side, swap its content, slide it back in from the other side */
const slide=(el,dir,swap)=>{
 if(still()||!el.animate){swap();return}
 el.getAnimations().forEach(a=>a.finish());
 const out=el.animate([{transform:'translateX(0)',opacity:1},{transform:`translateX(${-dir*40}px)`,opacity:0}],{duration:140,easing:'ease-in'});
 out.onfinish=()=>{swap();el.animate([{transform:`translateX(${dir*40}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:260,easing:'cubic-bezier(.2,.8,.2,1)'})};
};
const slideIn=(el,dir)=>{if(still()||!el.animate)return;el.animate([{transform:`translateX(${dir*32}px)`,opacity:0},{transform:'translateX(0)',opacity:1}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'})};
const paintSw=(el,i)=>{el.style.setProperty('--n',el.children.length);el.style.setProperty('--i',i)};

function stats(){
 const t=today();$('sToday').textContent=store.days[t]||0;
 let d=new Date(),n=0;if(!store.days[t])d.setDate(d.getDate()-1);
 while(store.days[d.toLocaleDateString('sv')]){n++;d.setDate(d.getDate()-1)}
 $('sStreak').textContent=n+'일';
 const W='일월화수목금토',days=[];const s=new Date();s.setDate(s.getDate()-6);
 for(let i=0;i<7;i++){const k=s.toLocaleDateString('sv'),c=store.days[k]||0;days.push(`<div class="day${c?' on':''}">${W[s.getDay()]}<b>${c}</b></div>`);s.setDate(s.getDate()+1)}
 $('week').innerHTML=days.join('');
 const m=Object.entries(store.miss).sort((a,b)=>b[1]-a[1]).slice(0,10);
 $('misses').innerHTML=m.length?m.map(([k,c])=>`<span class="chip"><b>${k}</b>${RD[k]||RD[toH(k)]||''}<i>${c}번</i></span>`).join(''):'<span style="color:var(--muted)">아직 틀린 글자가 없어요.</span>';
}

/* count pills follow the range: 10/20/30 below the total, then "전체 N" */
function paintCount(){
 const T=pickList().length,pre=PRESETS.filter(n=>n<T);
 if(!cfg.all&&PRESETS.includes(cfg.n)&&cfg.n>=T)cfg.all=true;
 const had=new Set([...$$('#nBtns button')].map(b=>b.dataset.n));
 $('nBtns').innerHTML=[...pre.map(n=>`<button type="button" data-n="${n}">${n}</button>`),`<button type="button" data-n="all">전체 <b>${T}</b></button>`].join('');
 $$('#nBtns button').forEach(b=>{if(had.size&&!had.has(b.dataset.n))b.classList.add('pop')});
 paintPressed();
}
function paintPressed(){
 const custom=!cfg.all&&!PRESETS.includes(cfg.n);
 $$('#nBtns button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.n==='all'?cfg.all:!cfg.all&&+b.dataset.n===cfg.n)));
 $('nIn').classList.toggle('on',custom);
 if(document.activeElement!==$('nIn'))$('nIn').value=custom?cfg.n:'';
 $('start').textContent=`${count()}문제 시작하기`;
 saveCfg();
}
function paintCfg(){
 $$('#kSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===cfg.script)));
 paintSw($('kSw'),SCRIPTS.indexOf(cfg.script));
 $$('#mSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===cfg.mode)));
 paintSw($('mSw'),cfg.mode==='type'?1:0);
 $$('.tile').forEach(t=>{
  const b=t.querySelector('b'),txt=sample(SAMPLE[t.dataset.o]);
  t.setAttribute('aria-pressed',String(cfg[t.dataset.o]));
  b.textContent=txt;b.classList.toggle('long',[...txt].length>2);
  t.querySelectorAll('[data-h]').forEach(el=>el.textContent=cfg.script==='k'?toK(el.dataset.h):el.dataset.h);
 });
 paintCount();
}
function idle(){
 show('vSetup');$('bar').style.width='0';$('stamp').classList.remove('on');
 idleK=BASE[Math.floor(Math.random()*BASE.length)];setKana(asScript(idleK.k));$('cBot').textContent=idleK.r;$('cBot').style.color='var(--muted)';
 $('cTL').textContent='오늘의 글자';$('cTR').textContent='';stats();
}
function build(list,n){
 pool=list;const out=[];
 while(out.length<n)out.push(...shuf(list));
 return out.slice(0,n).map(x=>({k:x.k,r:x.r,d:x.d||asScript(x.k)}));
}
let run=0;
function start(list,n){
 if(!list.length)return;
 run++;qs=build(list,n);qi=0;score=0;wrong=[];show('vQuiz');ask();
}
function options(q){
 const set=new Set([q.r]);
 const look=(LOOK[q.k]||'').split('').map(c=>RD[c]).filter(Boolean);
 for(const r of shuf(look)){if(set.size>=3)break;set.add(r)}
 for(const x of shuf(pool.length>=4?pool:ALL)){if(set.size>=4)break;set.add(x.r)}
 for(const x of shuf(ALL)){if(set.size>=4)break;set.add(x.r)}
 return shuf([...set]);
}
function ask(){
 locked=false;const q=qs[qi];
 if(qi>0)slide($('kana'),1,()=>setKana(q.d));else setKana(q.d);
 $('cBot').textContent='';$('stamp').classList.remove('on');
 $('cTL').textContent=`${qi+1} / ${qs.length}`;$('cTR').textContent=`맞힘 ${score}`;
 $('bar').style.width=(qi/qs.length*100)+'%';
 const typing=cfg.mode==='type';
 $('opts').hidden=typing;$('typeForm').hidden=!typing;
 if(typing){
  const i=$('typeIn');i.value='';i.disabled=false;i.classList.remove('ok','bad');i.focus();
  $('msg').textContent='읽는 법을 한글로 적고 Enter를 누르세요.';
 }else{
  $('opts').innerHTML=options(q).map((r,i)=>`<button type="button" class="opt" data-r="${r}"><span>${i+1}</span>${r}</button>`).join('');
  $('msg').textContent='숫자 키 1~4로도 고를 수 있어요.';
 }
 $('next').hidden=true;
}
function judge(ok,btn){
 if(locked)return;locked=true;
 const q=qs[qi],t=today();
 store.days[t]=(store.days[t]||0)+1;
 $$('.opt').forEach(b=>{if(b.dataset.r===q.r)b.classList.add('ok')});
 if(btn&&!ok)btn.classList.add('bad');
 if(!$('typeForm').hidden){const i=$('typeIn');i.disabled=true;i.classList.add(ok?'ok':'bad')}
 $('cBot').textContent=q.r;
 if(ok){score++;$('cBot').style.color='var(--ok)';$('msg').textContent='정답!';const r=run,i=qi;setTimeout(()=>{if(r===run&&i===qi&&!$('vQuiz').hidden)nextQ()},650)}
 else{wrong.push(q);store.miss[q.d]=(store.miss[q.d]||0)+1;
  $('cBot').style.color='var(--bad)';$('stamp').classList.add('on');
  $('msg').textContent=`${q.d}는 '${q.r}'예요. 다음으로 넘어가려면 Enter.`;$('next').hidden=false;$('next').focus()}
 $('cTR').textContent=`맞힘 ${score}`;save();stats();
}
function nextQ(){
 qi++;if(qi<qs.length){ask();return}
 $('bar').style.width='100%';$('stamp').classList.remove('on');show('vDone');
 const k=$('kana');k.textContent=`${score}/${qs.length}`;k.classList.add('small');
 $('cTL').textContent='결과';$('cTR').textContent='';
 const pct=Math.round(score/qs.length*100);
 $('cBot').style.color=pct>=80?'var(--ok)':'var(--bad)';$('cBot').textContent=pct===100?'다 맞혔어요!':pct+'%';
 $('dTitle').textContent=pct===100?'완벽해요! 내일도 만나요.':pct>=80?'거의 다 왔어요.':'틀린 글자를 한 번 더 봐요.';
 const uniq=[...new Map(wrong.map(w=>[w.d,w])).values()];
 $('dWrongLab').hidden=!uniq.length;
 $('dWrong').innerHTML=uniq.map(w=>`<span class="chip"><b>${w.d}</b>${w.r}</span>`).join('');
 $('retry').hidden=!uniq.length;
}

/* events */
$('nBtns').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.n==='all')cfg.all=true;else{cfg.all=false;cfg.n=+b.dataset.n}paintPressed()});
$('nIn').addEventListener('input',e=>{const v=Math.max(1,Math.min(200,parseInt(e.target.value,10)||0));if(v){cfg.all=false;cfg.n=v;paintPressed()}});
$('nIn').addEventListener('blur',paintPressed);
$$('.tile').forEach(t=>t.addEventListener('click',()=>{
 const o=t.dataset.o;cfg[o]=!cfg[o];
 if(!cfg.base&&!cfg.dak&&!cfg.yoon){cfg[o]=true;t.classList.remove('no');void t.offsetWidth;t.classList.add('no');return}
 paintCfg();
}));
$$('#kSw button').forEach(b=>b.addEventListener('click',()=>{
 const from=SCRIPTS.indexOf(cfg.script),to=SCRIPTS.indexOf(b.dataset.v);if(from===to)return;
 cfg.script=b.dataset.v;paintCfg();
 if(!$('vSetup').hidden)slide($('kana'),to>from?1:-1,()=>setKana(asScript(idleK.k)));
}));
$$('#mSw button').forEach(b=>b.addEventListener('click',()=>{cfg.mode=b.dataset.v;paintCfg()}));
const tab=(name,first)=>{
 const rec=name==='records',was=!$('pRecords').hidden;
 $('pPractice').hidden=rec;$('pRecords').hidden=!rec;
 $('tPractice').setAttribute('aria-selected',String(!rec));$('tRecords').setAttribute('aria-selected',String(rec));
 paintSw($('tabs'),rec?1:0);
 history.replaceState(null,'',rec?'#records':location.pathname+location.search);
 if(rec)stats();
 if(!first&&rec!==was)slideIn(rec?$('pRecords'):$('pPractice'),rec?1:-1);
};
$('tPractice').addEventListener('click',()=>tab('practice'));
$('tRecords').addEventListener('click',()=>tab('records'));
$('start').addEventListener('click',()=>start(pickList(),count()));
$('opts').addEventListener('click',e=>{const b=e.target.closest('.opt');if(b)judge(b.dataset.r===qs[qi].r,b)});
$('typeForm').addEventListener('submit',e=>{e.preventDefault();const v=$('typeIn').value.replace(/\s/g,'');if(!v||locked)return;judge(v===qs[qi].r)});
$('next').addEventListener('click',nextQ);
$('quit').addEventListener('click',()=>{run++;idle()});
$('again').addEventListener('click',idle);
$('retry').addEventListener('click',()=>{const u=[...new Map(wrong.map(w=>[w.d,w])).values()];start(u,u.length)});
document.addEventListener('keydown',e=>{
 if($('vQuiz').hidden||$('pPractice').hidden||e.isComposing)return;
 if(!locked&&cfg.mode==='pick'&&/^[1-4]$/.test(e.key)){const b=$$('.opt')[+e.key-1];if(b)judge(b.dataset.r===qs[qi].r,b)}
 else if(e.key==='Enter'&&!$('next').hidden){e.preventDefault();nextQ()}
});
$('exp').addEventListener('click',async()=>{const code=btoa(unescape(encodeURIComponent(JSON.stringify(store))));$('moveTxt').value=code;try{await navigator.clipboard.writeText(code);$('moveMsg').textContent='복사했어요. 새 브라우저에서 붙여 넣으세요.'}catch(e){$('moveTxt').select();$('moveMsg').textContent='칸에 나온 코드를 직접 복사하세요 (Ctrl+C).'}});
$('imp').addEventListener('click',()=>{try{const d=JSON.parse(decodeURIComponent(escape(atob($('moveTxt').value.trim()))));if(!d||typeof d!=='object')throw 0;store=merge(store,d);save();stats();$('moveMsg').textContent='불러왔어요. 기록이 합쳐졌어요.'}catch(e){$('moveMsg').textContent='코드가 올바르지 않아요. 다시 복사해 주세요.'}});
/* theme: follows the system until the user picks one */
const dark=matchMedia('(prefers-color-scheme: dark)');
const theme=()=>document.documentElement.dataset.theme||(dark.matches?'dark':'light');
const paintTheme=()=>{const t=theme();$$('#themeSw button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.v===t)));paintSw($('themeSw'),['light','dark','mix'].indexOf(t))};
$$('#themeSw button').forEach(b=>b.addEventListener('click',()=>{document.documentElement.dataset.theme=b.dataset.v;try{localStorage.setItem('kana-theme',b.dataset.v)}catch(e){}paintTheme()}));
dark.addEventListener('change',paintTheme);
paintTheme();

paintCfg();idle();tab(location.hash==='#records'?'records':'practice',true);
$('syncMsg').textContent='기록은 이 브라우저에 저장돼요. 다른 브라우저로 옮기려면 아래 기록 옮기기를 쓰세요.';

/* hook for sync.js: it reads the store, merges in what the account has, and receives every later save */
window.kanaSync={
 get:()=>JSON.parse(JSON.stringify(store)),
 mergeIn:d=>{store=merge(store,d||{});try{localStorage.setItem(KEY,JSON.stringify(store))}catch(e){}stats();return JSON.parse(JSON.stringify(store))},
 attach:c=>{cloud=c},
 detach:()=>{cloud=null;clearTimeout(wTimer)},
 status:t=>{$('syncMsg').textContent=t}
};
document.dispatchEvent(new Event('kanasync-ready'));
}
