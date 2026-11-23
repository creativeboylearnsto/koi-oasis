/* Koi Oasis app: tasks earn pearls, pearls buy koi and decor, the pond shows it all. Everything stays on this phone. */
(function(){
const E=window.KoiEngine;
const LS='koi-oasis-v1';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const dkey=d=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const today=()=>dkey(new Date());
const fmtDay=k=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString([], {month:'short',day:'numeric'})};
const daysBetween=(a,b)=>{const p=s=>{const [y,m,d]=s.split('-').map(Number);return Date.UTC(y,m-1,d)};return Math.round((p(b)-p(a))/864e5)};

/* ---------- catalogue ---------- */
const KOI_ORDER=['yamabuki','orenji','hariwake','doitsu','ginrin','butterfly'];
const DECOR=[
  {id:'pad',name:'Lily pad',price:10,max:24,note:'A floating pad for the koi to hide under.'},
  {id:'wlily',name:'Water lily',price:25,max:10,note:'A pad with a white bloom.'},
  {id:'lotus',name:'Pink lotus',price:40,max:8,note:'A pad with a pink lotus flower.'},
  {id:'reeds',name:'Reeds and iris',price:60,once:true,note:'A reed bed with blue iris in the top corner.'},
  {id:'rocks',name:'Mossy rocks',price:50,once:true,note:'Three stones with moss.'},
  {id:'lantern',name:'Stone lantern',price:150,once:true,needs:'rocks',note:'Sits on the rocks and glows from dusk.'},
  {id:'bridge',name:'Wooden bridge',price:250,once:true,note:'Spans the lower pond.'}
];
const NAMES=['Hana','Sora','Kin','Momo','Yuki','Ren','Mizu','Hoshi','Nami','Kaze','Mochi','Taiyo','Kumo','Aki','Natsu','Haru','Riku','Umi','Tama','Koko','Sumi','Hikari'];
const SUGGEST=[
  {name:'Meditate 30 min',timed:true,minutes:30},
  {name:'Read 20 pages',timed:false,pearls:20},
  {name:'Walk outside 15 min',timed:false,pearls:15},
  {name:'Journal 10 min',timed:false,pearls:10},
  {name:'Drink 8 glasses of water',timed:false,pearls:10}
];
const MAX_KOI=12;

/* ---------- state ---------- */
function fresh(){const now=Date.now();return {v:1,created:now,createdDay:today(),pearls:0,earned:0,tasks:[],log:[],
  koi:[{id:uid(),v:'orenji',name:'Hana',boughtAt:now,boughtDay:today(),note:'Your first koi',bonus:14}],
  decor:{items:['pad','pad','pad'],reeds:false,rocks:false,lantern:false,bridge:false},days:[],settings:{sound:true,water:true},seed:1+Math.floor(Math.random()*9000),activeSit:null}}
function load(){try{const s=JSON.parse(localStorage.getItem(LS));if(s&&s.v===1)return s}catch(e){}return fresh()}
function save(){try{localStorage.setItem(LS,JSON.stringify(S))}catch(e){}}
let S=load();

const doneToday=t=>S.log.some(l=>l.taskId===t.id&&l.day===today());
const visibleTasks=()=>S.tasks.filter(t=>!t.archived&&(t.repeat==='daily'||!S.log.some(l=>l.taskId===t.id&&l.day!==today())));
function markActive(){const d=today();if(!S.days.includes(d))S.days.push(d)}
function koiStage(k){const n=S.days.filter(d=>d>k.boughtDay).length+(k.bonus||0);return n<14?{stage:'fry',label:'Fry',next:14-n,to:'young'}:n<42?{stage:'young',label:'Young',next:42-n,to:'adult'}:{stage:'adult',label:'Adult',next:0}}
function koiL(k){const st=koiStage(k).stage;return E.SIZES[st][k.v==='butterfly'?'bfly':'std']}
const koiList=()=>S.koi.map(k=>({id:k.id,v:k.v,L:koiL(k)}));
function layout(){const D=S.decor,P=D.pos||{};const pp=P.pads||{};
  return {pads:D.items.map((t,i)=>Object.assign({flower:t==='wlily'?'white':t==='lotus'?'lotus':null},pp[i]?{x:pp[i].x,y:pp[i].y}:{})),
    reeds:D.reeds&&(P.reeds?{x:P.reeds.x,y:P.reeds.y,w:.4,h:.2}:true),rocks:D.rocks&&(P.rocks||true),lantern:D.lantern,
    bridge:D.bridge&&(P.bridge?{x:P.bridge.x,y:P.bridge.y,len:.84}:true),moon:false}}
function haze(){const last=S.days.length?S.days[S.days.length-1]:S.createdDay;const gap=daysBetween(last,today());return gap<2?0:gap===2?.25:gap===3?.4:.55}

/* ---------- icons ---------- */
const ICONS={
  pearl:{rows:["..ooo..",".obbbo.","obwwbbo","obwbbso","obbbsso",".ossso.","..ooo.."],map:{o:'#6c6494',b:'#e6e0f4',w:'#ffffff',s:'#b8aed8'},s:2},
  checkOn:{rows:["ooooooo","o....ko","o...k.o","ok.k..o","o.k...o","o.....o","ooooooo"],map:{o:'#f2c02e',k:'#f2c02e'},s:3},
  checkOff:{rows:["ooooooo","o.....o","o.....o","o.....o","o.....o","o.....o","ooooooo"],map:{o:'#9fb6b0'},s:3},
  today:{rows:["ooooooooo","o.......o","o.....k.o","o....k..o","ok..k...o","o.kk....o","o.......o","ooooooooo"],map:{o:'currentColor',k:'currentColor'},s:2},
  sit:{rows:["....p....","...ppp...",".p.ppp.p.","ppp.p.ppp",".ppppppp.","..ppppp..","ggggggggg"],map:{p:'currentColor',g:'currentColor'},s:2},
  fish:{rows:["..KKKK..K.",".KOOOOKKOK","KOEOOOOOOK",".KOOOOKKOK","..KKKK..K."],map:{K:'currentColor',O:'currentColor'},s:2}
};
function icon(name,scale){const I=ICONS[name],h=I.rows.length,w=I.rows[0].length,sc=scale||I.s;let r='';I.rows.forEach((row,y)=>[...row].forEach((ch,x)=>{const c=I.map[ch];if(c)r+=`<rect x="${x}" y="${y}" width="1" height="1" fill="${c}"/>`}));return `<svg viewBox="0 0 ${w} ${h}" width="${w*sc}" height="${h*sc}" shape-rendering="crispEdges" aria-hidden="true">${r}</svg>`}
function paintIcons(root){(root||document).querySelectorAll('[data-icon]').forEach(el=>{if(!el.firstChild)el.innerHTML=icon(el.dataset.icon)})}

/* ---------- sound ---------- */
let AC=null,water=null;
function ac(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){}}if(AC&&AC.state==='suspended')AC.resume();return AC}
function tone(freq,dur,gain,type,delay){const a=ac();if(!a||!S.settings.sound)return;const t=a.currentTime+(delay||0);const o=a.createOscillator(),g=a.createGain();o.type=type||'sine';o.frequency.setValueAtTime(freq,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(gain,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g).connect(a.destination);o.start(t);o.stop(t+dur+.05)}
function blip(){tone(880,.18,.08,'sine');tone(1320,.22,.05,'sine',.07)}
function chime(){[523.25,784,1046.5,1568].forEach((f,i)=>tone(f,3.2-i*.5,.09/(i+1),'sine',i*.02));tone(392,3.6,.05,'sine',.4)}
function waterOn(){const a=ac();if(!a||!S.settings.sound||!S.settings.water||water)return;const len=a.sampleRate*3,b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.2}
  const src=a.createBufferSource();src.buffer=b;src.loop=true;const f=a.createBiquadFilter();f.type='lowpass';f.frequency.value=700;const g=a.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.18,a.currentTime+2);
  const lfo=a.createOscillator(),lg=a.createGain();lfo.frequency.value=.08;lg.gain.value=250;lfo.connect(lg).connect(f.frequency);lfo.start();src.connect(f).connect(g).connect(a.destination);src.start();water={src,g,lfo}}
function waterOff(){if(!water||!AC)return;const w=water;water=null;w.g.gain.cancelScheduledValues(AC.currentTime);w.g.gain.setValueAtTime(w.g.gain.value,AC.currentTime);w.g.gain.linearRampToValueAtTime(0,AC.currentTime+1.2);setTimeout(()=>{try{w.src.stop();w.lfo.stop()}catch(e){}},1400)}

/* ---------- pond ---------- */
const cv=$('#pond');let pond,scale=3;
const extra=[];
function buildPond(){
  // Some launches report a zero-size window for a moment; fall back to the screen size so the pond always builds.
  const W=Math.max(innerWidth||0,document.documentElement.clientWidth||0)||screen.width||390;
  let H=Math.max(innerHeight||0,document.documentElement.clientHeight||0,window.visualViewport?visualViewport.height:0)||screen.height||844;
  lastW=W;lastH=H;
  // Home-screen apps on iPhone report a window shorter than the screen (it stops above the home bar).
  // Draw the pond as tall as the whole screen so it runs edge to edge, under the home bar too.
  const standalone=(window.matchMedia&&matchMedia('(display-mode: standalone)').matches)||navigator.standalone;
  if(standalone&&H>=W)H=Math.max(H,Math.max(screen.width,screen.height));
  H+=2;scale=Math.max(2,Math.round(W/135));
  cv.width=Math.ceil(W/scale);cv.height=Math.ceil(H/scale);cv.style.width=cv.width*scale+'px';cv.style.height=cv.height*scale+'px';
  pond=new E.Pond(cv,{seed:S.seed,koi:koiList(),layout:layout()});pond.haze=haze();pond.step(0);
  paintBg();
}
function paintBg(){if(!pond)return;const c=pond.pal.water[0];const col=`rgb(${c[0]},${c[1]},${c[2]})`;document.documentElement.style.background=col;document.body.style.background=col;const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',col)}
function refreshPond(){pond.syncKoi(koiList());pond.setLayout(layout());pond.haze=haze()}
let lastW=0,lastH=0,rz;
addEventListener('resize',()=>{clearTimeout(rz);rz=setTimeout(()=>{if(innerWidth&&innerHeight&&(Math.abs(innerWidth-lastW)>40||Math.abs(innerHeight-lastH)>120))buildPond()},250)});
function toPond(e){const r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*cv.width,y:(e.clientY-r.top)/r.height*cv.height}}
cv.addEventListener('pointerdown',e=>{ac();if(sitState)return;const p=toPond(e);
  if(arranging){const hit=pond.decorAt(p.x,p.y);if(hit){const a=pond.decorAnchor(hit);drag={hit,sx:p.x/pond.w,sy:p.y/pond.h,ax:a.x,ay:a.y};pond.hl=hit;try{cv.setPointerCapture(e.pointerId)}catch(_){}}else pond.ripple(p.x,p.y,.6);return}
  if(!$('#sheet').hidden){closeSheet();return}const k=pond.hitKoi(p.x,p.y);if(k){openKoi(k.key);return}pond.poke(p.x,p.y)});
cv.addEventListener('pointermove',e=>{if(!arranging||!drag)return;e.preventDefault();const p=toPond(e);
  const nx=clamp01(drag.ax+p.x/pond.w-drag.sx,drag.hit.kind==='bridge'?.82:drag.hit.kind==='reeds'?.4:0),ny=clamp01(drag.ay+p.y/pond.h-drag.sy,0);
  setPos(drag.hit,nx,ny);if(!moveQueued){moveQueued=true;requestAnimationFrame(()=>{moveQueued=false;pond.setLayout(layout())})}});
const endDrag=()=>{if(drag){drag=null;save();pond.setLayout(layout())}};
cv.addEventListener('pointerup',endDrag);cv.addEventListener('pointercancel',endDrag);

const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let last=performance.now();
// The pond always animates: the swimming koi are the content. Reduce Motion only calms the pond.
// iPhone Safari can hold back animation frames until the first tap, so a timer keeps the pond going if frames stall.
let lastRaf=0;
function tick(now){if(document.hidden||!pond)return;const el=now-last;if(el<1000/15)return;const dt=Math.min(.15,el/1000);last=now;
  pond.speed=sitState?.55:reduce?.6:1;pond.step(dt);for(const p of extra)if(p.cv.isConnected)p.step(dt)}
function loop(now){requestAnimationFrame(loop);lastRaf=performance.now();tick(lastRaf)}
setInterval(()=>{const n=performance.now();if(n-lastRaf>250)tick(n)},66);
/* ---------- Arrange mode ---------- */
let arranging=false,drag=null,moveQueued=false;
const clamp01=(v,reserve)=>Math.max(.02,Math.min(.98-reserve,v));
function setPos(hit,x,y){const D=S.decor;D.pos=D.pos||{};
  if(hit.kind==='pad'){D.pos.pads=D.pos.pads||{};D.pos.pads[hit.i]={x,y}}else D.pos[hit.kind]={x,y}}
function startArrange(hl){closeSheet();closeModal();arranging=true;drag=null;document.body.classList.add('arranging');
  $('#arrange').hidden=false;$('.tabs').hidden=true;pond.hl=hl||null;pond.target=null}
function endArrange(){arranging=false;drag=null;document.body.classList.remove('arranging');$('#arrange').hidden=true;$('.tabs').hidden=false;pond.hl=null;save();pond.setLayout(layout());toast('Pond saved')}
$('#arrDone').addEventListener('click',endArrange);
$('#arrReset').addEventListener('click',()=>{$('#arrReset').hidden=true;$('#arrConfirm').hidden=false});
$('#arrNo').addEventListener('click',()=>{$('#arrReset').hidden=false;$('#arrConfirm').hidden=true});
$('#arrYes').addEventListener('click',()=>{S.decor.pos={};save();pond.hl=null;pond.setLayout(layout());$('#arrReset').hidden=false;$('#arrConfirm').hidden=true;toast('Decor back in its starting spots')});

/* ---------- UI helpers ---------- */
let toastT;
function toast(html,high){const t=$('#toast');t.innerHTML=html;t.classList.toggle('high',!!high);paintIcons(t);t.classList.add('show');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('show'),2200)}
function updatePearls(){$('#pearls').textContent=S.pearls}
let tab=null;
function openTab(name){if(tab===name&&!$('#sheet').hidden){closeSheet();return}tab=name;document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current',b.dataset.tab===name?'true':'false'));$('#sheet').hidden=false;render()}
function closeSheet(){$('#sheet').hidden=true;tab=null;extra.length=0;document.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-current','false'))}
function render(){extra.length=0;const b=$('#sheetBody');b.innerHTML=({today:vToday,sit:vSit,shop:vShop,koi:vKoi})[tab]();paintIcons(b);after[tab]&&after[tab]()}
const after={};
function modal(html,onMount){const m=$('#modal'),c=$('#modalCard');c.innerHTML=html;paintIcons(c);m.hidden=false;onMount&&onMount(c)}
function closeModal(){$('#modal').hidden=true}
$('#modal').addEventListener('pointerdown',e=>{if(e.target.id==='modal')closeModal()});
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{ac();openTab(b.dataset.tab)}));
$('#pearlPill').addEventListener('click',openHistory);

/* ---------- Today ---------- */
function vToday(){
  const ts=visibleTasks(),done=ts.filter(doneToday).length;
  let h=`<div class="sh-head"><h2>Today</h2><span class="muted">${ts.length?`${done} of ${ts.length} done`:''}</span></div>`;
  if(ts.length)h+=`<div class="pips">${ts.map(t=>`<i class="${doneToday(t)?'on':''}"></i>`).join('')}</div>`;
  if(!ts.length)h+=`<p class="empty">Add the things you want to do. Each one you finish drops pearls into the pond. Try one of these:</p><div class="chips">${SUGGEST.map((s,i)=>`<button class="chip" data-sug="${i}">${esc(s.name)}</button>`).join('')}</div>`;
  h+=`<ul class="tasks">${ts.map(t=>{const d=doneToday(t);const meta=(t.repeat==='daily'?'Every day':'Once')+(t.timed?` · ${t.minutes} min timer`:'');
    const lead=t.timed&&!d?`<button class="tick" data-start="${t.id}" aria-label="Start ${esc(t.name)}"><span class="ico" data-icon="checkOff"></span></button>`:`<button class="tick" data-tick="${t.id}" aria-pressed="${d}" aria-label="${d?'Undo':'Done'}: ${esc(t.name)}"><span class="ico" data-icon="${d?'checkOn':'checkOff'}"></span></button>`;
    const tail=t.timed&&!d?`<button class="start" data-start="${t.id}">Start</button>`:`<span class="rew">+${t.pearls}<span class="ico" data-icon="pearl"></span></span>`;
    return `<li class="task${d?' done':''}">${lead}<button class="tname" data-edit="${t.id}"><b>${esc(t.name)}</b><small>${meta}</small></button>${tail}</li>`}).join('')}</ul>`;
  const ideas=SUGGEST.map((x,i)=>[x,i]).filter(([x])=>!S.tasks.some(t=>!t.archived&&t.name===x.name));
  if(ts.length&&ts.length<6&&ideas.length)h+=`<p class="hint" style="margin:14px 0 8px">More ideas</p><div class="chips">${ideas.map(([x,i])=>`<button class="chip" data-sug="${i}">${esc(x.name)}</button>`).join('')}</div>`;
  h+=`<button class="btn ghost block add" id="addTask">Add a task</button>`;
  return h;
}
after.today=()=>{
  const b=$('#sheetBody');
  b.querySelectorAll('[data-tick]').forEach(el=>el.addEventListener('click',()=>toggleTask(el.dataset.tick)));
  b.querySelectorAll('[data-start]').forEach(el=>el.addEventListener('click',()=>{const t=S.tasks.find(x=>x.id===el.dataset.start);startSit(t.minutes,t.id)}));
  b.querySelectorAll('[data-edit]').forEach(el=>el.addEventListener('click',()=>editTask(el.dataset.edit)));
  b.querySelectorAll('[data-sug]').forEach(el=>el.addEventListener('click',()=>{const s=SUGGEST[+el.dataset.sug];addTask({name:s.name,timed:s.timed,minutes:s.minutes||null,pearls:s.timed?s.minutes:s.pearls,repeat:'daily'})}));
  $('#addTask').addEventListener('click',()=>editTask(null));
};
function addTask(t){S.tasks.push(Object.assign({id:uid(),createdAt:Date.now(),archived:false},t));save();render()}
function award(name,pearls,taskId){
  S.log.push({id:uid(),taskId:taskId||null,name,pearls,day:today(),at:Date.now()});S.pearls+=pearls;S.earned+=pearls;markActive();save();updatePearls();
  pond.haze=0;pond.drop('pearl',Math.min(10,Math.max(3,Math.ceil(pearls/5))));blip();toast(`+${pearls} <span class="ico" data-icon="pearl"></span> ${esc(name)}`,true);
}
function toggleTask(id){
  const t=S.tasks.find(x=>x.id===id);if(!t)return;
  if(doneToday(t)){const i=S.log.findIndex(l=>l.taskId===id&&l.day===today());const l=S.log[i];
    if(S.pearls<l.pearls){toast('Those pearls are already spent, so this stays done.');return}
    S.log.splice(i,1);S.pearls-=l.pearls;S.earned-=l.pearls;if(!S.log.some(x=>x.day===today()))S.days=S.days.filter(d=>d!==today());save();updatePearls();render();return}
  award(t.name,t.pearls,t.id);render();
}
function editTask(id){
  const t=id?S.tasks.find(x=>x.id===id):{name:'',timed:false,minutes:20,pearls:10,repeat:'daily'};
  let timed=!!t.timed,repeat=t.repeat||'daily',touched=!!id;
  modal(`<h2>${id?'Edit task':'New task'}</h2>
    <div class="field"><label for="fName">Task</label><input id="fName" maxlength="60" value="${esc(t.name)}" placeholder="Meditate, read, stretch…" autocomplete="off"></div>
    <div class="field"><label>Type</label><div class="seg" id="fType"><button data-v="0" aria-pressed="${!timed}">Tick it off</button><button data-v="1" aria-pressed="${timed}">With a timer</button></div></div>
    <div class="field" id="fMinWrap" ${timed?'':'hidden'}><label for="fMin">Minutes</label><input id="fMin" type="number" inputmode="numeric" min="1" max="180" value="${t.minutes||20}"></div>
    <div class="field"><label>Repeats</label><div class="seg" id="fRep"><button data-v="daily" aria-pressed="${repeat==='daily'}">Every day</button><button data-v="once" aria-pressed="${repeat==='once'}">Just once</button></div></div>
    <div class="field"><label for="fPearls">Pearls when done</label><input id="fPearls" type="number" inputmode="numeric" min="1" max="500" value="${t.pearls||10}"><span class="hint">Timed tasks start at one pearl per minute.</span></div>
    <p class="hint" id="fErr" hidden></p>
    <div class="row"><button class="btn ghost" id="fCancel">Cancel</button><button class="btn primary" id="fSave">${id?'Save':'Add task'}</button></div>
    ${id?'<button class="btn danger block" id="fDel">Delete task</button>':''}`,c=>{
    const seg=(sel,fn)=>c.querySelectorAll(sel+' button').forEach(b=>b.addEventListener('click',()=>{c.querySelectorAll(sel+' button').forEach(x=>x.setAttribute('aria-pressed',x===b?'true':'false'));fn(b.dataset.v)}));
    seg('#fType',v=>{timed=v==='1';c.querySelector('#fMinWrap').hidden=!timed;if(timed&&!touched)c.querySelector('#fPearls').value=c.querySelector('#fMin').value});
    seg('#fRep',v=>{repeat=v});
    c.querySelector('#fMin').addEventListener('input',e=>{if(!touched)c.querySelector('#fPearls').value=e.target.value});
    c.querySelector('#fPearls').addEventListener('input',()=>{touched=true});
    c.querySelector('#fCancel').addEventListener('click',closeModal);
    c.querySelector('#fSave').addEventListener('click',()=>{
      const name=c.querySelector('#fName').value.trim(),mins=Math.round(+c.querySelector('#fMin').value),pearls=Math.round(+c.querySelector('#fPearls').value);
      const err=c.querySelector('#fErr');
      if(!name){err.hidden=false;err.textContent='Give the task a name.';return}
      if(timed&&!(mins>=1&&mins<=180)){err.hidden=false;err.textContent='Minutes need to be between 1 and 180.';return}
      if(!(pearls>=1&&pearls<=500)){err.hidden=false;err.textContent='Pearls need to be between 1 and 500.';return}
      const data={name,timed,minutes:timed?mins:null,pearls,repeat};
      if(id)Object.assign(t,data);else S.tasks.push(Object.assign({id:uid(),createdAt:Date.now(),archived:false},data));
      save();closeModal();render()});
    if(id)c.querySelector('#fDel').addEventListener('click',()=>{t.archived=true;save();closeModal();render();toast('Task deleted. Pearls you earned stay.')});
    if(!id)setTimeout(()=>c.querySelector('#fName').focus(),60);
  });
}

/* ---------- Sit ---------- */
let sitMinutes=10,sitState=null,sitTimer=null,wake=null;
function vSit(){
  const linked=S.tasks.filter(t=>!t.archived&&t.timed&&!doneToday(t));
  return `<div class="sh-head"><h2>Sit</h2><span class="muted">1 pearl per minute</span></div>
  <p class="empty">The pond dims and slows while you sit. When the bell rings, you feed the koi.</p>
  <div class="chips" id="sitDur">${[5,10,15,20,30,45].map(m=>`<button class="chip" data-m="${m}" aria-pressed="${m===sitMinutes}">${m} min</button>`).join('')}</div>
  ${linked.length?`<p class="hint" style="margin-top:10px">A sit of ${linked.map(t=>t.minutes+' min ticks off “'+esc(t.name)+'”').join(', ')}.</p>`:''}
  <div class="setting" style="margin-top:12px"><span>Water sound</span><button class="chip" id="sitWater" aria-pressed="${S.settings.water}">${S.settings.water?'On':'Off'}</button></div>
  <button class="btn primary block" id="sitGo" style="margin-top:8px">Start ${sitMinutes} min sit</button>`;
}
after.sit=()=>{
  document.querySelectorAll('#sitDur .chip').forEach(b=>b.addEventListener('click',()=>{sitMinutes=+b.dataset.m;render()}));
  $('#sitWater').addEventListener('click',()=>{S.settings.water=!S.settings.water;save();render()});
  $('#sitGo').addEventListener('click',()=>{const t=S.tasks.find(t=>!t.archived&&t.timed&&!doneToday(t)&&t.minutes===sitMinutes);startSit(sitMinutes,t&&t.id)});
};
async function lockWake(){try{wake=await navigator.wakeLock.request('screen')}catch(e){wake=null}}
function startSit(minutes,taskId,startAt){
  closeSheet();closeModal();
  const t=taskId&&S.tasks.find(x=>x.id===taskId);
  sitState={minutes,taskId:taskId||null,start:startAt||Date.now(),label:t?t.name:`Sit ${minutes} min`};
  S.activeSit={minutes,taskId:sitState.taskId,start:sitState.start};save();
  $('#sit').hidden=false;$('.top').hidden=true;$('.tabs').hidden=true;$('#sitLabel').textContent=sitState.label;
  pond.dim=.55;pond.speed=.55;lockWake();waterOn();chime();
  showSitActions('run');tickSit();sitTimer=setInterval(tickSit,250);
}
function tickSit(){
  if(!sitState)return;const total=sitState.minutes*60,el=(Date.now()-sitState.start)/1000,left=Math.max(0,total-el);
  $('#sitTime').textContent=String(Math.floor(left/60)).padStart(2,'0')+':'+String(Math.floor(left%60)).padStart(2,'0');
  const phase=Math.floor(el/5)%2;const br=$('#sitBreath');const txt=phase?'Breathe out':'Breathe in';if(br.textContent!==txt){br.textContent=txt;if(!phase)pond.ripple(pond.w/2,pond.h*.42,1.4)}
  if(left<=0)finishSit();
}
function showSitActions(mode){
  const a=$('#sitActions');
  if(mode==='run'){a.innerHTML=`<button class="btn ghost" id="sitEnd">End early</button>`;$('#sitEnd').onclick=()=>showSitActions('confirm')}
  else if(mode==='confirm'){a.innerHTML=`<span class="hint">End now? Pearls are only given for a full sit.</span><div class="row"><button class="btn ghost" id="sitKeep">Keep sitting</button><button class="btn danger" id="sitStop">End sit</button></div>`;$('#sitKeep').onclick=()=>showSitActions('run');$('#sitStop').onclick=()=>endSit(false)}
  else if(mode==='done'){a.innerHTML=`<button class="btn primary" id="sitFeed">Feed the koi</button>`;$('#sitFeed').onclick=()=>endSit(true)}
}
function finishSit(){clearInterval(sitTimer);sitTimer=null;$('#sitTime').textContent='Done';$('#sitBreath').textContent=`+${sitState.minutes} pearls`;chime();waterOff();showSitActions('done');S.activeSit=null;save();sitState.complete=true}
function endSit(complete){
  clearInterval(sitTimer);sitTimer=null;waterOff();try{wake&&wake.release()}catch(e){}wake=null;
  const st=sitState;sitState=null;S.activeSit=null;save();
  $('#sit').hidden=true;$('.top').hidden=false;$('.tabs').hidden=false;pond.dim=1;pond.speed=1;
  if(complete&&st&&st.complete){pond.drop('food',12,{x:pond.w*.3,y:pond.h*.3,w:pond.w*.4,h:pond.h*.25});
    const t=st.taskId&&S.tasks.find(x=>x.id===st.taskId);
    if(t&&!doneToday(t))award(t.name,t.pearls,t.id);else award(st.label,st.minutes,null)}
}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sitState){tickSit();if(!wake)lockWake()}});

/* ---------- Shop ---------- */
let shopTab='koi';
function vShop(){
  let h=`<div class="sh-head"><h2>Shop</h2><span class="rew">${S.pearls}<span class="ico" data-icon="pearl"></span></span></div>
  <div class="seg" id="shopSeg" style="margin-bottom:12px"><button data-v="koi" aria-pressed="${shopTab==='koi'}">Koi</button><button data-v="decor" aria-pressed="${shopTab==='decor'}">Decor</button></div><div class="shop-grid">`;
  if(shopTab==='koi'){const full=S.koi.length>=MAX_KOI;
    for(const v of KOI_ORDER){const V=E.VAR[v];const need=V.price-S.pearls;
      h+=`<div class="item"><canvas data-prev-koi="${v}" width="56" height="30"></canvas><b>${V.name}</b><div class="meta"><span class="rar ${V.rarity}">${V.rarity}</span><span class="rew">${V.price}<span class="ico" data-icon="pearl"></span></span></div>
      <button class="btn ${need<=0&&!full?'primary':'ghost'}" data-buy-koi="${v}" ${need>0||full?'disabled':''}>${full?'Pond is full':need>0?`Need ${need} more`:'Buy'}</button></div>`}}
  else{h=h.replace('<div class="shop-grid">',`<button class="btn ghost block" id="openArrange" style="margin-bottom:12px">Arrange pond</button><div class="shop-grid">`);
    for(const D of DECOR){const own=D.once?S.decor[D.id]:S.decor.items.filter(x=>x===D.id).length;const maxed=D.once?own:own>=D.max;const locked=D.needs&&!S.decor[D.needs];const need=D.price-S.pearls;
      const label=maxed?(D.once?'In your pond':'Pond is full'):locked?'Needs mossy rocks':need>0?`Need ${need} more`:'Buy';
      h+=`<div class="item"><canvas data-prev-decor="${D.id}" width="56" height="40"></canvas><b>${D.name}</b><div class="meta"><span>${D.once?'':own?own+' in pond':''}</span><span class="rew">${D.price}<span class="ico" data-icon="pearl"></span></span></div>
      <button class="btn ${label==='Buy'?'primary':'ghost'}" data-buy-decor="${D.id}" ${label==='Buy'?'':'disabled'}>${label}</button></div>`}}
  return h+'</div>';
}
after.shop=()=>{
  document.querySelectorAll('#shopSeg button').forEach(b=>b.addEventListener('click',()=>{shopTab=b.dataset.v;render()}));
  document.querySelectorAll('[data-prev-koi]').forEach(c=>{const p=new E.Pond(c,{time:'auto',seed:3,koi:[{id:'prev-'+c.dataset.prevKoi,v:c.dataset.prevKoi,pose:{x:.5,y:.5,ang:Math.PI}}],layout:{particles:null,mist:false,moon:false}});p.step(0);extra.push(p)});
  const DL={pad:{pads:[{x:.3,y:.4,r:6},{x:.65,y:.6,r:7},{x:.75,y:.25,r:4}]},wlily:{pads:[{x:.5,y:.5,r:7,flower:'white'},{x:.22,y:.3,r:4}]},lotus:{pads:[{x:.5,y:.5,r:7,flower:'lotus'},{x:.78,y:.7,r:4}]},reeds:{reeds:{x:.15,y:.15,w:.7,h:.8}},rocks:{rocks:{x:.5,y:.5}},lantern:{rocks:{x:.5,y:.66},lantern:true},bridge:{bridge:{x:.06,y:.4,len:.88}}};
  document.querySelectorAll('[data-prev-decor]').forEach(c=>{const id=c.dataset.prevDecor;const p=new E.Pond(c,{time:id==='lantern'?'night':'auto',seed:21,layout:Object.assign({particles:null,mist:false,moon:false},DL[id])});p.step(0);extra.push(p)});
  document.querySelectorAll('[data-buy-koi]').forEach(b=>b.addEventListener('click',()=>buyKoi(b.dataset.buyKoi)));
  document.querySelectorAll('[data-buy-decor]').forEach(b=>b.addEventListener('click',()=>buyDecor(b.dataset.buyDecor)));
  const oa=$('#openArrange');if(oa)oa.addEventListener('click',()=>startArrange(null));
};
function buyKoi(v){
  const V=E.VAR[v];if(S.pearls<V.price||S.koi.length>=MAX_KOI)return;
  const used=new Set(S.koi.map(k=>k.name));const name=NAMES.find(n=>!used.has(n))||('Koi '+(S.koi.length+1));
  const lastLog=S.log[S.log.length-1];
  const k={id:uid(),v,name,boughtAt:Date.now(),boughtDay:today(),note:lastLog?`Earned after “${lastLog.name}”`:'A gift to yourself'};
  S.pearls-=V.price;S.koi.push(k);save();updatePearls();closeSheet();refreshPond();
  const fish=pond.koi.find(x=>x.key===k.id);if(fish)pond.ripple(fish.p[0].x,fish.p[0].y,1.2);
  chime();toast(`Welcome, ${esc(name)}`,true);
}
function buyDecor(id){
  const D=DECOR.find(d=>d.id===id);if(!D||S.pearls<D.price)return;
  if(D.once){if(S.decor[id])return;S.decor[id]=true}else{if(S.decor.items.filter(x=>x===id).length>=D.max)return;S.decor.items.push(id)}
  S.pearls-=D.price;save();updatePearls();closeSheet();refreshPond();blip();
  const hl=D.once?{kind:id==='lantern'?'rocks':id}:{kind:'pad',i:S.decor.items.length-1};
  startArrange(hl);toast(`Drag your ${esc(D.name.toLowerCase())} where you like`,true);
}

/* ---------- Koi journal ---------- */
function vKoi(){
  return `<div class="sh-head"><h2>Your koi</h2><span class="muted">${S.koi.length} of ${MAX_KOI}</span></div>
  <div class="stats"><div class="stat"><b>${S.days.length}</b><span>days you showed up</span></div><div class="stat"><b>${S.earned}</b><span>pearls earned</span></div></div>
  <div class="koi-list">${S.koi.map(k=>{const st=koiStage(k);return `<button class="koi-row" data-koi="${k.id}"><canvas data-mini="${k.id}" width="40" height="22"></canvas><span><b>${esc(k.name)}</b><small>${E.VAR[k.v].name} · ${st.label}</small><small>${esc(k.note)} · ${fmtDay(k.boughtDay)}</small></span></button>`}).join('')}</div>
  <h3>Settings</h3>
  <div class="setting"><span>Sounds</span><button class="chip" id="setSound" aria-pressed="${S.settings.sound}">${S.settings.sound?'On':'Off'}</button></div>
  <div class="setting"><span>Move your decor</span><button class="chip" id="setArrange">Arrange pond</button></div>
  <div class="setting"><span>Back up or move your pond</span><button class="chip" id="setBackup">Backup code</button></div>
  <div class="setting"><span>Start over</span><button class="chip" id="setReset">New pond</button></div>`;
}
after.koi=()=>{
  document.querySelectorAll('[data-mini]').forEach(c=>{const k=S.koi.find(x=>x.id===c.dataset.mini);const p=new E.Pond(c,{time:'day',seed:5,koi:[{id:'mini-'+k.id,v:k.v,L:koiL(k),pose:{x:.5,y:.5,ang:Math.PI}}],layout:{particles:null,mist:false,moon:false}});p.step(0)});
  document.querySelectorAll('[data-koi]').forEach(b=>b.addEventListener('click',()=>openKoi(b.dataset.koi)));
  $('#setSound').addEventListener('click',()=>{S.settings.sound=!S.settings.sound;save();render()});
  $('#setBackup').addEventListener('click',openBackup);
  $('#setArrange').addEventListener('click',()=>startArrange(null));
  $('#setReset').addEventListener('click',()=>modal(`<h2>Start a new pond?</h2><p class="muted">This removes every koi, decoration, task and pearl on this phone. Copy a backup code first if you might want it back.</p><div class="row"><button class="btn ghost" id="rNo">Keep my pond</button><button class="btn danger" id="rYes">Start over</button></div>`,c=>{c.querySelector('#rNo').onclick=closeModal;c.querySelector('#rYes').onclick=()=>{S=fresh();save();closeModal();closeSheet();buildPond();updatePearls();toast('New pond ready')}}));
};
function openKoi(id){
  const k=S.koi.find(x=>x.id===id);if(!k)return;const st=koiStage(k),V=E.VAR[k.v];
  const pct=st.stage==='adult'?100:st.stage==='young'?Math.round((42-st.next-14)/28*100):Math.round((14-st.next)/14*100);
  modal(`<canvas class="koi-hero" id="kHero" width="72" height="34"></canvas>
    <div class="field"><label for="kName">Name</label><input id="kName" maxlength="20" value="${esc(k.name)}" autocomplete="off"></div>
    <div><b>${V.name}</b> <span class="rar ${V.rarity}">${V.rarity}</span><p class="muted" style="margin:4px 0 0">${V.note}</p></div>
    <div><div class="sh-head" style="margin:0 0 6px"><span>${st.label}</span><span class="muted">${st.stage==='adult'?'Fully grown':`${st.next} more ${st.next===1?'day':'days'} you show up to ${st.to}`}</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
    <p class="muted" style="margin:0">${esc(k.note)} · joined ${fmtDay(k.boughtDay)}</p>
    <button class="btn primary block" id="kDone">Done</button>`,c=>{
    const p=new E.Pond(c.querySelector('#kHero'),{time:'auto',seed:9,koi:[{id:'hero-'+k.id,v:k.v,L:koiL(k),pose:{x:.5,y:.5,ang:Math.PI}}],layout:{particles:null,mist:false,moon:false}});p.step(0);extra.push(p);
    const fin=()=>{const n=c.querySelector('#kName').value.trim();if(n&&n!==k.name){k.name=n;save();if(tab==='koi')render()}closeModal();const i=extra.indexOf(p);if(i>=0)extra.splice(i,1)};
    c.querySelector('#kDone').addEventListener('click',fin);
  });
}
function openBackup(){
  let code='';try{code=btoa(unescape(encodeURIComponent(JSON.stringify(S))))}catch(e){}
  modal(`<h2>Backup code</h2><p class="muted" style="margin:0">Copy this code and keep it somewhere safe, or paste it on your other phone to move this pond there. Restoring replaces the pond on that phone.</p>
    <div class="field"><label for="bOut">Your pond</label><textarea id="bOut" readonly>${code}</textarea></div>
    <button class="btn ghost block" id="bCopy">Copy code</button>
    <div class="field"><label for="bIn">Restore from a code</label><textarea id="bIn" placeholder="Paste a backup code"></textarea></div>
    <p class="hint" id="bMsg" hidden></p>
    <div class="row"><button class="btn ghost" id="bClose">Close</button><button class="btn primary" id="bRestore">Restore</button></div>`,c=>{
    c.querySelector('#bClose').onclick=closeModal;
    c.querySelector('#bCopy').onclick=async()=>{const ta=c.querySelector('#bOut');try{await navigator.clipboard.writeText(code);toast('Backup code copied')}catch(e){ta.focus();ta.select();toast('Select the code and copy it')}};
    c.querySelector('#bRestore').onclick=()=>{const m=c.querySelector('#bMsg');try{const s=JSON.parse(decodeURIComponent(escape(atob(c.querySelector('#bIn').value.trim()))));if(!s||s.v!==1||!Array.isArray(s.koi))throw 0;S=s;save();closeModal();closeSheet();buildPond();updatePearls();toast('Pond restored')}catch(e){m.hidden=false;m.textContent='That code didn’t work. Check that you copied all of it.'}};
  });
}
function openHistory(){
  const L=S.log.slice(-25).reverse();
  modal(`<h2>Pearls</h2><div class="stats"><div class="stat"><b>${S.pearls}</b><span>to spend</span></div><div class="stat"><b>${S.earned}</b><span>earned in total</span></div></div>
    ${L.length?`<ul class="hist">${L.map(l=>`<li><span>${esc(l.name)} <span class="muted">${fmtDay(l.day)}</span></span><span class="rew">+${l.pearls}<span class="ico" data-icon="pearl"></span></span></li>`).join('')}</ul>`:'<p class="muted">Finish a task to earn your first pearls.</p>'}
    <button class="btn ghost block" id="hClose">Close</button>`,c=>{c.querySelector('#hClose').onclick=closeModal});
}

/* ---------- start ---------- */
paintIcons();updatePearls();buildPond();requestAnimationFrame(loop);
if(S.activeSit){const a=S.activeSit;const left=a.minutes*60-(Date.now()-a.start)/1000;if(left>-3600)startSit(a.minutes,a.taskId,a.start);else{S.activeSit=null;save()}}
else if(!S.tasks.length)setTimeout(()=>openTab('today'),600);
// Daily refresh: haze and the Today list follow the date.
setInterval(()=>{pond.haze=haze();paintBg();if(tab==='today')render()},60000);
if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('sw.js').catch(()=>{});
window.__koi={get S(){return S},pond:()=>pond};
})();
