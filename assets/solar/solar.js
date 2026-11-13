/* Освоенные миры — сцена Солнечной системы (three.js r128, глобальный THREE).
   window.SolarScene.mount(container, {tex:'planets/tex/', worlds:[...], ui:{...}})  */
(function(){
'use strict';
const T=window.THREE;
const MOBILE=matchMedia('(max-width:900px)').matches;
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;


const NOISE=`vec3 m289(vec3 x){return x-floor(x*(1./289.))*289.;}vec4 m289(vec4 x){return x-floor(x*(1./289.))*289.;}
vec4 perm(vec4 x){return m289(((x*34.)+1.)*x);}vec4 tis(vec4 r){return 1.79284291400159-.85373472095314*r;}
float snoise(vec3 v){const vec2 C=vec2(1./6.,1./3.);const vec4 D=vec4(0.,.5,1.,2.);vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
i=m289(i);vec4 p=perm(perm(perm(i.z+vec4(0.,i1.z,i2.z,1.))+i.y+vec4(0.,i1.y,i2.y,1.))+i.x+vec4(0.,i1.x,i2.x,1.));
float n_=.142857142857;vec3 ns=n_*D.wyz-D.xzx;vec4 j=p-49.*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.*x_);
vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.-abs(x)-abs(y);vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
vec4 s0=floor(b0)*2.+1.;vec4 s1=floor(b1)*2.+1.;vec4 sh=-step(h,vec4(0.));vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);vec4 nr=tis(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
p0*=nr.x;p1*=nr.y;p2*=nr.z;p3*=nr.w;vec4 m=max(.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.);m=m*m;
return 42.*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));}
float fbm3(vec3 p){float v=0.,a=.5;for(int i=0;i<4;i++){v+=a*snoise(p);p*=2.02;a*=.5;}return v;}
`;

const VS=`varying vec2 vUv;varying vec3 vN;varying vec3 vP;varying vec3 vO;
void main(){vUv=uv;vO=normalize(position);vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const FS=NOISE+`uniform float texLight;uniform float style;uniform vec4 bases[16];uniform float nBases;uniform vec3 la[6];uniform vec3 lb[6];uniform float nLinks;uniform vec3 cA;uniform vec3 cB;
float h21(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float m2(float u){return 1.-smoothstep(.85,1.,u);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
float fb(vec2 p){return vn(p)*.55+vn(p*2.1)*.28+vn(p*4.3)*.17;}
uniform sampler2D map;uniform sampler2D night;uniform sampler2D spec;uniform vec3 sun;uniform float lightGain;uniform float hasSpec;uniform float ambient;uniform vec3 lightTint;uniform float t;
varying vec2 vUv;varying vec3 vN;varying vec3 vP;varying vec3 vO;
void main(){vec3 n=normalize(vN);vec3 L=normalize(sun-vP);float d=dot(n,L);
vec3 day=texture2D(map,vUv).rgb;
float lit=smoothstep(-0.12,0.35,d);float dark=1.-lit;
vec3 o=normalize(vO);float lat=asin(clamp(o.y,-1.,1.));
vec3 V=normalize(cameraPosition-vP);vec3 H=normalize(L+V);
float wet=0.;
if(style>1.5&&style<2.5){ // Mars: terraformed — northern sea + greening lowlands
  float lum=dot(day,vec3(.3,.5,.2));
  float sea=smoothstep(.95,1.05,lat*1.35+(lum-.32)*1.6+(fb(vUv*vec2(24.,12.))-.5)*.35);
  float green=smoothstep(.36,.22,lum)*(1.-sea)*smoothstep(-0.9,-0.2,lat)*.25;
  day=mix(day,day*vec3(.82,.86,.72),green);
  day=mix(day,vec3(.03,.11,.2),sea*.9);wet=sea;}
if(style>2.5){ // Titan: resolution-free procedural surface — highlands, dune seas, methane lakes
  float hgt=fbm3(o*2.6+3.1);float det=fbm3(o*14.)*.35+fbm3(o*40.)*.2+.5;
  vec3 low=vec3(.20,.12,.06),high=vec3(.62,.42,.22);
  day=mix(low,high,smoothstep(-.25,.35,hgt))*(0.8+0.35*det);
  float belt=smoothstep(.55,.15,abs(lat));float dunes=.5+.5*sin(o.y*140.+snoise(o*6.)*4.+o.x*20.);
  day*=1.-belt*.22*dunes*smoothstep(.1,-.2,hgt);
  float sea=smoothstep(.02,.1,fbm3(o*2.2+9.)+(lat-.45)*.9)*smoothstep(.15,.35,lat);
  day=mix(day,vec3(.03,.025,.03),sea*.92);wet=sea;}
if(style<0.5){float pol=smoothstep(.82,.95,abs(o.y));day=mix(day,vec3(dot(day,vec3(.33)))*vec3(.92,.95,1.),pol);}
vec3 col=day*(ambient+max(d,0.)*1.15);
float sp=(hasSpec>0.5?texture2D(spec,vUv).r:wet)*(1.-smoothstep(.8,.92,abs(o.y)));
col+=vec3(0.55,0.62,0.7)*pow(max(dot(n,H),0.),style>2.5?18.:40.)*sp*lit*(style>2.5?vec3(1.,.7,.4):vec3(1.));
vec3 nl0=texture2D(night,vUv).rgb;vec3 nl=style<0.5?vec3(1.,.86,.62)*smoothstep(.07,.55,nl0.r-nl0.b*.15):nl0;float nb=dot(nl,vec3(.33));
float tw=0.88+0.12*sin(t*1.3+vUv.x*70.+vUv.y*50.);
vec3 neon=style<0.5?mix(lightTint,vec3(.75,.95,1.),smoothstep(.35,.8,nb)):lightTint;
col+=(nl*neon*lightGain*dark*tw + nl*neon*0.05*lit)*texLight;
// settlements
for(int i=0;i<16;i++){if(float(i)>=nBases)break;vec3 c=bases[i].xyz;float rad=bases[i].w;float cd=dot(o,c);
 if(cd>cos(rad*1.6)){float ang=acos(clamp(cd,-1.,1.));float u=ang/rad;
  vec3 t1=normalize(cross(c,abs(c.y)>.95?vec3(1.,0.,0.):vec3(0.,1.,0.)));vec3 t2=cross(c,t1);float th=atan(dot(o,t2),dot(o,t1));
  float vis=0.7+0.6*dark;vec3 add=vec3(0.);
  { // shared city language (Moon/Mars/Titan): domed city — lit rim, inner ring, avenues, hub; outer belt differs per world
    float rim=smoothstep(.07,0.,abs(u-1.))*(.55+.45*step(.5,fract(th*7.6)));
    float inner=smoothstep(.04,0.,abs(u-.55))*.6;
    float spoke=smoothstep(.06,0.,abs(sin(th*3.)))*step(u,1.)*step(.18,u)*.45;
    float hub=smoothstep(.22,.0,u)*(.8+.2*sin(t*2.));
    vec2 bq=vec2(cos(th),sin(th))*u*10.;vec2 bi=floor(bq);float br=h21(bi+float(i)*3.);
    float blocks=step(.55,br)*step(u,.95)*step(.18,u)*smoothstep(.45,.25,length(fract(bq)-.5))*(.6+.4*sin(t*1.3+br*30.));
    float glass=(1.-smoothstep(.85,1.,u))*pow(max(dot(n,H),0.),45.)*lit;
    vec2 g=vec2(th*rad*60.,(u-1.25)*rad*60.);float belt=step(1.08,u)*step(u,1.5)*step(.2,fract(th*2.+.1));
    float field=belt*(step(.1,fract(g.x))*step(.15,fract(g.y)));
    vec3 fieldCol=style<1.5?vec3(.04,.07,.14):(style<2.5?vec3(.16,.09,.06):vec3(.05,.04,.03));
    add=cA*rim*1.2+cB*(inner+hub+blocks*.9)+cA*spoke;

    if(style<2.5){col=mix(col,col*.7+vec3(.06,.06,.07),(1.-smoothstep(.85,1.,u))*.35*lit);
    col+=vec3(.85,.9,1.)*glass*.3;}
    if(style<2.5){col=mix(col,fieldCol+col*.25,field*.85);col+=vec3(.5,.7,1.)*field*pow(max(dot(n,H),0.),60.)*lit*1.5;}
    
  }
  col+=add*vis*lightGain*.55;}}
// transport links: great-circle maglev / mass-driver lines with moving pulses
for(int i=0;i<6;i++){if(float(i)>=nLinks)break;vec3 a=la[i],b=lb[i];vec3 nn=normalize(cross(a,b));float dl=abs(dot(o,nn));
 if(dl<.012&&dot(cross(a,o),nn)>0.&&dot(cross(o,b),nn)>0.){float al=acos(clamp(dot(a,o),-1.,1.))/acos(clamp(dot(a,b),-1.,1.));
  float line=smoothstep(.006,.0,dl);float pulse=smoothstep(.03,0.,abs(fract(al*3.-t*.25)-.5)-.47);
  col+=(cA*line*.55+vec3(1.,.95,.85)*line*pulse*1.4)*(0.5+0.5*dark);}}
gl_FragColor=vec4(col,1.);}`;
const CFS=`uniform sampler2D map;uniform vec3 sun;varying vec2 vUv;varying vec3 vN;varying vec3 vP;
void main(){vec3 n=normalize(vN);float d=dot(n,normalize(sun-vP));float a=texture2D(map,vUv).r;
gl_FragColor=vec4(vec3(1.)*(0.04+max(d,0.)),a*smoothstep(-0.25,0.15,d)*0.92+a*0.04);}`;
const HFS=`uniform vec3 color;uniform vec3 sun;uniform float k0;uniform float strength;varying vec3 vN;varying vec3 vP;varying vec2 vUv;
void main(){vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);float c=clamp(-dot(n,V)/k0,0.,1.);float f=pow(c,2.2)*(1.-smoothstep(.92,1.,c)*.0);
float d=dot(-n,normalize(sun-vP));float l=smoothstep(-0.45,0.5,-d);gl_FragColor=vec4(color,f*strength*(0.2+0.8*l));}`;
const AFS=`uniform vec3 color;uniform vec3 sun;uniform float power;uniform float strength;varying vec3 vN;varying vec3 vP;varying vec2 vUv;
void main(){vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);float f=pow(1.-max(dot(n,V),0.),power);
float d=dot(n,normalize(sun-vP));float l=smoothstep(-0.35,0.4,d);gl_FragColor=vec4(color,f*strength*(0.25+0.75*l));}`;


const SUN_FS=NOISE+`uniform sampler2D map;uniform float t;varying vec2 vUv;varying vec3 vN;varying vec3 vP;varying vec3 vO;
void main(){vec3 V=normalize(cameraPosition-vP);float mu=max(dot(normalize(vN),V),0.);vec3 o=normalize(vO);
float big=fbm3(o*2.2+vec3(0.,t*.02,0.));
vec3 q=o*9.+vec3(t*.05,0.,t*.03)+big*1.5;
float gran=snoise(o*55.+vec3(0.,t*.25,0.)+snoise(o*18.+t*.08)*.6);
float g=fbm3(q)*.6+gran*.25;
float spots=smoothstep(.42,.6,fbm3(o*3.1+vec3(7.,t*.01,3.)))*smoothstep(.75,.2,abs(o.y));
vec3 hot=vec3(1.,.96,.82),mid=vec3(1.,.66,.22),cool=vec3(.78,.24,.04);
vec3 c=mix(cool,mid,smoothstep(-.35,.25,g));c=mix(c,hot,smoothstep(.15,.6,g));
c=mix(c,vec3(.32,.08,.02),spots*.85);
c*=0.5+0.5*pow(mu,.5);
float rim=pow(1.-mu,2.5);c+=vec3(1.,.5,.15)*rim*(.7+.5*snoise(o*6.+t*.2));
gl_FragColor=vec4(c*1.2,1.);}`;


const COR_VS=`varying vec2 vU;void main(){vU=uv*2.-1.;vec4 mv=modelViewMatrix*vec4(0.,0.,0.,1.);mv.xy+=position.xy;gl_Position=projectionMatrix*mv;}`;
const COR_FS=NOISE+`uniform float t;uniform float rs;varying vec2 vU;void main(){float r=length(vU);float a=atan(vU.y,vU.x);
float d=max(r-rs,0.);float rays=.55+.45*snoise(vec3(cos(a)*3.,sin(a)*3.,t*.15))+.35*snoise(vec3(cos(a)*9.,sin(a)*9.,t*.3));
float glow=exp(-d*14.)*1.25+exp(-d*6.)*.18*rays;glow*=smoothstep(rs*.9,rs*1.02,r);
vec3 c=mix(vec3(1.,.82,.55),vec3(1.,.97,.9),exp(-d*10.));gl_FragColor=vec4(c*glow,1.)*smoothstep(1.,.85,r);}`;


const RING_VS=`varying vec3 vL;varying vec3 vP;varying vec3 vN;void main(){vL=position;vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const RING_FS=`uniform float t;uniform float rin;uniform float rout;uniform vec3 col;uniform vec3 sun;uniform float segs;varying vec3 vL;varying vec3 vP;varying vec3 vN;
float hh(float x){return fract(sin(x*91.7)*43758.5);}
void main(){float r=length(vL.xy);float u=(r-rin)/(rout-rin);float a=atan(vL.y,vL.x)/6.2831853+.5;
float sg=a*segs;float id=floor(sg);float f=fract(sg);float aa=fwidth(sg)*1.2;float au=fwidth(u)*1.2;
vec3 n=normalize(vN);vec3 L=normalize(sun-vP);vec3 V=normalize(cameraPosition-vP);float lam=abs(dot(n,L));
float spec=pow(max(dot(reflect(-L,n*sign(dot(n,V))),V),0.),24.);
float plate=hh(id*3.1+floor(u*3.));vec3 metal=mix(vec3(.055,.06,.07),vec3(.1,.105,.115),plate);
float seam=max(1.-smoothstep(0.,aa+.02,f),smoothstep(1.-aa-.02,1.,f));seam=max(seam,1.-smoothstep(0.,au+.03,abs(fract(u*3.)-.5)*2.-.94+.94));
float edge=max(1.-smoothstep(0.,au+.04,u),smoothstep(1.-au-.04,1.,u));
vec3 c=metal*(.35+1.1*lam)+vec3(.7,.75,.8)*spec*.35;
c=mix(c,vec3(.02,.022,.026),seam*.8);c+=vec3(.16,.18,.2)*edge*(.4+lam);
float nav=step(.97,hh(id*1.7))*smoothstep(.12,0.,length(vec2(f-.5,u-.5)*vec2(1.,.6)))*step(.5,fract(t*.6+hh(id)));
float win=step(.8,hh(id*7.+floor(u*6.)))*step(.3,u)*step(u,.7)*smoothstep(.06,0.,abs(fract(f*8.)-.5)-.3)*.35;
c+=vec3(1.,.25,.2)*nav*1.6+vec3(1.,.8,.55)*win;
gl_FragColor=vec4(c,1.);}`;


const HAZE_FS=NOISE+`uniform vec3 sun;uniform float t;varying vec3 vN;varying vec3 vP;varying vec3 vO;
void main(){vec3 n=normalize(vN);float d=dot(n,normalize(sun-vP));vec3 o=normalize(vO);
float b=fbm3(vec3(o.x*2.,o.y*9.,o.z*2.)+vec3(t*.01,0.,t*.006));float lit=smoothstep(-.2,.4,d);
float a=clamp(.16+.26*smoothstep(-.2,.6,b),0.,1.)*(.45+.55*lit);vec3 c=mix(vec3(.85,.5,.18),vec3(1.,.78,.45),smoothstep(0.,.6,b))*(.15+lit);
gl_FragColor=vec4(c,a);}`;


const RING2_FS=`uniform float t;uniform float rin;uniform float rout;uniform float bh;uniform vec3 sun;uniform float segs;varying vec3 vL;varying vec3 vP;varying vec3 vN;
float hh(float x){return fract(sin(x*91.7)*43758.5);}
void main(){float r=length(vL.xz);float u=clamp((r-rin)/(rout-rin),0.,1.);float a=atan(vL.z,vL.x)/6.2831853+.5;
float sg=a*segs;float id=floor(sg);float f=fract(sg);float aa=max(fwidth(sg),1e-4);
vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);if(dot(n,V)<0.)n=-n;vec3 L=normalize(sun-vP);
float lam=max(dot(n,L),0.);float spec=pow(max(dot(reflect(-L,n),V),0.),40.);
float side=step(abs(vL.y),bh*.98)*0.+1.-step(bh*.98,abs(vL.y));
float plate=hh(id);vec3 metal=mix(vec3(.16,.17,.19),vec3(.22,.23,.25),plate);
float seam=1.-smoothstep(0.,aa*1.5,min(f,1.-f)*1.);
float lane=1.-smoothstep(0.,fwidth(u)*1.5,abs(u-.5)-.002);
float fr=pow(1.-abs(dot(n,V)),3.);vec3 c=metal*(.75+1.1*lam)+vec3(.9,.92,.95)*spec*.5+vec3(.35,.5,.65)*fr*.35;
c*=1.-seam*.5;c*=1.-lane*.3;
c=mix(c,c*.7+vec3(.05),side*.0);
float nav=step(.93,hh(id*1.7))*step(.6,fract(t*.5+plate))*smoothstep(.08,0.,abs(u-.5))*smoothstep(.2,.0,abs(f-.5));
c+=vec3(1.,.3,.22)*nav*1.4;
gl_FragColor=vec4(c,1.);}`;


const STN_FS=`varying vec3 vN;varying vec3 vP;varying float vH;float hh(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}
void main(){vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);vec3 L=normalize(-vP);float lam=max(dot(n,L),0.);float spec=pow(max(dot(reflect(-L,n),V),0.),30.);
vec3 c=vec3(.3,.32,.35)*(.6+lam)+vec3(1.)*spec*.4;float w=step(.75,hh(floor(vP.xz*900.)))*.0;gl_FragColor=vec4(c,1.);}`;


const RING3_FS=`uniform float t;uniform float rin;uniform float rout;uniform vec3 sun;uniform float op;uniform vec3 cen;uniform float pr;varying vec3 vL;varying vec3 vP;varying vec3 vN;
void main(){float r=length(vL.xy);float u=(r-rin)/(rout-rin);float a=atan(vL.y,vL.x);
vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);if(dot(n,V)<0.)n=-n;vec3 L=normalize(sun-vP);
vec3 dC=vP-cen;float along=dot(dC,L);float perp=length(dC-L*along);float day=1.-step(along,0.)*(1.-smoothstep(pr*.92,pr*1.08,perp));
float spec=pow(max(dot(reflect(-L,n),V),0.),12.);float lam=abs(dot(n,L));
float prof=smoothstep(0.,.18,u)*smoothstep(1.,.82,u);
vec3 metal=vec3(.62,.66,.72)*(.25+.9*lam)*day+vec3(1.)*spec*day*.8;
float k=a*1600.;float fw=fwidth(k);float dash=mix(.5,.5+.5*sin(k),clamp(1.-fw*.6,0.,1.));
float strip=smoothstep(.12,0.,abs(u-.5));
vec3 lights=vec3(1.,.78,.45)*strip*(.55+.45*dash)*(1.-day)*1.4+vec3(.6,.85,1.)*strip*.12;
vec3 c=metal+lights;float al=prof*op*clamp(.55+.45*day+strip*(1.-day),0.,1.);
gl_FragColor=vec4(c,al);}`;

function glowTex(inner,outer){const c=document.createElement('canvas');c.width=c.height=256;const g=c.getContext('2d');
  const r=g.createRadialGradient(128,128,0,128,128,128);r.addColorStop(0,inner);r.addColorStop(.25,outer);r.addColorStop(1,'rgba(0,0,0,0)');
  g.fillStyle=r;g.fillRect(0,0,256,256);const t=new T.CanvasTexture(c);return t}


const STR_VS=`varying vec3 vN;varying vec3 vP;varying float vH;
void main(){vec4 lp=instanceMatrix*vec4(position,1.);vH=position.y;vec4 w=modelMatrix*lp;vP=w.xyz;vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const STR_FS=`uniform vec3 color;uniform float t;uniform float base;uniform float vis;varying vec3 vN;varying vec3 vP;varying float vH;
void main(){vec3 V=normalize(cameraPosition-vP);float f=pow(1.-abs(dot(normalize(vN),V)),2.);
float scan=base>0.3?0.6+0.4*sin(vH*40.-t*2.5):1.;float fade=base>0.3?pow(1.-clamp(vH,0.,1.),1.6)*(0.85+0.15*sin(t*4.+vP.x*30.)):1.;gl_FragColor=vec4(color*(base>0.3?1.3:(base+f*.75))*scan*fade,1.)*vis;}`;
const PT_VS=`attribute vec4 prm;attribute float kind;uniform float t;uniform float scale;uniform float ringR;uniform float planetR;varying float vA;varying float vK;varying float vPh;
void main(){vec3 q;float a;vPh=prm.z;
 if(kind<0.5){a=prm.z+t*prm.w;q=vec3(cos(a),0.,sin(a))*prm.x;float c=cos(prm.y),s=sin(prm.y);q=vec3(q.x,q.y*c-q.z*s,q.y*s+q.z*c);vA=1.;}
 else if(kind<1.5){float f=fract(prm.z+t*prm.w);float r=mix(planetR*1.01,ringR,f);vec3 d=normalize(vec3(cos(prm.x)*cos(prm.y),sin(prm.y),sin(prm.x)*cos(prm.y)));q=d*r;vA=smoothstep(0.,.08,f)*(1.-smoothstep(.9,1.,f));}
 else{vec3 d=normalize(vec3(cos(prm.x)*cos(prm.y),sin(prm.y),sin(prm.x)*cos(prm.y)));q=d*prm.w;vA=step(.55,fract(t*.7+prm.z));}
 vK=kind;vec4 mv=modelViewMatrix*vec4(q,1.);gl_PointSize=clamp((kind>1.5?1.3:(kind<.5?1.25:.8))*scale/-mv.z,kind<.5?2.6:1.5,10.);gl_Position=projectionMatrix*mv;}`;
const PT_FS=`uniform vec3 c1;uniform vec3 c2;uniform float vis;varying float vA;varying float vK;
uniform float t;varying float vPh;void main(){vec2 d=gl_PointCoord-.5;float r=length(d);float core=smoothstep(.22,.06,r);float halo=pow(smoothstep(.5,0.,r),2.5)*.45;vec3 c=vK>1.5?vec3(1.,.35,.3):(vK>0.5?c2:c1);float blink=step(.92,fract(t*.5+vPh));gl_FragColor=vec4(c*(core+halo)+vec3(1.,.3,.25)*blink*smoothstep(.3,0.,r)*.8,1.)*vA*vis;}`;

function sph(lat,lon){const ph=(lon+180)/360*Math.PI*2,th=(90-lat)/180*Math.PI;return new THREE.Vector3(-Math.cos(ph)*Math.sin(th),Math.cos(th),Math.sin(ph)*Math.sin(th))}
function rnd(seed){let x=seed*9301+49297;return()=>{x=(x*9301+49297)%233280;return x/233280}}


function boxGeo(parts){const pos=[],nor=[];parts.forEach(([sx,sy,sz,ox,oy,oz])=>{const g=new THREE.BoxGeometry(sx,sy,sz).toNonIndexed();g.translate(ox,oy,oz);pos.push(...g.attributes.position.array);nor.push(...g.attributes.normal.array)});
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g}
const SAT_FS=`uniform float t;varying vec3 vN;varying vec3 vP;varying float vH;void main(){vec3 n=normalize(vN);vec3 L=normalize(-vP);vec3 V=normalize(cameraPosition-vP);
 float d=max(dot(n,L),0.);float f=pow(1.-abs(dot(n,V)),2.);float flash=pow(max(sin(t*1.1+vP.x*37.+vP.z*23.),0.),60.);
 vec3 c=vec3(.16,.18,.22)*(.3+.9*d)+vec3(.45,.9,1.)*f*.9+vec3(1.)*flash*2.5;gl_FragColor=vec4(c,1.);}`;


const MET_VS=`varying vec3 vN;varying vec3 vP;varying vec2 vUv;void main(){vUv=uv;vec4 w=modelMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
const MET_FS=`uniform float t;uniform vec3 base;uniform float win;uniform vec2 wrep;uniform float glow;varying vec3 vN;varying vec3 vP;varying vec2 vUv;
float hh(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}
void main(){vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);if(dot(n,V)<0.)n=-n;vec3 L=normalize(-vP);
float lam=max(dot(n,L),0.);float spec=pow(max(dot(reflect(-L,n),V),0.),32.);float fr=pow(1.-abs(dot(n,V)),3.);
vec3 c=base*(.22+1.05*lam)+vec3(1.)*spec*.6+vec3(.4,.6,.8)*fr*.25;
vec2 g=vUv*wrep;vec2 gi=floor(g),gf=fract(g);float w=win*step(.45,hh(gi))*step(.25,gf.x)*step(gf.x,.75)*step(.3,gf.y)*step(gf.y,.7);
c+=vec3(1.,.85,.6)*w*(1.2-lam*.6)+vec3(.55,.85,1.)*glow;gl_FragColor=vec4(c,1.);}`;

function buildFuture(T,b,ft,MOBILE,shared){
  const w=b.w,r=w.r,F=w.future,R=rnd(w.id.length*7+w.r*100);const parts=[];
  const up=new T.Vector3(0,1,0),m4=new T.Matrix4(),qq=new T.Quaternion(),sc=new T.Vector3(),pos=new T.Vector3();
  const strMat=(col,base)=>{const m=new T.ShaderMaterial({vertexShader:STR_VS,fragmentShader:STR_FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{color:{value:new T.Color(col)},t:shared.t,base:{value:base},vis:shared.vis[w.id]}});return m};
  const beacons=[];
  // 3D extras per world
  if(F.platforms){ // Titan: floating hex platforms hovering over the sea, glowing undersides
    const g=new T.CylinderGeometry(1,1,.12,6,1,false);const list=[];
    F.platforms.forEach(([la,lo,n])=>{for(let i=0;i<n;i++){const d=2+R()*6,a=R()*6.283;list.push(sph(la+Math.sin(a)*d,lo+Math.cos(a)*d))}});
    const im=new T.InstancedMesh(g,strMat('#ffcf8a',.22),list.length);
    list.forEach((nn,i)=>{qq.setFromUnitVectors(up,nn);const s=r*(.045+R()*.03);sc.set(s,s,s);pos.copy(nn).multiplyScalar(r*(1.03+R()*.04));m4.compose(pos,qq,sc);im.setMatrixAt(i,m4);beacons.push([nn,1.03+.02])});
    b.mesh.add(im);parts.push(im)}
  if(F.pads){F.pads.forEach(([la,lo])=>{for(let j=0;j<4;j++){const nn=sph(la+(R()-.5)*3,lo+(R()-.5)*3);beacons.push([nn,1.004])}})}
  if(F.towers){ // Mars: slender arcology towers (light columns) in each city
    const g=new T.CylinderGeometry(.35,1,1,6,1,true);g.translate(0,.5,0);const list=[];
    F.bases.forEach(([la,lo,rad])=>{for(let i=0;i<F.towers;i++){const d=rad*57.3*.7*Math.sqrt(R()),a=R()*6.283;list.push([sph(la+Math.sin(a)*d,lo+Math.cos(a)*d/Math.max(.3,Math.cos(la*Math.PI/180))),.5+R()])}});
    const im=new T.InstancedMesh(g,strMat('#ffe0b0',.35),list.length);
    list.forEach(([nn,k],i)=>{qq.setFromUnitVectors(up,nn);const h=r*.1*k;sc.set(h*.03,h,h*.03);pos.copy(nn).multiplyScalar(r*.996);m4.compose(pos,qq,sc);im.setMatrixAt(i,m4);if(i%4===0)beacons.push([nn,1+.1*k])});
    b.mesh.add(im);parts.push(im)}

  const metMat=(base,win,wrep,glow)=>new T.ShaderMaterial({vertexShader:MET_VS,fragmentShader:MET_FS,side:T.DoubleSide,uniforms:{t:shared.t,base:{value:new T.Color(base)},win:{value:win},wrep:{value:new T.Vector2(wrep[0],wrep[1])},glow:{value:glow||0}}});
  // rotating wheel station(s) on inclined orbits
  if(F.wheels){b.wheelTick=[];b.wheelSt=[];F.wheels.forEach(([rad,inc,ph,sz],wi)=>{const S=r*sz;const st=new T.Group();
    const torus=new T.Mesh(new T.TorusGeometry(S,S*.12,28,128),metMat('#b4bcc7',1,[64,4]));st.add(torus);
    const rim=new T.Mesh(new T.TorusGeometry(S*1.08,S*.018,8,128),metMat('#7f8894',0,[1,1],.05));st.add(rim);
    const torus2=new T.Mesh(new T.TorusGeometry(S*.6,S*.045,14,96),metMat('#98a1ae',1,[36,2]));st.add(torus2);
    for(let k=0;k<8;k++){const sp=new T.Mesh(new T.CylinderGeometry(S*.022,S*.022,S*2,8),metMat('#a0a9b4',0,[1,1]));sp.rotation.z=Math.PI/2;sp.rotation.y=k*Math.PI/8;st.add(sp)}
    const hub=new T.Mesh(new T.CylinderGeometry(S*.15,S*.15,S*1.1,20),metMat('#ccd2da',1,[14,8]));hub.rotation.x=Math.PI/2;st.add(hub);
    for(const z of [-1,1]){const pw=new T.Mesh(new T.BoxGeometry(S*2.4,S*.015,S*.42),metMat('#1d2c46',0,[1,1]));pw.position.z=z*S*.62;st.add(pw);
      const rad2=new T.Mesh(new T.BoxGeometry(S*.5,S*.01,S*.9),metMat('#d9dee5',0,[1,1],.05));rad2.position.z=z*S*.62;rad2.rotation.z=Math.PI/2;st.add(rad2)}
    const dock=new T.Mesh(new T.CylinderGeometry(S*.06,S*.09,S*.5,12),metMat('#e2e6eb',1,[6,3],.1));dock.rotation.x=Math.PI/2;dock.position.z=-S*.8;st.add(dock);
    const ship=new T.Mesh(new T.BoxGeometry(S*.12,S*.08,S*.38),metMat('#c5ccd5',1,[3,6]));ship.position.z=-S*1.15;st.add(ship);
    st.rotation.x=Math.PI/2;const holder=new T.Group();holder.rotation.x=inc;holder.rotation.y=wi*1.3;holder.add(st);b.grp.add(holder);parts.push(holder);
    const W={a:ph,holder,base:ph};b.wheelSt.push(W);const om=.025*Math.pow(rad/1.4,-1.5);
    b.wheelTick.push(dt=>{W.a+=dt*om;st.position.set(Math.cos(W.a)*r*rad,0,-Math.sin(W.a)*r*rad);torus.rotation.z+=dt*.08;torus2.rotation.z+=dt*.08;rim.rotation.z+=dt*.08})})}
  // orbital ring + elevators (geostationary: rides with the planet's spin)
  let ringR=1.35;
  if(F.ring){ringR=F.ring;const rr=r*ringR;
    const bw=r*(F.ringW||.018);
    const mkBand=(R0,W,op)=>{const m=new T.ShaderMaterial({vertexShader:RING_VS,fragmentShader:RING3_FS,transparent:true,side:T.DoubleSide,depthWrite:false,extensions:{derivatives:true},
        uniforms:{t:shared.t,rin:{value:R0-W},rout:{value:R0+W},sun:{value:new T.Vector3()},op:{value:op},cen:b.cenU||(b.cenU={value:new T.Vector3()}),pr:{value:r}}});
      const me=new T.Mesh(new T.RingGeometry(R0-W,R0+W,MOBILE?360:720,1),m);me.rotation.x=-Math.PI/2;b.mesh.add(me);parts.push(me)};
    mkBand(rr,bw,1.);mkBand(rr*1.012,bw*.25,.55);mkBand(rr*.988,bw*.25,.55);
    const n=(F.elevators||[]).length,g=boxGeo([[1,1,1,0,0,0],[.6,1.6,.6,0,0,0],[1.4,.25,1.4,0,.75,0],[1.4,.25,1.4,0,-.75,0]]),im=new T.InstancedMesh(g,new T.ShaderMaterial({vertexShader:STR_VS,fragmentShader:STN_FS}),Math.max(1,n));
    (F.elevators||[]).forEach((lo,i)=>{const d=sph(0,lo);pos.copy(d).multiplyScalar(rr);qq.setFromUnitVectors(new T.Vector3(1,0,0),d);sc.set(bw*3.,bw*2.2,bw*3.);m4.compose(pos,qq,sc);im.setMatrixAt(i,m4)});
    b.mesh.add(im);parts.push(im);
    const lp=[];(F.elevators||[]).forEach(lo=>{const d=sph(0,lo);lp.push(d.clone().multiplyScalar(r),d.clone().multiplyScalar(rr))});
    if(lp.length){const ln=new T.LineSegments(new T.BufferGeometry().setFromPoints(lp),new T.LineBasicMaterial({color:'#bff0ff',transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false}));b.mesh.add(ln);parts.push(ln)}
  }
  // traffic: orbital ships (group frame) + lifts (surface frame) + beacons
  const mkPts=(arr,parent)=>{const g=new T.BufferGeometry();const P=new Float32Array(arr.length*4),K=new Float32Array(arr.length),X=new Float32Array(arr.length*3);
    arr.forEach((a,i)=>{P.set(a.slice(0,4),i*4);K[i]=a[4]});g.setAttribute('position',new T.BufferAttribute(X,3));g.setAttribute('prm',new T.BufferAttribute(P,4));g.setAttribute('kind',new T.BufferAttribute(K,1));
    const m=new T.ShaderMaterial({vertexShader:PT_VS,fragmentShader:PT_FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,
      uniforms:{t:shared.t,scale:shared.ptScale,ringR:{value:ringR},planetR:{value:r},c1:{value:new T.Color(F.shipColor||'#ffe7b8')},c2:{value:new T.Color('#9fe8ff')},vis:shared.vis[w.id]}});
    const p=new T.Points(g,m);p.frustumCulled=false;parent.add(p);parts.push(p);return p};
  const ships=[],nS=Math.round((F.ships!=null?F.ships:60)*(MOBILE?.35:.5));
  for(let i=0;i<nS;i++){const lane=R();ships.push([r*(1.15+lane*.6),(R()-.5)*1.2,R()*6.283,(R()<.5?-1:1)*(.025+R()*.04)/(1+lane),0])}
  if(ships.length){const p=mkPts(ships,b.grp);p.rotation.z=w.tilt||0}
  const lifts=[];
  
  if(F.bases&&F.lifts){F.bases.forEach(([la,lo])=>{const d=sph(la,lo);const lon=Math.atan2(d.z,d.x),lat=Math.asin(d.y);for(let j=0;j<F.lifts;j++)lifts.push([lon,lat,R(),.008+R()*.008,1])})}
  beacons.forEach(([nn,h])=>lifts.push([Math.atan2(nn.z,nn.x),Math.asin(nn.y),R(),r*h*1.004,2]));
  if(lifts.length){const p=mkPts(lifts,b.mesh);p.material.uniforms.ringR.value=F.ring?ringR*r:1.6*r}
  if(F.sats){const n=Math.round(F.sats*(MOBILE?.6:1));const g=boxGeo([[.35,.22,1.6,0,0,0],[1.5,.03,.5,-.9,0,-.2],[1.5,.03,.5,.9,0,-.2],[.1,.1,.5,0,0,.95]]);
    const im=new T.InstancedMesh(g,new T.ShaderMaterial({vertexShader:STR_VS,fragmentShader:SAT_FS,uniforms:{t:shared.t}}),n);im.frustumCulled=false;
    const orb=[];for(let i=0;i<n;i++)orb.push({rad:r*(1.18+R()*.75),inc:(R()-.5)*1.6,node:R()*6.283,a:R()*6.283,sp:(.012+R()*.02)*(R()<.5?-1:1)/(1+R()),sz:r*(.009+R()*.006)});
    b.grp.add(im);parts.push(im);const mm=new T.Matrix4(),q=new T.Quaternion(),e=new T.Euler(),p=new T.Vector3(),sc=new T.Vector3();
    const AX=new T.Vector3(1,0,0),AY=new T.Vector3(0,1,0);b.satTick=(dt)=>{orb.forEach((o,i)=>{o.a+=dt*o.sp;p.set(Math.cos(o.a)*o.rad,0,Math.sin(o.a)*o.rad);p.applyAxisAngle(AX,o.inc).applyAxisAngle(AY,o.node);
      e.set(o.inc,o.node-o.a+(o.sp>0?0:Math.PI),0);q.setFromEuler(e);sc.setScalar(o.sz);mm.compose(p,q,sc);im.setMatrixAt(i,mm)});im.instanceMatrix.needsUpdate=true};b.satTick(0)}
  return parts;
}

function mount(box,cfg){
  const shared0={t:{value:0}};
  const W=()=>box.clientWidth,H=()=>box.clientHeight;
  const renderer=new T.WebGLRenderer({antialias:!MOBILE,alpha:false,powerPreference:'high-performance'});renderer.setClearColor(0x050a16,1);
  renderer.setPixelRatio(Math.min(devicePixelRatio,MOBILE?1.5:1.5));
  renderer.setSize(W(),H());renderer.outputEncoding=T.sRGBEncoding;
  box.appendChild(renderer.domElement);renderer.domElement.className='solar-cv';
  const scene=new T.Scene();
  const cam=new T.PerspectiveCamera(MOBILE?52:38,W()/H(),.05,600);
  const loader=new T.TextureLoader();const sfx=MOBILE?'_m':'';
  const tx=(n,full)=>{const t=loader.load(cfg.tex+n+(full?'':sfx)+'.webp');t.encoding=T.sRGBEncoding;t.anisotropy=4;return t};
  const lin=(n)=>{const t=loader.load(cfg.tex+n+sfx+'.webp');return t};
  const black=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1);

  // stars
  {const n=MOBILE?900:1800,g=new T.BufferGeometry(),p=new Float32Array(n*3),c=new Float32Array(n*3);
   for(let i=0;i<n;i++){const u=Math.random()*2-1,a=Math.random()*6.283,r=220+Math.random()*120;const s=Math.sqrt(1-u*u);
     p.set([r*s*Math.cos(a),r*u,r*s*Math.sin(a)],i*3);const k=.55+Math.random()*.45,w=Math.random();c.set([k*(w>.8?1:.85),k*.9,k*(w<.2?1:.95)],i*3)}
   g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));
   scene.add(new T.Points(g,new T.PointsMaterial({size:MOBILE?1.1:.9,vertexColors:true,transparent:true,opacity:.85,depthWrite:false})))}

  // sun
  const sunPos=new T.Vector3(0,0,0);
  const sunGrp=new T.Group();scene.add(sunGrp);
  const sunMat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:SUN_FS,uniforms:{map:{value:tx('sun',true)},t:{value:0}}});
  const sunMesh=new T.Mesh(new T.SphereGeometry(2.2,64,40),sunMat);sunGrp.add(sunMesh);
  // corona (view-facing shader quad)
  {const R=2.2*3.2;const cg=new T.PlaneGeometry(R*2,R*2);const cm=new T.ShaderMaterial({vertexShader:COR_VS,fragmentShader:COR_FS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{t:shared0.t,rs:{value:2.2/R}}});
   const co=new T.Mesh(cg,cm);co.frustumCulled=false;co.renderOrder=-1;sunGrp.add(co)}
  // first Dyson-swarm: hexagonal mirror collectors + partial solar-sail rings
  const swarm=new T.Group();scene.add(swarm);
  {const SAIL_FS=`uniform float t;uniform float rin;uniform float rout;varying vec3 vL;varying vec3 vP;varying vec3 vN;
   vec2 hx(vec2 p){vec2 s=vec2(1.,1.732);vec2 a=mod(p,s)-s*.5;vec2 b=mod(p-s*.5,s)-s*.5;return dot(a,a)<dot(b,b)?a:b;}
   void main(){float r=length(vL.xy);float u=(r-rin)/(rout-rin);float an=atan(vL.y,vL.x);vec2 q=vec2(an*r*9.,u*5.);vec2 h=hx(q);
    float e=max(dot(abs(h),vec2(.5,.866)),abs(h.x));float cell=smoothstep(.47,.43,e);
    vec3 V=normalize(cameraPosition-vP);vec3 L=normalize(-vP);float face=abs(dot(normalize(vN),L));float glint=pow(max(dot(reflect(-L,normalize(vN)),V),0.),20.);
    vec3 c=mix(vec3(.25,.17,.08),vec3(1.,.8,.45)*(.6+.5*face)+vec3(1.,.95,.8)*glint*1.5,cell);
    float edge=smoothstep(.06,0.,u)+smoothstep(.94,1.,u);c+=vec3(1.,.8,.45)*edge;
    gl_FragColor=vec4(c,.92);}`;
   const sails=[[2.95,.22,0,3.2],[3.3,-.35,2.2,2.8],[3.65,.55,4.4,2.4]];
   sails.forEach(([rr,inc,st,len])=>{const w=.07;const m=new T.ShaderMaterial({vertexShader:RING_VS,fragmentShader:SAIL_FS,transparent:true,side:T.DoubleSide,uniforms:{t:shared0.t,rin:{value:rr-w},rout:{value:rr+w}}});
     const mesh=new T.Mesh(new T.RingGeometry(rr-w,rr+w,MOBILE?160:300,1,st,len),m);const g=new T.Group();mesh.rotation.x=-Math.PI/2;g.add(mesh);g.rotation.z=inc;swarm.add(g)});
   // large hex mirrors
   const PAN_VS=`varying vec3 vN;varying vec3 vP;varying vec3 vL;void main(){vL=position;vec4 w=modelMatrix*instanceMatrix*vec4(position,1.);vP=w.xyz;vN=normalize(mat3(modelMatrix)*mat3(instanceMatrix)*normal);gl_Position=projectionMatrix*viewMatrix*w;}`;
   const PAN_FS=`varying vec3 vN;varying vec3 vP;varying vec3 vL;float hh(vec2 p){return fract(sin(dot(p,vec2(12.9,78.2)))*43758.5);}
    void main(){vec3 n=normalize(vN);vec3 V=normalize(cameraPosition-vP);vec3 L=normalize(-vP);vec3 R=reflect(-L,n);
    float face=abs(dot(n,L));float glint=pow(max(dot(R,V),0.),18.);
    vec2 p=vL.xz;float e=max(dot(abs(p),vec2(.5,.866)),abs(p.x));
    vec2 q=p*3.2;vec2 s=vec2(1.,1.732);vec2 a=mod(q,s)-s*.5;vec2 b=mod(q-s*.5,s)-s*.5;vec2 h=dot(a,a)<dot(b,b)?a:b;float he=max(dot(abs(h),vec2(.5,.866)),abs(h.x));
    float facet=hh(q-h);float cellLine=smoothstep(.42,.47,he);float frame=smoothstep(.78,.82,e);
    vec3 gold=mix(vec3(.95,.72,.35),vec3(1.,.88,.6),facet)*(.45+.6*face)+vec3(1.,.97,.9)*glint*(1.2+facet);
    vec3 c=mix(gold,vec3(.08,.07,.06),cellLine*.85);c=mix(c,vec3(.18,.16,.14)+vec3(.9,.8,.6)*glint*.5,frame);
    if(abs(vL.y)<.019)c=vec3(.12,.1,.08)*(.5+face);
    gl_FragColor=vec4(c,1.);}`;
   const g=new T.CylinderGeometry(1,1,.04,6,1);const n=MOBILE?8:14;const im=new T.InstancedMesh(g,new T.ShaderMaterial({vertexShader:PAN_VS,fragmentShader:PAN_FS}),n);
   const mm=new T.Matrix4(),q=new T.Quaternion(),sc=new T.Vector3(),ps=new T.Vector3();
   for(let i=0;i<n;i++){const a=i/n*6.283*2.+Math.sin(i)*.3,rad=2.8+(i%5)*.2,inc=((i*37)%11-5)*.1;ps.set(Math.cos(a)*rad,0,Math.sin(a)*rad).applyAxisAngle(new T.Vector3(1,0,0),inc);
     q.setFromUnitVectors(new T.Vector3(0,1,0),ps.clone().normalize());const s=.1+(i%3)*.03;sc.set(s,s,s);mm.compose(ps,q,sc);im.setMatrixAt(i,mm)}
   swarm.add(im)}
  
  

  const segs=MOBILE?48:72;
  const bodies=[];
  function makeBody(w){
    const grp=new T.Group();scene.add(grp);
    const mat=new T.ShaderMaterial({vertexShader:VS,fragmentShader:FS,uniforms:{
      map:{value:tx(w.key)},night:{value:w.lights?lin(w.lights):black},spec:{value:w.spec?lin(w.spec):black},
      sun:{value:sunPos},lightGain:{value:w.lightGain||1.6},hasSpec:{value:w.spec?1:0},ambient:{value:w.ambient||.035},
      lightTint:{value:new T.Color(w.tint||'#ffd9a0')},t:{value:0},style:{value:w.style||0},texLight:{value:w.texLight!=null?w.texLight:1},
      bases:{value:Array.from({length:16},(_,i)=>{const F=w.future,cs=F&&F.bases&&F.bases[i];if(!cs)return new T.Vector4(0,1,0,0);const v=sph(cs[0],cs[1]);return new T.Vector4(v.x,v.y,v.z,cs[2]||.1)})},
      nBases:{value:w.future&&w.future.bases?Math.min(16,w.future.bases.length):0},
      la:{value:Array.from({length:6},(_,i)=>{const l=w.future&&w.future.links&&w.future.links[i];return l?sph(l[0],l[1]):new T.Vector3(0,1,0)})},
      lb:{value:Array.from({length:6},(_,i)=>{const l=w.future&&w.future.links&&w.future.links[i];return l?sph(l[2],l[3]):new T.Vector3(0,1,0)})},
      nLinks:{value:w.future&&w.future.links?Math.min(6,w.future.links.length):0},
      cA:{value:new T.Color((w.future&&w.future.lineColor)||'#5fd8ff')},cB:{value:new T.Color((w.future&&w.future.coreColor)||'#ffd27a')}}});
    const mesh=new T.Mesh(new T.SphereGeometry(w.r,segs,segs/2),mat);mesh.rotation.z=w.tilt||0;grp.add(mesh);
    let clouds=null;if(w.clouds){clouds=new T.Mesh(new T.SphereGeometry(w.r*1.012,segs,segs/2),new T.ShaderMaterial({vertexShader:VS,fragmentShader:CFS,transparent:true,depthWrite:false,uniforms:{map:{value:lin(w.clouds)},sun:{value:sunPos}}}));grp.add(clouds)}
    if(w.haze){const bl=new T.Mesh(new T.SphereGeometry(w.r*1.035,segs,segs/2),new T.ShaderMaterial({vertexShader:VS,fragmentShader:AFS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{color:{value:new T.Color('#7f9cff')},sun:{value:sunPos},power:{value:4.},strength:{value:.9}}}));grp.add(bl);const hz=new T.Mesh(new T.SphereGeometry(w.r*1.022,segs,segs/2),new T.ShaderMaterial({vertexShader:VS,fragmentShader:HAZE_FS,transparent:true,depthWrite:false,uniforms:{sun:{value:sunPos},t:shared0.t}}));grp.add(hz)}
    let atmo=null;if(w.atmo){const sc=w.atmoScale||1.09;atmo=new T.Mesh(new T.SphereGeometry(w.r*sc,segs,segs/2),new T.ShaderMaterial({vertexShader:VS,fragmentShader:HFS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.BackSide,uniforms:{color:{value:new T.Color(w.atmo)},sun:{value:sunPos},k0:{value:Math.sqrt(1-1/(sc*sc))},strength:{value:(w.atmoStr||1.4)*.75}}}));grp.add(atmo);
      const rim=new T.Mesh(new T.SphereGeometry(w.r*1.004,segs,segs/2),new T.ShaderMaterial({vertexShader:VS,fragmentShader:AFS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{color:{value:new T.Color(w.atmo)},sun:{value:sunPos},power:{value:w.atmoPow||2.6},strength:{value:(w.atmoStr||1.4)*.55}}}));grp.add(rim)}
    // orbit line
    let orbit=null;if(w.orbit&&!w.parent){const pts=[];for(let i=0;i<=256;i++){const a=i/256*6.283;pts.push(new T.Vector3(Math.cos(a)*w.orbit,0,Math.sin(a)*w.orbit))}
      orbit=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xe8c27a,transparent:true,opacity:.16}));scene.add(orbit)}
    const b={w,grp,mesh,mat,clouds,atmo,orbit,ang:w.phase||0,hi:false};bodies.push(b);return b}

  const byId={};cfg.worlds.forEach(w=>{byId[w.id]=makeBody(w)});
  const sunBody={w:Object.assign(cfg.sun||{name:'Sun'},{id:'sun',r:2.2,interactive:true}),grp:sunGrp,mesh:sunMesh,isSun:true,hi:false};byId.sun=sunBody;
  const pickables=bodies.concat(cfg.sun?[sunBody]:[]);
  const shared={t:shared0.t,ptScale:{value:(MOBILE?15:19)*Math.min(devicePixelRatio,MOBILE?1.5:1.75)},vis:{}};
  bodies.forEach(b=>{shared.vis[b.w.id]={value:1};if(b.w.future)buildFuture(T,b,null,MOBILE,shared)});
  // moon orbit line follows parent
  bodies.forEach(b=>{if(b.w.parent){const p=byId[b.w.parent];const pts=[];for(let i=0;i<=128;i++){const a=i/128*6.283;pts.push(new T.Vector3(Math.cos(a)*b.w.orbit,0,Math.sin(a)*b.w.orbit))}
    b.orbit=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xe8c27a,transparent:true,opacity:.14}));p.grp.add(b.orbit)}});

  bodies.forEach(b=>{if(b.w.parent)byId[b.w.parent].grp.add(b.grp)});

  // shuttles commuting Earth <-> Moon: slim hulls with engine glow and fading trails
  let shuttleTick=null;
  if(cfg.shuttles&&byId.earth&&byId.moon){const E=byId.earth,M=byId.moon,N=MOBILE?4:7,TR=46;
    const hull=boxGeo([[.25,.18,1.6,0,0,0],[1.1,.04,.5,0,0,.3],[.3,.3,.3,0,0,-.85]]);
    const hm=new T.InstancedMesh(hull,new T.ShaderMaterial({vertexShader:STR_VS,fragmentShader:SAT_FS,uniforms:{t:shared0.t}}),N);hm.frustumCulled=false;scene.add(hm);
    const tg=new T.BufferGeometry();const tp=new Float32Array(N*TR*3),ta=new Float32Array(N*TR);tg.setAttribute('position',new T.BufferAttribute(tp,3));tg.setAttribute('al',new T.BufferAttribute(ta,1));
    const tm=new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{sc:{value:(MOBILE?16:22)*Math.min(devicePixelRatio,1.5)}},
      vertexShader:`attribute float al;uniform float sc;varying float vA;void main(){vA=al;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=clamp(sc*(.5+al*1.2)/-mv.z,1.5,16.);gl_Position=projectionMatrix*mv;}`,
      fragmentShader:`varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);vec3 c=mix(vec3(.5,.8,1.),vec3(1.,.95,.85),vA);gl_FragColor=vec4(c*a*vA*2.2,1.);}`});
    const tr=new T.Points(tg,tm);tr.frustumCulled=false;scene.add(tr);
    const S=[];for(let i=0;i<N;i++)S.push({ph:i/N,sp:.035+Math.random()*.02,back:i%2,arc:(Math.random()-.5)*1.2,lift:.3+Math.random()*.5});
    const e=new T.Vector3(),m=new T.Vector3(),a=new T.Vector3(),bq=new T.Vector3(),up=new T.Vector3(0,1,0),side=new T.Vector3(),p=new T.Vector3(),p2=new T.Vector3(),q=new T.Quaternion(),mm=new T.Matrix4(),sc=new T.Vector3(),fw=new T.Vector3(0,0,1);
    const at=(o,u,out)=>{let s=o.back?1-u:u;a.copy(m).sub(e);const L=a.length();a.normalize();side.crossVectors(a,up).normalize();
      out.copy(e).addScaledVector(a,E.w.r*1.25+(L-E.w.r*1.25-M.w.r*1.4)*s).addScaledVector(up,Math.sin(Math.PI*s)*L*.18*o.lift).addScaledVector(side,Math.sin(Math.PI*s)*L*.2*o.arc);return out};
    shuttleTick=(dt)=>{E.mesh.getWorldPosition(e);M.mesh.getWorldPosition(m);
      S.forEach((o,i)=>{o.ph=(o.ph+dt*o.sp)%1;const u=o.ph;at(o,u,p);at(o,Math.min(1,u+.01),p2);
        const fade=Math.min(1,u*8,(1-u)*8);q.setFromUnitVectors(fw,p2.clone().sub(p).normalize());sc.setScalar(E.w.r*.045*fade);mm.compose(p,q,sc);hm.setMatrixAt(i,mm);
        for(let k=0;k<TR;k++){const uu=Math.max(0,u-k*.007);at(o,uu,bq);tp.set([bq.x,bq.y,bq.z],(i*TR+k)*3);ta[i*TR+k]=Math.pow(1-k/TR,1.5)*fade*(k===0?1.:.6)}});
      hm.instanceMatrix.needsUpdate=true;tg.attributes.position.needsUpdate=true;tg.attributes.al.needsUpdate=true}}

  const hiCache={};
  if(MOBILE){(window.requestIdleCallback||setTimeout)(()=>{cfg.worlds.forEach(w=>{const t=loader.load(cfg.tex+w.key+'.webp',tt=>{renderer.initTexture&&renderer.initTexture(tt)});t.encoding=T.sRGBEncoding;t.anisotropy=4;hiCache[w.key]=t})},{timeout:4000})}
  // camera rig
  const overview={pos:new T.Vector3(0,MOBILE?26:17,MOBILE?40:31),look:new T.Vector3(MOBILE?0:-9.5,0,MOBILE?1.5:1)};
  const camPos=overview.pos.clone(),camLook=overview.look.clone();
  const tgtPos=camPos.clone(),tgtLook=camLook.clone();
  cam.position.copy(camPos);cam.lookAt(camLook);
  let focus=null,speed=1,targetSpeed=1;
  const fromPos=camPos.clone(),fromLook=camLook.clone();let tw=1,twDur=3.6;
  const ease=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2;

  function worldPos(b,out){return b.mesh.getWorldPosition(out)}
  const tmp=new T.Vector3(),tmp2=new T.Vector3();
  function placeCamFor(b){
    if(b.isSun){const r=2.2;tgtPos.set(r*1.2,r*1.5,r*(MOBILE?5.6:4.6));tgtLook.set(0,0,0);
      if(!MOBILE){const right=new T.Vector3().subVectors(tgtLook,tgtPos).cross(new T.Vector3(0,1,0)).normalize();tgtLook.add(right.multiplyScalar(r*.75))}else tgtLook.y-=r*.15;return}
    worldPos(b,tmp);const r=b.w.r;const dist=r*(MOBILE?4.3:5.2);
    // view from the sunlit side, slightly toward terminator so city lights show
    const toSun=tmp2.copy(sunPos).sub(tmp).normalize();
    const side=new T.Vector3(-toSun.z,0,toSun.x);
    const lw=b.w.light||[.55,.85];const dir=toSun.clone().multiplyScalar(lw[0]).add(side.multiplyScalar(lw[1])).normalize();dir.y=b.w.camY||.18;dir.normalize();if(b.w.ringView){const nq=new T.Quaternion();b.mesh.getWorldQuaternion(nq);const nn=new T.Vector3(0,1,0).applyQuaternion(nq);dir.addScaledVector(nn,b.w.ringView).normalize()}b.camAng=Math.atan2(dir.z,dir.x);
    tgtPos.copy(tmp).add(dir.multiplyScalar(dist));
    tgtLook.copy(tmp);
    if(!MOBILE){const right=new T.Vector3().subVectors(tgtLook,tgtPos).cross(new T.Vector3(0,1,0)).normalize();tgtLook.add(right.multiplyScalar(r*.6))} // planet sits left of center, caption on the right
    else tgtLook.y-=r*.1; // planet sits higher on phones, caption below
  }
  function setFocus(id){
    const b=id?byId[id]:null;if(b===focus)return;focus=b;
    fromPos.copy(camPos);fromLook.copy(camLook);tw=0;twDur=REDUCE?1.2:(b?3.6:4.0);
    if(b){targetSpeed=0;placeCamFor(b);if(b.wheelSt){b.wheelSt.forEach((W,i)=>{W.a=-(b.camAng+W.holder.rotation.y)+(i-1.5)*.45})}if(!b.isSun&&b.w.face){const p=sph(b.w.face[0],b.w.face[1]);b.faceT=Math.atan2(p.z,p.x)-b.camAng;}if(!b.isSun&&MOBILE){const k=b.w.key;if(hiCache[k]&&hiCache[k].image)b.mat.uniforms.map.value=hiCache[k]}}
    else{targetSpeed=1;tgtPos.copy(overview.pos);tgtLook.copy(overview.look)}
    cfg.onFocus&&cfg.onFocus(b?b.w:null);
  }

  // picking: screen-space nearest body (forgiving on touch)
  const v=new T.Vector3();
  function pick(cx,cy){const rect=renderer.domElement.getBoundingClientRect();let best=null,bs=1e9,inside=null,iz=1e9;
    pickables.forEach(b=>{if(!b.w.interactive)return;worldPos(b,v);const c=v.clone().project(cam);if(c.z>1)return;
      const x=(c.x+1)/2*rect.width+rect.left,y=(1-c.y)/2*rect.height+rect.top;
      const edge=worldPos(b,new T.Vector3()).add(new T.Vector3(b.w.r,0,0).applyQuaternion(cam.quaternion)).project(cam);
      const pr=Math.abs(((edge.x+1)/2*rect.width+rect.left)-x);const d=Math.hypot(cx-x,cy-y);
      if(d<=pr+6&&b!==focus){const z=cam.position.distanceTo(v);if(z<iz){iz=z;inside=b}}
      const lim=Math.max(MOBILE?34:24,pr+12);if(d>lim)return;let sc=d/Math.max(pr,14);if(b===focus)sc+=2;if(sc<bs){bs=sc;best=b}});
    return inside||best}
  const tip=cfg.tip;
  renderer.domElement.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;const b=pick(e.clientX,e.clientY);
    pickables.forEach(o=>o.hi=o===b);renderer.domElement.style.cursor=b?'pointer':'';
    if(tip){if(b){tip.textContent=b.w.name;tip.style.transform=`translate(${e.clientX+14}px,${e.clientY+14}px)`;tip.classList.add('show')}else tip.classList.remove('show')}});
  renderer.domElement.addEventListener('pointerleave',()=>{tip&&tip.classList.remove('show');pickables.forEach(o=>o.hi=false)});
  renderer.domElement.addEventListener('click',e=>{const b=pick(e.clientX,e.clientY);if(b&&b!==focus){tip&&tip.classList.remove('show');setFocus(b.w.id)}else if(!b&&focus)setFocus(null)});

  // loop
  let raf=0,last=performance.now(),running=false,tt=0;
  function frame(now){raf=requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;tt+=dt;
    speed+=(targetSpeed-speed)*Math.min(1,dt*2.5);
    const k=REDUCE?.15:1;
    bodies.forEach(b=>{const w=b.w;b.ang+=dt*w.speed*speed*k*.03;
      if(w.orbit){const px=Math.cos(b.ang)*w.orbit,pz=-Math.sin(b.ang)*w.orbit;b.grp.position.set(px,0,pz)}
      if(focus===b&&b.faceT!=null){b.faceT+=dt*w.spin*k*.06;let d=((b.faceT-b.mesh.rotation.y)%6.2832+9.4248)%6.2832-3.1416;b.mesh.rotation.y+=d*Math.min(1,dt*.9)}else b.mesh.rotation.y+=dt*w.spin*k*.15;if(b.clouds)b.clouds.rotation.y+=dt*w.spin*.28*k;
      b.mat.uniforms.t.value=tt;if(b.satTick)b.satTick(dt*k);if(b.wheelTick)b.wheelTick.forEach(f=>f(dt*k));if(b.bridgeTick)b.bridgeTick(dt*k);if(b.cenU)b.mesh.getWorldPosition(b.cenU.value);const s=b.hi?1.18:1;const cs=b.grp.scale.x+(s-b.grp.scale.x)*Math.min(1,dt*6);b.grp.scale.setScalar(cs)});
    sunMesh.rotation.y+=dt*.012;sunMat.uniforms.t.value=tt;swarm.rotation.y+=dt*.012*k;{const s2=sunBody.hi?1.06:1;const cs=sunGrp.scale.x+(s2-sunGrp.scale.x)*Math.min(1,dt*6);sunGrp.scale.setScalar(cs)}
    const oa=focus?0:1;bodies.forEach(b=>{if(b.orbit){const m=b.orbit.material,base=b.w.parent?.14:.16;m.opacity+=(base*oa-m.opacity)*Math.min(1,dt*3)}});
    if(focus)placeCamFor(focus);
    shared.t.value=tt;if(shuttleTick)shuttleTick(dt*k);
    if(tw<1){tw=Math.min(1,tw+dt/twDur);const p=ease(tw);camPos.copy(fromPos).lerp(tgtPos,p);camPos.y+=Math.sin(Math.PI*p)*fromPos.distanceTo(tgtPos)*.22;camLook.copy(fromLook).lerp(tgtLook,p)}
    else{camPos.copy(tgtPos);camLook.copy(tgtLook)}
    cam.position.copy(camPos);cam.lookAt(camLook);
    renderer.render(scene,cam)}
  function start(){if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame)}
  function stop(){running=false;cancelAnimationFrame(raf)}
  function resize(){cam.aspect=W()/H();cam.updateProjectionMatrix();renderer.setSize(W(),H())}
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>document.hidden?stop():(cfg.isActive?.()!==false&&start()));
  addEventListener('keydown',e=>{if(e.key==='Escape'&&focus)setFocus(null)});
  try{renderer.compile(scene,cam)}catch(e){}
  start();
  function screenPos(id){const b=byId[id];if(!b)return null;worldPos(b,v);const c=v.clone().project(cam);const rect=renderer.domElement.getBoundingClientRect();return {x:(c.x+1)/2*rect.width+rect.left,y:(1-c.y)/2*rect.height+rect.top}}
  return {start,stop,focus:setFocus,resize,screenPos,_pick:(x,y)=>{const b=pick(x,y);return b&&b.w.id}}
}
window.SolarScene={mount};
})();
