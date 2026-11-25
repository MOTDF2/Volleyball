// world.js – Insel, Deko, Zuschauer, Wetter
let windStr=0;
// ================= Arenen (Tageszeiten) =================
const ARENAS={
  tag:{name:'Mittag',icon:'☀️',fog:[.86,.93,.97],top:[.2,.62,.92],sun:norm([.55,.32,-1]),sunCol:[1,.98,.85],light:norm([.35,1,.6]),lightCol:[1,.95,.85],
    amb:[.74,.84,.98],gnd:[.52,.47,.42],w0:[.30,.86,.82],w1:[.06,.52,.78],w2:[.03,.32,.58],night:0,torch:0,glow:.45,fogN:40,fogF:190,cloud:0xffffff,trans:0},
  abend:{name:'Sonnenuntergang',icon:'🌅',fog:[1,.66,.45],top:[.32,.27,.58],sun:norm([.15,.07,-1]),sunCol:[1,.72,.38],light:norm([.25,.6,.7]),lightCol:[1,.7,.48],
    amb:[.66,.56,.74],gnd:[.56,.42,.36],w0:[.42,.72,.72],w1:[.28,.42,.62],w2:[.25,.24,.45],night:.15,torch:.25,glow:.75,fogN:35,fogF:170,cloud:0xffc4a8,trans:-3},
  nacht:{name:'Fackelnacht',icon:'🌙',fog:[.07,.1,.22],top:[.01,.02,.07],sun:norm([-.45,.3,-1]),sunCol:[.85,.9,1],light:norm([-.3,1,.55]),lightCol:[.42,.52,.85],
    amb:[.34,.4,.6],gnd:[.22,.2,.28],w0:[.08,.33,.42],w1:[.04,.17,.33],w2:[.02,.07,.18],night:1,torch:.85,glow:1.2,fogN:25,fogF:140,cloud:0x56607e,trans:-5}};
let arena=ARENAS.tag;let sandNode;

// ================= Szene =================
const GRAV=20,VY0=11,HOLD_H=2.35,BR=.26,NET_TOP=2.43,NET_HALF=4.4,CX=7,CZ=3.5,IX=13,IZ=8.5;
const sky=new Nd(UM.sph,{s:300,mode:1});scene.add(sky);
const water=new Nd(upload((()=>{const g=newG();gAdd(g,rPlane(320,320,110,110),IDM,[1,1,1]);return g;})()),{p:[0,-.25,0],mode:2});scene.add(water);
{const g=newG();put(g,rCyl(1,1.18,64),0xf6dc9c,[0,-.6,0],0,[IX,1.2,IZ]);
  put(g,rCyl(1.02,1.06,64),0xd9b06a,[0,-.35,0],0,[IX,.5,IZ]);
  for(const[x,z,sx,sz]of[[-10.3,-1,2.6,1.8],[10.2,1.5,2.4,1.7],[-4,-6.9,3,1.3],[5,-6.9,3.2,1.3],[-11,3.6,1.6,1.2]])put(g,R.sph,0xf3d595,[x,-.08,z],0,[sx,.3,sz]);
  sandNode=new Nd(upload(g),{mode:3});scene.add(sandNode);}
const gA=newG();
for(const z of[-CZ,CZ])put(gA,R.box,0xffffff,[0,.012,z],0,[2*CX+.1,.02,.1]);
for(const x of[-CX,CX])put(gA,R.box,0xffffff,[x,.012,0],0,[.1,.02,2*CZ+.1]);
put(gA,R.box,0xffffff,[0,.012,0],0,[.07,.02,2*CZ]);
for(const x of[-CX,CX])for(const z of[-CZ,CZ]){put(gA,R.cyl,0xffffff,[x,.5,z],0,[.03,1,.03]);put(gA,R.box,0xff6d00,[x+(x<0?-.17:.17),.88,z],0,[.32,.2,.02]);}
for(const z of[-NET_HALF,NET_HALF]){put(gA,R.cyl,0x6d4c41,[0,1.33,z],0,[.08,2.66,.08]);put(gA,R.sph,0xffca28,[0,2.7,z],0,.1);put(gA,R.box,0x5d4037,[0,.05,z],0,[.35,.1,.35]);}
for(let y=1.52;y<=NET_TOP-.05;y+=.115)put(gA,R.box,0x263238,[0,y,0],0,[.018,.018,2*NET_HALF]);
for(let z=-NET_HALF;z<=NET_HALF+.01;z+=.17)put(gA,R.box,0x263238,[0,1.97,z],0,[.018,.9,.018]);
put(gA,R.box,0xffffff,[0,NET_TOP,0],0,[.05,.09,2*NET_HALF]);put(gA,R.box,0xffffff,[0,1.5,0],0,[.04,.04,2*NET_HALF]);
for(const z of[-3.6,3.6])for(let k=0;k<6;k++)put(gA,R.cyl,k%2?0xffffff:0xe53935,[0,NET_TOP+.08+k*.12,z],0,[.02,.12,.02]);
{const x=-9.2,z=5,t=.15;put(gA,R.cyl,0xffffff,[x-Math.sin(t)*1.1,1.1,z],[0,0,t],[.045,2.2,.045]);
  const tx=x-Math.sin(t)*2.25,ty=Math.cos(t)*2.25;
  put(gA,R.cone,0xe53935,[tx,ty,z],[0,0,t],[1.45,.5,1.45]);put(gA,R.cone,0xffffff,[tx-Math.sin(t)*.12,ty+.12,z],[0,0,t],[.75,.27,.75]);put(gA,R.sph,0xffffff,[tx-Math.sin(t)*.3,ty+.28,z],0,.07);
  for(let k=0;k<3;k++)put(gA,R.box,k===1?0xffffff:0x1e88e5,[-9.9+k*.4-.4,.015,3.4],[0,.3,0],[.4,.02,1.7]);
  put(gA,R.sph,0xffffff,[-8.6,.25,3.3],0,.25);put(gA,R.sph,0xe53935,[-8.6,.27,3.3],[.4,0,0],[.255,.12,.255]);}
put(gA,R.sph,0xffca28,[9.6,.9,4.6],[0,.4,-.15],[.34,1.2,.08]);put(gA,R.box,0xe53935,[9.6,.9,4.6],[0,.4,-.15],[.06,2.1,.17]);
{const x=4.5,z=6.4,c=0xe2c07c,d=0xd4ac63;put(gA,R.box,c,[x,.2,z],0,[1.1,.4,.75]);
  for(const[dx,dz]of[[-.5,-.33],[.5,-.33],[-.5,.33],[.5,.33]]){put(gA,R.cyl,c,[x+dx,.38,z+dz],0,[.17,.76,.17]);put(gA,R.cone,d,[x+dx,.88,z+dz],0,[.2,.25,.2]);}
  put(gA,R.cyl,c,[x,.6,z],0,[.22,1.2,.22]);put(gA,R.cone,d,[x,1.33,z],0,[.26,.3,.26]);put(gA,R.cyl,0x5d4037,[x,1.62,z],0,[.012,.35,.012]);put(gA,R.box,0x29b6f6,[x+.09,1.73,z],0,[.18,.11,.01]);}
put(gA,R.star,0xff8a65,[-2.6,.02,6.9],[0,.4,0],.38);put(gA,R.star,0xffb74d,[7.6,.02,-5.6],[0,1.1,0],.3);
for(const[x,z,c]of[[1.6,7.2,0xf8bbd0],[-5.6,6.6,0xfff3e0],[6.9,5.5,0xffe0b2],[-1,-7.6,0xf8bbd0],[2.8,7.3,0xffffff]])put(gA,R.hemi,c,[x,0,z],[0,x,0],[.16,.1,.13]);
// Tiki-Statue und Schatztruhe
{const x=-1.8,z=-7.7;put(gA,R.cyl,0x8d6e63,[x,.9,z],0,[.38,1.8,.34]);put(gA,R.box,0x5d4037,[x,1.35,z+.3],0,[.55,.12,.1]);
  put(gA,R.box,0x3e2723,[x,1.0,z+.31],0,[.35,.08,.08]);put(gA,R.sph,0xffca28,[x-.14,1.25,z+.32],0,.06);put(gA,R.sph,0xffca28,[x+.14,1.25,z+.32],0,.06);
  put(gA,R.cone,0x2e7d32,[x,1.95,z],0,[.45,.35,.4]);}
{const x=8.6,z=-3.6;put(gA,R.box,0x6d4c41,[x,.22,z],[0,.5,0],[.8,.44,.5]);put(gA,R.cyl,0x795548,[x,.47,z],[Math.PI/2,.5,0],[.25,.8,.25]);
  put(gA,R.box,0xffca28,[x,.3,z],[0,.5,0],[.82,.06,.52]);put(gA,R.sph,0xffd54f,[x+.1,.62,z+.1],0,.09);put(gA,R.sph,0xffd54f,[x-.15,.6,z],0,.08);}
scene.add(new Nd(upload(gA)));
const gB=newG();
const crownG=newG();
for(let k=0;k<9;k++){const a=k/9*Math.PI*2+((k*37)%10)*.03,L=2.5+((k*53)%7)*.13;put(crownG,R.leaf,k%2?0x2e7d32:0x43a047,[0,0,0],[0,a,.5],L);}
for(const[x,z]of[[.2,.05],[-.12,.16],[.02,-.2]])put(crownG,R.sph,0x5d4037,[x,-.2,z],0,.17);
const crownM=upload(crownG);
const crowns=[];
function palm(x,z,h,lean,sc){const la=Math.atan2(x,z*1.5),dx=Math.sin(la),dz=Math.cos(la),N=14;
  put(gB,R.sph,0x8b6b47,[x,.05,z],0,[.42*sc,.25,.42*sc]);
  for(let i=0;i<N;i++){const t=(i+.5)/N,ang=Math.atan2(2*lean*t,h);
    put(gB,R.cyl,i%2?0x8b6b47:0xa47b4f,[x+dx*lean*t*t,h*t,z+dz*lean*t*t],[ang,la,0],[lerp(.3,.17,t)*sc,h/N*1.12,lerp(.3,.17,t)*sc]);}
  const n=new Nd(crownM,{p:[x+dx*lean,h,z+dz*lean],r:[0,rand(0,6.28),0],s:sc});n.ph=rand(0,6);crowns.push(n);scene.add(n);
  scene.add(new Nd(UM.disc,{p:[x+dx*lean*.8,.02,z+dz*lean*.8],s:[2.2*sc,1,2.2*sc],col:0,mode:4,a:.13}));}
for(const[x,z,h,l,s]of[[-10.5,-4.5,7,1.6,1],[-7.4,-6.4,5.6,1.1,.9],[-2.8,-7.3,6.4,.9,.95],[3.6,-7.2,5.4,1,.85],[8,-6.2,6.8,1.3,1],[10.8,-3.8,5.8,1.5,.95],[11.4,3.2,6.6,1.7,1]])palm(x,z,h,l,s);
function bush(x,z,s){for(let k=0;k<7;k++){const a=k*.9;put(gB,R.sphLo,k%2?0x2e7d32:0x388e3c,[x+Math.cos(a)*.45*s*(k?1:0),.28*s+(k?0:.15*s),z+Math.sin(a)*.35*s*(k?1:0)],0,[.55*s,.45*s,.5*s]);}
  for(let k=0;k<6;k++){const a=k*1.1+.3;put(gB,R.sphLo,[0xff4081,0xe53935,0xff7043][k%3],[x+Math.cos(a)*.55*s,.42*s+(k%2)*.15*s,z+Math.sin(a)*.45*s],0,.13*s);
    put(gB,R.sphLo,0xffeb3b,[x+Math.cos(a)*.6*s,.42*s+(k%2)*.15*s,z+Math.sin(a)*.5*s],0,.05*s);}}
for(const[x,z,s]of[[-9.6,-2.6,1.1],[-11,2.6,.9],[-5.5,-7,1],[1,-7.6,.9],[6.4,-6.8,1],[9.9,-.9,1.1],[-10.6,.6,.8],[10.9,1.4,.8],[-7.6,6,.8],[7.4,6.2,.9]])bush(x,z,s);
const torches=[],torchPos=new Float32Array(12);
[[-9.6,-5],[9.6,-5],[-9.6,5.1],[9.6,5]].forEach(([x,z],i)=>{put(gB,R.cyl,0xc8a165,[x,.85,z],0,[.06,1.7,.06]);
  for(const y of[.5,1.1])put(gB,R.cyl,0x8d6e3f,[x,y,z],0,[.07,.05,.07]);put(gB,R.cone,0x5d4037,[x,1.79,z],[Math.PI,0,0],[.17,.22,.17]);
  const f=new Nd(null,{p:[x,1.98,z]});f.add(new Nd(UM.cone,{s:[.14,.4,.14],col:0xff6f00,mode:4}),new Nd(UM.cone,{p:[0,-.04,0],s:[.08,.28,.08],col:0xffd54f,mode:4}));
  const gw=new Nd(UM.disc,{p:[x,2,z],s:1.1,col:0xffa040,mode:5,add:true,a:.55});torches.push([f,gw]);scene.add(f,gw);torchPos.set([x,2.1,z],i*3);});
// Lichterkette am Netz (leuchtet abends und nachts)
const lights=[];for(let k=0;k<13;k++){const z=-NET_HALF+k*(2*NET_HALF/12);const n=new Nd(UM.sphLo,{p:[0,NET_TOP+.03-Math.sin(k/12*Math.PI)*.05,z],s:.055,col:[0xffeb3b,0xff4081,0x40c4ff,0x69f0ae][k%4],mode:4});lights.push(n);scene.add(n);}
scene.add(new Nd(upload(gB)));
const gC=newG();
for(const[x,z,s]of[[-15,5,1.1],[15.4,-3,1.3],[-8,10.6,.6],[7,11.2,.5],[16.5,4.5,.7],[-16,-4,.9]]){put(gC,R.sphLo,0x6d7b84,[x,-.25,z],[0,x,0],[1.3*s,.8*s,1*s]);put(gC,R.sphLo,0x8a99a2,[x-.3*s,.1*s,z+.2*s],[0,z,0],[.7*s,.5*s,.6*s]);}
put(gC,R.sph,0x3e8e5e,[-90,-3,-130],0,[32,9,18]);put(gC,R.cone,0x52795a,[-96,6,-134],0,[16,20,12]);put(gC,R.cyl,0xe8cf95,[-90,-1.2,-130],0,[36,1,21]);
put(gC,R.sph,0x4a9b68,[120,-3,-165],0,[24,7,13]);put(gC,R.cyl,0xe8cf95,[120,-1.2,-165],0,[27,1,15]);
put(gC,R.sph,0x5aa475,[40,-2,-190],0,[14,4,8]);
scene.add(new Nd(upload(gC)));
const cloudG=newG();for(const[x,y,z,s]of[[0,0,0,5],[5,1.5,0,6],[10,0,0,4.5],[5,-1,1,7],[-4,-.5,0,3.5]])put(cloudG,R.sph,0xffffff,[x,y,z],0,[s,s*.7,s*.8]);
const cloudM=upload(cloudG),clouds=[];
for(const[x,y,z,s]of[[-60,32,-140,1],[-10,42,-170,1.3],[45,30,-130,.9],[95,38,-160,1.1],[-110,36,-150,1]]){const n=new Nd(cloudM,{p:[x,y,z],s,mode:6});clouds.push(n);scene.add(n);}
const boat=new Nd(null,{p:[38,-.3,-55],r:[0,.4,0]});
boat.add(new Nd(UM.box,{p:[0,.3,0],s:[3.2,.6,1.1],col:0x6d4c41}),new Nd(UM.box,{p:[0,.65,0],s:[2.8,.1,.95],col:0xd7ccc8}),
  new Nd(UM.cyl,{p:[0,2.2,0],s:[.06,3.4,.06],col:0x4e342e}),new Nd(UM.cone,{p:[.75,2.1,0],s:[.7,2.8,.06],col:0xffffff}),
  new Nd(UM.cone,{p:[-.6,1.9,0],s:[.5,2.2,.05],col:0xff7043}));
const boatLamp=new Nd(UM.disc,{p:[38,4.2,-55],s:1.6,col:0xffd180,mode:5,add:true,a:0});scene.add(boat,boatLamp);
const birds=[];for(let k=0;k<4;k++){const b=new Nd(null);const wl=new Nd(null),wr=new Nd(null);
  wl.add(new Nd(UM.box,{p:[-.35,0,0],s:[.7,.03,.22],col:0x37474f}));wr.add(new Nd(UM.box,{p:[.35,0,0],s:[.7,.03,.22],col:0x37474f}));
  b.add(wl,wr,new Nd(UM.sphLo,{s:[.12,.1,.3],col:0xeceff1}));b.wl=wl;b.wr=wr;b.ph=k*1.7;b.rad=rand(14,26);b.h=rand(11,17);b.sp=rand(.12,.22)*(k%2?1:-1);birds.push(b);scene.add(b);}
const crab=new Nd(null,{p:[-4,0,7.3]});crab.dir=1;
crab.add(new Nd(UM.sphLo,{p:[0,.14,0],s:[.26,.12,.19],col:0xe53935}));
for(const sx of[-1,1]){crab.add(new Nd(UM.sphLo,{p:[sx*.3,.15,.14],s:[.1,.07,.07],col:0xd32f2f}),new Nd(UM.cyl,{p:[sx*.07,.28,.1],s:[.015,.12,.015],col:0xd32f2f}),
  new Nd(UM.sphLo,{p:[sx*.07,.35,.1],s:.035,col:0xffffff}),new Nd(UM.sphLo,{p:[sx*.07,.35,.13],s:.016,col:0x111111}));
  for(let k=-1;k<=1;k++)crab.add(new Nd(UM.box,{p:[sx*.26,.07,k*.08],r:[0,0,sx*.6],s:[.18,.025,.025],col:0xc62828}));}
scene.add(crab);
// Glühwürmchen in der Nacht
const flies=[];for(let k=0;k<26;k++){const n=new Nd(UM.disc,{s:.18,col:0xd4ff6b,mode:5,add:true,a:0});n.base=[rand(-12,12),rand(.5,3),rand(-8,7)];n.ph=rand(0,9);flies.push(n);scene.add(n);}


// ================= Zuschauer =================
const fans=[];
function makeFan(x,z,team){const g=newG();const shirt=pick(team==='P'?[0x1e88e5,0x42a5f5,0x0277bd,0x26c6da]:[0xe53935,0xef5350,0xc62828,0xff7043]);
  const skin=pick([0xf1c27d,0xe0ac69,0xc68642,0x8d5524,0xffdbac]),hair=pick([0x4e342e,0x212121,0xffd54f,0xd84315,0x6d4c41]);
  put(g,R.cyl,skin,[-.07,.22,0],0,[.055,.44,.055]);put(g,R.cyl,skin,[.07,.22,0],0,[.055,.44,.055]);
  put(g,R.cyl,pick([0x3e2723,0x1a237e,0x004d40,0x4a148c]),[0,.55,0],0,[.17,.3,.13]);
  put(g,R.cyl,shirt,[0,.95,0],0,[.19,.52,.14]);put(g,R.sph,skin,[0,1.38,0],0,[.15,.16,.15]);
  put(g,R.hemi,hair,[0,1.4,-.01],[-.35,0,0],[.16,.16,.16]);
  for(const ex of[-.05,.05])put(g,R.sphLo,0x111111,[ex,1.41,.135],0,.022);
  const root=new Nd(upload(g),{p:[x,0,z],r:[0,rand(-.3,.3),0]});
  const arm=(sx,flag)=>{const h=new Nd(null,{p:[sx*.22,1.15,0]});h.add(new Nd(UM.cyl,{p:[0,-.24,0],s:[.045,.48,.045],col:skin}));
    if(flag){h.add(new Nd(UM.cyl,{p:[0,-.62,0],s:[.012,.55,.012],col:0x5d4037}),new Nd(UM.box,{p:[.13*sx,-.8,0],s:[.24,.16,.01],col:team==='P'?0x1e88e5:0xe53935}));}return h;};
  const al=arm(-1,false),ar=arm(1,Math.random()<.45);root.add(al,ar);
  const f={root,al,ar,team,ph:rand(0,6),cheer:0,sad:0};fans.push(f);scene.add(root);}
{const r0=[-6.4,-5.2,-4,-2.8,-1.6,1.6,2.8,4,5.2,6.4],r1=[-5.8,-4.6,-3.4,-2.2,2.2,3.4,4.6,5.8];
  r0.forEach((x,i)=>makeFan(x,-5.0,x<0?'P':'A'));r1.forEach(x=>makeFan(x,-5.75,x<0?'P':'A'));
  const g=newG();for(const z of[-5.0,-5.75])for(const sx of[-1,1])put(g,R.box,0xb08a5a,[sx*4,.04,z],0,[5.6,.08,.55]);scene.add(new Nd(upload(g)));}
function fansReact(team){for(const f of fans){if(f.team===team)f.cheer=1.8;else f.sad=1.5;}}
function updateFans(dt,time){for(const f of fans){f.cheer-=dt;f.sad-=dt;
  if(f.cheer>0){f.root.p[1]=Math.abs(Math.sin(time*9+f.ph))*.25;const w=Math.sin(time*12+f.ph)*.3;f.al.r[0]=-Math.PI+.3+w;f.ar.r[0]=-Math.PI+.3-w;f.al.r[2]=.2;f.ar.r[2]=-.2;}
  else if(f.sad>0){f.root.p[1]=0;f.al.r[0]=-.4;f.ar.r[0]=-.4;f.al.r[2]=-.5;f.ar.r[2]=.5;}
  else{f.root.p[1]=0;const w=Math.sin(time*1.5+f.ph)*.1;f.al.r[0]=w;f.ar.r[0]=-w;f.al.r[2]=-.1;f.ar.r[2]=.1;f.root.r[2]=Math.sin(time*1.2+f.ph)*.04;}}}

// ================= Wetter: Regen =================
const rain=[];for(let k=0;k<90;k++){const n=new Nd(UM.box,{s:[.015,.4,.015],col:0xcfe8ff,mode:4,a:.45});n.vis=false;n.p=[rand(-14,14),rand(0,14),rand(-9,10)];rain.push(n);scene.add(n);}
function updateRain(dt,on,wind,eco){for(let i=0;i<rain.length;i++){const n=rain[i];n.vis=on&&(!eco||i%2===0);if(!n.vis)continue;
  n.p[1]-=18*dt;n.p[2]+=wind*.6*dt;n.r[0]=-wind*.03;if(n.p[1]<0){n.p[1]=rand(10,14);n.p[0]=rand(-14,14);n.p[2]=rand(-9,10);}}}

// ================= Hindernisse: Welle & Möwe =================
const waveSheet=new Nd(UM.box,{col:0x4dd0e1,a:.55}),waveFoam=new Nd(UM.box,{col:0xffffff,a:.85});
waveSheet.vis=waveFoam.vis=false;scene.add(waveSheet,waveFoam);
function setWave(front){const on=front<8.9;waveSheet.vis=waveFoam.vis=on;if(!on)return;
  waveSheet.p=[0,.035,(front+9)/2];waveSheet.s=[24,.04,9-front];waveFoam.p=[0,.06,front];waveFoam.s=[24,.06,.25];}
const gull=new Nd(null);
{const wl=new Nd(null),wr=new Nd(null);wl.add(new Nd(UM.box,{p:[-.55,0,0],s:[1.1,.04,.32],col:0x90a4ae}));wr.add(new Nd(UM.box,{p:[.55,0,0],s:[1.1,.04,.32],col:0x90a4ae}));
  gull.add(wl,wr,new Nd(UM.sphLo,{s:[.2,.18,.5],col:0xffffff}),new Nd(UM.sphLo,{p:[0,.08,.42],s:.13,col:0xffffff}),new Nd(UM.cone,{p:[0,.06,.6],r:[Math.PI/2,0,0],s:[.04,.14,.04],col:0xffb300}));
  gull.wl=wl;gull.wr=wr;}
gull.vis=false;scene.add(gull);

// ================= Inselfarben =================
const ISLAND_SKINS={classic:{name:'Klassisch',tint:[1,1,1]},pink:{name:'Pinker Sand',tint:[1,.8,.88]},lava:{name:'Lava-Insel',tint:[.36,.33,.36]}};
let env=Object.assign({},ARENAS.tag);
function mulv(a,k){return a.map(x=>x*k);}
function setEnv(arenaKey,weather,skin){arena=ARENAS[arenaKey];env=Object.assign({},arena);
  if(weather==='regen'){env.fog=mulv(arena.fog,.75);env.top=mulv(arena.top,.6);env.lightCol=mulv(arena.lightCol,.7);env.sunCol=mulv(arena.sunCol,.3);env.fogF=arena.fogF*.6;env.fogN=arena.fogN*.6;}
  sandNode.col=(ISLAND_SKINS[skin]||ISLAND_SKINS.classic).tint.slice();if(weather==='regen')sandNode.col=mulv(sandNode.col,.85);
  for(const n of clouds)n.col=hex(arena.cloud);if(weather==='regen')for(const n of clouds)n.col=mulv(n.col,.6);
  for(const l of lights)l.vis=arena.night>.1;boatLamp.a=arena.night>.5?.9:0;for(const f of flies)f.vis=arena.night>.5&&weather!=='regen';}
function updateWorld(dt,time,eco){
  for(const n of crowns){n.r[2]=Math.sin(time*1.2+n.ph)*.05*(1+windStr);n.r[0]=Math.cos(time*1.0+n.ph)*.04;}
  for(const n of clouds){n.p[0]+=dt*1.2;if(n.p[0]>160)n.p[0]=-160;}
  boat.p[1]=-.3+Math.sin(time*1.4)*.12;boat.r[2]=Math.sin(time*1.1)*.05;boat.p[0]=38+Math.sin(time*.05)*12;boatLamp.p=[boat.p[0],boat.p[1]+4.4,boat.p[2]];
  for(const b of birds){const a=time*b.sp+b.ph;b.p=[Math.cos(a)*b.rad,b.h+Math.sin(time+b.ph)*.6,-12+Math.sin(a)*b.rad*.6];b.r[1]=-a+(b.sp>0?0:Math.PI);
    const f=Math.sin(time*9+b.ph)*.5;b.wl.r[2]=f;b.wr.r[2]=-f;b.vis=arena.night<.5;}
  for(let i=0;i<flies.length;i++){const f=flies[i];f.p=[f.base[0]+Math.sin(time*.4+f.ph)*1.5,f.base[1]+Math.sin(time*.9+f.ph*2)*.4,f.base[2]+Math.cos(time*.35+f.ph)*1.5];f.a=Math.max(0,Math.sin(time*2+f.ph))*.9;if(eco&&i%2)f.a=0;}
  for(const l of lights)l.dim=.7+.3*Math.sin(time*3+l.p[2]);
  crab.p[0]+=crab.dir*.7*dt;if(crab.p[0]>-1.5)crab.dir=-1;if(crab.p[0]<-6)crab.dir=1;crab.p[1]=Math.abs(Math.sin(time*14))*.02;
  for(const[f,g]of torches){const k=1+Math.sin(time*17+f.p[0])*.12+Math.sin(time*29+f.p[2])*.07;f.s=[1,k,1];g.a=arena.glow*(1+(k-1)*2);}
  updateFans(dt,time);
  for(let i=0;i<fans.length;i++)fans[i].root.vis=!eco||i%2===0;}
