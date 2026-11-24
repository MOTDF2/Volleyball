// game.js – Spiellogik von Bomben-Volleyball 3D

// ================= Speicher: Einstellungen & Spielerprofile =================
const SKEY='bombVB3d_v2';
let settings={eco:false,vib:true,music:true,sound:true};
let profiles={cur:0,list:[]};
function defLook(){return{skin:0xf1c27d,hair:'kurz',hairCol:0x4e342e,shirt:0x1e88e5,hat:'band',glasses:'none',bomb:'classic',island:'classic'};}
function defProfile(name){return{name,w:0,l:0,best:0,trophy:0,tourBest:0,survBest:0,shells:0,owned:[],look:defLook(),missions:{},cnt:{dive:0,pups:0,kracher:0},tut:false};}
function loadData(){try{const d=JSON.parse(localStorage.getItem(SKEY)||'null');if(d){Object.assign(settings,d.settings||{});if(d.profiles&&d.profiles.list)profiles=d.profiles;}}catch(e){}
  if(!profiles.list.length){const p=defProfile('Spieler 1');
    try{const o=JSON.parse(localStorage.getItem('bombVB3d')||'null');if(o){for(const k of['w','l','best','trophy','tourBest'])p[k]=o[k]||0;p.tut=true;}}catch(e){}
    profiles.list.push(p);}
  for(const p of profiles.list){const d=defProfile(p.name);for(const k in d)if(p[k]===undefined)p[k]=d[k];p.look=Object.assign(defLook(),p.look);p.cnt=Object.assign(d.cnt,p.cnt);}
  profiles.cur=clamp(profiles.cur|0,0,profiles.list.length-1);}
function saveData(){try{localStorage.setItem(SKEY,JSON.stringify({settings,profiles}));}catch(e){}}
loadData();
const prof=()=>profiles.list[profiles.cur];
const starCount=p=>Object.keys(p.missions).length;
function vib(ms){try{if(settings.vib&&navigator.vibrate)navigator.vibrate(ms);}catch(e){}}

// ================= Ton & Musik =================
let paused=false,AC=null,musicGain=null,mNext=0,mStep=0,mTrans=0;
function unlockAudio(){if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){}
    if(AC){musicGain=AC.createGain();musicGain.gain.value=0;musicGain.connect(AC.destination);mNext=AC.currentTime+.1;setInterval(scheduleMusic,30);setMusic(settings.music);}}
  if(AC&&AC.state==='suspended')AC.resume().catch(()=>{});}
function tone(f,d,type,v,f2){if(!AC||!settings.sound)return;const t=AC.currentTime,o=AC.createOscillator(),g=AC.createGain();
  o.type=type||'sine';o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);
  g.gain.setValueAtTime(v||.15,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(AC.destination);o.start(t);o.stop(t+d);}
function noiseBuf(d){const len=Math.floor(AC.sampleRate*d),buf=AC.createBuffer(1,len,AC.sampleRate),ch=buf.getChannelData(0);
  for(let i=0;i<len;i++)ch[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.2);return buf;}
function noise(d,freq,ftype,v,dest,at){if(!AC||(!settings.sound&&!dest))return;const s=AC.createBufferSource();s.buffer=noiseBuf(d);const f=AC.createBiquadFilter();f.type=ftype;f.frequency.value=freq;
  const g=AC.createGain();g.gain.value=v;s.connect(f);f.connect(g);g.connect(dest||AC.destination);s.start(at||0);}
const sfx={boom(){noise(1,800,'lowpass',.9);tone(110,.6,'sine',.45,30);},splash(){noise(.6,1500,'highpass',.35);tone(400,.3,'sine',.08,120);},
  throw(){noise(.18,2500,'bandpass',.25);tone(300,.15,'triangle',.08,700);},catch(){tone(520,.08,'square',.07);tone(780,.12,'square',.05);},
  net(){tone(160,.2,'sawtooth',.1,90);},tick(){tone(1200,.04,'square',.05);},dive(){noise(.25,900,'bandpass',.3);tone(220,.18,'triangle',.07,120);},
  power(){[660,880,1320].forEach((f,i)=>setTimeout(()=>tone(f,.15,'triangle',.1),i*70));},shield(){tone(300,.4,'sine',.2,900);tone(600,.4,'triangle',.08,1500);},
  mega(){tone(180,.7,'sawtooth',.12,1400);noise(.6,3000,'highpass',.2);},ko(){noise(1.6,500,'lowpass',1.1);tone(80,1.2,'sine',.55,22);},
  crowd(){noise(1.4,1600,'bandpass',.35);noise(1.2,900,'bandpass',.2);},freeze(){tone(1600,.35,'sine',.08,500);},
  gull(){tone(1400,.15,'triangle',.06,900);setTimeout(()=>tone(1300,.18,'triangle',.05,800),160);},wave(){noise(1.6,500,'lowpass',.35);},
  win(){[523,659,784,1046].forEach((f,i)=>setTimeout(()=>tone(f,.25,'triangle',.12),i*120));},
  lose(){[392,330,262].forEach((f,i)=>setTimeout(()=>tone(f,.3,'triangle',.12),i*160));}};
const MEL=[72,0,76,79,76,0,74,72,69,0,72,76,74,72,69,0,65,69,72,0,74,72,69,0,67,71,74,0,79,77,74,71];
const BASS=[48,45,41,43],CHD=[[64,67],[64,69],[65,69],[67,71]];
const mtof=m=>440*Math.pow(2,(m-69)/12);
function pan(f,t,v,dec){const o=AC.createOscillator(),o2=AC.createOscillator(),g=AC.createGain(),g2=AC.createGain();
  o.type='sine';o2.type='sine';o.frequency.value=f;o2.frequency.value=f*2.01;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0008,t+dec);
  g2.gain.setValueAtTime(0,t);g2.gain.linearRampToValueAtTime(v*.4,t+.004);g2.gain.exponentialRampToValueAtTime(.0008,t+dec*.35);
  o.connect(g);o2.connect(g2);g.connect(musicGain);g2.connect(musicGain);o.start(t);o2.start(t);o.stop(t+dec+.05);o2.stop(t+dec+.05);}
function bassNote(f,t){const o=AC.createOscillator(),g=AC.createGain();o.type='triangle';o.frequency.value=f;
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.16,t+.01);g.gain.exponentialRampToValueAtTime(.001,t+.32);o.connect(g);g.connect(musicGain);o.start(t);o.stop(t+.35);}
function scheduleMusic(){if(!AC||!musicGain||AC.state!=='running'||!settings.music)return;const spb=60/112/2;
  if(mNext<AC.currentTime-.2)mNext=AC.currentTime+.05;
  while(mNext<AC.currentTime+.15){const s=mStep%32,bar=Math.floor(s/8),b=s%8;
    if(MEL[s])pan(mtof(MEL[s]+mTrans),mNext,.075,.5);
    if(b===0||b===4||b===7)bassNote(mtof(BASS[bar]+mTrans-12+(b===7?7:0)),mNext);
    if(b===2||b===6)for(const n of CHD[bar])pan(mtof(n+mTrans-12),mNext,.03,.25);
    noise(.05,7000,'highpass',b%2?.025:.045,musicGain,mNext);
    mNext+=spb;mStep++;}}
function setMusic(on){settings.music=on;const b=$('bMusic');if(b)b.classList.toggle('off',!on);if(musicGain)musicGain.gain.value=(on&&!paused)?.5:0;}

// ================= Aussehen =================
const HAIRS={kurz:'Kurz',zopf:'Zopf',stachel:'Stacheln',locken:'Locken',glatze:'Glatze'};
const HATS={none:'Keiner',band:'Stirnband',cap:'Cap',stroh:'Strohhut',wikinger:'Wikingerhelm',krone:'Krone'};
const SKINS=[0xffdbac,0xf1c27d,0xe0ac69,0xc68642,0x8d5524];
const HAIRCOLS=[0x4e342e,0x212121,0xffd54f,0xd84315,0x1e88e5,0xec407a];
const SHIRTS=[0x1e88e5,0xe53935,0x43a047,0xff9800,0x8e24aa,0x00bfa5,0xec407a,0x212121];
const GOLD=0xffc107;
const SHOP=[
  {id:'stroh',cat:'hat',name:'Strohhut',price:10,icon:'👒'},{id:'wikinger',cat:'hat',name:'Wikingerhelm',price:25,icon:'⛑️'},{id:'krone',cat:'hat',name:'Krone',price:40,icon:'👑'},
  {id:'gold',cat:'shirt',name:'Gold-Shirt',price:20,icon:'✨'},
  {id:'kokos',cat:'bomb',name:'Kokosnuss-Bombe',price:15,icon:'🥥'},{id:'melone',cat:'bomb',name:'Wassermelonen-Bombe',price:20,icon:'🍉'},{id:'disko',cat:'bomb',name:'Diskokugel-Bombe',price:40,icon:'🪩'},
  {id:'pink',cat:'island',name:'Pinker Sand',price:30,icon:'🌸'},{id:'lava',cat:'island',name:'Lava-Insel',price:45,icon:'🌋'}];
const owns=id=>prof().owned.includes(id);
const OPP={
  kalle:{name:'Kokos-Kalle',skin:0xc68642,hair:'stachel',hairCol:0x212121,shirt:0xe53935,shorts:0x6a1b1a,hat:'none',glasses:'sonne',
    lines:{serve:['Fang das, wenn du kannst!','Achtung, heiss!'],score:['Haha, Treffer!','Kokosnuss-Power!'],lost:['Mist!','Das war Glück!'],catch:['Easy!','Zu einfach!']}},
  sina:{name:'Surf-Sina',skin:0xe8b88a,hair:'zopf',hairCol:0xffd54f,shirt:0x8e24aa,shorts:0x00bfa5,hat:'none',glasses:'none',extra:'flower',
    lines:{serve:['Welle reiten!','Bereit für die Brandung?'],score:['Cowabunga!','Zu langsam!'],lost:['Grrr!','Wipeout!'],catch:['Locker!','Wie auf dem Brett!']}},
  kaboom:{name:'Captain Kaboom',skin:0xd7a26a,hair:'kurz',hairCol:0x4e342e,shirt:0x37474f,shorts:0x3e2723,hat:'pirat',glasses:'none',extra:'pirate',
    lines:{serve:['Kanonenkugel los!','Arrr!'],score:['Ein Hoch auf die Bombe!','Arrr, versenkt!'],lost:['Bei meinem Holzbein!','Meuterei!'],catch:['Arrr!','Gefangen wie ein Fisch!']}},
  kraki:{name:'Krake Kraki',boss:true,lines:{serve:['Blubb!','Acht Arme, null Chance!'],score:['Blubb blubb!','Tintenklecks!'],lost:['Blubb?!','Ich krieg dich!'],catch:['Acht Arme!','Blubb!']}}};
const P2LOOK={name:'Spieler 2',skin:0xe0ac69,hair:'locken',hairCol:0xd84315,shirt:0xff9800,shorts:0x5d4037,hat:'cap',glasses:'none'};
const SURV_NAMES=['Muschel-Max','Palmen-Paula','Hai-Henry','Lagunen-Lena','Tiki-Tom','Welle-Willi','Sandy','Korallen-Kim','Bongo-Ben','Flamingo-Fia','Riff-Rocco','Möwen-Mia'];
const GEN_LINES={serve:['Los geht\'s!','Pass auf!'],score:['Treffer!','Ha!'],lost:['Oh nein!','Mist!'],catch:['Hab sie!','Gefangen!']};

function baseChar(side,look){return{side,x:side*4.5,z:0,vx:0,vz:0,evx:0,evz:0,spd:0,lives:3,maxLives:3,hits:0,hurt:0,catchT:0,throwT:0,anim:0,armA:0,
  diveT:0,diveCd:0,ddx:0,ddz:0,tilt:0,cheerT:0,shield:false,turbo:0,slow:0,iceT:0,streak:0,mega:0,jump:null,jumpY:0,ko:null,look,
  holdH:HOLD_H,catchR:.8,catchLo:1.15,catchHi:2.95,hitR:1.0,hitY:1.0,ctrl:'ai',inp:null,min:0,max:0,boss:false};}
function finishChar(c,root,body,starY,bub,shadowS){
  c.stars=new Nd(null,{p:[0,starY,0]});for(let k=0;k<3;k++){const an=k*2.094;c.stars.add(new Nd(UM.star,{p:[Math.cos(an)*.32,0,Math.sin(an)*.32],r:[Math.PI/2,-an,0],s:.12,col:0xffeb3b,mode:4}));}
  c.stars.vis=false;root.add(c.stars);
  c.bubble=new Nd(UM.sph,{p:[0,bub[1],0],s:[bub[0],bub[2],bub[0]],col:0x40c4ff,a:.22});c.bubble.vis=false;root.add(c.bubble);
  c.shadow=new Nd(UM.disc,{p:[0,.02,0],s:[shadowS,1,shadowS],col:0,mode:4,a:.28});
  c.root=root;c.body=body;scene.add(root,c.shadow);return c;}
function makeChar(side,L){const c=baseChar(side,L);
  const S=hex(L.skin),SH=hex(L.shirt),SO=hex(L.shorts||0x0d47a1),HC=L.hairCol;
  const root=new Nd(null),body=new Nd(null);root.add(body);
  const leg=x=>{const h=new Nd(null,{p:[x,.95,0]});h.add(new Nd(UM.cyl,{p:[0,-.43,0],s:[.09,.86,.09],col:S}),new Nd(UM.box,{p:[0,-.88,.05],s:[.16,.1,.3],col:0xffffff}));return h;};
  const arm=x=>{const h=new Nd(null,{p:[x,1.6,0]});h.add(new Nd(UM.cyl,{p:[0,-.31,0],s:[.065,.6,.065],col:S}),new Nd(UM.cyl,{p:[0,-.09,0],s:[.095,.2,.095],col:SH}),new Nd(UM.sph,{p:[0,-.63,0],s:.085,col:S}));return h;};
  c.legL=leg(-.13);c.legR=leg(.13);c.armL=arm(-.31);c.armR=arm(.31);
  body.add(c.legL,c.legR,c.armL,c.armR,
    new Nd(UM.cyl,{p:[0,1.0,0],s:[.24,.3,.19],col:SO}),new Nd(UM.cyl,{p:[0,1.37,0],s:[.26,.5,.19],col:SH}),
    new Nd(UM.sph,{p:[0,1.61,0],s:[.27,.1,.19],col:SH}),new Nd(UM.cyl,{p:[0,1.72,0],s:[.07,.12,.07],col:S}),
    new Nd(UM.sph,{p:[0,1.92,0],s:[.2,.21,.2],col:S}),new Nd(UM.sphLo,{p:[0,1.895,.2],s:.035,col:S}));
  const pirate=L.extra==='pirate';
  if(!pirate)body.add(new Nd(UM.cyl,{p:[0,1.45,0],s:[.266,.07,.196],col:L.shirt===GOLD?0xfff59d:0xffffff}),new Nd(UM.box,{p:[0,1.83,.19],s:[.09,.025,.02],col:0x7a2a1a}));
  else for(const y of[1.2,1.32,1.44,1.56])body.add(new Nd(UM.cyl,{p:[0,y,0],s:[.266,.045,.196],col:0xeceff1}));
  for(const x of pirate?[-.07]:[-.07,.07])body.add(new Nd(UM.sphLo,{p:[x,1.95,.18],s:.03,col:0x1a1a1a}));
  // Frisur
  const h=L.hair;
  if(h==='kurz')body.add(new Nd(UM.hemi,{p:[0,1.93,-.01],r:[-.4,0,0],s:[.215,.23,.215],col:HC}));
  else if(h==='zopf')body.add(new Nd(UM.hemi,{p:[0,1.93,-.02],r:[-.45,0,0],s:[.22,.24,.22],col:HC}),new Nd(UM.sph,{p:[0,1.98,-.22],s:[.09,.09,.11],col:HC}),
    new Nd(UM.cone,{p:[0,1.78,-.27],r:[.35,0,Math.PI],s:[.08,.32,.08],col:HC}));
  else if(h==='stachel'){body.add(new Nd(UM.hemi,{p:[0,1.94,-.01],r:[-.3,0,0],s:[.212,.2,.212],col:HC}));
    for(let k=-2;k<=2;k++)body.add(new Nd(UM.cone,{p:[k*.07,2.13-Math.abs(k)*.025,-.03],r:[-.25,0,-k*.25],s:[.06,.18,.06],col:HC}));}
  else if(h==='locken'){body.add(new Nd(UM.hemi,{p:[0,1.93,-.01],r:[-.35,0,0],s:[.215,.22,.215],col:HC}));
    for(let k=0;k<9;k++){const an=k/9*Math.PI*2;body.add(new Nd(UM.sphLo,{p:[Math.cos(an)*.16,2.04+Math.sin(an*2)*.02,Math.sin(an)*.16-.04],s:.075,col:HC}));}}
  // Kopfbedeckung
  const hat=L.hat;
  if(hat==='band')body.add(new Nd(UM.cyl,{p:[0,2.0,-.01],r:[-.18,0,0],s:[.214,.05,.214],col:0xffeb3b}));
  else if(hat==='cap')body.add(new Nd(UM.hemi,{p:[0,1.97,0],s:[.22,.17,.22],col:SH}),new Nd(UM.box,{p:[0,1.99,.21],r:[-.12,0,0],s:[.26,.025,.2],col:SH}));
  else if(hat==='stroh')body.add(new Nd(UM.cyl,{p:[0,2.06,0],s:[.42,.025,.42],col:0xe6c86e}),new Nd(UM.cyl,{p:[0,2.15,0],s:[.2,.17,.2],col:0xe6c86e}),new Nd(UM.cyl,{p:[0,2.1,0],s:[.205,.04,.205],col:0xd32f2f}));
  else if(hat==='wikinger'){body.add(new Nd(UM.hemi,{p:[0,1.99,0],s:[.228,.2,.228],col:0x9e9e9e}),new Nd(UM.box,{p:[0,1.92,.21],s:[.03,.12,.03],col:0x9e9e9e}));
    for(const sx of[-1,1])body.add(new Nd(UM.cone,{p:[sx*.24,2.16,0],r:[0,0,-sx*.75],s:[.055,.22,.055],col:0xfff8e1}));}
  else if(hat==='krone'){body.add(new Nd(UM.cyl,{p:[0,2.12,0],s:[.16,.09,.16],col:0xffc107}));
    for(let k=0;k<6;k++){const an=k/6*Math.PI*2;body.add(new Nd(UM.cone,{p:[Math.cos(an)*.15,2.21,Math.sin(an)*.15],s:[.035,.08,.035],col:0xffc107}));}
    body.add(new Nd(UM.sphLo,{p:[0,2.12,.16],s:.03,col:0xe53935}));}
  else if(hat==='pirat')body.add(new Nd(UM.hemi,{p:[0,1.94,-.01],r:[-.3,0,0],s:[.214,.2,.214],col:0xc62828}),
      new Nd(UM.cyl,{p:[0,2.1,0],s:[.38,.03,.27],col:0x111111}),new Nd(UM.hemi,{p:[0,2.1,0],s:[.2,.17,.2],col:0x111111}),new Nd(UM.sphLo,{p:[0,2.17,.19],s:.035,col:0xffffff}));
  if(L.glasses==='sonne')body.add(new Nd(UM.box,{p:[0,1.955,.19],s:[.32,.075,.05],col:0x111111}));
  if(L.extra==='flower'){for(let k=0;k<5;k++){const an=k*1.257;body.add(new Nd(UM.sphLo,{p:[.17+Math.cos(an)*.04,2.02+Math.sin(an)*.04,.07],s:.035,col:0xff4081}));}
    body.add(new Nd(UM.sphLo,{p:[.17,2.02,.09],s:.025,col:0xffeb3b}));}
  if(pirate)body.add(new Nd(UM.box,{p:[.07,1.95,.19],s:[.09,.075,.03],col:0x111111}),new Nd(UM.box,{p:[0,1.99,.17],r:[0,0,-.45],s:[.42,.015,.02],col:0x111111}),
      new Nd(UM.sph,{p:[0,1.8,.08],s:[.16,.11,.13],col:0x4e342e}),new Nd(UM.sphLo,{p:[-.2,1.9,0],s:.03,col:0xffca28}));
  return finishChar(c,root,body,2.45,[.78,1.15,1.25],.55);}
function makeBoss(){const L=OPP.kraki,c=baseChar(1,L);c.boss=true;c.holdH=3.7;c.catchLo=1.4;c.catchHi=4.5;c.hitR=1.8;c.hitY=2.0;
  const PUR=0x8e24aa,PL=0xce93d8,DK=0x4a148c;const root=new Nd(null),body=new Nd(null);root.add(body);
  body.add(new Nd(UM.sph,{p:[0,2.45,0],s:[1.05,1.2,1.0],col:PUR}),new Nd(UM.sph,{p:[0,1.45,.05],s:[.95,.65,.85],col:PUR}));
  for(const[x,y,z]of[[.5,3,.6],[-.6,2.85,.55],[.2,3.45,.45],[-.3,3.3,-.6],[.7,2.4,-.5]])body.add(new Nd(UM.sphLo,{p:[x,y,z],s:.14,col:PL}));
  for(const sx of[-1,1])body.add(new Nd(UM.sph,{p:[sx*.38,2.5,.82],s:[.26,.28,.18],col:0xffffff}),new Nd(UM.sphLo,{p:[sx*.38,2.47,.98],s:.11,col:0x111111}),
    new Nd(UM.box,{p:[sx*.38,2.85,.86],r:[0,0,sx*.35],s:[.34,.07,.07],col:DK}));
  body.add(new Nd(UM.sph,{p:[0,1.98,.88],s:[.2,.12,.1],col:0x311b92}));
  const tent=(px,py,pz,len,r)=>{const h=new Nd(null,{p:[px,py,pz]});h.add(new Nd(UM.cyl,{p:[0,-len/2,0],s:[r,len,r],col:PUR}),new Nd(UM.sph,{p:[0,-len,0],s:r,col:PUR}));
    for(let k=1;k<4;k++)h.add(new Nd(UM.sphLo,{p:[0,-len*k/4,r*.85],s:r*.4,col:PL}));return h;};
  c.legL=tent(-.45,1.1,.35,1.0,.2);c.legR=tent(.45,1.1,.35,1.0,.2);c.armL=tent(-.95,1.95,0,1.4,.17);c.armR=tent(.95,1.95,0,1.4,.17);
  body.add(c.legL,c.legR,c.armL,c.armR);c.tent=[];
  for(let k=0;k<4;k++){const an=k/4*Math.PI*2+.4,t=tent(Math.cos(an)*.75,.95,Math.sin(an)*.75,1.1,.17);t.an=an;t.ph=k*1.3;c.tent.push(t);body.add(t);}
  return finishChar(c,root,body,4.1,[1.6,2.2,2.4],1.6);}
function playerLook(){const l=prof().look;return{name:prof().name,skin:l.skin,hair:l.hair,hairCol:l.hairCol,shirt:l.shirt,shorts:0x0d47a1,hat:l.hat,glasses:l.glasses};}
const NODEKEYS=['root','body','legL','legR','armL','armR','stars','bubble','shadow','look','tent'];
const P=makeChar(-1,playerLook());P.min=-12;P.max=-.45;P.ctrl='h1';
let A=makeChar(1,OPP.kalle);A.min=.45;A.max=12;
function rebuildP(){removeNode(P.root);removeNode(P.shadow);const n=makeChar(-1,playerLook());for(const k of NODEKEYS)P[k]=n[k];}
function setOpponent(key,look){removeNode(A.root);removeNode(A.shadow);
  A=key==='kraki'?makeBoss():makeChar(1,look||OPP[key]);A.min=.45;A.max=12;}
const other=c=>c===P?A:P;
const nameOf=c=>mode==='2p'?(c===P?'Spieler 1':'Spieler 2'):(c===P?'Du':c.look.name);

// ================= Eingaben =================
function mkInp(){return{joy:{x:0,y:0,id:null},k:{l:0,r:0,u:0,d:0},throwHeld:false,charging:false,chargeT:0,charge:0,mv:[0,0]};}
const INP=[mkInp(),mkInp()];P.inp=INP[0];

// ================= Bomben =================
const BV=[];
function makeBombVis(i){const g=new Nd(null);const body=new Nd(UM.sph,{s:BR,col:0x1c1c1c});
  const b1=new Nd(UM.cyl,{s:[BR*1.03,.05,BR*1.03],col:0xffffff}),b2=new Nd(UM.cyl,{r:[Math.PI/2,0,0],s:[BR*1.03,.05,BR*1.03],col:0xffffff});
  g.add(body,b1,b2,new Nd(UM.sphLo,{p:[-.08,.1,.16],s:.06,col:0xffffff,mode:4,a:.6}),new Nd(UM.cyl,{p:[0,.28,0],s:[.08,.1,.08],col:0x555555}),
    new Nd(UM.cyl,{p:[.03,.37,0],r:[0,0,-.4],s:[.022,.14,.022],col:0xc8a165}));
  const spark=new Nd(UM.sphLo,{s:.06,col:0xfff59d,mode:4}),glow=new Nd(UM.disc,{s:.5,col:0xffa040,mode:5,add:true}),
    aura=new Nd(UM.disc,{s:1.2,col:0xffffff,mode:5,add:true,a:0}),shadow=new Nd(UM.disc,{col:0,mode:4,a:.35});
  for(const n of[g,spark,glow,aura,shadow]){n.vis=false;scene.add(n);}
  return{i,g,body,b1,b2,spark,glow,aura,shadow,used:false,auraCol:null};}
for(let i=0;i<3;i++)BV.push(makeBombVis(i));
const DESIGNS={classic:{name:'Klassisch',body:0x1c1c1c,band:null},kokos:{name:'Kokosnuss',body:0x6d4c41,band:0x8d6e63},
  melone:{name:'Wassermelone',body:0x43a047,band:0x1b5e20},disko:{name:'Diskokugel',body:0xcfd8dc,band:0x78909c,glow:0xffffff}};
const TYPES={ice:{body:0x81d4fa,band:0xffffff,glow:0x81d4fa,name:'Eisbombe',icon:'❄️'},split:{body:0x7e57c2,band:0xffeb3b,glow:0xb388ff,name:'Teilbombe',icon:'✂️'},
  gold:{body:0xffc107,band:0xfff59d,glow:0xffd54f,name:'Goldbombe',icon:'🥇'},mega:{body:0xd50000,band:0xffab00,glow:0xff3d00}};
let curDesign='classic';
function styleBomb(b){const v=b.v;let st=DESIGNS[curDesign]||DESIGNS.classic;if(b.mega)st=TYPES.mega;else if(b.type!=='normal')st=TYPES[b.type];
  v.body.col=hex(st.body);v.b1.vis=v.b2.vis=st.band!=null;if(st.band!=null){v.b1.col=hex(st.band);v.b2.col=hex(st.band);}v.auraCol=st.glow||null;}
const bombs=[];
function makeBomb(){const v=BV.find(v=>!v.used);if(!v)return null;v.used=true;
  const b={x:0,y:0,z:0,vx:0,vy:0,vz:0,holder:null,thrower:null,fuse:0,fuseMax:3,rot:0,netHit:false,type:'normal',kracher:false,mega:false,splitDone:false,target:null,v};
  bombs.push(b);styleBomb(b);return b;}
function hideVis(v){for(const n of[v.g,v.spark,v.glow,v.aura,v.shadow])n.vis=false;}
function killBomb(b){b.v.used=false;hideVis(b.v);const i=bombs.indexOf(b);if(i>=0)bombs.splice(i,1);}
function clearBombs(){while(bombs.length)killBomb(bombs[0]);}
const heldBy=c=>bombs.find(b=>b.holder===c);

// ================= Partikel =================
const pool=[];for(let k=0;k<300;k++){const n=new Nd(UM.sphLo);n.vis=false;scene.add(n);pool.push({n,life:0});}
function spawn(o){if(o.opt&&settings.eco&&Math.random()<.6)return;const q=pool.find(q=>q.life<=0);if(!q)return;
  Object.assign(q,{vr:0,g:0,vx:0,vy:0,vz:0,ss:null},o);q.max=o.life;const n=q.n;n.vis=true;n.mesh=o.mesh||UM.sphLo;
  n.col=hex(o.c);n.mode=o.mode===undefined?4:o.mode;n.add_=!!o.add;n.a=o.a===undefined?1:o.a;q.a0=n.a;n.p=[o.x,o.y,o.z];n.r=[0,0,0];n.s=o.ss||[o.r,o.r,o.r];}
function updateParticles(dt){for(const q of pool){if(q.life<=0)continue;q.life-=dt;const n=q.n;if(q.life<=0){n.vis=false;continue;}
  q.vy-=q.g*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;
  if(q.g>0&&q.y<.04&&q.vy<0){q.y=.04;q.vy*=-.25;q.vx*=.5;q.vz*=.5;}
  const a=q.life/q.max;n.p[0]=q.x;n.p[1]=q.y;n.p[2]=q.z;
  if(q.t==='fire'){const s=q.r*(.3+a);n.s=[s,s,s];n.a=Math.min(1,a*1.6);}
  else if(q.t==='smoke'){const s=q.r*(1+(1-a)*1.8);n.s=[s,s,s];n.a=q.a0*a;}
  else if(q.t==='conf'){n.r[0]+=q.vr*dt;n.r[1]+=q.vr*dt*.7;n.s=[.14,.02,.09];}
  else if(q.t==='streak'){n.a=q.a0*Math.min(1,a*2);}
  else{n.a=Math.min(q.a0,a*3);}}}
function resetParticles(){for(const q of pool){q.life=0;q.n.vis=false;}}
let shake=0,flashT=0,shockT=0;const boomArr=[0,0,0,0];
const shock=new Nd(UM.ring,{col:0xfff3e0,mode:4,a:0}),boomGlow=new Nd(UM.disc,{col:0xffc070,mode:5,add:true,a:0});
const aimRing=new Nd(UM.ring,{s:.6,col:0x69f0ae,mode:4,a:.9}),landRing=new Nd(UM.ring,{s:.75,col:0xffeb3b,mode:4,a:.85});
scene.add(shock,boomGlow,aimRing,landRing);for(const n of[shock,boomGlow,aimRing,landRing])n.vis=false;
function explosion(x,y,z,big){big=big||1;shake=.5*big;flashT=.3*Math.min(big,1.15);shockT=.55;boomArr[0]=x;boomArr[1]=y+.5;boomArr[2]=z;boomArr[3]=3.2*Math.min(big,1.2);sfx.boom();vib(90);
  shock.vis=boomGlow.vis=true;shock.p=[x,.06,z];boomGlow.p=[x,y,z];
  for(let k=0;k<44*big;k++){const th=rand(0,6.28),ph=rand(-.3,1.4),s=rand(3,9)*Math.sqrt(big);
    spawn({t:'fire',x,y,z,vx:Math.cos(th)*Math.cos(ph)*s,vy:Math.sin(ph)*s,vz:Math.sin(th)*Math.cos(ph)*s,g:4,life:rand(.35,.85),r:rand(.2,.45),c:[0xfff176,0xffb300,0xff6d00,0xe53935][k%4],add:true});}
  for(let k=0;k<18*big;k++)spawn({t:'smoke',x:x+rand(-.4,.4),y:y+rand(0,.4),z:z+rand(-.4,.4),vx:rand(-1.2,1.2),vy:rand(1,3),vz:rand(-1.2,1.2),g:-.5,life:rand(1,1.8),r:rand(.35,.65),c:0x616161,mode:0,a:.55});
  for(let k=0;k<18;k++){const th=rand(0,6.28),s=rand(2,6);spawn({t:'bit',x,y:Math.max(y,.2),z,vx:Math.cos(th)*s,vy:rand(4,9),vz:Math.sin(th)*s,g:20,life:1.3,r:rand(.06,.12),c:0xd9b26a,mode:0,opt:true});}}
function splash(x,z){shake=.2;sfx.splash();shockT=.6;shock.vis=true;shock.p=[x,-.15,z];
  for(let k=0;k<36;k++){const th=rand(0,6.28),s=rand(.5,2.5);spawn({t:'bit',x,y:-.1,z,vx:Math.cos(th)*s,vy:rand(4,9),vz:Math.sin(th)*s,g:20,life:1.1,r:rand(.06,.14),c:k%3?0xb3e5fc:0xffffff,mode:0});}}
function puff(x,y,z,c){for(let k=0;k<10;k++){const th=rand(0,6.28);spawn({t:'bit',x,y,z,vx:Math.cos(th)*1.8,vy:rand(-1,1.5),vz:Math.sin(th)*1.8,life:.35,r:.06,c:c||0xffffff});}}
function sandPuff(x,z){for(let k=0;k<12;k++){const th=rand(0,6.28);spawn({t:'smoke',x:x+rand(-.2,.2),y:.15,z:z+rand(-.2,.2),vx:Math.cos(th)*1.2,vy:rand(.4,1.2),vz:Math.sin(th)*1.2,life:.6,r:.14,c:0xe8cf95,mode:0,a:.7,opt:true});}}
function confetti(){for(let k=0;k<140;k++)spawn({t:'conf',mesh:UM.box,x:rand(-9,9),y:rand(7,13),z:rand(-4,5),vx:rand(-.6,.6),vy:rand(-3,-1.5),vz:rand(-.6,.6),g:.3,vr:rand(4,9),life:5,r:.1,c:[0xff4081,0xffeb3b,0x40c4ff,0x69f0ae,0xff6d00][k%5]});}

// ================= Schwierigkeiten & Modi =================
const DIFF={
  leicht:{name:'Leicht',aiSpeed:2.6,react:.6,err:1.0,throwErr:1.2,fuse:5,dodge:false,aim:true,catchR:1.15,catchLo:.9,catchHi:3.3,chargeP:1.3,tempoStep:.03,tempoMax:1.3,aiMode:'near',hold:[.9,1.6],aiDive:false,aiPU:false,aiCatchR:.8,lives:3,double:0,
    info:'Langsamer Gegner, der oft danebengreift und dir zuwirft. Grosser Fangbereich, lange Lunte, Zielhilfe.'},
  mittel:{name:'Mittel',aiSpeed:5.4,react:.16,err:.25,throwErr:.55,fuse:2.6,dodge:true,aim:false,catchR:.8,catchLo:1.15,catchHi:2.95,chargeP:.75,tempoStep:.08,tempoMax:1.9,aiMode:'far',hold:[.3,.7],aiDive:true,aiPU:true,aiCatchR:.8,lives:3,double:0,
    info:'Flinker Gegner, wirft gezielt weit weg von dir und hechtet. Kurze Lunte, Tempo steigt schnell.'},
  schwer:{name:'Schwer',aiSpeed:6.4,react:.08,err:.12,throwErr:.45,fuse:2.0,dodge:true,aim:false,catchR:.75,catchLo:1.2,catchHi:2.9,chargeP:.6,tempoStep:.1,tempoMax:2.2,aiMode:'corner',hold:[.2,.5],aiDive:true,aiPU:true,aiCatchR:.8,lives:3,double:0,
    info:'Sehr schneller Gegner, zielt auf die Ecken. Sehr kurze Lunte. Tipp: Hechtsprung, Power-ups und Mega-Sprung nutzen.'},
  boss:{name:'Boss',aiSpeed:3.6,react:.2,err:.25,throwErr:.5,fuse:2.4,dodge:true,aim:false,catchR:.8,catchLo:1.15,catchHi:2.95,chargeP:.7,tempoStep:.07,tempoMax:1.9,aiMode:'far',hold:[.4,.8],aiDive:false,aiPU:false,aiCatchR:1.5,lives:5,double:.35},
  tut:{name:'Tutorial',aiSpeed:4,react:.2,err:0,throwErr:.25,fuse:8,dodge:false,aim:true,catchR:1.25,catchLo:.9,catchHi:3.3,chargeP:1.3,tempoStep:0,tempoMax:1,aiMode:'near',hold:[1,1.5],aiDive:false,aiPU:false,aiCatchR:3,lives:3,double:0}};
function survDiff(n){const k=Math.min(1,n/8);return{name:`Stufe ${n+1}`,aiSpeed:lerp(2.8,6.6,k),react:lerp(.55,.07,k),err:lerp(.9,.1,k),throwErr:lerp(1.2,.42,k),fuse:lerp(4.5,2.0,k),dodge:n>=2,aim:false,
  catchR:.85,catchLo:1.1,catchHi:3,chargeP:lerp(1.1,.6,k),tempoStep:lerp(.04,.1,k),tempoMax:lerp(1.4,2.2,k),aiMode:n<2?'near':n<5?'far':'corner',
  hold:[lerp(.9,.2,k),lerp(1.5,.5,k)],aiDive:n>=3,aiPU:n>=2,aiCatchR:.8,lives:n<3?1:2,double:0};}
const TOUR=[{opp:'kalle',diff:'leicht',arena:'tag',weather:'sonne'},{opp:'sina',diff:'mittel',arena:'abend',weather:'wind'},
  {opp:'kaboom',diff:'schwer',arena:'nacht',weather:'regen'},{opp:'kraki',diff:'boss',arena:'nacht',weather:'wind'}];
const FREE_OPP={leicht:'kalle',mittel:'sina',schwer:'kaboom'};
const WEATHER={sonne:'☀️ Sonne',wind:'💨 Wind',regen:'🌧️ Regen',zufall:'🎲 Zufall'};
let mode='free',round=0,survN=0,matchCfg=null,diff=DIFF.mittel;
const sel={diff:'mittel',arena:'tag',weather:'sonne'};
const opts={pu:true,special:true,obst:true};
let weather='sonne',windZ=0;
const ex=()=>mode!=='tut';

// ================= Zustand =================
const INTRO=2.8;
let focusOn=false,state='menu',time=0,pointT=0,nextServer=P,rally=0,tempo=1,introT=0,slowT=0,focusW=0,nextT=0;
let firstServe=true,msgT=0,toastT=0,puTimer=8,gullT=12,waveT=18,sayCd=0,bubbleT=0,torchFlick=1,overAction=null;
const focus=[0,0,0],ai={reactT:0,megaReact:0,holdT:0,ex:0,ez:0,tx:4.5,tz:0};
const wave={front:9,t:0,on:false};const gullObj={active:false,x:0,z:0,dir:1,hitCd:0};
let tut={step:0,moved:0,doneT:0};
const pups=[];
const PU={shield:{icon:'🛡️',name:'Schild',col:0x40c4ff},turbo:{icon:'⚡',name:'Turbo',col:0xffd600},slow:{icon:'🐢',name:'Zeitlupe',col:0x69f0ae},heart:{icon:'❤️',name:'Extra-Leben',col:0xff4081}};

// ================= HUD-Helfer =================
function heartsHTML(n,max){let s='';for(let i=0;i<max;i++)s+=`<svg viewBox="0 0 24 24" class="${i<n?'':'lost'}"><path d="M12 21s-7.5-4.6-9.6-9.4C.9 8 3 4 6.8 4c2.2 0 3.6 1.2 5.2 3 1.6-1.8 3-3 5.2-3C21 4 23.1 8 21.6 11.6 19.5 16.4 12 21 12 21z"/></svg>`;return s;}
function updateHUD(){$('hP').innerHTML=heartsHTML(P.lives,P.maxLives);$('hA').innerHTML=heartsHTML(A.lives,A.maxLives);$('tP').textContent=P.hits;$('tA').textContent=A.hits;
  $('nameP').textContent=mode==='2p'?'Spieler 1':'Du';$('nameA').textContent=mode==='2p'?'Spieler 2':A.look.name;}
function fxText(c){let s='';if(c.shield)s+='🛡️ ';if(c.turbo>0)s+='⚡'+Math.ceil(c.turbo)+' ';if(c.slow>0)s+='🐢'+Math.ceil(c.slow)+' ';if(c.iceT>0)s+='❄️ ';if(c.streak>=3)s+='🔥 Kracher bereit';return s;}
function showMsg(t1,t2,color,dur){const m=$('msg');$('m1').textContent=t1;$('m1').style.color=color||'#fff';$('m2').textContent=t2||'';
  m.classList.remove('pop');void m.offsetWidth;m.classList.add('show','pop');msgT=dur||1.8;}
function toast(t){$('toast').textContent=t;$('toast').classList.add('show');toastT=1.8;}
function say(c,ev){if(!c||c.ctrl!=='ai'||sayCd>0||Math.random()>.65||mode==='tut')return;const L=(c.look.lines||GEN_LINES)[ev];if(!L)return;
  $('bubble').textContent=pick(L);$('bubble').classList.add('show');bubbleT=1.8;sayCd=3;}

// ================= Match-Ablauf =================
function survLook(){return{name:pick(SURV_NAMES),skin:pick(SKINS),hair:pick(['kurz','zopf','stachel','locken','glatze']),hairCol:pick(HAIRCOLS),
  shirt:pick([0x6d4c41,0x00897b,0x5e35b1,0xc0ca33,0xd81b60,0x3949ab,0xf4511e]),shorts:pick([0x263238,0x4e342e,0x1a237e]),hat:pick(['none','none','cap','stroh','band']),glasses:pick(['none','sonne'])};}
function survCfg(n){return{opp:'surv',look:survLook(),diffObj:survDiff(n),arena:pick(['tag','abend','nacht']),weather:n<2?'sonne':'zufall'};}
function startMode(m){mode=m;firstServe=true;
  if(m==='tour'){round=0;prepareMatch(TOUR[0]);}
  else if(m==='surv'){survN=0;prepareMatch(survCfg(0),false);}
  else if(m==='2p')prepareMatch({opp:null,diff:sel.diff,arena:sel.arena,weather:sel.weather});
  else if(m==='tut'){tut={step:0,moved:0,doneT:0};prepareMatch({opp:'kalle',diff:'tut',arena:'tag',weather:'sonne'});}
  else prepareMatch({opp:FREE_OPP[sel.diff],diff:sel.diff,arena:sel.arena,weather:sel.weather});}
function prepareMatch(cfg,keep){unlockAudio();document.body.classList.remove('inmenu');window.scrollTo(0,0);matchCfg=cfg;diff=cfg.diffObj||DIFF[cfg.diff];curDesign=prof().look.bomb;
  weather=cfg.weather==='zufall'?pick(['sonne','sonne','wind','regen']):cfg.weather;
  windZ=weather==='wind'?(Math.random()<.5?-1:1)*rand(2.2,3.6):0;windStr=weather==='wind'?1:0;
  setEnv(cfg.arena,weather,prof().look.island);mTrans=ARENAS[cfg.arena].trans;
  if(mode==='2p'){removeNode(A.root);removeNode(A.shadow);A=makeChar(1,P2LOOK);A.min=.45;A.max=12;A.ctrl='h2';A.inp=INP[1];}
  else setOpponent(cfg.opp,cfg.look);
  for(const c of[P,A]){if(c.ctrl!=='ai'){c.catchR=diff.catchR;c.catchLo=diff.catchLo;c.catchHi=diff.catchHi;}else if(!c.boss)c.catchR=diff.aiCatchR||.8;else c.catchR=diff.aiCatchR;}
  if(!keep){P.lives=P.maxLives=3;P.hits=0;P.mega=0;P.shield=false;P.lostLife=false;}
  A.lives=A.maxLives=mode==='2p'?3:(diff.lives||3);A.hits=0;A.mega=0;A.shield=false;
  for(const c of[P,A]){c.hurt=0;c.turbo=0;c.slow=0;c.iceT=0;c.cheerT=0;c.diveCd=0;c.diveT=0;c.jump=null;c.jumpY=0;c.ko=null;c.streak=0;
    c.x=c.side*4.5;c.z=0;c.vx=c.vz=0;c.root.r=[0,0,0];c.root.p=[c.x,0,c.z];c.root.vis=true;c.root.dim=1;}
  for(const I of INP){I.charging=false;}
  paused=false;$('pauseTxt').style.display='none';setMusic(settings.music);clearBombs();clearPU();resetParticles();
  puTimer=rand(6,9);gullT=rand(10,18);waveT=rand(14,22);wave.on=false;wave.front=9;setWave(9);gullObj.active=false;gull.vis=false;
  slowT=0;focusW=0;focusOn=false;rp=null;replayPend=false;recBuf.length=0;landRing.vis=aimRing.vis=false;
  updateHUD();$('menu').classList.add('hidden');$('over').classList.add('hidden');$('replayTag').classList.remove('show');
  const lbl=mode==='tour'?`Turnier · Runde ${round+1} von 4`:mode==='surv'?`Überleben · Gegner ${survN+1}`:mode==='2p'?'Zwei Spieler':mode==='tut'?'Tutorial':'Freies Spiel';
  $('vsR').textContent=lbl;$('vsN').innerHTML=`${mode==='2p'?'Spieler 1':'Du'}<span>vs</span>${mode==='2p'?'Spieler 2':A.look.name}`;
  $('vsA').textContent=`${ARENAS[cfg.arena].icon} ${ARENAS[cfg.arena].name} · ${WEATHER[weather]} · ${diff.name}${A.boss?' · Boss!':''}`;
  $('vs').classList.add('show');state='intro';introT=keep?1.8:INTRO;if(mode==='2p'||mode==='tut')camMode=0;
  if(typeof setControlsMode==='function')setControlsMode(mode==='2p');
  showTut();}
function serve(c){for(const x of[P,A]){x.x=x.side*4.5;x.z=0;x.vx=x.vz=0;x.diveT=0;x.jump=null;x.jumpY=0;}
  clearBombs();const b=makeBomb();b.holder=c;b.x=c.x;b.y=c.holdH;b.z=c.z;b.fuse=b.fuseMax=diff.fuse+(c.ctrl==='ai'?0:1);rally=0;tempo=1;state='play';
  for(const I of INP)I.charging=false;
  const mb=(P.lives===1||A.lives===1)&&mode!=='surv'&&mode!=='tut'?'Matchball!':'';
  if(mode==='tut'){if(c.ctrl==='ai'){ai.holdT=1.2;ai.tx=4.5;ai.tz=0;}}
  else if(c.ctrl==='ai'){ai.holdT=rand(.9,1.6);ai.tx=rand(2.5,5.5);ai.tz=rand(-2,2);showMsg(`${A.look.name} schlägt auf`,mb,'#ffcc80',1.3);say(A,'serve');}
  else{const t1=mode==='2p'?`Aufschlag ${nameOf(c)}`:'Dein Aufschlag!';
    showMsg(t1,firstServe&&mode!=='2p'?'«Werfen» halten – im richtigen Moment loslassen':mb,'#ffe082',firstServe?2.8:1.3);firstServe=false;
    if(c.inp.throwHeld){c.inp.charging=true;c.inp.chargeT=0;}}}
function rollType(){if(!opts.special||!ex())return'normal';const r=Math.random();return r<.06?'gold':r<.13?'ice':r<.2?'split':'normal';}
function flightT(h){const d=h-BR;return(VY0+Math.sqrt(VY0*VY0+2*GRAV*d))/GRAV;}
const throwVx=c=>lerp(2.5,11,c);
function doThrow(c,b,vx,vz){b.holder=null;b.thrower=c;b.x=c.x-c.side*.12;b.z=c.z;b.y=c.holdH;b.vx=vx;b.vy=VY0;b.vz=vz;b.netHit=false;b.splitDone=false;
  b.type=rollType();b.kracher=false;const notes=[];
  if(c.streak>=3){b.kracher=true;c.streak=0;notes.push(`🔥 Kracher-Wurf${c===P&&mode!=='2p'?'':' von '+nameOf(c)}`);}
  if(b.type!=='normal')notes.push(`${TYPES[b.type].icon} ${TYPES[b.type].name}`);if(notes.length)toast(notes.join(' · ')+'!');
  styleBomb(b);c.throwT=.28;rally++;tempo=Math.min(diff.tempoMax,1+(rally-1)*diff.tempoStep);sfx.throw();
  const o=other(c);if(o.ctrl==='ai'){ai.reactT=diff.react*(b.kracher?.6:1);ai.ex=rand(-diff.err,diff.err);ai.ez=rand(-diff.err,diff.err);}
  if(diff.aim&&c.ctrl==='ai'&&o===P){const[lx,lz]=predictB(b);landRing.vis=true;landRing.p=[lx,.05,lz];}
  if(mode==='tut'&&c===P)tutEvent('throw');}
function humanThrow(c){const I=c.inp;if(!I.charging)return;I.charging=false;const b=heldBy(c);if(!b||state!=='play'||c.jump||c.ko)return;
  doThrow(c,b,-c.side*throwVx(I.charge),I.mv[1]*2.4);}
function catchBomb(c,b){b.holder=c;b.fuse=b.fuseMax=diff.fuse;c.catchT=.3;sfx.catch();vib(20);puff(b.x,b.y,b.z);landRing.vis=false;
  if(b.type==='ice'){c.iceT=2.5;sfx.freeze();toast(`❄️ ${nameOf(c)} ${c===P&&mode!=='2p'?'bist':'ist'} eingefroren!`);for(let k=0;k<14;k++)puff(c.x,1.2,c.z,0xb3e5fc);}
  b.type='normal';b.kracher=false;styleBomb(b);
  if(c.diveT>0){toast(c===P?'Hechtsprung-Rettung!':`${nameOf(c)} hechtet!`);if(c===P)bump('dive');c.diveT=0;}
  c.streak++;if(c.ctrl!=='ai'){const before=c.mega;c.mega=Math.min(10,c.mega+1);if(before<10&&c.mega===10){toast(`⚡ MEGA-SPRUNG bereit${mode==='2p'?' für '+nameOf(c):''}!`);sfx.power();}}
  if(c.ctrl==='ai'){ai.holdT=rand(diff.hold[0],diff.hold[1]);ai.tx=clamp(c.x+rand(-1.5,1.5),1.2,6);ai.tz=clamp(c.z+rand(-1.5,1.5),-2.8,2.8);say(c,'catch');}
  else if(c.inp.throwHeld){c.inp.charging=true;c.inp.chargeT=0;}
  if(mode==='tut'&&c===P)tutEvent('catch');}
function aiTarget(){let tx,tz;
  if(diff.aiMode==='near'){const a=rand(0,6.28),r=rand(.4,1.8);tx=clamp(P.x+Math.cos(a)*r,-6,-1.2);tz=clamp(P.z+Math.sin(a)*r,-2.7,2.7);}
  else{const n=diff.aiMode==='corner'?6:4;let best=-1;
    for(let k=0;k<n;k++){let cx,cz;
      if(diff.aiMode==='corner'){cx=Math.random()<.65?rand(-6.8,-5.4):rand(-1.8,-.9);cz=(Math.random()<.5?-1:1)*rand(2.2,3.35);}
      else{cx=rand(-6.5,-.9);cz=rand(-3.2,3.2);}
      const d=Math.hypot(cx-P.x,cz-P.z);if(d>best){best=d;tx=cx;tz=cz;}}}
  return[tx+rand(-diff.throwErr,diff.throwErr),tz+rand(-diff.throwErr,diff.throwErr)];}
function aiThrow(c,b){const[tx,tz]=aiTarget(),T=flightT(c.holdH),bx=c.x-c.side*.12;
  doThrow(c,b,clamp((tx-bx)/T,-13,-.8),(tz-c.z)/T);
  if(diff.double&&Math.random()<diff.double){const nb=makeBomb();if(nb){const[t2x,t2z]=aiTarget();Object.assign(nb,{thrower:c,x:c.x,y:c.holdH,z:c.z+(Math.random()<.5?-.7:.7),vy:VY0,type:'normal'});
    nb.vx=clamp((t2x-nb.x)/T,-13,-.8);nb.vz=(t2z-nb.z)/T;styleBomb(nb);toast('🐙 Doppelbombe!');}}}
function predictB(b){let x=b.x,y=b.y,z=b.z,vx=b.vx,vy=b.vy,vz=b.vz,net=b.netHit,t=0;const st=1/120;
  for(let i=0;i<1500;i++){vy-=GRAV*st;vz+=windZ*st;const px=x;x+=vx*st;y+=vy*st;z+=vz*st;t+=st;
    if(!net&&(px<0)!==(x<0)&&y<NET_TOP+BR&&Math.abs(z)<NET_HALF){x=px<0?-BR-.08:BR+.08;vx*=-.35;vz*=.5;net=true;}
    if(vy<0&&y<=1.9)return[x,z,t];}return[x,z,t];}
function scorePoint(loser,reason,water,b){if(state!=='play')return;const winner=other(loser);
  const px=b.x,py=Math.max(b.y,.35),pz=b.z,gold=b.type==='gold',kr=b.kracher;
  if(water)splash(px,pz);else explosion(px,py,pz);
  rpEnd={x:px,y:py,z:pz,water};
  clearBombs();landRing.vis=aimRing.vis=false;for(const I of INP)I.charging=false;state='point';pointT=2.4;nextServer=loser;for(const c of[P,A])c.streak=0;
  if(mode==='tut'){showMsg('Nochmal!',reason,'#ffe082',1.6);pointT=1.6;nextServer=P;return;}
  if(loser.shield){loser.shield=false;sfx.shield();showMsg('Schild hält!',reason+' – kein Leben verloren','#40c4ff',2);return;}
  const dmg=gold?2:1;loser.lives=Math.max(0,loser.lives-dmg);winner.hits+=dmg;loser.hurt=1.9;winner.cheerT=1.7;updateHUD();
  fansReact(winner===P?'P':'A');setTimeout(sfx.crowd,150);if(loser.ctrl!=='ai')vib(120);if(loser===P)P.lostLife=true;
  if(rally>=15)mission('rally15');if(gold&&winner===P)mission('gold');if(kr&&winner===P)bump('kracher');
  const pr=prof();if(rally>pr.best&&rally>=4&&mode!=='2p'){pr.best=rally;saveData();toast(`Neuer Rekord: ${rally} Ballwechsel!`);}
  say(A,winner===A?'score':'lost');
  if(loser.lives<=0){slowT=1.5;focusOn=true;focus[0]=px;focus[1]=Math.max(py,1);focus[2]=pz;pointT=3;replayPend=true;}
  const head=winner===P?(mode==='2p'?'Treffer für Spieler 1!':'Treffer für dich!'):(mode==='2p'?'Treffer für Spieler 2!':`${A.look.name} trifft!`);
  showMsg(gold?head+' ×2':head,reason,winner===P?'#76ff7a':'#ff8a80',2.2);}
function koHit(o,b){const t=b.thrower;const px=o.x,pz=o.z;rpEnd={x:px,y:1.2,z:pz,water:false};clearBombs();state='point';nextServer=o;
  if(mode==='tut'){explosion(px,1.2,pz,1.3);showMsg('Volltreffer!','So funktioniert der Mega-Sprung','#ffeb3b',2);pointT=1.8;nextServer=P;return;}
  if(o.shield){o.shield=false;explosion(px,1.2,pz,1.4);sfx.shield();pointT=2.4;showMsg('Schild hält!','Mega-Bombe abgewehrt','#40c4ff',2);return;}
  explosion(px,1.2,pz,2);sfx.ko();vib(300);shake=1;
  o.ko={t:0,vy:11,vx:o.side*7,y:0,splashed:false};o.lives=0;o.hurt=6;t.hits++;t.cheerT=3;fansReact(t===P?'P':'A');setTimeout(sfx.crowd,200);
  pointT=3.4;slowT=1.6;focusOn=true;focus[0]=px;focus[1]=1.5;focus[2]=pz;replayPend=true;updateHUD();
  showMsg('K.O.!',`${nameOf(o)} fliegt davon!`,'#ffeb3b',3);if(t===P)mission('mega');if(o===P)P.lostLife=true;}
function megaLand(b){const o=b.target;if(Math.sign(b.x)===Math.sign(o.x)||Math.abs(b.x)<.3)scorePoint(o,'Mega-Bombe!',false,b);
  else{explosion(b.x,.4,b.z);clearBombs();state='point';pointT=1.6;nextServer=o;showMsg('Daneben!','','#fff',1.4);}}
function afterPoint(){if(P.lives<=0||A.lives<=0)endMatch();else serve(nextServer);}
function endMatch(){const pWon=P.lives>0;state='over';const w=pWon?P:A;w.cheerT=99;clearPU();setWave(9);wave.on=false;
  const pr=prof();let title='',btn='Nochmal',reward=0,line=`${nameOf(P)}: ${P.hits} Treffer · ${nameOf(A)}: ${A.hits}`;
  if(mode==='2p'){title=pWon?'🏆 Spieler 1 gewinnt!':'🏆 Spieler 2 gewinnt!';btn='Revanche';overAction=()=>startMode('2p');mission('twoP');confetti();sfx.win();}
  else if(mode==='surv'){
    if(pWon){survN++;pr.shells+=2;if(survN>=5)mission('surv5');saveData();showMsg(`Gegner ${survN} besiegt!`,'+2 🐚 · Der Nächste kommt …','#76ff7a',2.2);sfx.win();state='next';nextT=2.4;return;}
    title='💥 Überleben vorbei';line=`Besiegte Gegner: ${survN}`;if(survN>pr.survBest){pr.survBest=survN;line+=' · Neuer Rekord!';}
    btn='Nochmal';overAction=()=>startMode('surv');sfx.lose();}
  else if(mode==='tour'){
    if(pWon){pr.tourBest=Math.max(pr.tourBest,round+1);reward=[5,8,12,25][round];if(round===3)mission('krake');
      if(round<3){title=`Runde ${round+1} gewonnen!`;btn=`Weiter: ${OPP[TOUR[round+1].opp].name} →`;overAction=()=>{round++;prepareMatch(TOUR[round]);};}
      else{pr.trophy++;mission('tour');title='🏆 Turniersieger!';btn='Neues Turnier';overAction=()=>startMode('tour');}
      sfx.win();confetti();}
    else{title=`💥 ${A.look.name} gewinnt`;btn='Nochmal versuchen';reward=1;overAction=()=>prepareMatch(TOUR[round]);sfx.lose();}}
  else{if(pWon){reward={leicht:3,mittel:6,schwer:10}[matchCfg.diff]||3;title='🏆 Gewonnen!';sfx.win();confetti();}else{reward=1;title='💥 Verloren!';sfx.lose();}
    overAction=()=>startMode('free');}
  if(mode!=='2p'){if(pWon){pr.w++;if(!P.lostLife)mission('flawless');if(matchCfg.arena==='nacht')mission('night');}else pr.l++;pr.shells+=reward;}
  saveData();if(typeof refreshMenu==='function')refreshMenu();
  $('ovTitle').textContent=title;$('ovScore').textContent=line;$('ovReward').textContent=reward?`+${reward} 🐚 Muscheln`:'';$('bAgain').textContent=btn;
  setTimeout(()=>{if(state==='over'){$('over').classList.remove('hidden');document.body.classList.add('inmenu');window.scrollTo(0,0);}},1500);}
function finishTutorial(){prof().tut=true;saveData();state='menu';clearBombs();$('tutBox').classList.remove('show');if(typeof openMenu==='function')openMenu('play');}

// ================= Missionen =================
const MISSIONS=[
  {id:'flawless',name:'Gewinne ein Match, ohne ein Leben zu verlieren'},{id:'rally15',name:'Spiele einen Ballwechsel mit 15 Würfen'},
  {id:'dive5',name:'Fange 5 Bomben mit einem Hechtsprung',cnt:'dive',goal:5},{id:'mega',name:'Besiege einen Gegner mit dem Mega-Sprung (K.O.)'},
  {id:'night',name:'Gewinne ein Match in der Fackelnacht'},{id:'pups10',name:'Sammle 10 Power-ups',cnt:'pups',goal:10},
  {id:'kracher',name:'Lande 3 Treffer mit dem Kracher-Wurf',cnt:'kracher',goal:3},{id:'gold',name:'Gewinne einen Punkt mit einer Goldbombe'},
  {id:'surv5',name:'Besiege 5 Gegner im Überlebensmodus'},{id:'tour',name:'Gewinne das Turnier'},{id:'krake',name:'Besiege Krake Kraki'},{id:'twoP',name:'Spiele ein Match zu zweit'}];
function mission(id){const p=prof();if(p.missions[id]||mode==='tut')return;if(mode==='2p'&&id!=='twoP')return;
  p.missions[id]=true;p.shells+=10;saveData();const m=MISSIONS.find(m=>m.id===id);setTimeout(()=>{toast(`⭐ Mission: ${m.name} (+10 🐚)`);sfx.power();},900);}
function bump(cnt){if(mode==='2p'||mode==='tut')return;const p=prof();p.cnt[cnt]=(p.cnt[cnt]||0)+1;const m=MISSIONS.find(m=>m.cnt===cnt);if(m&&p.cnt[cnt]>=m.goal)mission(m.id);}

// ================= Tutorial =================
const TUT=[{t:'Zieh den Joystick, um zu laufen.',k:'move'},{t:'Halte «Werfen» gedrückt und lass im richtigen Moment los.',k:'throw'},
  {t:'Fang die Bombe: Stell dich unter ihren Schatten.',k:'catch'},{t:'Drück «Hecht» für einen Hechtsprung.',k:'dive'},
  {t:'Nach 10 Fängen ist der Mega-Sprung bereit. Fang die Bombe, halte sie und drück «Mega»!',k:'mega'},{t:'Super! Du bist bereit für die Insel. 🎉',k:'done'}];
function showTut(){const b=$('tutBox');if(mode!=='tut'){b.classList.remove('show');return;}b.classList.add('show');b.innerHTML=`<small>Schritt ${Math.min(tut.step+1,TUT.length)} von ${TUT.length}</small>${TUT[tut.step].t}`;}
function tutEvent(k){if(mode!=='tut')return;const s=TUT[tut.step];if(!s||s.k!==k)return;tut.step++;sfx.power();showTut();
  if(TUT[tut.step].k==='mega')P.mega=10;if(TUT[tut.step].k==='done')tut.doneT=3;}

// ================= Power-ups & Hindernisse =================
function clearPU(){for(const p of pups){removeNode(p.node);p.el.remove();}pups.length=0;}
function spawnPU(){const side=Math.random()<.5?-1:1;if(pups.some(p=>Math.sign(p.x)===side))return;const owner=side<0?P:A;
  const bag=['shield','shield','turbo','turbo','slow','slow'];if(owner.lives<owner.maxLives)bag.push('heart','heart');
  const type=pick(bag),x=side*rand(1.6,6),z=rand(-3,3),d=PU[type];
  const node=new Nd(null,{p:[x,.9,z]});node.add(new Nd(UM.sph,{s:.22,col:d.col}),new Nd(UM.ring,{r:[Math.PI/2,0,0],s:.42,col:0xffffff,mode:4}),
    new Nd(UM.disc,{p:[0,-.88,0],s:.6,col:d.col,mode:4,a:.35}));scene.add(node);
  const el=document.createElement('div');el.className='pu';el.textContent=d.icon;$('pus').appendChild(el);
  pups.push({type,x,z,t:12,node,el});puff(x,.9,z,d.col);}
function grabPU(c,p){const d=PU[p.type];sfx.power();vib(30);puff(p.x,1,p.z,d.col);
  if(p.type==='shield')c.shield=true;else if(p.type==='turbo')c.turbo=8;else if(p.type==='slow')c.slow=8;
  else if(p.type==='heart'){if(c.lives<c.maxLives){c.lives++;updateHUD();}else c.shield=true;}
  if(c===P)bump('pups');toast(`${nameOf(c)}: ${d.icon} ${d.name}!`);}
const inWave=c=>wave.on&&c.z>wave.front;
function updateObstacles(dt){
  gullObj.hitCd-=dt;
  if(!gullObj.active){gullT-=dt;if(gullT<=0){gullObj.active=true;gullObj.dir=Math.random()<.5?-1:1;gullObj.x=rand(-6,6);gullObj.z=-11*gullObj.dir;gull.vis=true;sfx.gull();}}
  else{gullObj.z+=gullObj.dir*7*dt;gullObj.x+=Math.sin(time*1.3)*dt;gull.p=[gullObj.x,3.2+Math.sin(time*2)*.25,gullObj.z];gull.r[1]=gullObj.dir>0?0:Math.PI;
    const f=Math.sin(time*10)*.55;gull.wl.r[2]=f;gull.wr.r[2]=-f;
    if(Math.abs(gullObj.z)>11.5){gullObj.active=false;gull.vis=false;gullT=rand(14,24);}
    for(const b of bombs){if(b.holder||b.mega||gullObj.hitCd>0)continue;
      if(Math.hypot(b.x-gull.p[0],b.y-gull.p[1],b.z-gull.p[2])<.9){b.vy=Math.abs(b.vy)*.4+4;b.vx*=.55;b.vz+=gullObj.dir*2.5;gullObj.hitCd=1;
        for(let k=0;k<12;k++)spawn({t:'bit',x:b.x,y:b.y,z:b.z,vx:rand(-2,2),vy:rand(0,2),vz:rand(-2,2),g:2,life:1.2,r:.06,c:0xffffff,mode:0});
        sfx.gull();toast('🐦 Möwen-Abpraller!');if(A.ctrl==='ai')ai.reactT=Math.min(ai.reactT,.1);}}}
  if(!wave.on){waveT-=dt;if(waveT<=0){wave.on=true;wave.t=0;sfx.wave();toast('🌊 Welle!');}}
  else{wave.t+=dt;const t=wave.t;wave.front=t<1.6?lerp(9,1.8,t/1.6):t<2.8?1.8:t<4.4?lerp(1.8,9,(t-2.8)/1.6):9;setWave(wave.front);
    if(t>=4.4){wave.on=false;waveT=rand(18,28);setWave(9);}}}

// ================= Bewegung, KI, Sprünge =================
function clampPos(c){c.x=clamp(c.x,c.min,c.max);const e=(c.x/12.2)**2+(c.z/7.7)**2;if(e>1){const k=1/Math.sqrt(e);c.x*=k;c.z*=k;}c.x=clamp(c.x,c.min,c.max);}
const speedMul=c=>(c.turbo>0?1.4:1)*(c.iceT>0?.5:1)*(inWave(c)?.5:1)*(c.diveCd>1.2?.35:1);
function moveTo(c,tx,tz,speed,dt){const dx=tx-c.x,dz=tz-c.z,d=Math.hypot(dx,dz);if(d<.02){c.spd=0;return;}
  const st=Math.min(d,speed*speedMul(c)*dt);c.x+=dx/d*st;c.z+=dz/d*st;clampPos(c);c.spd=st/dt;}
const CAMS=[{e:[0,7.4,15.2],t:[0,1.9,0]},{e:[-15.5,5.8,0],t:[3,1.6,0]}];
let camMode=0,camMix=0;const eye=[0,7.4,15.2],tgt=[0,1.9,0];
function camBasis(){let fx=tgt[0]-eye[0],fz=tgt[2]-eye[2];const l=Math.hypot(fx,fz)||1;fx/=l;fz/=l;return[fx,fz,-fz,fx];}
function startDive(c,dx,dz){if(state!=='play'||c.diveCd>0||c.diveT>0||heldBy(c)||c.jump||c.ko||c.boss)return false;let l=Math.hypot(dx,dz);
  if(l<.1){const inc=bombs.find(b=>!b.holder&&b.thrower&&b.thrower!==c&&!b.mega);if(inc){const[lx,lz]=predictB(inc);dx=lx-c.x;dz=lz-c.z;}else{dx=-c.side;dz=0;}l=Math.hypot(dx,dz)||1;}
  c.diveT=.3;c.diveCd=1.6;c.ddx=dx/l;c.ddz=dz/l;sfx.dive();sandPuff(c.x,c.z);if(mode==='tut'&&c===P)tutEvent('dive');return true;}
function startMega(c){if(state!=='play'||c.mega<10||c.jump||c.ko||c.diveT>0)return;const b=heldBy(c);if(!b)return;
  c.mega=0;c.jump={t:0,b,fired:false};if(c.inp)c.inp.charging=false;sfx.mega();vib(80);toast('⚡ MEGA-SPRUNG!');slowT=.45;
  for(let k=0;k<20;k++)spawn({t:'fire',x:c.x,y:.2,z:c.z,vx:rand(-2,2),vy:rand(1,4),vz:rand(-2,2),g:2,life:.6,r:.2,c:0xffd54f,add:true});
  if(mode==='tut'&&c===P)tutEvent('mega');}
function stepChar(c,dt){
  if(c.ko){const K=c.ko;K.t+=dt;c.x+=K.vx*dt;K.y+=K.vy*dt;K.vy-=18*dt;c.jumpY=Math.max(-3,K.y);c.root.r[0]+=dt*9;c.root.r[2]+=dt*4;
    if(K.y<-.3&&!K.splashed){K.splashed=true;splash(c.x,c.z);}c.spd=0;return true;}
  if(c.jump){const J=c.jump;J.t+=dt;
    if(!J.fired){const k=Math.min(1,J.t/.55);c.jumpY=Math.sin(k*Math.PI/2)*4.2;J.b.x=c.x;J.b.z=c.z;J.b.y=c.jumpY+c.holdH;
      spawn({t:'fire',x:c.x+rand(-.2,.2),y:c.jumpY+.2,z:c.z+rand(-.2,.2),vy:-2,life:.3,r:.15,c:0xffb300,add:true,opt:true});
      if(J.t>=.55){J.fired=true;const o=other(c),b=J.b;b.holder=null;b.thrower=c;b.mega=true;b.target=o;b.kracher=false;b.type='normal';styleBomb(b);
        const tx=o.x+o.evx*.15,tz=o.z+o.evz*.15;let dx=tx-b.x,dy=o.hitY-b.y,dz=tz-b.z;const l=Math.hypot(dx,dy,dz);
        b.vx=dx/l*24;b.vy=dy/l*24;b.vz=dz/l*24;c.throwT=.3;sfx.throw();if(o.ctrl==='ai')ai.megaReact=diff.react+.12;J.t=0;}}
    else{const k=Math.min(1,J.t/.45);c.jumpY=4.2*(1-k*k);if(k>=1){c.jumpY=0;c.jump=null;sandPuff(c.x,c.z);shake=Math.max(shake,.15);}}
    c.spd=0;return true;}
  if(c.diveT>0){c.diveT-=dt;c.x+=c.ddx*12*dt;c.z+=c.ddz*12*dt;clampPos(c);c.spd=12;return true;}
  return false;}
function humanMove(c,dt){const I=c.inp;const ix=clamp(I.k.r-I.k.l+I.joy.x,-1,1),iy=clamp(I.k.u-I.k.d+I.joy.y,-1,1);const[fx,fz,rx,rz]=camBasis();
  let mx=rx*ix+fx*iy,mz=rz*ix+fz*iy;const ml=Math.hypot(mx,mz);if(ml>1){mx/=ml;mz/=ml;}I.mv[0]=mx;I.mv[1]=mz;
  if(I.charging){I.chargeT+=dt;const p=(I.chargeT/diff.chargeP)%2;I.charge=p<1?p:2-p;}
  if(stepChar(c,dt))return;
  const ox=c.x,oz=c.z,sp=5.2*speedMul(c),k=weather==='regen'?3.2:25;
  c.vx+=(mx*sp-c.vx)*Math.min(1,k*dt);c.vz+=(mz*sp-c.vz)*Math.min(1,k*dt);c.x+=c.vx*dt;c.z+=c.vz*dt;clampPos(c);c.spd=Math.hypot(c.x-ox,c.z-oz)/dt;
  if(mode==='tut')tut.moved+=Math.hypot(c.x-ox,c.z-oz);}
function aiIdle(c){if(diff.aiPU&&opts.pu){const p=pups.find(p=>p.x>0);if(p)return[p.x,p.z];}return[4.5,0];}
function aiUpdate(c,dt){if(stepChar(c,dt))return;const D=diff;
  const mb=bombs.find(b=>b.mega&&b.thrower!==c);
  if(mb){if(ai.megaReact>0){ai.megaReact-=dt;c.spd=0;return;}
    let ax=c.x-(mb.x+mb.vx*.2),az=c.z-(mb.z+mb.vz*.2);const l=Math.hypot(ax,az);if(l<.2){ax=0;az=c.z>=0?1:-1;}else{ax/=l;az/=l;}
    if(D.aiDive&&c.diveCd<=0&&!c.boss)startDive(c,ax*.3,az);moveTo(c,c.x+ax*3,c.z+az*3,D.aiSpeed,dt);return;}
  const held=heldBy(c);
  if(held){moveTo(c,ai.tx,ai.tz,D.aiSpeed*.6,dt);ai.holdT-=dt;if(ai.holdT<=0)aiThrow(c,held);return;}
  const inc=bombs.filter(b=>!b.holder&&b.thrower&&b.thrower!==c&&!b.mega);
  if(inc.length){if(ai.reactT>0){ai.reactT-=dt;c.spd=0;return;}
    let bt=1e9,bx=0,bz=0,best=null;for(const b of inc){const[px,pz,t]=predictB(b);if(t<bt){bt=t;bx=px;bz=pz;best=b;}}
    let tx,tz;const out=Math.abs(bz)>CZ+.35||bx>CX+.35;
    if(bx<=0){[tx,tz]=aiIdle(c);}
    else if(D.dodge&&out){const dx=c.x-bx,dz=c.z-bz,d=Math.hypot(dx,dz)||1;if(d<1.7+c.catchR-.8){tx=bx+dx/d*(1.9+c.catchR-.8);tz=bz+dz/d*(1.9+c.catchR-.8);}else{tx=c.x;tz=c.z;}}
    else{tx=bx+ai.ex;tz=bz+ai.ez;const d=Math.hypot(tx-c.x,tz-c.z);if(D.aiDive&&c.diveCd<=0&&best.vy<0&&best.y<3.4&&d>1.1&&d<3.6)startDive(c,tx-c.x,tz-c.z);}
    if(c.diveT<=0)moveTo(c,tx,tz,D.aiSpeed,dt);return;}
  const[tx,tz]=aiIdle(c);moveTo(c,tx,tz,D.aiSpeed*.55,dt);}

// ================= Figuren-Animation =================
function animChar(c,dt){
  const moving=c.spd>.4;if(moving)c.anim+=dt;const sw=moving&&c.diveT<=0?Math.sin(c.anim*11):0;
  c.legL.r[0]=sw*.65;c.legR.r[0]=-sw*.65;
  const cheer=c.cheerT>0&&state!=='play';const held=!!heldBy(c);
  const up=held||(bombs.some(b=>!b.holder&&b.thrower&&b.thrower!==c)&&state==='play')||c.catchT>0||cheer||c.diveT>0||!!c.jump||!!c.ko;
  const target=c.throwT>0?-1.9:up?-Math.PI+.2:0;c.armA=lerp(c.armA,target,Math.min(1,dt*14));
  const wave2=cheer||c.ko?Math.sin(time*14)*.35:0;
  c.armL.r[0]=c.armA+(up||c.throwT>0?wave2:-sw*.5);c.armR.r[0]=c.armA+(up||c.throwT>0?-wave2:sw*.5);
  c.armL.r[2]=up?.22:-.12;c.armR.r[2]=up?-.22:.12;
  if(c.tent)c.tent.forEach(t=>{t.r=[1.05+Math.sin(time*2.4+t.ph)*.3,Math.atan2(-Math.cos(t.an),-Math.sin(t.an)),0];});
  c.tilt=lerp(c.tilt,c.diveT>0?1.15:0,Math.min(1,dt*(c.diveT>0?18:7)));c.body.r[0]=c.tilt;
  c.body.p[1]=cheer?Math.abs(Math.sin(time*8))*.4:(moving?Math.abs(sw)*.06:Math.sin(time*3+c.side)*.015);
  const turn=(mode==='2p'?.3:.45)*(1-camMix);c.root.p=[c.x,c.jumpY,c.z];
  if(!c.ko){let face=c.side<0?Math.PI/2-turn:-Math.PI/2+turn;if(c.diveT>0)face=Math.atan2(c.ddx,c.ddz);c.root.r[1]=face;}
  c.shadow.p=[c.x,.02,c.z];c.shadow.s=c.jumpY>0?[.55/(1+c.jumpY*.3),1,.55/(1+c.jumpY*.3)]:(c.boss?[1.6,1,1.6]:[.55,1,.55]);c.shadow.vis=!c.ko;
  c.root.dim=c.ko?.25:c.hurt>0?(Math.sin(time*30)>0?.45:.7):c.iceT>0?.75:1;c.stars.vis=c.hurt>0;c.stars.r[1]=time*5;
  c.bubble.vis=c.shield;if(c.shield)c.bubble.a=.18+Math.sin(time*5)*.06;
  if(c.iceT>0&&Math.random()<.3)spawn({t:'bit',x:c.x+rand(-.3,.3),y:rand(.3,2),z:c.z+rand(-.3,.3),vy:.5,life:.5,r:.04,c:0xe1f5fe,opt:true});
  if(c.turbo>0&&moving&&Math.random()<.5)spawn({t:'bit',x:c.x+rand(-.2,.2),y:.1,z:c.z+rand(-.2,.2),vy:rand(.5,1.5),life:.4,r:.04,c:0xffeb3b,add:true,opt:true});}

// ================= Wiederholung =================
const recBuf=[];let rp=null,replayPend=false,rpEnd={x:0,y:0,z:0,water:false};
const poseOf=c=>[c.root.p[0],c.root.p[1],c.root.p[2],c.root.r[0],c.root.r[1],c.root.r[2],c.body.p[1],c.body.r[0],c.legL.r[0],c.legR.r[0],c.armL.r[0],c.armR.r[0],c.armL.r[2],c.armR.r[2]];
function setPose(c,a){c.root.p=[a[0],a[1],a[2]];c.root.r=[a[3],a[4],a[5]];c.body.p[1]=a[6];c.body.r[0]=a[7];c.legL.r[0]=a[8];c.legR.r[0]=a[9];
  c.armL.r[0]=a[10];c.armR.r[0]=a[11];c.armL.r[2]=a[12];c.armR.r[2]=a[13];c.shadow.p=[a[0],.02,a[2]];c.shadow.vis=true;c.root.dim=1;c.stars.vis=false;}
function record(){recBuf.push({t:time,P:poseOf(P),A:poseOf(A),b:bombs.map(b=>[b.v.i,b.x,b.y,b.z,b.rot,b.v.body.col])});while(recBuf.length&&time-recBuf[0].t>3)recBuf.shift();}
function startReplay(){replayPend=false;if(recBuf.length<4){afterPoint();return;}
  rp={f:recBuf.slice(),t:recBuf[0].t,end:recBuf[recBuf.length-1].t,i:0,hold:0,boomed:false,koC:P.ko?P:A.ko?A:null};
  state='replay';$('replayTag').classList.add('show');$('msg').classList.remove('show');}
function updateReplay(rdt){if(!rp)return;
  if(!rp.boomed){rp.t+=rdt*.42;while(rp.i<rp.f.length-1&&rp.f[rp.i+1].t<=rp.t)rp.i++;const F=rp.f[rp.i];
    setPose(P,F.P);setPose(A,F.A);for(const v of BV)hideVis(v);
    for(const[i,x,y,z,rot,col]of F.b){const v=BV[i];v.g.vis=v.spark.vis=v.glow.vis=true;v.g.p=[x,y,z];v.g.r=[0,0,rot];v.body.col=col;v.spark.p=[x,y+.45,z];v.glow.p=[x,y+.45,z];
      if(Math.random()<.5)spawn({t:'smoke',x,y,z,life:.45,r:.09,c:0x9e9e9e,mode:0,a:.35,opt:true});}
    if(rp.t>=rp.end){rp.boomed=true;for(const v of BV)hideVis(v);if(rpEnd.water)splash(rpEnd.x,rpEnd.z);else explosion(rpEnd.x,rpEnd.y,rpEnd.z,rp.koC?2:1);rp.hold=1.8;}}
  else{rp.hold-=rdt;if(rp.hold<=0)endReplay();}}
function endReplay(){if(!rp)return;const k=rp.koC;rp=null;$('replayTag').classList.remove('show');for(const v of BV)hideVis(v);
  if(k)k.root.vis=false;afterPoint();}

// ================= Hauptupdate =================
function update(dt,rdt){
  updateWorld(dt,time,settings.eco);updateRain(dt,weather==='regen',windZ,settings.eco);
  torchFlick=1+Math.sin(time*17)*.08+Math.sin(time*29)*.05;
  camMix=clamp(camMix+(camMode?1:-1)*rdt*1.6,0,1);
  focusW=slowT>0&&focusOn?Math.min(1,focusW+rdt*3):Math.max(0,focusW-rdt*1.2);
  updateParticles(dt);
  if(msgT>0){msgT-=rdt;if(msgT<=0)$('msg').classList.remove('show');}
  if(toastT>0){toastT-=rdt;if(toastT<=0)$('toast').classList.remove('show');}
  if(bubbleT>0){bubbleT-=rdt;if(bubbleT<=0)$('bubble').classList.remove('show');}sayCd-=rdt;
  shake=Math.max(0,shake-rdt*1.4);flashT=Math.max(0,flashT-rdt);boomArr[3]=Math.max(0,boomArr[3]-dt*5);
  if(shockT>0){shockT-=dt;const k=1-shockT/.6;shock.s=[.5+k*6,1,.5+k*6];shock.a=Math.max(0,shockT/.6)*.8;boomGlow.s=[3+k*6,1,3+k*6];boomGlow.a=Math.max(0,1-k*1.6);
    if(shockT<=0)shock.vis=boomGlow.vis=false;}
  if(weather==='wind'&&Math.random()<(settings.eco?.15:.4))spawn({t:'streak',mesh:UM.box,x:rand(-12,12),y:rand(.5,6),z:windZ>0?-9:9,vz:windZ*5,life:1.6,r:.1,ss:[.01,.01,.7],c:0xffffff,mode:4,a:.45});
  if(state==='replay'){updateReplay(rdt);return;}
  for(const c of[P,A]){c.hurt-=dt;c.catchT-=dt;c.throwT-=dt;c.diveCd-=dt;c.cheerT-=dt;c.iceT-=dt;if(c.turbo>0)c.turbo-=dt;if(c.slow>0)c.slow-=dt;}
  if(state==='intro'){introT-=dt;P.spd=A.spd=0;if(introT<=0){$('vs').classList.remove('show');serve(P);}}
  else if(state==='point'){for(const c of[P,A]){c.spd=0;c.diveT=0;if(c.ko||c.jump)stepChar(c,dt);}pointT-=dt;
    if(pointT<=0){if(replayPend)startReplay();else afterPoint();}}
  else if(state==='next'){nextT-=dt;for(const c of[P,A])if(c.ko)stepChar(c,dt);if(nextT<=0)prepareMatch(survCfg(survN),true);}
  else if(state==='over'){for(const c of[P,A])if(c.ko)stepChar(c,dt);}
  else if(state==='play'){
    if(mode==='tut'){if(tut.step===0&&tut.moved>2.5)tutEvent('move');if(tut.doneT>0){tut.doneT-=dt;if(tut.doneT<=0){finishTutorial();return;}}}
    if(opts.pu&&ex()){puTimer-=dt;if(puTimer<=0){spawnPU();puTimer=rand(8,13);}}
    for(let i=pups.length-1;i>=0;i--){const p=pups[i];p.t-=dt;p.node.p[1]=.9+Math.sin(time*3+i)*.12;p.node.r[1]=time*2;p.node.vis=p.t>2||Math.sin(time*20)>0;
      let got=null;for(const c of[P,A])if(!c.ko&&!c.jump&&Math.hypot(c.x-p.x,c.z-p.z)<.95)got=c;
      if(got)grabPU(got,p);if(got||p.t<=0){removeNode(p.node);p.el.remove();pups.splice(i,1);}}
    if(opts.obst&&ex())updateObstacles(dt);
    const ox=[P.x,P.z,A.x,A.z];
    humanMove(P,dt);if(A.ctrl==='ai')aiUpdate(A,dt);else humanMove(A,dt);
    P.evx=(P.x-ox[0])/dt;P.evz=(P.z-ox[1])/dt;A.evx=(A.x-ox[2])/dt;A.evz=(A.z-ox[3])/dt;
    updateBombs(dt);}
  if(state!=='replay'){animChar(P,dt);animChar(A,dt);}
  if(state==='play')record();
  updateBombVisuals();
  aimRing.vis=false;
  if(state==='play'&&P.inp.charging&&diff.aim){const b=heldBy(P);if(b){const T=flightT(P.holdH),lx=b.x+throwVx(P.inp.charge)*T,lz=b.z+P.inp.mv[1]*2.4*T;
    const ok=lx>.3&&lx<=CX&&Math.abs(lz)<=CZ;aimRing.vis=true;aimRing.p=[lx,.04,lz];aimRing.col=hex(ok?0x69f0ae:0xff5252);}}}
function updateBombs(dt){
  for(const b of bombs.slice()){if(state!=='play')return;
    if(b.holder){const h=b.holder;if(h.jump)continue;b.x=h.x-h.side*.12;b.y=h.holdH;b.z=h.z;b.rot=Math.sin(time*6)*.15;
      const before=b.fuse;b.fuse-=dt;if(b.fuse<1.1&&Math.floor(before*6)!==Math.floor(b.fuse*6))sfx.tick();
      if(b.fuse<=0){scorePoint(h,'Zu lange gehalten!',false,b);return;}continue;}
    if(b.mega){b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;b.rot+=dt*20;
      spawn({t:'fire',x:b.x,y:b.y,z:b.z,life:.3,r:.25,c:Math.random()<.5?0xff3d00:0xffab00,add:true});
      const o=b.target;if(!o.ko&&Math.hypot(b.x-o.x,b.y-o.hitY,b.z-o.z)<o.hitR){koHit(o,b);return;}
      if(b.y<=BR){megaLand(b);return;}continue;}
    const tc=other(b.thrower);const bdt=dt*tempo*(b.kracher?1.5:1)*(tc.slow>0?.6:1),px=b.x;
    b.vy-=GRAV*bdt;b.vz+=windZ*bdt;b.x+=b.vx*bdt;b.y+=b.vy*bdt;b.z+=b.vz*bdt;b.rot-=b.vx*bdt*1.2;
    spawn({t:'smoke',x:b.x,y:b.y,z:b.z,life:.45,r:.09,c:0x9e9e9e,mode:0,a:.35,opt:true});
    if(tempo>1.45||b.kracher)spawn({t:'fire',x:b.x,y:b.y,z:b.z,life:.25,r:.2,c:Math.random()<.5?0xffb300:0xff6d00,add:true,opt:!b.kracher});
    if(b.type==='split'&&!b.splitDone&&b.vy<0){b.splitDone=true;const nb=makeBomb();
      if(nb){Object.assign(nb,{x:b.x,y:b.y,z:b.z,vx:b.vx,vy:b.vy,vz:b.vz-2.3,thrower:b.thrower,netHit:b.netHit,type:'split',splitDone:true});b.vz+=2.3;styleBomb(nb);
        puff(b.x,b.y,b.z,0xb388ff);tone(500,.15,'square',.06,1000);if(tc.ctrl==='ai')ai.reactT=Math.min(ai.reactT,.15);}}
    if(!b.netHit&&(px<0)!==(b.x<0)&&b.y<NET_TOP+BR&&Math.abs(b.z)<NET_HALF){b.x=px<0?-BR-.08:BR+.08;b.vx*=-.35;b.vz*=.5;b.netHit=true;sfx.net();}
    if(b.vy<0)for(const c of[P,A]){if(c===b.thrower||c.ko||c.jump||heldBy(c))continue;
      const cr=c.catchR+(c.diveT>0?.3:0),lo=c.catchLo-(c.diveT>0?.5:0);
      if(Math.hypot(b.x-c.x,b.z-c.z)<cr&&b.y>lo&&b.y<c.catchHi){catchBomb(c,b);break;}}
    if(b.holder)continue;
    const onI=(b.x/IX)**2+(b.z/IZ)**2<=1;
    if((onI&&b.y<=BR)||(!onI&&b.y<=-.3)){const inB=Math.abs(b.x)<=CX+.1&&Math.abs(b.z)<=CZ+.1;let loser,reason;
      if(inB){loser=b.x<0?P:A;reason=loser===b.thrower?(b.netHit?'Ins Netz!':'Zu kurz geworfen!'):'Nicht gefangen!';}
      else{loser=b.thrower;reason='Aus!';}
      scorePoint(loser,reason,!onI,b);return;}}}
function updateBombVisuals(){if(state==='replay')return;
  for(const v of BV){if(!v.used)hideVis(v);}
  for(const b of bombs){const v=b.v;v.g.vis=v.spark.vis=v.glow.vis=true;v.g.p=[b.x,b.y,b.z];v.g.r=[0,0,b.rot];
    const warn=b.holder&&b.fuse<1.1&&Math.sin(time*30)>0;if(warn)v.body.col=hex(0xc62828);else if(!b.mega&&b.type==='normal')v.body.col=hex((DESIGNS[curDesign]||DESIGNS.classic).body);else styleBomb(b);
    const c=Math.cos(b.rot),s=Math.sin(b.rot);const sp=[b.x+c*.08-s*.45,b.y+s*.08+c*.45,b.z];
    v.spark.p=sp;v.glow.p=sp;const fl=.35+Math.random()*.3;v.glow.s=[fl,1,fl];const r=.04+Math.random()*.04;v.spark.s=[r,r,r];
    if(Math.random()<.4)spawn({t:'bit',x:sp[0],y:sp[1],z:sp[2],vx:rand(-1,1),vy:rand(.5,2),vz:rand(-1,1),g:3,life:.3,r:.025,c:Math.random()<.5?0xfff59d:0xffab40,opt:true});
    v.aura.vis=!!v.auraCol||b.kracher;if(v.aura.vis){v.aura.p=[b.x,b.y,b.z];v.aura.col=hex(b.kracher?0xff6d00:v.auraCol);v.aura.a=.5+Math.sin(time*12)*.2;const s2=b.mega?2.2:1.3;v.aura.s=[s2,1,s2];}
    const onI=(b.x/IX)**2+(b.z/IZ)**2<=1;v.shadow.vis=onI&&!b.holder;
    if(v.shadow.vis){const k=clamp(1-b.y/7,.2,1);v.shadow.p=[b.x,.025,b.z];v.shadow.s=[.5*k+.1,1,.5*k+.1];v.shadow.a=.18+.4*k;}}}

// ================= Kamera =================
let menuFocus=false;
function computeCam(rdt){
  if(state==='replay'&&rp){const th=.7-(rp.t-rp.f[0].t)*.12;eye[0]=rpEnd.x*.5+Math.sin(th)*7;eye[1]=2.4;eye[2]=rpEnd.z*.4+Math.cos(th)*7.5;
    tgt[0]=rpEnd.x*.55;tgt[1]=1.4;tgt[2]=rpEnd.z*.5;}
  else if(state==='menu'&&menuFocus){eye[0]=lerp(eye[0],-2.7,rdt*4);eye[1]=lerp(eye[1],2.1,rdt*4);eye[2]=lerp(eye[2],4.3,rdt*4);
    tgt[0]=lerp(tgt[0],-3.8,rdt*4);tgt[1]=lerp(tgt[1],1.25,rdt*4);tgt[2]=lerp(tgt[2],0,rdt*4);}
  else{const k=camMix*camMix*(3-2*camMix);const ce=[],ct=[];
    for(let i=0;i<3;i++){ce[i]=lerp(CAMS[0].e[i],CAMS[1].e[i],k);ct[i]=lerp(CAMS[0].t[i],CAMS[1].t[i],k);}
    if(state==='intro'){const t=introT/INTRO,a=t*t*1.9;const ex2=ce[0]-ct[0],ez=ce[2]-ct[2];
      ce[0]=ct[0]+ex2*Math.cos(a)-ez*Math.sin(a);ce[2]=ct[2]+ex2*Math.sin(a)+ez*Math.cos(a);ce[1]+=t*t*5;}
    if(focusW>0){const w=focusW*focusW*(3-2*focusW);const fe=[focus[0]*.6,3.4,focus[2]+7.5];for(let i=0;i<3;i++){ce[i]=lerp(ce[i],fe[i],w);ct[i]=lerp(ct[i],focus[i],w);}}
    const blend=state==='menu'?Math.min(1,rdt*4):1;for(let i=0;i<3;i++){eye[i]=lerp(eye[i],ce[i],blend);tgt[i]=lerp(tgt[i],ct[i],blend);}}
  if(shake>0){eye[0]+=rand(-shake,shake);eye[1]+=rand(-shake,shake);}
  sky.p=[eye[0],eye[1],eye[2]];
  for(const[,g]of torches)billboard(g,eye);for(const v of BV){billboard(v.glow,eye);billboard(v.aura,eye);}billboard(boomGlow,eye);billboard(boatLamp,eye);for(const f of flies)billboard(f,eye);}

// ================= Overlay (HTML über dem Spiel) =================
function placeEl(el,x,y,z){const[sx,sy,ok]=proj(x,y,z);el.style.left=sx+'px';el.style.top=sy+'px';return ok;}
function updateOverlay(){
  const humans=[P,A].filter(c=>c.ctrl!=='ai');
  for(let n=1;n<=2;n++){const ch=$('charge'+n),c=humans[n-1];
    if(c&&c.inp.charging&&heldBy(c)&&state==='play'){ch.style.display='block';placeEl(ch,c.x,3.05+c.jumpY,c.z);ch.querySelector('i').style.width=(c.inp.charge*100)+'%';}else ch.style.display='none';}
  for(const v of BV){const el=$('fuse'+v.i);const b=bombs.find(b=>b.v===v);
    if(b&&b.holder&&state==='play'){el.style.display='block';placeEl(el,b.x,b.y,b.z);const fr=clamp(b.fuse/b.fuseMax,0,1);const arc=el.querySelector('.arc');
      arc.setAttribute('stroke-dasharray',(fr*88)+' 88');arc.setAttribute('stroke',fr>.5?'#66bb6a':fr>.25?'#ffca28':'#ef5350');}else el.style.display='none';}
  for(const p of pups){placeEl(p.el,p.x,p.node.p[1]+.45,p.z);p.el.style.opacity=p.node.vis?1:.3;}
  if(bubbleT>0)placeEl($('bubble'),A.x,A.boss?4.4:2.7,A.z);
  $('flash').style.opacity=flashT*1.6;
  const mid=$('mid');const show=state==='play'||state==='point';mid.style.display=show?'block':'none';
  if(show){let t=`Ballwechsel ${rally} · Tempo ${tempo.toFixed(2)}×`;if(weather!=='sonne')t+=' · '+(weather==='wind'?`💨 Wind ${windZ>0?'↓':'↑'}`:'🌧️ Regen');if(mode==='surv')t+=` · Gegner ${survN+1}`;
    mid.textContent=t;mid.style.color=tempo>1.4?'#ffcc80':'#fff';}
  $('fxP').textContent=fxText(P);$('fxA').textContent=fxText(A);
  for(const[c,id]of[[P,'megaP'],[A,'megaA']]){const el=$(id);el.style.display=c.ctrl!=='ai'&&mode!=='tut'||(mode==='tut'&&c===P)?'block':'none';
    el.querySelector('i').style.width=(c.mega*10)+'%';el.classList.toggle('ready',c.mega>=10);el.querySelector('span').textContent=c.mega>=10?'MEGA BEREIT!':`Mega ${c.mega}/10`;}
  [P,A].forEach((c,i)=>{if(i===1&&c.ctrl==='ai')return;const n=i+1;$('cd'+n).style.height=(clamp(c.diveCd/1.6,0,1)*100)+'%';
    const mb=$('bM'+n);mb.classList.toggle('ready',c.mega>=10&&!!heldBy(c)&&state==='play');mb.querySelector('i').style.height=(100-c.mega*10)+'%';});}
