const $=id=>document.getElementById(id);
const cv=$('c'),g=cv.getContext('2d'),W=480,H=720,HOR=210,CX=W/2;
const look={g:'m',hair:'#3b2412',skin:'#f1c27d',shirt:'#2f8cff',pants:'#2e2e55'};
try{Object.assign(look,JSON.parse(localStorage.getItem('br_look')||'{}'))}catch(e){}
const DIFF=[{n:'Easy',up:1.6,gap:.7,rows:1},{n:'Mid',up:2.4,gap:.5,rows:2},{n:'Hard',up:3.6,gap:.38,rows:3}];

function show(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));$('ctl').classList.remove('on')}
function shade(h,a){const n=parseInt(h.slice(1),16);const f=v=>Math.max(0,Math.min(255,v+a));return`rgb(${f(n>>16)},${f((n>>8)&255)},${f(n&255)})`}

// ---- avatar (all blocks) ----
function avatar(c,x,y,u,L,ph,air){
  const sw=air?0:Math.sin(ph)*.12*u;
  c.save();c.translate(x,y-(air||0));
  const R=(px,py,w,h,col)=>{c.fillStyle=col;c.fillRect(px*u,py*u,w*u,h*u)};
  R(-.28,-.55,.24,.55+0,L.pants);R(.04,-.55,.24,.55,L.pants);          // legs
  if(!air){c.clearRect(0,0,0,0)}
  R(-.28,-.02,.24,.06,'#222');R(.04,-.02,.24,.06,'#222');               // shoes
  if(L.g==='f'){R(-.36,-.62,.72,.14,L.pants)}                          // hips
  R(-.34,-1.12,.68,.58,L.shirt);                                       // torso
  R(-.5,-1.1+sw/u,.15,.5,L.skin);R(.35,-1.1-sw/u,.15,.5,L.skin);        // arms
  R(-.28,-1.58,.56,.46,L.skin);                                        // head
  R(-.32,-1.68,.64,.2,L.hair);                                         // hair top
  if(L.g==='f'){R(-.34,-1.6,.12,.62,L.hair);R(.22,-1.6,.12,.62,L.hair)}else R(-.3,-1.6,.6,.06,L.hair);
  R(-.14,-1.42,.07,.07,'#111');R(.07,-1.42,.07,.07,'#111');             // eyes
  c.restore();
}
function drawPreview(cn){const c=cn.getContext('2d');c.clearRect(0,0,cn.width,cn.height);c.fillStyle='#2a1a5e';c.fillRect(0,0,cn.width,cn.height);avatar(c,cn.width/2,cn.height-14,cn.height/2.1,look,0,0)}
function refreshPv(){drawPreview($('pv'));drawPreview($('pv2'))}

// ---- state ----
let st=null,raf=0,last=0,keysBound=false;
function start(){
  const d=+$('df').value;
  st={d,D:DIFF[d],lane:1,laneX:1,spd:20,t:0,off:0,obs:[],acc:0,jt:-1,run:0,over:false,name:($('nm').value.trim()||'Player').slice(0,12)};
  $('hd').textContent=st.D.n;$('ctl').classList.add('on');
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  last=performance.now();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);
}
const move=d=>{if(st&&!st.over)st.lane=Math.max(0,Math.min(2,st.lane+d))};
const jump=()=>{if(st&&!st.over&&st.jt<0)st.jt=0};

function spawn(){
  const r=st.D.rows,lanes=[0,1,2].sort(()=>Math.random()-.5);
  let n=r===1?1:r===2?1+(Math.random()<.5):2;
  if(r===3&&Math.random()<.25)n=3; // full row: must jump
  lanes.slice(0,n).forEach(l=>st.obs.push({l,p:0,c:Math.random()<.5?'#ff6a3d':'#ff3d7f'}));
}
function loop(now){
  const dt=Math.min(.05,(now-last)/1000);last=now;const s=st;
  s.t+=dt;s.spd=Math.min(100,20+s.t*s.D.up*(1+0)*1);
  const dp=s.spd*.012*dt;s.off=(s.off+dp*14)%2;
  s.laneX+=(s.lane-s.laneX)*Math.min(1,dt*14);
  if(s.jt>=0){s.jt+=dt/.55;if(s.jt>=1)s.jt=-1}
  s.run+=dt*(8+s.spd/8);
  s.acc+=dp;const gap=Math.max(s.D.gap,s.spd*.012*.62);
  if(s.acc>=gap){s.acc=0;spawn()}
  const air=s.jt>=0?Math.sin(Math.PI*s.jt):0;
  for(const o of s.obs){o.p+=dp;
    if(o.p>.84&&o.p<.96&&Math.abs(o.l-s.laneX)<.55&&air<.42){return finish(false)}}
  s.obs=s.obs.filter(o=>o.p<1.25);
  if(s.spd>=100)return finish(true);
  render(air);raf=requestAnimationFrame(loop);
}
// perspective helpers
const rw=tt=>90+(400-90)*tt, ry=tt=>HOR+(H-HOR)*tt, lx=(l,tt)=>CX+(l-1)*rw(tt)/3;
function render(air){
  const s=st;
  const gr=g.createLinearGradient(0,0,0,HOR);gr.addColorStop(0,'#0a0620');gr.addColorStop(1,'#3b1f7a');
  g.fillStyle=gr;g.fillRect(0,0,W,HOR);
  g.fillStyle='#120a2b';g.fillRect(0,HOR,W,H-HOR);
  // road bands
  const n=12;
  for(let k=-2;k<n;k++){
    const a=Math.max(0,(k+s.off)/n),b=Math.min(1.05,(k+1+s.off)/n);if(b<=0)continue;
    const ta=a*a,tb=b*b;
    g.fillStyle=(((k%2)+2)%2)?'#2b1b63':'#241556';
    g.beginPath();g.moveTo(CX-rw(ta)/2,ry(ta));g.lineTo(CX+rw(ta)/2,ry(ta));g.lineTo(CX+rw(tb)/2,ry(tb));g.lineTo(CX-rw(tb)/2,ry(tb));g.fill();
  }
  g.strokeStyle='#6c4bd6';g.lineWidth=3;
  for(const e of[-1.5,-.5,.5,1.5]){g.beginPath();g.moveTo(CX+e*rw(0)/3,HOR);g.lineTo(CX+e*rw(1)/3,H);g.globalAlpha=Math.abs(e)>1?1:.5;g.stroke()}
  g.globalAlpha=1;
  // objects sorted far->near, player drawn at its depth
  const items=s.obs.map(o=>({p:o.p,o}));items.push({p:.9,pl:1});items.sort((a,b)=>a.p-b.p);
  for(const it of items){
    const tt=it.p*it.p,u=rw(tt)/3;
    if(it.pl){avatar(g,lx(s.laneX,tt),ry(tt),u*.95,look,s.run,air*u*.95*.9);
      g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(lx(s.laneX,tt),ry(tt)+2,u*.3*(1-air*.4),u*.08,0,0,7);g.fill()}
    else{const o=it.o,w=u*.8,h=u*.8,x=lx(o.l,tt),y=ry(tt);
      g.fillStyle=o.c;g.fillRect(x-w/2,y-h,w,h);
      g.fillStyle=shade(o.c.length===7?o.c:'#ff6a3d',50);g.fillRect(x-w/2,y-h-h*.18,w,h*.18);
      g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=2;g.strokeRect(x-w/2,y-h,w,h)}
  }
  $('hs').textContent='Speed '+Math.floor(s.spd);$('ht').textContent=s.t.toFixed(1)+'s';
}

// ---- end + leaderboard ----
const API='/api/scores';
const localLB=()=>{try{return JSON.parse(localStorage.getItem('br_lb')||'[]')}catch(e){return[]}};
function sortLB(a){a.sort((x,y)=>(y.fin-x.fin)||(x.fin?x.t-y.t:y.spd-x.spd||y.t-x.t))}
// Online leaderboard (Python server). Falls back to this browser's storage if the server is unreachable.
async function getLB(){
  try{const r=await fetch(API);if(!r.ok)throw 0;return await r.json()}
  catch(e){return localLB()}
}
async function saveLB(e){
  try{const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(e)});if(!r.ok)throw 0;return await r.json()}
  catch(x){const a=localLB();a.push(e);sortLB(a);try{localStorage.setItem('br_lb',JSON.stringify(a.slice(0,50)))}catch(y){}return e}
}
function fillList(el,a,hl){el.innerHTML='';a.slice(0,10).forEach((e,i)=>{const li=document.createElement('li');
  li.textContent=`${e.name} [${e.d}] — ${e.fin?'FINISHED '+e.t.toFixed(2)+'s':'crashed at speed '+e.spd+' ('+e.t.toFixed(1)+'s)'}`;
  if(hl&&e.id===hl)li.style.color='#ffd45e';el.appendChild(li)})}
async function finish(win){
  const s=st;s.over=true;cancelAnimationFrame(raf);$('ctl').classList.remove('on');
  const e={id:Date.now(),name:s.name,d:s.D.n,fin:win?1:0,t:s.t,spd:Math.floor(s.spd)};
  $('et').textContent=win?'YOU FINISHED!':'CRASHED!';
  $('es').textContent=win?`Time: ${s.t.toFixed(2)}s on ${s.D.n}`:`You reached speed ${e.spd} in ${s.t.toFixed(1)}s on ${s.D.n}`;
  show('end');$('el').innerHTML='<li>Loading…</li>';const saved=await saveLB(e);fillList($('el'),await getLB(),saved.id);
}

// ---- wiring ----
const hold=(id,f)=>$(id).addEventListener('pointerdown',ev=>{ev.preventDefault();f()});
hold('bl',()=>move(-1));hold('br',()=>move(1));hold('bj',jump);
addEventListener('keydown',e=>{const k=e.key;
  if(k==='ArrowLeft'||k==='a')move(-1);else if(k==='ArrowRight'||k==='d')move(1);
  else if(k===' '||k==='ArrowUp'||k==='w'){e.preventDefault();jump()}});
$('play').onclick=start;$('again').onclick=start;
$('tomenu').onclick=()=>show('menu');
$('cust').onclick=()=>show('custom');$('cdone').onclick=()=>{try{localStorage.setItem('br_look',JSON.stringify(look))}catch(e){}show('menu')};
$('lb').onclick=async()=>{show('board');$('bl2').innerHTML='<li>Loading…</li>';fillList($('bl2'),await getLB())};$('bback').onclick=()=>show('menu');
[['gd','g'],['ch','hair'],['cs','skin'],['csh','shirt'],['cp','pants']].forEach(([id,k])=>{
  $(id).value=look[k];$(id).oninput=()=>{look[k]=$(id).value;refreshPv()}});
try{$('nm').value=localStorage.getItem('br_name')||''}catch(e){}
$('nm').oninput=()=>{try{localStorage.setItem('br_name',$('nm').value)}catch(e){}};
refreshPv();
