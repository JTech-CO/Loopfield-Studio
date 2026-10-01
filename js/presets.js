import { uid, clone } from './utils.js';
import { parseControls } from './glsl.js';
import { EXTRA_PRESETS } from './presets-extra.js';
export const PALETTES = [
 { name:'오로라', colors:['#65fbd5','#ac76ff','#ffb86c'] },
 { name:'일몰', colors:['#ff543e','#ffc879','#a63cff'] },
 { name:'빙하', colors:['#b7fbff','#409eff','#6862ef'] },
 { name:'아날로그', colors:['#fce5b4','#e6a065','#647b73'] },
 { name:'캔디', colors:['#ff64bc','#6fe8ff','#fff1a3'] },
 { name:'모노', colors:['#f7f4ed','#8a929d','#dbe6ed'] }
];
export const PRESETS = [
 { id:'prism', name:'Prism Bloom', ko:'프리즘 블룸', category:'geometry', description:'겹겹의 빛으로 만드는 회전 대칭 패턴', palette:0,
 code:`// @slider uPetals 3 16 1 7 | 대칭 수
// @slider uBands 3 18 1 9 | 빛의 겹
// @slider uTwist 0 3 0.05 1.2 | 꼬임
vec3 pattern(vec2 p) {
  float r=length(p), a=atan(p.y,p.x);
  float wave=sin(a*uPetals + uTwist*sin(r*4.0-uAngle));
  float field=r*(uBands+1.6*wave) - 0.6*sin(uAngle);
  float line=pow(0.5+0.5*cos(field*TAU), 18.0);
  float halo=0.16/(0.15+abs(sin(field*PI)));
  vec3 col=palette(r*0.55+wave*0.13+0.12*sin(uAngle));
  return col*(line*0.75+halo*0.35)*exp(-r*0.65);
}` },
 { id:'mandelbrot', name:'Mandelbrot', ko:'망델브로 집합', category:'fractal', description:'z²+c의 탈출 시간과 부드러운 카메라 루프', palette:2, zoom:1.05,
 code:`// @slider uIterations 48 384 16 160 | 반복 정밀도
// @slider uBreath 0 0.8 0.01 0.28 | 줌 호흡
// @slider uContour 0.01 0.15 0.005 0.045 | 등고선 밀도
vec3 pattern(vec2 p) {
  float scale=1.3*exp(uBreath*cos(uAngle));
  vec2 c=p*scale+vec2(-0.55,0.02);
  vec2 z=vec2(0.0); float n=0.0;
  for(int i=0;i<384;i++) {
    if(i>=int(uIterations)) break;
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
    n=float(i)+1.0;
    if(dot(z,z)>256.0) break;
  }
  if(n>=uIterations) return vec3(0.005,0.008,0.018);
  float smoothN=n+1.0-log2(max(0.001,log2(max(length(z),1.0001))));
  vec3 col=palette(smoothN*uContour+0.1*sin(uAngle));
  return col*(0.35+0.65*(1.0-exp(-smoothN*.12)));
}` },
 { id:'julia', name:'Julia orbit', ko:'줄리아 궤도', category:'fractal', description:'복소 상수 c가 닫힌 궤도를 따라 움직이는 프랙탈', palette:1,
 code:`// @slider uIterations 48 384 16 144 | 반복 정밀도
// @slider uReal -1 0.5 0.005 -0.745 | c 실수부
// @slider uImag -0.5 0.5 0.005 0.185 | c 허수부
// @slider uOrbit 0 0.18 0.002 0.028 | 궤도 반경
vec3 pattern(vec2 p) {
  vec2 z=p*1.3;
  vec2 c=vec2(uReal,uImag)+uOrbit*uCycle;
  float n=0.0, trap=100.0;
  for(int i=0;i<384;i++) {
    if(i>=int(uIterations)) break;
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;
    trap=min(trap,abs(length(z)-.65)); n=float(i)+1.0;
    if(dot(z,z)>256.0) break;
  }
  if(n>=uIterations) return palette(trap)*.03;
  float sn=n+1.0-log2(max(.001,log2(max(length(z),1.0001))));
  return palette(sn*.037+trap*.3)*(0.4+0.6*exp(-trap*3.0));
}` },
 { id:'kaleido', name:'Kaleido tiles', ko:'만화경 타일', category:'geometry', description:'접힌 좌표 공간에 반복되는 빛의 격자', palette:4,
 code:`// @slider uSymmetry 3 16 1 8 | 접힘 수
// @slider uDensity 1 5 0.1 2.2 | 타일 밀도
// @slider uLayers 2 5 1 3 | 반복 깊이
vec3 pattern(vec2 p) {
  float a=atan(p.y,p.x)+0.15*sin(uAngle), r=length(p);
  a=abs(mod(a,TAU/uSymmetry)-PI/uSymmetry);
  vec2 q=vec2(cos(a),sin(a))*r; vec3 col=vec3(0.0);
  for(int i=0;i<5;i++) {
    if(i>=int(uLayers)) break;
    q=fract(q*uDensity+0.11*uCycle)-.5;
    float d=abs(length(q)-(.18+.06*sin(uAngle+float(i))));
    col+=palette(r*.3+float(i)*.21)*.018/(.025+d);
  }
  return col*exp(-r*.4)*.7;
}` },
 { id:'ribbons', name:'Silk contours', ko:'실크 등고선', category:'organic', description:'천처럼 접히고 흐르는 매끄러운 곡선', palette:3,
 code:`// @slider uDensity 3 24 1 12 | 선 밀도
// @slider uFlow 0 2 0.05 0.85 | 물결 강도
// @slider uWidth 0.01 0.2 0.005 0.055 | 선 두께
vec3 pattern(vec2 p) {
  vec2 q=rotate(.35*sin(uAngle))*p;
  float f=q.y+uFlow*.3*sin(q.x*2.7+uAngle)+.13*sin(q.x*5.0-uAngle);
  float d=sin(f*uDensity);
  float line=1.0-smoothstep(uWidth,uWidth+max(fwidth(d),.008),abs(d));
  float shade=.5+.5*sin(f*3.0+q.x);
  return palette(shade*.7)*(line*.8+.055)*exp(-length(p)*.2);
}` },
 { id:'moire', name:'Moiré study', ko:'모아레 연구', category:'geometry', description:'두 격자의 간섭이 만드는 큰 형태', palette:5,
 code:`// @slider uDensity 8 80 1 34 | 격자 밀도
// @slider uAngleRange 0.02 0.8 0.01 0.24 | 교차 각도
vec3 pattern(vec2 p) {
  vec2 q=rotate(uAngleRange*sin(uAngle))*p;
  float a=sin(p.x*uDensity), b=sin(q.x*uDensity+cos(uAngle)*2.0);
  float f=.5+.5*a*b;
  float aa=max(fwidth(f),.015);
  float band=smoothstep(.48-aa,.48+aa,f);
  return palette(length(p)*.22)*band*.85;
}` },
 { id:'interference', name:'Wave interference', ko:'파동 간섭', category:'geometry', description:'원을 그리며 이동하는 두 파동원', palette:2,
 code:`// @slider uFrequency 4 30 1 14 | 파동 주파수
// @slider uOrbit 0.1 1.1 0.02 0.6 | 파동원 거리
vec3 pattern(vec2 p) {
  vec2 c=uOrbit*uCycle;
  float d1=length(p-c),d2=length(p+c);
  float v=sin(d1*uFrequency-uAngle)+sin(d2*uFrequency+uAngle);
  float glow=pow(.5+.25*v,3.0);
  return palette(v*.16+length(p)*.2)*glow;
}` },
 { id:'voronoi', name:'Cellular glass', ko:'셀룰러 글라스', category:'organic', description:'살아 움직이는 보로노이 셀과 유리 경계', palette:0,
 code:`// @slider uCells 2 8 0.25 3.5 | 셀 밀도
// @slider uMotion 0 0.45 0.01 0.3 | 움직임
vec3 pattern(vec2 p) {
  p=p*uCells; vec2 cell=floor(p), f=fract(p);
  float d1=10.0,d2=10.0,id=0.0;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++) {
    vec2 g=vec2(float(x),float(y));
    float h=hash21(cell+g+uSeed);
    vec2 o=.5+uMotion*vec2(cos(uAngle+h*TAU),sin(uAngle+h*TAU));
    float d=length(g+o-f);
    if(d<d1){d2=d1;d1=d;id=h;}else{d2=min(d2,d);}
  }
  float edge=exp(-(d2-d1)*32.0);
  return palette(id+0.06*sin(uAngle))*(.12+edge*.78+exp(-d1*5.0)*.3);
}` },
 { id:'domain', name:'Liquid topography', ko:'유체 지형', category:'organic', description:'주기적 좌표 이동으로 흐르는 노이즈 지형', palette:1,
 code:`// @slider uScale 1 5 0.1 2.4 | 지형 크기
// @slider uWarp 0 4 0.1 2.0 | 왜곡 강도
// @slider uContours 2 16 1 8 | 등고선 수
vec3 pattern(vec2 p) {
  vec2 q=p*uScale;
  vec2 w=vec2(fbm(q+uCycle*.6),fbm(q+vec2(4.7,1.3)-uCycle*.6));
  float v=fbm(q+uWarp*w+uSeed*.07);
  float line=pow(.5+.5*cos(v*TAU*uContours),14.0);
  return palette(v*.85)*(.2+.72*line);
}` },
 { id:'orbital', name:'Orbital rings', ko:'궤도 링', category:'geometry', description:'서로 다른 축을 가진 발광 타원 궤도', palette:4,
 code:`// @slider uRings 3 14 1 8 | 궤도 수
// @slider uTilt 0.15 1 0.01 0.5 | 궤도 기울기
vec3 pattern(vec2 p) {
  vec3 col=vec3(0.0);
  for(int i=0;i<14;i++) {
    if(i>=int(uRings))break;
    float fi=float(i); vec2 q=rotate(fi*PI/uRings+.2*sin(uAngle))*p;
    q.y/=uTilt+.1*sin(uAngle+fi);
    float radius=.4+fi*.055+.04*cos(uAngle+fi);
    float d=abs(length(q)-radius);
    float light=.015/(d+.018);
    col+=palette(fi/uRings+.1*sin(uAngle))*light;
  }
  return col*.32;
}` },
 { id:'gyroid', name:'Gyroid sculpture', ko:'자이로이드 조각', category:'volume', description:'구 내부의 삼중 주기 곡면을 레이마칭으로 표현', palette:0,
 code:`// @slider uFrequency 2 8 0.2 4.0 | 곡면 주파수
// @slider uThickness 0.06 0.4 0.01 0.16 | 곡면 두께
float shape(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;
  vec3 q=p*uFrequency;
  float gy=dot(sin(q),cos(q.yzx));
  return max((abs(gy)-uThickness)/uFrequency*.55,length(p)-1.1);
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3.4),rd=normalize(vec3(p,-2.2));
  float t=0.0,d=0.0; bool hit=false;
  for(int i=0;i<96;i++) {
    d=shape(ro+rd*t); if(d<.0015){hit=true;break;}
    t+=max(d,.001); if(t>5.0)break;
  }
  if(!hit)return vec3(.008,.01,.018);
  vec3 pos=ro+rd*t; vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(shape(pos+e.xyy)-shape(pos-e.xyy),shape(pos+e.yxy)-shape(pos-e.yxy),shape(pos+e.yyx)-shape(pos-e.yyx)));
  vec3 light=normalize(vec3(-.7,.9,1.0));
  float diff=max(dot(n,light),0.0), rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(pos.y*.28+pos.x*.17)*(.18+.75*diff)+palette(.7)*rim*.4;
}` },
 ...EXTRA_PRESETS,
 { id:'starter', name:'Your first loop', ko:'나의 첫 루프', category:'code', description:'단 5줄의 함수로 시작하는 나만의 루프', palette:0,
 code:`// @slider uDensity 2 20 1 8 | 원의 밀도
vec3 pattern(vec2 p) {
  float wave = sin(length(p) * uDensity - uAngle);
  vec3 color = palette(length(p) * 0.4);
  return color * (0.5 + 0.5 * wave);
}` }
];
export const presetById = id => PRESETS.find(p => p.id === id) || PRESETS[0];
export const defaultTransform = id => ({zoom:presetById(id).zoom||1,rotation:0,phase:0,seed:3});
export function createLayer(id='prism') {
  const p=presetById(id);
  return { id:uid(), preset:p.id, name:p.ko, source:p.code, draft:null, enabled:true, opacity:1, blend:'normal',
    ...defaultTransform(p.id), offset:[0,0], cycles:1,
    colors:[...PALETTES[p.palette].colors], hue:0,
    params:Object.fromEntries(parseControls(p.code).map(c=>[c.name,c.value])) };
}
export function defaultProject() {
  return { format:'loopfield-project', version:1, appVersion:'1.1.0', name:'Prism Bloom', nameMode:'auto', namePreset:'prism',
    layers:[createLayer('prism')],
    effects:{ glow:.35, exposure:1.15, contrast:1.08, vignette:.25, aberration:0 },
    background:'#080b12',
    output:{ resolution:'1080p', aspect:'landscape', fps:30, duration:8, quality:'high', encoder:'auto', direct:true }
  };
}
export function duplicateLayer(layer) {
  const out=clone(layer); out.id=uid(); out.name=`${out.name} 복사`; return out;
}
