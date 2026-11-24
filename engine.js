// engine.js – kleine WebGL-Engine für Bomben-Volleyball 3D
const $=id=>document.getElementById(id);
const rand=(a,b)=>a+Math.random()*(b-a);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const hex=h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255];
const norm=v=>{const l=Math.hypot(...v);return v.map(x=>x/l);};
const pick=a=>a[Math.floor(Math.random()*a.length)];
const VS=`attribute vec3 aP;attribute vec3 aN;attribute vec3 aC;
uniform mat4 uM;uniform mat4 uVP;uniform mat3 uNM;uniform float uMode;uniform float uTime;
varying vec3 vN;varying vec3 vW;varying vec3 vC;varying vec3 vL;
void main(){vec3 p=aP;vec3 n=aN;
if(uMode>1.5&&uMode<2.5){float d=length(p.xz/vec2(13.0,8.5));float a=smoothstep(1.08,1.9,d);
 float t1=p.x*0.45+uTime*1.3;float t2=p.z*0.6+uTime*1.1;float t3=(p.x+p.z)*0.9+uTime*2.0;
 p.y+=(sin(t1)*0.16+cos(t2)*0.12+sin(t3)*0.05)*a;
 float dx=(cos(t1)*0.072+cos(t3)*0.045)*a;float dz=(-sin(t2)*0.072+cos(t3)*0.045)*a;
 n=normalize(vec3(-dx,1.0,-dz));}
vec4 w=uM*vec4(p,1.0);vW=w.xyz;vN=uNM*n;vC=aC;vL=aP;gl_Position=uVP*w;}`;
const FS=`#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec3 vN;varying vec3 vW;varying vec3 vC;varying vec3 vL;
uniform vec3 uTint;uniform float uDim;uniform vec3 uCam;uniform vec3 uLight;uniform vec3 uLightCol;uniform vec3 uFog;uniform vec3 uSkyTop;
uniform vec3 uSun;uniform vec3 uSunCol;uniform vec3 uAmbSky;uniform vec3 uAmbGnd;uniform vec3 uW0;uniform vec3 uW1;uniform vec3 uW2;
uniform float uNight;uniform vec3 uTorch[4];uniform float uTorchI;uniform vec4 uBoom;
uniform float uMode;uniform float uAlpha;uniform float uTime;uniform float uFogNear;uniform float uFogFar;
float hash(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
vec3 base=vC*uTint*uDim;
if(uMode>0.5&&uMode<1.5){vec3 d=normalize(vW-uCam);vec3 c=mix(uFog,uSkyTop,smoothstep(0.0,0.5,d.y));
 float s=max(dot(d,uSun),0.0);c+=uSunCol*pow(s,10.0)*0.3+uSunCol*smoothstep(0.9965,0.9985,s);
 if(uNight>0.01){vec2 q=floor(vec2(atan(d.z,d.x)*160.0,asin(clamp(d.y,-1.0,1.0))*160.0));float h=hash(q);
  float st=step(0.992,h)*smoothstep(0.03,0.3,d.y)*(0.55+0.45*sin(uTime*2.5+h*60.0));c+=vec3(st)*uNight;}
 gl_FragColor=vec4(c,1.0);return;}
if(uMode>4.5&&uMode<5.5){float r=length(vL.xz);float a=pow(clamp(1.0-r,0.0,1.0),1.6);gl_FragColor=vec4(base,a*uAlpha);return;}
vec3 v=uCam-vW;
if(uMode>3.5&&uMode<4.5){gl_FragColor=vec4(base,uAlpha);return;}
vec3 n=normalize(vN);if(dot(n,v)<0.0)n=-n;
if(uMode>1.5&&uMode<2.5){float d=length(vW.xz/vec2(13.0,8.5));
 base=mix(uW0,uW1,smoothstep(1.05,1.9,d));base=mix(base,uW2,smoothstep(2.4,7.0,d));
 float fo=1.0-smoothstep(0.0,0.045,abs(d-1.065-0.012*sin(uTime*2.2+atan(vW.z,vW.x)*9.0)));
 base=mix(base,vec3(1.0),fo*0.9);}
if(uMode>2.5&&uMode<3.5){base*=0.955+0.07*hash(floor(vW.xz*14.0));}
float df=max(dot(n,uLight),0.0);
vec3 hemi=mix(uAmbGnd,uAmbSky,n.y*0.5+0.5);
vec3 c=base*(hemi*0.68+uLightCol*df*0.62);
float tl=0.0;for(int i=0;i<4;i++){vec3 dd=uTorch[i]-vW;tl+=1.0/(1.0+dot(dd,dd)*0.3);}
c+=base*vec3(1.0,0.55,0.22)*tl*uTorchI;
vec3 bd=uBoom.xyz-vW;c+=base*vec3(1.0,0.7,0.35)*uBoom.w/(1.0+dot(bd,bd)*0.06);
if(uMode>1.5&&uMode<2.5){vec3 h=normalize(uLight+normalize(v));c+=uLightCol*pow(max(dot(n,h),0.0),90.0)*0.7;}
float f=uMode>5.5?0.0:smoothstep(uFogNear,uFogFar,length(v));
gl_FragColor=vec4(mix(c,uFog,f),uAlpha);}`;

// ================= Matrizen =================
function mul(a,b,o){for(let i=0;i<4;i++){const b0=b[i*4],b1=b[i*4+1],b2=b[i*4+2],b3=b[i*4+3];
  o[i*4]=a[0]*b0+a[4]*b1+a[8]*b2+a[12]*b3;o[i*4+1]=a[1]*b0+a[5]*b1+a[9]*b2+a[13]*b3;
  o[i*4+2]=a[2]*b0+a[6]*b1+a[10]*b2+a[14]*b3;o[i*4+3]=a[3]*b0+a[7]*b1+a[11]*b2+a[15]*b3;}return o;}
function trsInto(o,p,r,s){const cx=Math.cos(r[0]),sx=Math.sin(r[0]),cy=Math.cos(r[1]),sy=Math.sin(r[1]),cz=Math.cos(r[2]),sz=Math.sin(r[2]);
  o[0]=(cy*cz+sy*sx*sz)*s[0];o[1]=cx*sz*s[0];o[2]=(-sy*cz+cy*sx*sz)*s[0];o[3]=0;
  o[4]=(-cy*sz+sy*sx*cz)*s[1];o[5]=cx*cz*s[1];o[6]=(sy*sz+cy*sx*cz)*s[1];o[7]=0;
  o[8]=sy*cx*s[2];o[9]=-sx*s[2];o[10]=cy*cx*s[2];o[11]=0;o[12]=p[0];o[13]=p[1];o[14]=p[2];o[15]=1;return o;}
function nmat(m,o){const a00=m[0],a01=m[4],a02=m[8],a10=m[1],a11=m[5],a12=m[9],a20=m[2],a21=m[6],a22=m[10];
  o[0]=a11*a22-a12*a21;o[1]=-(a01*a22-a02*a21);o[2]=a01*a12-a02*a11;
  o[3]=-(a10*a22-a12*a20);o[4]=a00*a22-a02*a20;o[5]=-(a00*a12-a02*a10);
  o[6]=a10*a21-a11*a20;o[7]=-(a00*a21-a01*a20);o[8]=a00*a11-a01*a10;return o;}
function persp(o,fov,asp,n,f){const t=1/Math.tan(fov/2);o.fill(0);o[0]=t/asp;o[5]=t;o[10]=(f+n)/(n-f);o[11]=-1;o[14]=2*f*n/(n-f);return o;}
function lookAt(o,e,t){let zx=e[0]-t[0],zy=e[1]-t[1],zz=e[2]-t[2];let l=Math.hypot(zx,zy,zz);zx/=l;zy/=l;zz/=l;
  let xx=zz,xy=0,xz=-zx;l=Math.hypot(xx,xz)||1;xx/=l;xz/=l;
  const yx=zy*xz-zz*xy,yy=zz*xx-zx*xz,yz=zx*xy-zy*xx;
  o[0]=xx;o[1]=yx;o[2]=zx;o[3]=0;o[4]=xy;o[5]=yy;o[6]=zy;o[7]=0;o[8]=xz;o[9]=yz;o[10]=zz;o[11]=0;
  o[12]=-(xx*e[0]+xy*e[1]+xz*e[2]);o[13]=-(yx*e[0]+yy*e[1]+yz*e[2]);o[14]=-(zx*e[0]+zy*e[1]+zz*e[2]);o[15]=1;return o;}
const IDM=trsInto(new Float32Array(16),[0,0,0],[0,0,0],[1,1,1]);

// ================= Geometrie =================
function rBox(){const p=[],n=[],i=[];for(const f of[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]]){
  const u=f[1]!==0?[1,0,0]:[0,1,0];const v=[f[1]*u[2]-f[2]*u[1],f[2]*u[0]-f[0]*u[2],f[0]*u[1]-f[1]*u[0]];const b=p.length/3;
  for(const[s,t]of[[-1,-1],[1,-1],[1,1],[-1,1]]){p.push((f[0]+u[0]*s+v[0]*t)*.5,(f[1]+u[1]*s+v[1]*t)*.5,(f[2]+u[2]*s+v[2]*t)*.5);n.push(f[0],f[1],f[2]);}
  i.push(b,b+1,b+2,b,b+2,b+3);}return{p,n,i};}
function rSphere(ws,hs,tmax){tmax=tmax||Math.PI;const p=[],n=[],i=[];
  for(let y=0;y<=hs;y++){const th=y/hs*tmax;for(let x=0;x<=ws;x++){const ph=x/ws*Math.PI*2;
    const nx=Math.sin(th)*Math.cos(ph),ny=Math.cos(th),nz=Math.sin(th)*Math.sin(ph);p.push(nx,ny,nz);n.push(nx,ny,nz);}}
  for(let y=0;y<hs;y++)for(let x=0;x<ws;x++){const a=y*(ws+1)+x,b=a+ws+1;i.push(a,b,a+1,b,b+1,a+1);}return{p,n,i};}
function rCyl(rt,rb,seg){const p=[],n=[],i=[],sl=rb-rt,l=Math.hypot(1,sl);
  for(let k=0;k<=seg;k++){const a=k/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c*rb,-.5,s*rb,c*rt,.5,s*rt);n.push(c/l,sl/l,s/l,c/l,sl/l,s/l);}
  for(let k=0;k<seg;k++){const a=k*2;i.push(a,a+1,a+2,a+1,a+3,a+2);}
  for(const[r,y]of[[rt,.5],[rb,-.5]]){if(r<=0)continue;const b=p.length/3;p.push(0,y,0);n.push(0,Math.sign(y),0);
    for(let k=0;k<=seg;k++){const a=k/seg*Math.PI*2;p.push(Math.cos(a)*r,y,Math.sin(a)*r);n.push(0,Math.sign(y),0);}
    for(let k=0;k<seg;k++)i.push(b,b+1+k,b+2+k);}return{p,n,i};}
function rPlane(w,d,sx,sz){const p=[],n=[],i=[];for(let z=0;z<=sz;z++)for(let x=0;x<=sx;x++){p.push((x/sx-.5)*w,0,(z/sz-.5)*d);n.push(0,1,0);}
  for(let z=0;z<sz;z++)for(let x=0;x<sx;x++){const a=z*(sx+1)+x,b=a+sx+1;i.push(a,b,a+1,a+1,b,b+1);}return{p,n,i};}
function rRing(ri,ro,seg){const p=[],n=[],i=[];for(let k=0;k<=seg;k++){const a=k/seg*Math.PI*2,c=Math.cos(a),s=Math.sin(a);p.push(c*ri,0,s*ri,c*ro,0,s*ro);n.push(0,1,0,0,1,0);}
  for(let k=0;k<seg;k++){const a=k*2;i.push(a,a+1,a+2,a+1,a+3,a+2);}return{p,n,i};}
function rLeaf(wid,droop){const p=[],n=[],i=[],N=10;for(let k=0;k<=N;k++){const t=k/N,hw=wid*Math.pow(Math.sin(Math.PI*Math.min(1,t*1.05)),.7),y=-droop*t*t;
  p.push(t,y-.02,-hw,t,y+.035,0,t,y-.02,hw);n.push(0,1,0,0,1,0,0,1,0);}
  for(let k=0;k<N;k++)for(let j=0;j<2;j++){const a=k*3+j,b=a+3;i.push(a,b,a+1,a+1,b,b+1);}return{p,n,i};}
function rStar(r1,r2,h){const p=[0,h,0],n=[0,1,0],i=[];for(let k=0;k<=10;k++){const r=k%2?r2:r1,a=k/10*Math.PI*2;p.push(Math.cos(a)*r,0,Math.sin(a)*r);n.push(0,1,0);}
  for(let k=0;k<10;k++)i.push(0,1+k,2+k);return{p,n,i};}
const R={box:rBox(),sph:rSphere(14,10),sphLo:rSphere(8,6),cyl:rCyl(1,1,10),cone:rCyl(0,1,10),leaf:rLeaf(.17,.42),star:rStar(1,.42,.25),hemi:rSphere(16,8,Math.PI*.5)};
const newG=()=>({p:[],n:[],c:[],i:[]});
const tN=new Float32Array(9),tM=new Float32Array(16);
function gAdd(g,raw,m,col){const b=g.p.length/3;nmat(m,tN);
  for(let k=0;k<raw.p.length;k+=3){const x=raw.p[k],y=raw.p[k+1],z=raw.p[k+2];
    g.p.push(m[0]*x+m[4]*y+m[8]*z+m[12],m[1]*x+m[5]*y+m[9]*z+m[13],m[2]*x+m[6]*y+m[10]*z+m[14]);
    const nx=raw.n[k],ny=raw.n[k+1],nz=raw.n[k+2];const a=tN[0]*nx+tN[3]*ny+tN[6]*nz,b2=tN[1]*nx+tN[4]*ny+tN[7]*nz,c=tN[2]*nx+tN[5]*ny+tN[8]*nz,l=Math.hypot(a,b2,c)||1;
    g.n.push(a/l,b2/l,c/l);g.c.push(col[0],col[1],col[2]);}
  for(const ii of raw.i)g.i.push(b+ii);}
function put(g,raw,col,p,r,s){trsInto(tM,p,r||[0,0,0],typeof s==='number'?[s,s,s]:(s||[1,1,1]));gAdd(g,raw,tM,typeof col==='number'?hex(col):col);}


// ================= WebGL =================
const cv=$('c');
const gl=cv.getContext('webgl',{antialias:true,alpha:false})||cv.getContext('experimental-webgl');
if(!gl){$('nogl').classList.remove('hidden');throw new Error('Kein WebGL');}
const U32=gl.getExtension('OES_element_index_uint');
function shd(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
const prog=gl.createProgram();gl.attachShader(prog,shd(gl.VERTEX_SHADER,VS));gl.attachShader(prog,shd(gl.FRAGMENT_SHADER,FS));gl.linkProgram(prog);
if(!gl.getProgramParameter(prog,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(prog));
gl.useProgram(prog);
const aP=gl.getAttribLocation(prog,'aP'),aN=gl.getAttribLocation(prog,'aN'),aC=gl.getAttribLocation(prog,'aC');
for(const a of[aP,aN,aC])if(a>=0)gl.enableVertexAttribArray(a);
const u={};for(const n of['uM','uVP','uNM','uMode','uTime','uTint','uDim','uCam','uLight','uLightCol','uFog','uSkyTop','uSun','uSunCol','uAmbSky','uAmbGnd',
  'uW0','uW1','uW2','uNight','uTorch','uTorchI','uBoom','uAlpha','uFogNear','uFogFar'])u[n]=gl.getUniformLocation(prog,n);
function upload(g){const m={cnt:g.i.length};const vb=arr=>{const b=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,b);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array(arr),gl.STATIC_DRAW);return b;};
  m.p=vb(g.p);m.n=vb(g.n);m.c=vb(g.c);m.ib=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);
  const big=g.p.length/3>65535;if(big&&!U32)console.warn('Mesh zu gross');
  m.type=big?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,big?new Uint32Array(g.i):new Uint16Array(g.i),gl.STATIC_DRAW);return m;}
function M1(raw,col){const g=newG();gAdd(g,raw,IDM,hex(col===undefined?0xffffff:col));return upload(g);}
const UM={sph:M1(rSphere(16,12)),sphLo:M1(R.sphLo),cyl:M1(rCyl(1,1,14)),cone:M1(R.cone),box:M1(R.box),disc:M1(rRing(0,1,28)),
  ring:M1(rRing(.8,1,40)),hemi:M1(R.hemi),star:M1(R.star)};

class Nd{constructor(mesh,o){o=o||{};this.mesh=mesh;this.p=o.p||[0,0,0];this.r=o.r||[0,0,0];const s=o.s===undefined?1:o.s;
  this.s=typeof s==='number'?[s,s,s]:s;this.col=o.col===undefined?[1,1,1]:(typeof o.col==='number'?hex(o.col):o.col);
  this.mode=o.mode||0;this.a=o.a===undefined?1:o.a;this.add_=!!o.add;this.dim=1;this.vis=true;this.kids=[];
  this.L=new Float32Array(16);this.W=new Float32Array(16);this._d=1;}
  add(...k){this.kids.push(...k);return this;}}
const scene=new Nd(null);
function removeNode(n){const i=scene.kids.indexOf(n);if(i>=0)scene.kids.splice(i,1);}
const PM=new Float32Array(16),VM=new Float32Array(16),VPm=new Float32Array(16),NMt=new Float32Array(9);
const OPQ=[],TRN=[];
function collectNodes(n,PMx,dim){if(!n.vis)return;trsInto(n.L,n.p,n.r,n.s);mul(PMx,n.L,n.W);const d=dim*n.dim;n._d=d;
  if(n.mesh)(n.a<1||n.mode===5||n.add_?TRN:OPQ).push(n);for(const k of n.kids)collectNodes(k,n.W,d);}
function drawNode(n){const m=n.mesh;gl.uniformMatrix4fv(u.uM,false,n.W);gl.uniformMatrix3fv(u.uNM,false,nmat(n.W,NMt));
  gl.uniform3fv(u.uTint,n.col);gl.uniform1f(u.uDim,n._d);gl.uniform1f(u.uMode,n.mode);gl.uniform1f(u.uAlpha,n.a);
  gl.bindBuffer(gl.ARRAY_BUFFER,m.p);gl.vertexAttribPointer(aP,3,gl.FLOAT,false,0,0);
  if(aN>=0){gl.bindBuffer(gl.ARRAY_BUFFER,m.n);gl.vertexAttribPointer(aN,3,gl.FLOAT,false,0,0);}
  if(aC>=0){gl.bindBuffer(gl.ARRAY_BUFFER,m.c);gl.vertexAttribPointer(aC,3,gl.FLOAT,false,0,0);}
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,m.ib);gl.drawElements(gl.TRIANGLES,m.cnt,m.type,0);}
// env: Lichtstimmung; tp: Fackelpositionen (Float32Array 12); boom: [x,y,z,stärke]
function renderScene(env,eye,tgt,time,tp,torchI,boom){
  persp(PM,42*Math.PI/180,cv.width/cv.height,.1,700);lookAt(VM,eye,tgt);mul(PM,VM,VPm);
  gl.viewport(0,0,cv.width,cv.height);gl.clearColor(env.fog[0],env.fog[1],env.fog[2],1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
  gl.enable(gl.DEPTH_TEST);gl.disable(gl.CULL_FACE);gl.disable(gl.BLEND);gl.depthMask(true);
  gl.uniformMatrix4fv(u.uVP,false,VPm);gl.uniform3fv(u.uCam,eye);gl.uniform3fv(u.uLight,env.light);gl.uniform3fv(u.uLightCol,env.lightCol);
  gl.uniform3fv(u.uFog,env.fog);gl.uniform3fv(u.uSkyTop,env.top);gl.uniform3fv(u.uSun,env.sun);gl.uniform3fv(u.uSunCol,env.sunCol);
  gl.uniform3fv(u.uAmbSky,env.amb);gl.uniform3fv(u.uAmbGnd,env.gnd);gl.uniform3fv(u.uW0,env.w0);gl.uniform3fv(u.uW1,env.w1);gl.uniform3fv(u.uW2,env.w2);
  gl.uniform1f(u.uNight,env.night);gl.uniform3fv(u.uTorch,tp);gl.uniform1f(u.uTorchI,torchI);
  gl.uniform4f(u.uBoom,boom[0],boom[1],boom[2],boom[3]);
  gl.uniform1f(u.uTime,time);gl.uniform1f(u.uFogNear,env.fogN);gl.uniform1f(u.uFogFar,env.fogF);
  OPQ.length=0;TRN.length=0;collectNodes(scene,IDM,1);
  for(const n of OPQ)drawNode(n);
  for(const n of TRN)n._z=Math.hypot(n.W[12]-eye[0],n.W[13]-eye[1],n.W[14]-eye[2]);
  TRN.sort((a,b)=>b._z-a._z);gl.enable(gl.BLEND);gl.depthMask(false);
  for(const n of TRN){if(n.add_)gl.blendFunc(gl.SRC_ALPHA,gl.ONE);else gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA);drawNode(n);}
  gl.depthMask(true);}
function proj(x,y,z){const m=VPm,X=m[0]*x+m[4]*y+m[8]*z+m[12],Y=m[1]*x+m[5]*y+m[9]*z+m[13],W=m[3]*x+m[7]*y+m[11]*z+m[15];
  return[(X/W*.5+.5)*cv.clientWidth,(-Y/W*.5+.5)*cv.clientHeight,W>0];}
function billboard(n,eye){const dx=eye[0]-n.p[0],dy=eye[1]-n.p[1],dz=eye[2]-n.p[2],l=Math.hypot(dx,dy,dz)||1;n.r=[Math.acos(clamp(dy/l,-1,1)),Math.atan2(dx,dz),0];}
let RES=1.75;
// Echte Bildschirmhöhe: als Home-Bildschirm-App auf dem iPhone ist window.innerHeight unzuverlässig,
// darum dort die Bildschirmmasse verwenden (Statusleiste liegt mit black-translucent über der App).
function isStandalone(){return window.navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);}
function fitApp(){const app=$('app'),stage=$('stage');let w=window.innerWidth,h=window.innerHeight;
  if(isStandalone()&&window.screen&&screen.width){const land=w>h;const a=Math.max(screen.width,screen.height),b=Math.min(screen.width,screen.height);h=land?b:a;w=land?a:b;}
  app.style.height=h+'px';const cs=getComputedStyle(app);
  const pl=parseFloat(cs.paddingLeft)||0,pr=parseFloat(cs.paddingRight)||0,pt=parseFloat(cs.paddingTop)||0,pb=parseFloat(cs.paddingBottom)||0;
  const aw=w-pl-pr,ah=h-pt-pb;const sw=aw>ah?Math.min(aw,ah*16/9):aw;stage.style.width=Math.floor(sw)+'px';}
function resize(){fitApp();const r=cv.getBoundingClientRect();if(!r.width)return;const d=Math.min(window.devicePixelRatio||1,RES);
  const h=Math.round(r.width*9/16);cv.style.height=h+'px';$('hud').style.height=h+'px';cv.width=Math.round(r.width*d);cv.height=Math.round(h*d);$('hud').style.fontSize=(r.width/62)+'px';}
resize();addEventListener('resize',resize);addEventListener('orientationchange',()=>{setTimeout(resize,250);setTimeout(resize,700);});if(window.ResizeObserver)new ResizeObserver(resize).observe(cv);
