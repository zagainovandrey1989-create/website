/* Dyson sphere 3D (Hoberman-style expansion on hover). Requires THREE r128 + hobx.js */
(function(){
const box=document.querySelector('.dyson');if(!box||matchMedia('(prefers-reduced-motion: reduce)').matches||!window.THREE||!THREE.EffectComposer)return;
const T=THREE;
const cv=document.createElement('canvas');cv.className='dy3d';cv.setAttribute('aria-hidden','true');
let ren;try{ren=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'})}catch(e){return}
const PR=Math.min(window.devicePixelRatio||1,1.75);ren.setPixelRatio(PR);ren.setClearColor(0x000000,1);
ren.outputEncoding=T.sRGBEncoding;ren.toneMapping=T.ACESFilmicToneMapping;ren.toneMappingExposure=1.05;
const sc=new T.Scene(),cam=new T.PerspectiveCamera(30,1,.1,100);cam.position.set(0,0,9.8);
const pm=new T.PMREMGenerator(ren);sc.environment=pm.fromScene(new T.RoomEnvironment(),.04).texture;
const pc=document.createElement('canvas');pc.width=4096;pc.height=64;const g=pc.getContext('2d');
g.fillStyle='#120b02';g.fillRect(0,0,4096,64);
for(let x=0;x<4096;x+=12){for(let r=0;r<3;r++){const b=110+Math.random()*120,hi=Math.random()<.035;
 g.fillStyle=hi?'#ffe7a8':`rgb(${b},${b*0.8|0},${b*0.4|0})`;g.fillRect(x+1,4+r*20,10,17);
 g.fillStyle='rgba(255,215,140,.12)';g.fillRect(x+1,4+r*20,10,1);}}
g.fillStyle='rgba(150,105,40,.6)';g.fillRect(0,0,4096,2);g.fillRect(0,62,4096,2);
const panelTex=new T.CanvasTexture(pc);panelTex.encoding=T.sRGBEncoding;panelTex.wrapS=T.RepeatWrapping;panelTex.anisotropy=ren.capabilities.getMaxAnisotropy();
const goldM=new T.MeshStandardMaterial({color:0xe6b84e,metalness:1,roughness:.42,map:panelTex,emissive:0xe0a830,emissiveMap:panelTex,emissiveIntensity:.5,envMapIntensity:.6});
const wireM=new T.MeshStandardMaterial({color:0x8a6420,metalness:1,roughness:.6,emissive:0x4a3008,emissiveIntensity:.3,envMapIntensity:.2,transparent:true,opacity:.35});
const sunC=document.createElement('canvas');sunC.width=sunC.height=1024;const s2=sunC.getContext('2d');
const rg=s2.createRadialGradient(512,512,0,512,512,512);rg.addColorStop(0,'#fff6d6');rg.addColorStop(.45,'#ffe6a8');rg.addColorStop(.8,'#ffc860');rg.addColorStop(1,'#eaa03a');s2.fillStyle=rg;s2.fillRect(0,0,1024,1024);
for(let i=0;i<60000;i++){const x=Math.random()*1024,y=Math.random()*1024,r=1+Math.random()*3.5;const d=Math.random();s2.fillStyle=d<.5?`rgba(255,${235+Math.random()*20|0},${170+Math.random()*60|0},${.12+Math.random()*.2})`:`rgba(${190+Math.random()*40|0},${100+Math.random()*50|0},20,${.08+Math.random()*.14})`;s2.beginPath();s2.arc(x,y,r,0,7);s2.fill();}
const sunTex=new T.CanvasTexture(sunC);sunTex.encoding=T.sRGBEncoding;
const sun=new T.Mesh(new T.SphereGeometry(.42,64,64),new T.MeshBasicMaterial({map:sunTex,toneMapped:false,color:0xd8b880}));sc.add(sun);
const radial=st=>{const c=document.createElement('canvas');c.width=c.height=256;const q=c.getContext('2d');const r=q.createRadialGradient(128,128,0,128,128,128);st.forEach(s=>r.addColorStop(s[0],s[1]));q.fillStyle=r;q.fillRect(0,0,256,256);const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;return t};
const spr=(map,s,o)=>{const m=new T.Sprite(new T.SpriteMaterial({map,blending:T.AdditiveBlending,depthWrite:false,depthTest:false,toneMapped:false}));m.renderOrder=o;m.scale.set(s,s,1);sc.add(m);return m};
const halo=spr(radial([[0,'rgba(255,220,150,0)'],[.2,'rgba(255,220,140,.42)'],[.3,'rgba(255,195,95,.22)'],[.55,'rgba(235,170,60,.10)'],[1,'rgba(0,0,0,0)']]),3.6,2);
spr(radial([[0,'rgba(255,200,110,.2)'],[.5,'rgba(210,150,50,.08)'],[1,'rgba(0,0,0,0)']]),4.6,1);
const lc=document.createElement('canvas');lc.width=1024;lc.height=8;const lq=lc.getContext('2d');const lg=lq.createLinearGradient(0,0,1024,0);lg.addColorStop(0,'rgba(255,230,180,0)');lg.addColorStop(.5,'rgba(255,248,230,1)');lg.addColorStop(1,'rgba(255,230,180,0)');lq.fillStyle=lg;lq.fillRect(0,3,1024,2);
const streakT=new T.CanvasTexture(lc);const SO=[.9,.62,.55,.45,.36,.32];
const streaks=[[-.5,4.4],[-.47,3.2],[.38,4.0],[1.22,3.0],[2.1,2.2],[-1.1,2.6]].map(([r,l],i)=>{const m=new T.Sprite(new T.SpriteMaterial({map:streakT,rotation:r,blending:T.AdditiveBlending,depthWrite:false,transparent:true,opacity:SO[i],toneMapped:false}));m.scale.set(l,.035,1);sc.add(m);return m});
sc.add(new T.AmbientLight(0x404660,.2));const L=new T.PointLight(0xffd890,6.5,0,2);sc.add(L);
const R=1.5,N=13,rings=[];const root=new T.Group();sc.add(root);
for(let k=0;k<N;k++){
 const grp=new T.Group();const y=1-2*(k+.5)/N,rr=Math.sqrt(1-y*y),th=k*2.399963;
 grp.quaternion.setFromUnitVectors(new T.Vector3(0,0,1),new T.Vector3(Math.cos(th)*rr,y,Math.sin(th)*rr).normalize());grp.rotateZ(k*.9);
 const segs=6+(k%3)*2,arcs=[],bandW=.07+(k%4)*.018;
 for(let i=0;i<segs;i++){
  const span=Math.PI*2/segs*.9,a0=i/segs*Math.PI*2;
  const geo=new T.TorusGeometry(R,.5,3,64,span);const pos=geo.attributes.position;
  for(let j=0;j<pos.count;j++){const x=pos.getX(j),yy=pos.getY(j),z=pos.getZ(j);const ang=Math.atan2(yy,x);const rad=Math.hypot(x,yy);const nr=R+(rad-R)*.012;pos.setXYZ(j,Math.cos(ang)*nr,Math.sin(ang)*nr,z*bandW);}
  geo.computeVertexNormals();const uv=geo.attributes.uv;for(let j=0;j<uv.count;j++)uv.setX(j,uv.getX(j)*span*R*1.6);
  const m=new T.Mesh(geo,goldM);m.rotation.z=a0;grp.add(m);arcs.push({m,mid:a0+span/2});
 }
 const w1=new T.Mesh(new T.TorusGeometry(R,.0028,6,256),wireM);grp.add(w1);const w2=new T.Mesh(new T.TorusGeometry(R*1.012,.0018,6,256),wireM);w2.rotation.x=.04;grp.add(w2);
 root.add(grp);rings.push({arcs,w1,w2,d:(k*5%N)/N});
}
const comp=new T.EffectComposer(ren);comp.addPass(new T.RenderPass(sc,cam));
const bloom=new T.UnrealBloomPass(new T.Vector2(256,256),.5,.55,.82);comp.addPass(bloom);
let W=0;const size=()=>{const s=Math.round(box.getBoundingClientRect().width*1.45);if(!s||s===W)return;W=s;ren.setSize(s,s,false);comp.setSize(s,s);bloom.setSize(s*PR,s*PR)};
let E=0,target=0,last=0,t=0,vis=false,raf=0,first=true;
const draw=()=>{
 root.rotation.y=t*.06;root.rotation.x=.3+Math.sin(t*.05)*.05;
 rings.forEach(r=>{const x=Math.min(1,Math.max(0,E*1.3-r.d*.3)),s=x*x*(3-2*x),off=R*.24*s;
  r.arcs.forEach(a=>a.m.position.set(Math.cos(a.mid)*off,Math.sin(a.mid)*off,0));r.w1.scale.setScalar(1+.24*s);r.w2.scale.setScalar(1+.24*s)});
 sun.rotation.y=t*.08;halo.scale.setScalar(3.6*(1+Math.sin(t*1.2)*.02)*(1+E*.12));
 ren.toneMappingExposure=.78+E*.32;L.intensity=5.3+E*2.4;bloom.strength=.38+E*.27;halo.material.opacity=.68+E*.32;sun.material.color.setRGB(.72+E*.13,.61+E*.11,.42+E*.08);streaks.forEach((m,i)=>m.material.opacity=SO[i]*(.85+.15*Math.sin(t*.7+i))*(.65+E*.65));
 comp.render();
 if(first){first=false;box.classList.add('dy3on');cv.style.opacity=.9}
};
const loop=now=>{raf=0;if(!vis||document.hidden)return;const dt=Math.min(.05,last?(now-last)/1000:0);last=now;t+=dt;
 const rate=target>E?1.25:.9;E+=(target-E)*(1-Math.exp(-dt*rate*1.0));draw();raf=requestAnimationFrame(loop)};
const kick=()=>{if(!raf&&vis&&!document.hidden){last=0;raf=requestAnimationFrame(loop)}};
const host=box.closest('section')||box.parentNode;
cv.style.cssText='position:absolute;z-index:1;mix-blend-mode:screen;pointer-events:none;opacity:0;transition:opacity 1.2s ease';
const place=()=>{const r=box.getBoundingClientRect(),h=host.getBoundingClientRect(),k=1.45,w=r.width*k;cv.style.width=cv.style.height=w+'px';cv.style.left=(r.left-h.left+host.scrollLeft-(w-r.width)/2)+'px';cv.style.top=(r.top-h.top+host.scrollTop-(w-r.height)/2)+'px'};
host.appendChild(cv);size();place();addEventListener('resize',()=>{size();place()});
const HOV=matchMedia('(hover:hover)').matches;
if(HOV){box.addEventListener('pointerenter',()=>{target=1});box.addEventListener('pointerleave',()=>{target=0});box.addEventListener('focus',()=>{target=1});box.addEventListener('blur',()=>{target=0})}
else{const sy=()=>{target=box.classList.contains('open')?1:0;kick()};new MutationObserver(sy).observe(box,{attributes:true,attributeFilter:['class']})}
const sec=box.closest('section');const upd=()=>{vis=!sec||sec.classList.contains('on')||sec.classList.contains('entering');if(vis){size();place();kick()}};new MutationObserver(upd).observe(sec||box,{attributes:true,attributeFilter:['class']});upd();
document.addEventListener('visibilitychange',kick);
draw();
})();
