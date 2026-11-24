// ui.js – Menüs, Steuerung, Hauptschleife

// ================= Steuerung =================
function setControlsMode(two){const c=$('controls');c.classList.toggle('two',two);c.classList.toggle('one',!two);}
function bindJoy(id,I){const jb=$(id),kn=jb.querySelector('.knob');
  function mv(e){const r=jb.getBoundingClientRect(),Rr=r.width/2;let dx=e.clientX-(r.left+Rr),dy=e.clientY-(r.top+Rr);
    const d=Math.hypot(dx,dy),max=Rr*.62;if(d>max){dx*=max/d;dy*=max/d;}kn.style.transform=`translate(${dx}px,${dy}px)`;
    let jx=dx/max,jy=-dy/max;if(Math.hypot(jx,jy)<.15){jx=0;jy=0;}I.joy.x=jx;I.joy.y=jy;}
  jb.addEventListener('pointerdown',e=>{e.preventDefault();unlockAudio();I.joy.id=e.pointerId;try{jb.setPointerCapture(e.pointerId);}catch(_){}jb.classList.add('on');mv(e);});
  jb.addEventListener('pointermove',e=>{if(e.pointerId===I.joy.id){e.preventDefault();mv(e);}});
  const end=e=>{if(e.pointerId!==I.joy.id)return;I.joy.id=null;I.joy.x=I.joy.y=0;kn.style.transform='';jb.classList.remove('on');};
  jb.addEventListener('pointerup',end);jb.addEventListener('pointercancel',end);jb.addEventListener('lostpointercapture',end);
  jb.addEventListener('contextmenu',e=>e.preventDefault());}
bindJoy('joy1',INP[0]);bindJoy('joy2',INP[1]);
function bindBtn(id,down,up){const el=$(id);let on=false;
  el.addEventListener('pointerdown',e=>{e.preventDefault();unlockAudio();try{el.setPointerCapture(e.pointerId);}catch(_){}on=true;el.classList.add('on');down();});
  const off=e=>{e.preventDefault();if(!on)return;on=false;el.classList.remove('on');if(up)up();};
  el.addEventListener('pointerup',off);el.addEventListener('pointercancel',off);el.addEventListener('lostpointercapture',off);
  el.addEventListener('contextmenu',e=>e.preventDefault());}
const humanN=n=>n===1?P:(A.ctrl==='h2'?A:null);
function pThrowDown(c){if(!c||!c.inp)return;const I=c.inp;I.throwHeld=true;if(state==='play'&&!paused&&heldBy(c)&&!I.charging&&!c.jump){I.charging=true;I.chargeT=0;I.charge=0;}}
function pThrowUp(c){if(!c||!c.inp)return;c.inp.throwHeld=false;if(!paused)humanThrow(c);}
function pDive(c){if(c&&!paused)startDive(c,c.inp.mv[0],c.inp.mv[1]);}
function pMega(c){if(c&&!paused)startMega(c);}
for(const n of[1,2]){bindBtn('bT'+n,()=>pThrowDown(humanN(n)),()=>pThrowUp(humanN(n)));bindBtn('bH'+n,()=>pDive(humanN(n)));bindBtn('bM'+n,()=>pMega(humanN(n)));}
const K1={KeyA:'l',KeyD:'r',KeyW:'u',KeyS:'d'},K2={ArrowLeft:'l',ArrowRight:'r',ArrowUp:'u',ArrowDown:'d'};
addEventListener('keydown',e=>{if(e.target&&e.target.tagName==='INPUT')return;const code=e.code,two=mode==='2p'&&state!=='menu';
  if(K1[code]){INP[0].k[K1[code]]=1;e.preventDefault();return;}
  if(K2[code]){(two?INP[1]:INP[0]).k[K2[code]]=1;e.preventDefault();return;}
  if(code==='Space')e.preventDefault();if(e.repeat)return;
  if(code==='Space'){unlockAudio();pThrowDown(P);}
  else if(code==='ShiftLeft'||code==='KeyE')pDive(P);else if(code==='KeyQ')pMega(P);
  else if(two&&(code==='Enter'||code==='NumpadEnter')){e.preventDefault();pThrowDown(A);}
  else if(two&&(code==='ShiftRight'||code==='Period'))pDive(A);
  else if(two&&(code==='Comma'||code==='ControlRight'))pMega(A);
  else if(code==='ShiftRight')pDive(P);
  else if(code==='KeyP')togglePause();else if(code==='KeyC'&&mode!=='2p')camMode^=1;
  else if(code==='KeyM'){unlockAudio();setMusic(!settings.music);saveData();}
  else if(code==='Enter'&&state==='menu')startMode('free');});
addEventListener('keyup',e=>{const code=e.code,two=mode==='2p'&&state!=='menu';
  if(K1[code])INP[0].k[K1[code]]=0;else if(K2[code]){INP[0].k[K2[code]]=0;INP[1].k[K2[code]]=0;}
  else if(code==='Space')pThrowUp(P);else if(two&&(code==='Enter'||code==='NumpadEnter'))pThrowUp(A);});
function togglePause(){if(['play','point','intro'].includes(state)){paused=!paused;$('bPause').textContent=paused?'▶':'⏸';$('pauseTxt').style.display=paused?'flex':'none';setMusic(settings.music);}}
$('bPause').addEventListener('click',togglePause);
$('bCam').addEventListener('click',()=>{if(mode!=='2p')camMode^=1;});
$('bMusic').addEventListener('click',()=>{unlockAudio();setMusic(!settings.music);saveData();});
$('bMute').addEventListener('click',e=>{settings.sound=!settings.sound;e.currentTarget.textContent=settings.sound?'🔊':'🔇';unlockAudio();saveData();});
$('bMenuTop').addEventListener('click',()=>{if(state==='menu')return;paused=false;$('pauseTxt').style.display='none';openMenu('play');});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&['play','point'].includes(state)&&!paused)togglePause();});
$('stage').addEventListener('pointerdown',()=>{if(state==='replay')endReplay();});

// ================= Menü =================
let curTab='play';
function openMenu(tab){state='menu';document.body.classList.add('inmenu');paused=false;$('over').classList.add('hidden');$('menu').classList.remove('hidden');$('vs').classList.remove('show');$('tutBox').classList.remove('show');
  $('replayTag').classList.remove('show');$('msg').classList.remove('show');
  clearBombs();clearPU();setWave(9);wave.on=false;gull.vis=false;gullObj.active=false;rp=null;replayPend=false;
  if(mode==='2p'||A.boss||mode==='surv'||mode==='tut'){mode='free';setOpponent(FREE_OPP[sel.diff]);}
  for(const c of[P,A]){c.cheerT=0;c.root.vis=true;c.ko=null;c.jump=null;c.jumpY=0;c.hurt=0;c.x=c.side*4.5;c.z=0;c.root.r=[0,0,0];c.shield=false;c.turbo=0;c.slow=0;c.iceT=0;}
  weather='sonne';windZ=0;windStr=0;setEnv(sel.arena,'sonne',prof().look.island);mTrans=ARENAS[sel.arena].trans;
  setControlsMode(false);showTab(tab||curTab);}
function showTab(t){curTab=t;document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('sel',b.dataset.t===t));
  document.querySelectorAll('.tabp').forEach(s=>s.hidden=s.id!=='t-'+t);
  menuFocus=t==='figur'||t==='shop';$('menu').classList.toggle('side',menuFocus);refreshMenu();}
document.querySelectorAll('#tabs button').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.t)));
function refreshMenu(){const p=prof();$('profName').textContent=p.name;$('shellCnt').textContent=p.shells;$('starCnt').textContent=starCount(p)+'/'+MISSIONS.length;
  ({play:renderPlay,figur:renderFigur,shop:renderShop,miss:renderMiss,board:renderBoard,opt:renderOpt})[curTab]();}
const hx=n=>'#'+n.toString(16).padStart(6,'0');
function selRow(id,attr,cb){document.querySelectorAll(`#${id} button`).forEach(b=>b.addEventListener('click',()=>{cb(b.dataset[attr]);renderPlay();}));}
selRow('diffs','d',v=>{sel.diff=v;if(state==='menu'&&!A.boss)setOpponent(FREE_OPP[v]);});
selRow('arenas','a',v=>{sel.arena=v;setEnv(v,'sonne',prof().look.island);mTrans=ARENAS[v].trans;});
selRow('weathers','w',v=>{sel.weather=v;});
for(const[id,k]of[['chkPU','pu'],['chkSp','special'],['chkOb','obst']])$(id).addEventListener('change',e=>{opts[k]=e.target.checked;});
$('bTour').addEventListener('click',()=>startMode('tour'));$('bSurv').addEventListener('click',()=>startMode('surv'));
$('b2P').addEventListener('click',()=>startMode('2p'));$('bStart').addEventListener('click',()=>startMode('free'));
$('bTut').addEventListener('click',()=>startMode('tut'));$('bTut2').addEventListener('click',()=>startMode('tut'));
$('bAgain').addEventListener('click',()=>{$('over').classList.add('hidden');if(overAction)overAction();});
$('bMenu').addEventListener('click',()=>openMenu('play'));
$('profChip').addEventListener('click',()=>showTab('board'));
function renderPlay(){const p=prof();
  $('opps').innerHTML=TOUR.map((t,i)=>`<span class="${i<p.tourBest?'done':''}">${i<p.tourBest?'✓ ':''}${ARENAS[t.arena].icon} ${OPP[t.opp].name}${i===3?' (Boss)':''}</span>`).join('');
  $('survBest').textContent=`Rekord: ${p.survBest} besiegte Gegner`;
  $('tutCall').hidden=p.tut;
  for(const[id,attr,val]of[['diffs','d',sel.diff],['arenas','a',sel.arena],['weathers','w',sel.weather]])
    document.querySelectorAll(`#${id} button`).forEach(b=>b.classList.toggle('sel',b.dataset[attr]===val));
  $('diffInfo').textContent=DIFF[sel.diff].info;}
function opt(k,v,label,selv,swatch,lock){return`<button class="${swatch?'sw':'ob'}${selv?' sel':''}" data-k="${k}" data-v="${v}" ${swatch?`style="background:${hx(v)}" aria-label="${label}"`:''}>${swatch?'':label}</button>`;}
function renderFigur(){const L=prof().look;const rows=[];
  rows.push(['Haut',SKINS.map(v=>opt('skin',v,'Hautton',L.skin===v,true)).join('')]);
  rows.push(['Frisur',Object.entries(HAIRS).map(([v,n])=>opt('hair',v,n,L.hair===v)).join('')]);
  rows.push(['Haarfarbe',HAIRCOLS.map(v=>opt('hairCol',v,'Haarfarbe',L.hairCol===v,true)).join('')]);
  rows.push(['Shirt',SHIRTS.concat(owns('gold')?[GOLD]:[]).map(v=>opt('shirt',v,'Shirt',L.shirt===v,true)).join('')]);
  rows.push(['Kopf',Object.entries(HATS).filter(([v])=>['none','band','cap'].includes(v)||owns(v)).map(([v,n])=>opt('hat',v,n,L.hat===v)).join('')]);
  rows.push(['Brille',opt('glasses','none','Keine',L.glasses==='none')+opt('glasses','sonne','Sonnenbrille',L.glasses==='sonne')]);
  rows.push(['Bombe',Object.entries(DESIGNS).filter(([v])=>v==='classic'||owns(v)).map(([v,d])=>opt('bomb',v,d.name,L.bomb===v)).join('')]);
  rows.push(['Insel',Object.entries(ISLAND_SKINS).filter(([v])=>v==='classic'||owns(v)).map(([v,d])=>opt('island',v,d.name,L.island===v)).join('')]);
  $('figRows').innerHTML=rows.map(([t,h])=>`<div class="frow"><b>${t}</b><div>${h}</div></div>`).join('')+'<p class="hint">Mehr Hüte, Bomben und Inseln gibt es im Shop.</p>';}
$('figRows').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const k=b.dataset.k;let v=b.dataset.v;
  if(['skin','hairCol','shirt'].includes(k))v=Number(v);prof().look[k]=v;saveData();
  if(k==='island')setEnv(sel.arena,'sonne',v);else if(k!=='bomb')rebuildP();renderFigur();});
function equip(it){const L=prof().look;if(it.cat==='hat')L.hat=it.id;else if(it.cat==='shirt')L.shirt=GOLD;else if(it.cat==='bomb')L.bomb=it.id;else if(it.cat==='island'){L.island=it.id;setEnv(sel.arena,'sonne',it.id);}
  rebuildP();saveData();}
function isEquipped(it){const L=prof().look;return it.cat==='hat'?L.hat===it.id:it.cat==='shirt'?L.shirt===GOLD:it.cat==='bomb'?L.bomb===it.id:L.island===it.id;}
function renderShop(){const p=prof();
  $('shopList').innerHTML=SHOP.map(it=>{const own=owns(it.id),eq=own&&isEquipped(it);
    const btn=own?(eq?'<button class="ob sel" disabled>Angelegt</button>':`<button class="ob" data-eq="${it.id}">Anlegen</button>`):
      (p.shells>=it.price?`<button class="ob buy" data-buy="${it.id}">Kaufen · ${it.price} 🐚</button>`:`<button class="ob" disabled>🔒 ${it.price} 🐚</button>`);
    return`<div class="item"><span class="ic">${it.icon}</span><span class="nm">${it.name}</span>${btn}</div>`;}).join('');}
$('shopList').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;const p=prof();
  if(b.dataset.buy){const it=SHOP.find(i=>i.id===b.dataset.buy);if(p.shells<it.price)return;p.shells-=it.price;p.owned.push(it.id);sfx.power();equip(it);}
  else if(b.dataset.eq)equip(SHOP.find(i=>i.id===b.dataset.eq));refreshMenu();});
function renderMiss(){const p=prof();
  $('missList').innerHTML=MISSIONS.map(m=>{const done=!!p.missions[m.id];const prog=m.cnt&&!done?` <small>(${Math.min(p.cnt[m.cnt]||0,m.goal)}/${m.goal})</small>`:'';
    return`<li class="${done?'done':''}"><span>${done?'⭐':'☆'}</span>${m.name}${prog}</li>`;}).join('');}
function renderBoard(){const list=profiles.list.map((p,i)=>({p,i})).sort((a,b)=>starCount(b.p)-starCount(a.p)||b.p.w-a.p.w);
  $('board').innerHTML=`<table><thead><tr><th>Name</th><th>⭐</th><th>Siege</th><th>🏆</th><th>Überleben</th><th>Ballw.</th><th></th></tr></thead><tbody>`+
    list.map(({p,i})=>`<tr class="${i===profiles.cur?'me':''}"><td>${esc(p.name)}</td><td>${starCount(p)}</td><td>${p.w}</td><td>${p.trophy}</td><td>${p.survBest}</td><td>${p.best}</td>
      <td>${i===profiles.cur?'<small>aktiv</small>':`<button class="ob" data-pick="${i}">Wählen</button>`}</td></tr>`).join('')+'</tbody></table>';
  $('profNameIn').value=prof().name;}
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
$('board').addEventListener('click',e=>{const b=e.target.closest('button[data-pick]');if(!b)return;profiles.cur=Number(b.dataset.pick);saveData();rebuildP();setEnv(sel.arena,'sonne',prof().look.island);refreshMenu();});
$('bRename').addEventListener('click',()=>{const v=$('profNameIn').value.trim().slice(0,16);if(v){prof().name=v;saveData();refreshMenu();}});
$('bNewProf').addEventListener('click',()=>{const v=$('newProfIn').value.trim().slice(0,16)||`Spieler ${profiles.list.length+1}`;
  profiles.list.push(defProfile(v));profiles.cur=profiles.list.length-1;$('newProfIn').value='';saveData();rebuildP();setEnv(sel.arena,'sonne','classic');refreshMenu();});
function renderOpt(){$('optEco').checked=settings.eco;$('optVib').checked=settings.vib;$('optMusic').checked=settings.music;$('optSound').checked=settings.sound;}
$('optEco').addEventListener('change',e=>{settings.eco=e.target.checked;RES=settings.eco?1:1.75;resize();saveData();});
$('optVib').addEventListener('change',e=>{settings.vib=e.target.checked;saveData();vib(40);});
$('optMusic').addEventListener('change',e=>{unlockAudio();setMusic(e.target.checked);saveData();});
$('optSound').addEventListener('change',e=>{settings.sound=e.target.checked;$('bMute').textContent=settings.sound?'🔊':'🔇';saveData();});

// ================= Hauptschleife =================
let last=performance.now();
function loop(now){const rdt=Math.min(.033,(now-last)/1000);last=now;let dt=rdt;if(slowT>0){slowT-=rdt;dt=rdt*.28;}
  if(!paused){time+=dt;update(dt,rdt);}computeCam(rdt);
  renderScene(env,eye,tgt,time,torchPos,arena.torch*torchFlick,boomArr);updateOverlay();requestAnimationFrame(loop);}
RES=settings.eco?1:1.75;resize();$('bMute').textContent=settings.sound?'🔊':'🔇';$('bMusic').classList.toggle('off',!settings.music);
openMenu('play');requestAnimationFrame(loop);
// Offline-App: Service Worker nur ausserhalb von claude.ai (z. B. GitHub Pages)
try{if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost')&&window.self===window.top&&!/claude\.(ai|site)|claudeusercontent/.test(location.hostname))
  navigator.serviceWorker.register('sw.js').catch(()=>{});}catch(e){}
window.__dbg={P,get A(){return A;},bombs,INP,get state(){return state;},startMode,prepareMatch,scorePoint,koHit,spawnPU,get mode(){return mode;},prof,openMenu};
