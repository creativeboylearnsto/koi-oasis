/* Koi Oasis pond engine: pixel pond, koi sprites wrapped on a swimming spine. No image files. */
(function(){
const TAU=Math.PI*2;
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
function rng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function hash2(x,y,s){let h=(Math.imul(x|0,374761393)+Math.imul(y|0,668265263)+Math.imul(s|0,1442695041))|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return (h>>>0)/4294967296}
function vnoise(x,y,s){const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi;const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);const a=hash2(xi,yi,s),b=hash2(xi+1,yi,s),c=hash2(xi,yi+1,s),d=hash2(xi+1,yi+1,s);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
const H=h=>[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)];
const mix=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t];
const BAY=[0,8,2,10,12,4,14,6,3,11,1,9,15,7,13,5].map(v=>(v+.5)/16);
const bay=(x,y)=>BAY[((y&3)<<2)|(x&3)];

const PAL={
  dawn:{label:'Dawn',hours:'5–8 am',water:['#252741','#313554','#3c4265'],light:'#7c7ba6',padD:'#2d5546',padM:'#3d7156',padL:'#5e976c',flower:'#f4e8ef',lotus:['#d68aa8','#f4c0d0'],reedD:'#2b5143',reedL:'#4e835f',iris:['#5a6ee0','#aab9ff'],stone:['#44445a','#66667e','#8c8ca4'],moss:'#5c8a5c',wood:['#6c4a3c','#8e6450','#3c2a26'],tint:'#f2a9c2',tintAmt:.16,particles:'petals',mist:'#cbbedd',accent:'#f4c0d0',accentName:'Petal'},
  day:{label:'Day',hours:'8 am–5 pm',water:['#0c3d45','#105059','#16626b'],light:'#3f9691',padD:'#1d683b',padM:'#2d8847',padL:'#5bbf66',flower:'#f6fbf2',lotus:['#e07aa0','#ffc3d5'],reedD:'#226c3a',reedL:'#5abc5c',iris:['#2f62ef','#90b1ff'],stone:['#525e5c','#7a8783','#a3afa9'],moss:'#5ea459',wood:['#784c2b','#a0693c','#482c19'],tint:'#ffffff',tintAmt:0,particles:'glints',accent:'#2f62ef',accentName:'Iris'},
  dusk:{label:'Dusk',hours:'5–8 pm',water:['#29192e','#362139','#452944'],light:'#94515a',padD:'#384b33',padM:'#506537',padL:'#7a8a44',flower:'#f7dcc6',lotus:['#de7a7a','#ffb48c'],reedD:'#3c482f',reedL:'#6c7a3d',iris:['#5856c6','#a59cf0'],stone:['#4a3d46','#6c5a60','#8e7a7a'],moss:'#6c7a43',wood:['#6c3d29','#915639','#3c2117'],tint:'#ff9858',tintAmt:.2,particles:'leaves',lantern:true,glow:'#ffb35e',accent:'#ff9858',accentName:'Sunset'},
  night:{label:'Night',hours:'8 pm–5 am',water:['#07101d','#0b1727','#102035'],light:'#22405f',padD:'#0e3225',padM:'#154638',padL:'#215f47',flower:'#b8c8d6',lotus:['#875a7a','#ae7a98'],reedD:'#0e3829',reedL:'#1d5840',iris:['#2a3ea0','#5b74d2'],stone:['#283040','#3a4357','#515b72'],moss:'#294939',wood:['#3c2b29','#523f39','#211719'],tint:'#5878b8',tintAmt:.24,particles:'fireflies',lantern:true,moon:true,glow:'#ffc66c',accent:'#ffc66c',accentName:'Lantern'}
};
function conv(o){const r={};for(const k in o){const v=o[k];if(typeof v==='string'&&v[0]==='#')r[k]=H(v);else if(Array.isArray(v)&&typeof v[0]==='string')r[k]=v.map(H);else r[k]=v}return r}
const PALC={};for(const k in PAL)PALC[k]=conv(PAL[k]);

const VAR={
  yamabuki:{name:'Yamabuki Ogon',base:'#f2c02e',sheen:'#fff1a6',edge:'#c48a14',fin:'#ffe48a',metal:true,price:100,rarity:'Common',note:'Bright yellow gold with a metallic sheen.'},
  orenji:{name:'Orenji Ogon',base:'#f2892a',sheen:'#ffcf8c',edge:'#b8561a',fin:'#ffbf7c',metal:true,price:100,rarity:'Common',note:'Metallic orange, the warmest fish in the pond.'},
  hariwake:{name:'Hariwake',base:'#efe7d6',sheen:'#ffffff',edge:'#b9aa8e',fin:'#f7f1e4',metal:true,patch:'#f08526',patchThr:.52,price:140,rarity:'Uncommon',note:'Platinum white with orange patches. No two are alike.'},
  doitsu:{name:'Doitsu Orenji',base:'#ee7e2c',sheen:'#ffb26c',edge:'#ae4f1c',fin:'#ffb072',metal:true,doitsu:'#6a3313',price:160,rarity:'Uncommon',note:'Scaleless orange with one row of dark scales along the back.'},
  ginrin:{name:'Kin Gin Rin',base:'#e8b13c',sheen:'#fde6a2',edge:'#ad7c1c',fin:'#ffe08c',metal:true,sparkle:'#fffbe6',price:220,rarity:'Rare',note:'Gold, with scales that catch the light as it swims.'},
  butterfly:{name:'Golden Butterfly',base:'#f0af32',sheen:'#ffe9a2',edge:'#b6771a',fin:'#fff0d2',metal:true,butterfly:true,patch:'#fff3d8',patchThr:.6,price:320,rarity:'Rare',note:'Long, flowing fins that trail behind it.'}
};
const VARC={};for(const k in VAR)VARC[k]=conv(VAR[k]);

/* Hand-drawn koi templates, head at the top. K outline, B body, H light side, S shaded side,
   E eye, P scale/spot slot, F fin, G fin tip. Colours come from each variety. */
const SPR={
std:[
".....KKK.....",
"....KHBBK....",
"...KHHBBSK...",
"...KEHBBEK...",
"..KHHBBBBSK..",
"..KHBBBBBSK..",
"FFKHBBBBBSKFF",
"FFKHBBBBBSKFF",
".GKHBBBBBSKG.",
"..KHBBBBBSK..",
"..KHBBPBBSK..",
"...KHBBBSK...",
"...KHBPBSK...",
"...KHBBBSK...",
"..FKHBPBSKF..",
"..GKHBBBSKG..",
"....KHBSK....",
"....KHBSK....",
".....KBK.....",
".....KBK.....",
"....KFFFK....",
"...KFFFFFK...",
"..KFFFFFFFK..",
".KFFFKKKFFFK.",
".KFFK...KFFK.",
".KGK.....KGK.",
"..K.......K.."],
bfly:[
"......KKK......",
".....KHBBK.....",
"....KHHBBSK....",
"....KEHBBEK....",
"...KHHBBBBSK...",
"...KHBBBBBSK...",
".FFKHBBBBBSKFF.",
"FFFKHBBBBBSKFFF",
"FFFKHBBBBBSKFFF",
"FFGKHBBBBBSKGFF",
"FG.KHBBPBBSK.GF",
"G...KHBBBSK...G",
"....KHBPBSK....",
"....KHBBBSK....",
"..FFKHBPBSKFF..",
"..FGKHBBBSKGF..",
"..G..KHBSK..G..",
".....KHBSK.....",
"......KBK......",
"......KBK......",
".....KFFFK.....",
"....KFFFFFK....",
"...KFFFFFFFK...",
"..KFFFFFFFFFK..",
"..KFFFFGFFFFK..",
".KFFFFGGGFFFFK.",
".KFFFG...GFFFK.",
".KFFG.....GFFK.",
".KFG.......GFK.",
"..G.........G.."]
};


function timeNow(){const h=new Date().getHours();return h>=5&&h<8?'dawn':h>=8&&h<17?'day':h>=17&&h<20?'dusk':'night'}

const LANTERN=["...rrr...",".rrRRRrr.","rrrrrrrrr","..sLLLs..","..sLFLs..","..sLLLs..","...sss...","...sSs...","...sSs...","..sssss..",".sSSSSSs."];
const WFLOWER=[".w.","wyw",".w."];
const LOTUS=["..p..",".plp.","plylp",".plp.","..p.."];
const IRIS=[".b.","bcb",".b."];
const YEL=[244,206,84];

let KID=1;

const SIZES={fry:{std:14,bfly:15},young:{std:20,bfly:22},adult:{std:27,bfly:30}};
function numId(s){let h=2166136261;s=String(s);for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return (h>>>0)%100000}

class Koi{
  constructor(pond,c){
    this.key=c.id||('k'+Math.random());this.id=numId(this.key);this.v=c.v;this.V=VARC[c.v];this.spr=SPR[this.V.butterfly?'bfly':'std'];
    this.N=10;this.setLength(c.L||this.spr.length);this.pose=c.pose||null;
    const r=pond.r;this.phase=r()*TAU;this.wv=0;this.base=4.5+r()*3;
    this.heading=this.pose?this.pose.ang:r()*TAU;
    const m=Math.min(16,pond.w*.2);
    const x=this.pose?this.pose.x*pond.w:(c.x!=null?c.x:m+r()*(pond.w-2*m)), y=this.pose?this.pose.y*pond.h:(c.y!=null?c.y:m+r()*(pond.h-2*m));
    this.p=[];for(let i=0;i<=this.N;i++)this.p.push({x:x-Math.cos(this.heading)*this.seg*i,y:y-Math.sin(this.heading)*this.seg*i});
  }
  setLength(L){this.L=L;this.seg=L/this.N}
  steer(ang,rate){let d=ang-this.heading;d=((d%TAU)+TAU*1.5)%TAU-Math.PI;this.heading+=clamp(d,-rate,rate)}
  update(dt,pond){
    const t=pond.t;
    if(this.pose){
      this.phase+=dt*2.3;
      const ang=this.pose.ang+Math.sin(t*.5+this.id)*.1;
      const cx=this.pose.x*pond.w+Math.sin(t*.4+this.id)*1.2, cy=this.pose.y*pond.h+Math.cos(t*.33+this.id)*.8;
      const bend=Math.sin(t*.45+this.id*2)*.16;
      for(let i=0;i<=this.N;i++){const a=ang+bend*(i/this.N);const d=this.L*.45-i*this.seg;this.p[i].x=cx+Math.cos(a)*d;this.p[i].y=cy+Math.sin(a)*d}
      return;
    }
    const h=this.p[0],m=Math.max(10,this.L*.75);
    this.wv+=(Math.random()-.5)*dt*2.4;this.wv*=Math.pow(.55,dt);this.wv=clamp(this.wv,-.7,.7);this.heading+=this.wv*dt;
    let ax=0,ay=0;if(h.x<m)ax=1;else if(h.x>pond.w-m)ax=-1;if(h.y<m)ay=1;else if(h.y>pond.h-m)ay=-1;
    if(ax||ay)this.steer(Math.atan2(ay,ax),1.5*dt);
    let sp=this.base*(1+.25*Math.sin(t*.4+this.id*1.7));
    // food and pearls pull the koi in
    let best=null,bd=90;for(const f of pond.food){const d=Math.hypot(f.x-h.x,f.y-h.y);if(d<bd){bd=d;best=f}}
    const tg=pond.target;
    if(best){if(bd>3){this.steer(Math.atan2(best.y-h.y,best.x-h.x),2.4*dt);sp*=1.9}else{sp*=.5;if(best.kind==='food'){best.eaten=true;pond.ripple(best.x,best.y,.4)}}}
    else if(tg&&t<tg.until){const d=Math.hypot(tg.x-h.x,tg.y-h.y);if(d>5){this.steer(Math.atan2(tg.y-h.y,tg.x-h.x),2*dt);sp*=1.8}else sp*=.4}
    sp*=pond.speed;
    h.x+=Math.cos(this.heading)*sp*dt;h.y+=Math.sin(this.heading)*sp*dt;
    for(let i=1;i<=this.N;i++){const a=this.p[i-1],b=this.p[i];const dx=b.x-a.x,dy=b.y-a.y;const d=Math.hypot(dx,dy)||1;b.x=a.x+dx/d*this.seg;b.y=a.y+dy/d*this.seg}
    this.phase+=dt*(1.7+sp*.22);
  }
  spine(){
    const N=this.N,amp=this.L*.055,out=[];
    for(let i=0;i<=N;i++){const a=this.p[Math.max(0,i-1)],b=this.p[Math.min(N,i+1)];let fx=a.x-b.x,fy=a.y-b.y;const d=Math.hypot(fx,fy)||1;fx/=d;fy/=d;const nx=-fy,ny=fx;const off=Math.sin(this.phase-i*.75)*amp*Math.pow(i/N,1.4);out.push({x:this.p[i].x+nx*off,y:this.p[i].y+ny*off,nx,ny,fx,fy})}
    return out;
  }
}

// Decor anchor points, as fractions of the pond. Pads fill cluster 0 first, then 1, and so on.
const ANCH=[{x:.2,y:.2},{x:.8,y:.46},{x:.22,y:.62},{x:.72,y:.86},{x:.5,y:.07},{x:.12,y:.92}];

class Pond{
  constructor(cv,c){
    c=c||{};this.cv=cv;this.c=c;this.w=cv.width;this.h=cv.height;this.ctx=cv.getContext('2d');
    this.img=this.ctx.createImageData(this.w,this.h);this.d=this.img.data;this.seed=c.seed||1;
    this.r=rng(this.seed);this.t=(this.seed*3.7)%50;this.ripples=[];this.food=[];this.target=null;this.visible=true;
    this.speed=1;this.dim=c.dim||1;this.haze=0;
    this.mode=c.time||'auto';this.pal=PALC[this.mode==='auto'?timeNow():this.mode];
    const w=this.w,h=this.h,s=this.seed;
    this.nf=new Float32Array(w*h);
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){let n=vnoise(x*.045,y*.06,s)*.65+vnoise(x*.11,y*.11,s+9)*.35;this.nf[y*w+x]=clamp((n-.5)*1.7+.5,0,1)}
    this.koi=[];if(c.koi)this.syncKoi(c.koi);
    this.setLayout(c.layout||{});
    this.ptype=null;
  }
  setTime(m){this.mode=m;this.pal=PALC[m==='auto'?timeNow():m]}
  syncKoi(list){
    const have=new Map(this.koi.map(k=>[k.key,k]));const next=[];
    for(const c of list){let k=have.get(c.id);if(!k)k=new Koi(this,c);else if(c.L&&c.L!==k.L)k.setLength(c.L);next.push(k)}
    this.koi=next;
  }
  setLayout(L){
    const w=this.w,h=this.h,mn=Math.min(w,h),s=this.seed;this.layout=L;
    this.pads=(L.pads||[]).map((p,i)=>{
      if(p.x!=null)return {x:Math.round(p.x*w),y:Math.round(p.y*h),r:p.r||5,notch:hash2(i,3,s)*TAU,ph:hash2(i,4,s)*TAU,flower:p.flower||null};
      const A=ANCH[Math.floor(i/4)%ANCH.length],a=hash2(i,1,s)*TAU,dd=Math.sqrt(hash2(i,2,s))*.16*mn+(i%4?3:0);
      return {x:Math.round(A.x*w+Math.cos(a)*dd),y:Math.round(A.y*h+Math.sin(a)*dd),r:3+hash2(i,5,s)*4.5,notch:hash2(i,3,s)*TAU,ph:hash2(i,4,s)*TAU,flower:p.flower||null};
    });
    this.pads.sort((a,b)=>a.r-b.r);
    this.reedBox=null;this.rocks=null;this.bridge=null;
    if(L.reeds){
      const R=L.reeds===true?{x:.6,y:0,w:.4,h:.2}:L.reeds,rx=R.x*w,ry=R.y*h,rw=R.w*w,rh=R.h*h;this.reedBox={cx:rx+rw/2,cy:ry+rh*.55,ax:rw/2,ay:rh*.45};
      const n=Math.round(rw*rh/11),rr=rng(s+31);this.blades=[];
      for(let i=0;i<n;i++){const a=rr()*TAU,dd=Math.sqrt(rr());this.blades.push({x:this.reedBox.cx+Math.cos(a)*dd*this.reedBox.ax,y:this.reedBox.cy+Math.sin(a)*dd*this.reedBox.ay+3,len:5+rr()*9,lean:(rr()-.5)*.8,ph:rr()*TAU,iris:rr()<.07,light:rr()<.5})}
      this.blades.sort((a,b)=>a.y-b.y);
    }
    if(L.rocks){const R=L.rocks===true?{x:.2,y:.8}:L.rocks;const x=Math.round(R.x*w),y=Math.round(R.y*h);this.rocks=[{x,y,rx:8,ry:5.5},{x:x-8,y:y+4,rx:5.5,ry:4},{x:x+7,y:y+5,rx:4.5,ry:3.2}];this.rockAt={x,y}}
    this.lantern=!!L.lantern;
    if(L.bridge){const B=L.bridge===true?{x:.08,y:.7,len:.84}:L.bridge;this.bridge={x:Math.round(B.x*w),y:Math.round(B.y*h),len:Math.round(B.len*w)}}
    this.c.particles=L.particles===undefined?'auto':L.particles;this.c.mist=L.mist!==false;this.c.moon=L.moon!==false;
  }
  set(x,y,c){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=this.w||y>=this.h)return;const i=(y*this.w+x)*4,d=this.d;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}
  blend(x,y,c,a){x=Math.floor(x);y=Math.floor(y);if(x<0||y<0||x>=this.w||y>=this.h||a<=0)return;const i=(y*this.w+x)*4,d=this.d;d[i]+=(c[0]-d[i])*a;d[i+1]+=(c[1]-d[i+1])*a;d[i+2]+=(c[2]-d[i+2])*a}
  spr(rows,x,y,map){for(let j=0;j<rows.length;j++){const row=rows[j];for(let i=0;i<row.length;i++){const c=map[row[i]];if(c)this.set(x+i,y+j,c)}}}
  tint(c){const P=this.pal;return P.tintAmt?mix(c,P.tint,P.tintAmt):c}
  ripple(x,y,size){this.ripples.push({x,y,t0:this.t,size:size||1})}
  poke(x,y){this.ripple(x,y,1);this.target={x,y,until:this.t+5}}
  drop(kind,n,area){
    const a=area||{x:this.w*.15,y:this.h*.15,w:this.w*.7,h:this.h*.45};
    for(let i=0;i<n;i++){const x=a.x+Math.random()*a.w,y=a.y+Math.random()*a.h;this.food.push({x,y,kind,t0:this.t+i*.12,ph:Math.random()*TAU});}
  }
  hitKoi(x,y){let best=null,bd=6;for(const k of this.koi)for(const p of k.p){const d=Math.hypot(p.x-x,p.y-y);if(d<bd){bd=d;best=k}}return best}
  initParticles(type){
    this.ptype=type;this.parts=[];const w=this.w,h=this.h,r=this.r;
    const n={petals:Math.round(w*h/1800)+3,glints:Math.round(w*h/1500)+4,leaves:Math.round(w*h/3600)+2,fireflies:Math.round(w*h/2400)+3}[type]||0;
    for(let i=0;i<n;i++)this.parts.push({x:r()*w,y:r()*h,ph:r()*TAU,a:r(),b:r()});
  }
  water(){
    const w=this.w,h=this.h,d=this.d,nf=this.nf,P=this.pal,t=this.t;const W0=P.water[0],W1=P.water[1],W2=P.water[2],L=P.light;
    if(!this._A||this._A.length!==h){this._A=new Float32Array(h);this._B=new Float32Array(w)}
    const A=this._A,B=this._B;for(let y=0;y<h;y++)A[y]=Math.sin(y*.083+t*.31);for(let x=0;x<w;x++)B[x]=Math.sin(x*.067-t*.26);
    if(this._lp!==P){this._lp=P;this._L=mix(W1,L,.62)}
    const Lm=this._L;let i=0;
    for(let y=0;y<h;y++){const ay=1.9*A[y],yy=y*.095;for(let x=0;x<w;x++,i+=4){const lv=nf[y*w+x]*2.7+(BAY[((y&3)<<2)|(x&3)]-.5)*.55;let c=lv<1?W0:lv<2?W1:W2;const v=Math.sin(x*.105+ay)*Math.sin(yy+1.7*B[x]);if(v<.028&&v>-.028)c=Lm;d[i]=c[0];d[i+1]=c[1];d[i+2]=c[2];d[i+3]=255}}
  }
  skinKoi(k){
    const S=k.spine(),N=k.N,spr=k.spr,R=spr.length,C=spr[0].length;
    const cum=[0];for(let i=0;i<N;i++)cum.push(cum[i]+Math.hypot(S[i+1].x-S[i].x,S[i+1].y-S[i].y));
    const sc=cum[N]/R,half=C/2*sc+2;
    let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const q of S){if(q.x<x0)x0=q.x;if(q.x>x1)x1=q.x;if(q.y<y0)y0=q.y;if(q.y>y1)y1=q.y}
    x0=Math.floor(x0-half);y0=Math.floor(y0-half);x1=Math.ceil(x1+half);y1=Math.ceil(y1+half);
    const seg=[];for(let i=0;i<N;i++){const a=S[i],b=S[i+1],dx=b.x-a.x,dy=b.y-a.y,l=Math.hypot(dx,dy)||1;seg.push({ax:a.x,ay:a.y,dx:dx/l,dy:dy/l,l,c:cum[i]})}
    const out=new Map();
    for(let py=y0;py<=y1;py++)for(let px=x0;px<=x1;px++){
      const qx=px+.5,qy=py+.5;let best=1e9,al=0,la=0;
      for(let i=0;i<N;i++){const g=seg[i];const rx=qx-g.ax,ry=qy-g.ay;const t=rx*g.dx+ry*g.dy;const lat=rx*g.dy-ry*g.dx;
        let d;if(t<0)d=i===0?Math.abs(lat):Math.hypot(rx,ry);else if(t>g.l)d=i===N-1?Math.abs(lat):Math.hypot(qx-g.ax-g.dx*g.l,qy-g.ay-g.dy*g.l);else d=Math.abs(lat);
        if(d<best){best=d;al=g.c+(i===0||i===N-1?t:clamp(t,0,g.l));la=lat}}
      const row=Math.floor(al/sc),col=Math.floor(C/2+la/sc);
      if(row<0||row>=R||col<0||col>=C)continue;const ch=spr[row][col];if(ch==='.')continue;
      out.set(py*8192+px,{px,py,ch,row,col});
    }
    return out;
  }
  koiPixel(k,e){
    const V=k.V,ch=e.ch;
    if(ch==='E')return this.tint([40,26,18]);
    if(ch==='F')return this.tint(V.fin);
    if(ch==='G')return this.tint(mix(V.fin,V.edge,.5));
    let base=V.base,hi=V.sheen,sh=V.edge;
    if(V.patch&&ch!=='P'){const pv=vnoise(e.row*.21+k.id*3.1,e.col*.42,k.id*7)+(e.row<4?.1:0);if(pv>V.patchThr){base=V.patch;hi=mix(V.patch,[255,255,255],.35);sh=mix(V.patch,[60,20,0],.3)}}
    let c=ch==='H'?hi:ch==='S'?sh:base;
    if(ch==='P')c=V.doitsu||base;
    if(V.sparkle&&ch!=='S'){const hh=hash2(e.row,e.col,k.id);if(hh<.2&&Math.sin(this.t*2.4+hh*40)>.5)c=V.sparkle}
    return this.tint(c);
  }
  drawPad(p,pass){
    const P=this.pal,bob=Math.round(Math.sin(this.t*.35+p.ph)*.7),cx=p.x,cy=p.y+bob,R=p.r,Ri=Math.ceil(R);
    for(let dy=-Ri;dy<=Ri;dy++)for(let dx=-Ri;dx<=Ri;dx++){const dd=Math.hypot(dx,dy);if(dd>R)continue;let df=Math.atan2(dy,dx)-p.notch;df=((df%TAU)+TAU*1.5)%TAU-Math.PI;if(Math.abs(df)<.34&&dd>R*.15)continue;
      if(pass===0){this.blend(cx+dx+1,cy+dy+2,[0,0,0],.3);continue}
      const c=dd>R-1.1?P.padD:(dx+dy<-R*.3?P.padL:P.padM);this.set(cx+dx,cy+dy,c)}
    if(pass===1&&p.flower){if(p.flower==='lotus')this.spr(LOTUS,cx-2,cy-2,{p:P.lotus[0],l:P.lotus[1],y:YEL});else this.spr(WFLOWER,cx-1,cy-1,{w:P.flower,y:YEL})}
  }
  drawReeds(){
    const P=this.pal,b=this.reedBox,t=this.t;
    for(let y=Math.floor(b.cy-b.ay);y<=b.cy+b.ay;y++)for(let x=Math.floor(b.cx-b.ax);x<=b.cx+b.ax;x++){const e=((x-b.cx)/b.ax)**2+((y-b.cy)/b.ay)**2;if(e>1)continue;if(bay(x,y)<.75-e*.4)this.set(x,y,P.reedD)}
    for(const bl of this.blades){
      const sway=Math.sin(t*.9+bl.ph)*1.1*(bl.len/12);const tx=bl.x+bl.lean*bl.len+sway,ty=bl.y-bl.len;
      const n=Math.ceil(Math.max(Math.abs(tx-bl.x),Math.abs(ty-bl.y)));
      for(let i=0;i<=n;i++){const f=i/n;const c=f>.9?mix(P.reedL,[255,255,220],.25):(f>.45||bl.light)?P.reedL:P.reedD;this.set(Math.round(bl.x+(tx-bl.x)*f),Math.round(bl.y+(ty-bl.y)*f),c)}
      if(bl.iris)this.spr(IRIS,Math.round(tx)-1,Math.round(ty)-1,{b:P.iris[0],c:P.iris[1]});
    }
  }
  drawRocks(){
    const P=this.pal;
    for(const k of this.rocks){const R=Math.ceil(Math.max(k.rx,k.ry));for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const e=(dx/k.rx)**2+(dy/k.ry)**2;if(e<=1)this.blend(k.x+dx+2,k.y+dy+2,[0,0,0],.32)}}
    for(const k of this.rocks){const R=Math.ceil(Math.max(k.rx,k.ry));for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const e=(dx/k.rx)**2+(dy/k.ry)**2;if(e>1)continue;let c=e>.72?P.stone[0]:(dx/k.rx+dy/k.ry<-.35?P.stone[2]:P.stone[1]);if(dy<0&&e<.8&&hash2(k.x+dx,k.y+dy,5)<.32)c=P.moss;this.set(k.x+dx,k.y+dy,c)}}
    if(this.lantern){const lit=!!P.lantern,x=this.rockAt.x-4,y=this.rockAt.y-12;const glow=P.glow||[255,210,120];
      this.spr(LANTERN,x,y,{r:P.stone[0],R:P.stone[2],s:P.stone[1],S:P.stone[2],L:lit?glow:P.stone[0],F:lit?[255,244,200]:P.stone[0]});this.lanternAt=lit?{x:x+4,y:y+4}:null}
    else this.lanternAt=null;
  }
  drawBridge(){
    const P=this.pal,B=this.bridge,W=9,mid=B.x+B.len/2;
    for(let x=B.x;x<B.x+B.len;x++)for(let y=0;y<W;y++)this.blend(x+2,B.y+y+3,[0,0,0],.3);
    for(let x=B.x;x<B.x+B.len;x++){const k=x-B.x;for(let y=0;y<W;y++){let c=(Math.floor(k/3)%2)?P.wood[0]:P.wood[1];if(k%3===2)c=P.wood[2];if(y===0||y===W-1)c=P.wood[2];if(Math.abs(x-mid)<B.len*.22&&y>0&&y<W-1)c=mix(c,[255,230,190],.12);this.set(x,B.y+y,c)}}
    for(let x=B.x+1;x<B.x+B.len;x+=8){this.set(x,B.y-1,P.wood[1]);this.set(x+1,B.y-1,P.wood[1]);this.set(x,B.y+W,P.wood[1]);this.set(x+1,B.y+W,P.wood[1])}
  }
  drawFood(){
    this.food=this.food.filter(f=>!f.eaten&&this.t-f.t0<(f.kind==='pearl'?4:14));
    for(const f of this.food){const age=this.t-f.t0;if(age<0)continue;
      if(f.kind==='pearl'){const a=1-age/4;const c=[238,232,252];this.blend(f.x,f.y,c,a);this.blend(f.x+1,f.y,c,a*.8);this.blend(f.x,f.y+1,c,a*.8);this.blend(f.x+1,f.y+1,[184,174,216],a*.8);if(Math.sin(this.t*6+f.ph)>.6)this.blend(f.x,f.y,[255,255,255],a)}
      else{this.set(f.x,f.y,this.tint([168,110,58]));}
      if(!f.rip){f.rip=true;this.ripple(f.x,f.y,f.kind==='pearl'?.6:.35)}}
  }
  drawParticles(dt){
    const type=this.c.particles==='auto'?this.pal.particles:this.c.particles;if(!type)return;if(type!==this.ptype)this.initParticles(type);
    const t=this.t,w=this.w,h=this.h,P=this.pal;
    for(const p of this.parts){
      if(type==='petals'){p.x+=(1+p.a*1.2)*dt+Math.sin(t+p.ph)*.15*dt*6;p.y+=(.4+p.b*.6)*dt;if(p.x>w+2){p.x=-2;p.y=Math.random()*h}if(p.y>h+2){p.y=-2;p.x=Math.random()*w}
        this.set(p.x,p.y,P.lotus[1]);if(p.a>.5)this.set(p.x+1,p.y,P.lotus[0])}
      else if(type==='glints'){const v=Math.sin(t*(1.2+p.a*1.5)+p.ph);if(v>.86){const c=[236,255,246];this.blend(p.x,p.y,c,.95);if(v>.95){this.blend(p.x+1,p.y,c,.45);this.blend(p.x-1,p.y,c,.45);this.blend(p.x,p.y+1,c,.45);this.blend(p.x,p.y-1,c,.45)}}else if(v<-.995){p.x=Math.random()*w;p.y=Math.random()*h}}
      else if(type==='leaves'){p.x+=(.35+p.a*.4)*dt;p.y+=Math.sin(t*.3+p.ph)*.12*dt;if(p.x>w+3){p.x=-3;p.y=Math.random()*h}
        const c=[[194,65,46],[224,112,46],[168,50,38]][Math.floor(p.b*3)];const x=Math.floor(p.x),y=Math.floor(p.y);this.set(x,y,c);this.set(x+1,y,c);this.set(x+1,y+(p.a>.5?1:-1),c);this.set(x+2,y+(p.a>.5?1:-1),mix(c,[0,0,0],.25))}
      else if(type==='fireflies'){const x=p.x+Math.sin(t*(.3+p.a*.3)+p.ph)*9,y=p.y+Math.cos(t*(.25+p.b*.3)+p.ph*1.3)*6;const bb=.5+.5*Math.sin(t*2.1+p.ph*3);if(bb>.2){const c=[236,255,150];this.blend(x,y,c,bb);this.blend(x+1,y,c,bb*.3);this.blend(x-1,y,c,bb*.3);this.blend(x,y+1,c,bb*.3);this.blend(x,y-1,c,bb*.3)}}
    }
  }
  drawMoon(){const cx=Math.round(this.w*.36),cy=Math.round(this.h*.3),rows=[5,9,11,11,11,9,5];rows.forEach((n,j)=>{const off=Math.round(Math.sin(this.t*1.1+j*.9)*1.2);for(let i=0;i<n;i++){const e=Math.abs(i-(n-1)/2)/(n/2);if(hash2(i,j,Math.floor(this.t*2))>.1)this.blend(cx-(n>>1)+i+off,cy+j,[220,230,246],e>.7?.12:.28)}})}
  drawGlow(){const L=this.lanternAt,G=this.pal.glow,R=24;if(!L||!G)return;for(let dy=-R;dy<=R;dy++)for(let dx=-R;dx<=R;dx++){const dd=Math.hypot(dx,dy*1.15);if(dd>R)continue;const a=Math.pow(1-dd/R,1.7)*.5;const lv=Math.floor(a*6+bay(L.x+dx,L.y+dy))/6;if(lv>0)this.blend(L.x+dx,L.y+dy,G,lv)}}
  drawMist(){const P=this.pal;if(!P.mist)return;const t=this.t;for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){const m=vnoise(x*.035+t*.05,y*.09,77);const a=clamp((m-.5)*1.8,0,1)*.42;const lv=Math.floor(a*4+bay(x,y))/4;if(lv>0)this.blend(x,y,P.mist,lv*.6)}}
  drawHaze(){const t=this.t,hz=this.haze,C=[64,84,62];for(let y=0;y<this.h;y++)for(let x=0;x<this.w;x++){const m=vnoise(x*.05+t*.03,y*.05,91);const a=hz*(.55+.45*m);const lv=Math.floor(a*5+bay(x,y))/5;if(lv>0)this.blend(x,y,C,lv*.7)}}
  drawRipples(){const L=this.pal.light;this.ripples=this.ripples.filter(r=>this.t-r.t0<3);for(const r of this.ripples){const age=this.t-r.t0;if(age<0)continue;const a=(1-age/3)*.75;for(const [k,f] of [[1,1],[.6,.5]]){const R=age*14*k*r.size;if(R<1)continue;const n=Math.ceil(TAU*R);for(let i=0;i<n;i++){const an=i/n*TAU;this.blend(r.x+Math.cos(an)*R,r.y+Math.sin(an)*R*.9,mix(L,[230,250,245],.4),a*f)}}}}
  step(dt){
    this.t+=dt;if(this.mode==='auto'&&(this._pt=(this._pt||0)+dt)>20){this._pt=0;this.pal=PALC[timeNow()]}
    for(const k of this.koi)k.update(dt,this);
    this.water();
    if(this.c.moon&&this.pal.moon)this.drawMoon();
    const rs=this.koi.map(k=>this.skinKoi(k));
    for(const r of rs)for(const e of r.values())this.blend(e.px+2,e.py+3,[0,0,0],e.ch==='F'||e.ch==='G'?.2:.3);
    const OUT=this.tint([26,22,34]);
    this.koi.forEach((k,i)=>{const r=rs[i];
      for(const e of r.values())this.set(e.px,e.py,e.ch==='K'?OUT:this.koiPixel(k,e));
      for(const [key,e] of r){if(e.ch==='K')continue;for(const n of [key-1,key+1,key-8192,key+8192])if(!r.has(n)){const py=Math.floor((n+4096)/8192),px=n-py*8192;this.set(px,py,OUT)}}});
    for(const p of this.pads)this.drawPad(p,0);
    for(const p of this.pads)this.drawPad(p,1);
    if(this.bridge)this.drawBridge();
    if(this.reedBox)this.drawReeds();
    if(this.rocks)this.drawRocks();else this.lanternAt=null;
    if(this.c.mist&&this.pal.mist)this.drawMist();
    this.drawGlow();
    this.drawFood();
    this.drawParticles(dt);
    if(this.haze>0.01)this.drawHaze();
    this.drawRipples();
    if(this.dim<1){const d=this.d,m=this.dim;for(let i=0;i<d.length;i+=4){d[i]*=m;d[i+1]*=m;d[i+2]*=m}}
    this.ctx.putImageData(this.img,0,0);
  }
}

window.KoiEngine={Pond,PAL,VAR,SPR,SIZES,timeNow,hash2};
})();
