/** Original, self-contained GLSL patterns. All default animations are periodic.
 * No textures, network assets or third-party shader snippets are needed. */
export const EXTRA_PRESETS = [
 {id:'spiral',name:'Logarithmic spiral',ko:'로그 나선',category:'geometry',palette:1,
 description:'극좌표의 로그 반지름이 만드는 끝없는 나선 띠',
 code:`// @slider uArms 2 12 1 5 | 나선 가지 수
// @slider uTightness 1 8 0.1 3.8 | 감김 밀도
vec3 pattern(vec2 p) {
  float r=max(length(p),0.003), a=atan(p.y,p.x);
  float v=a*uArms+log(r)*uTightness-uAngle;
  float band=pow(.5+.5*cos(v),10.0);
  float aa=1.0-smoothstep(.5,2.0,fwidth(v));
  return palette(log(r)*.1+.12*sin(uAngle))*(band*aa*.9+.035)*smoothstep(.01,.08,r);
}`},
 {id:'truchet',name:'Truchet circuit',ko:'트루셰 회로',category:'geometry',palette:2,
 description:'무작위 방향의 사분원 타일을 연결한 그래픽 회로',
 code:`// @slider uTiles 2 12 1 5 | 타일 밀도
// @slider uLineWidth 0.01 0.16 0.005 0.05 | 회로 두께
vec3 pattern(vec2 p) {
  vec2 q=p*uTiles+.18*uCycle, cell=floor(q), f=fract(q);
  if(hash21(cell+uSeed)>.5) f.x=1.0-f.x;
  float d=min(abs(length(f)-.5),abs(length(f-1.0)-.5));
  float line=stroke(d,uLineWidth);
  float light=.35+.65*pow(.5+.5*cos((f.x+f.y)*5.0+uAngle),2.0);
  return palette((cell.x+cell.y)*.09)*(.035+line*light);
}`},
 {id:'hex-pulse',name:'Hexagonal pulse',ko:'육각 펄스',category:'geometry',palette:0,
 description:'벌집 격자에서 바깥으로 번져 가는 빛의 파동',
 code:`// @slider uCells 2 10 0.5 5 | 벌집 밀도
// @slider uPulse 0.5 5 0.1 2 | 파동 밀도
vec3 pattern(vec2 p) {
  vec2 q=p*uCells, tile=vec2(1.0,1.7320508);
  vec2 a=mod(q,tile)-tile*.5, b=mod(q-tile*.5,tile)-tile*.5;
  vec2 f=dot(a,a)<dot(b,b)?a:b, id=q-f;
  float boundary=max(abs(f.x),dot(abs(f),vec2(.5,.8660254)));
  float phase=length(id)*uPulse-uAngle;
  float glow=pow(.5+.5*cos(phase),4.0);
  float edge=stroke(boundary-.46,.02);
  return palette(length(id)*.04)*(.025+glow*(.25+.65*edge));
}`},
 {id:'polar-lattice',name:'Polar lattice',ko:'극좌표 격자',category:'geometry',palette:4,
 description:'동심원과 방사형 선이 교차하는 회전 격자',
 code:`// @slider uSpokes 8 48 2 24 | 방사선 수
// @slider uCircles 2 12 1 6 | 원 밀도
vec3 pattern(vec2 p) {
  float r=length(p),a=atan(p.y,p.x)+.08*sin(uAngle);
  float rings=stroke(sin(r*uCircles*PI-.3*sin(uAngle)),.055);
  float spokes=stroke(sin(a*uSpokes*.5+.25*cos(r*5.0-uAngle)),.05);
  float fade=smoothstep(.03,.14,r)*exp(-r*.35);
  return palette(r*.25+.08*cos(uAngle))*(rings*.6+spokes*.6)*fade;
}`},
 {id:'rose',name:'Rhodonea garden',ko:'장미 곡선',category:'geometry',palette:1,
 description:'극방정식으로 겹치는 장미 모양의 발광 곡선',
 code:`// @slider uPetals 2 12 1 5 | 꽃잎 수
// @slider uRoses 2 8 1 5 | 겹 수
vec3 pattern(vec2 p) {
  float r=length(p),a=atan(p.y,p.x);vec3 c=vec3(0);
  for(int i=0;i<8;i++) {
    if(i>=int(uRoses))break;float k=float(i);
    float radius=(.85-k*.07)*abs(cos(a*uPetals+.16*sin(uAngle+k*.5)));
    float d=abs(r-radius);
    c+=palette(k/uRoses)*.006/(d+.015);
  }
  return c*.75;
}`},
 {id:'lissajous',name:'Lissajous signal',ko:'리사주 신호',category:'geometry',palette:4,
 description:'서로 다른 정수 주파수의 진동이 그리는 닫힌 곡선',
 code:`// @slider uFreqX 1 7 1 3 | 가로 진동 수
// @slider uFreqY 1 7 1 4 | 세로 진동 수
// @slider uWidth 0.004 0.04 0.002 0.012 | 궤적 두께
float segmentDistance(vec2 p,vec2 a,vec2 b) {
  vec2 ab=b-a;float h=clamp(dot(p-a,ab)/max(dot(ab,ab),.000001),0.0,1.0);
  return length(p-a-h*ab);
}
vec3 pattern(vec2 p) {
  float d=10.0,nearest=0.0;
  vec2 prev=.78*vec2(sin(uAngle),0.0);
  for(int i=1;i<=128;i++) {
    float t=TAU*float(i)/128.0;
    vec2 curr=.78*vec2(sin(uFreqX*t+uAngle),sin(uFreqY*t));
    float nd=segmentDistance(p,prev,curr);
    if(nd<d){d=nd;nearest=t/TAU;}prev=curr;
  }
  return palette(nearest)*(.01/(d+uWidth)+.35*stroke(d,uWidth));
}`},
 {id:'concentric-grid',name:'Concentric grid',ko:'동심원 격자',category:'geometry',palette:3,
 description:'격자마다 원형 파동이 위상을 달리하며 맥동하는 패턴',
 code:`// @slider uGrid 1 8 0.5 3 | 격자 밀도
// @slider uBands 2 12 1 5 | 동심원 수
vec3 pattern(vec2 p) {
  vec2 q=p*uGrid,id=floor(q),f=fract(q)-.5;
  float phase=hash21(id+uSeed)*TAU;
  float d=sin(length(f)*uBands*TAU-uAngle+phase);
  float line=stroke(d,.18);
  return palette(hash21(id+3.2))*(.035+.78*line)*(1.0-smoothstep(.35,.76,length(f)));
}`},
 {id:'quasicrystal',name:'Quasicrystal interference',ko:'준결정 간섭',category:'geometry',palette:2,
 description:'여러 방향의 평면파를 더한 비주기적 대칭 무늬',
 code:`// @slider uDirections 3 9 1 5 | 파동 방향 수
// @slider uFrequency 4 30 1 15 | 공간 주파수
vec3 pattern(vec2 p) {
  float v=0.0;
  for(int i=0;i<9;i++) {
    if(i>=int(uDirections))break;float a=PI*float(i)/uDirections;
    v+=cos(dot(p,vec2(cos(a),sin(a)))*uFrequency+.8*sin(uAngle+a));
  }
  v/=uDirections;
  float band=pow(.5+.5*cos(v*TAU*2.0),5.0);
  return palette(v*.5+.3)*(.09+.82*band);
}`},
 {id:'burning-ship',name:'Burning Ship',ko:'버닝 십 프랙탈',category:'fractal',palette:1,
 description:'복소수의 절댓값 변환으로 나타나는 불꽃과 선박 형태',
 code:`// @slider uIterations 48 256 16 144 | 반복 정밀도
// @slider uBreath 0 0.4 0.01 0.12 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 c=vec2(p.x,-p.y)*1.1*exp(uBreath*cos(uAngle))+vec2(-.45,-.45);
  vec2 z=vec2(0);float n=0.0;
  for(int i=0;i<256;i++) {
    if(i>=int(uIterations))break;z=abs(z);
    z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;n=float(i)+1.0;
    if(dot(z,z)>256.0)break;
  }
  if(n>=uIterations)return vec3(.007,.004,.009);
  float sn=n+1.0-log2(max(.001,log2(max(length(z),1.0001))));
  return palette(sn*.045+.08*sin(uAngle))*(.25+.7*(1.0-exp(-sn*.15)));
}`},
 {id:'multibrot',name:'Cubic Multibrot',ko:'3차 멀티브로',category:'fractal',palette:0,
 description:'z³+c 반복으로 만들어지는 다중 대칭 프랙탈',
 code:`// @slider uIterations 48 256 16 128 | 반복 정밀도
// @slider uBreath 0 0.5 0.01 0.2 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 c=rotate(.12*sin(uAngle))*p*1.2*exp(uBreath*cos(uAngle));
  vec2 z=vec2(0);float n=0.0;
  for(int i=0;i<256;i++) {
    if(i>=int(uIterations))break;vec2 s=z*z;
    z=vec2(z.x*(s.x-3.0*s.y),z.y*(3.0*s.x-s.y))+c;n=float(i)+1.0;
    if(dot(z,z)>256.0)break;
  }
  if(n>=uIterations)return vec3(.005,.008,.015);
  float sn=n+1.0-log(max(.001,log(max(length(z),1.0001))))/log(3.0);
  return palette(sn*.045+.09*sin(uAngle))*(.35+.6*(1.0-exp(-sn*.18)));
}`},
 {id:'newton',name:'Newton basins',ko:'뉴턴 수렴 영역',category:'fractal',palette:4,
 description:'z³=1의 세 근으로 수렴하는 경로를 색으로 구분',
 code:`// @slider uIterations 12 64 1 36 | 반복 정밀도
// @slider uOrbit 0 0.5 0.01 0.18 | 시점 궤도
vec2 cmul(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 cdiv(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),.0000001);}
vec3 pattern(vec2 p) {
  vec2 z=p*1.4+uOrbit*uCycle;float n=0.0;
  for(int i=0;i<64;i++) {
    if(i>=int(uIterations))break;vec2 z2=cmul(z,z),f=cmul(z2,z)-vec2(1,0);
    if(dot(f,f)<.000001)break;z-=cdiv(f,3.0*z2);n+=1.0;
  }
  float d0=length(z-vec2(1,0)),d1=length(z-vec2(-.5,.8660254)),d2=length(z-vec2(-.5,-.8660254));
  vec3 c=d0<d1&&d0<d2?uColorA:(d1<d2?uColorB:uColorC);
  return c*(.18+.72*exp(-n*.065))*(.8+.2*cos(n*1.5));
}`},
 {id:'sierpinski',name:'Sierpinski fold',ko:'시에르핀스키 삼각형',category:'fractal',palette:3,
 description:'삼각형을 축소·복제하는 반복 접힘 프랙탈',
 code:`// @slider uDepth 3 9 1 6 | 재귀 깊이
vec3 pattern(vec2 p) {
  p=rotate(.12*sin(uAngle))*p*exp(.08*cos(uAngle));
  vec2 q=vec2((p.x+1.0)*.5,(p.y+.72)/1.7320508);
  q.x-=q.y*.5;
  if(q.x<0.0||q.y<0.0||q.x+q.y>1.0)return vec3(.015,.018,.022);
  float shade=1.0;
  for(int i=0;i<9;i++) {
    if(i>=int(uDepth))break;
    q*=2.0;
    if(q.x<1.0&&q.y<1.0&&q.x+q.y>1.0){shade=.04;break;}
    q=fract(q);
  }
  float edge=min(min(q.x,q.y),abs(1.0-q.x-q.y));
  return palette(p.y*.25+.08*sin(uAngle))*shade*(.48+.45*exp(-edge*14.0));
}`},
 {id:'aurora',name:'Aurora curtains',ko:'오로라 커튼',category:'organic',palette:0,
 description:'층마다 흐름이 다른 수직 빛의 커튼',
 code:`// @slider uCurtains 2 8 1 5 | 커튼 층 수
// @slider uFlow 0.2 2 0.1 0.8 | 흐름 강도
vec3 pattern(vec2 p) {
  vec3 c=vec3(.005,.008,.016);
  for(int i=0;i<8;i++) {
    if(i>=int(uCurtains))break;float f=float(i);
    float y=-.55+f*.16+.15*sin(p.x*2.0+uAngle+f)+.08*sin(p.x*5.0-uAngle);
    float tex=fbm(vec2(p.x*3.0+f+uFlow*sin(uAngle),f+uFlow*cos(uAngle)));
    float d=p.y-y,curtain=exp(-abs(d)*5.0)*smoothstep(-.04,.08,d);
    c+=palette(f/uCurtains+tex*.18)*curtain*tex*.6;
  }
  return c;
}`},
 {id:'caustics',name:'Water caustics',ko:'수면 코스틱',category:'organic',palette:2,
 description:'겹치는 주기적 파면이 만드는 수중 빛무늬',
 code:`// @slider uScale 1 6 0.1 2.8 | 파면 밀도
// @slider uSharpness 1 8 0.2 4 | 빛 집중도
vec3 pattern(vec2 p) {
  vec2 q=p*uScale;float field=0.0;
  for(int i=0;i<4;i++) {
    float k=float(i)+1.0;
    q=rotate(.85)*q+vec2(sin(q.y+uAngle+k),cos(q.x-uAngle+k))*.45;
    field+=sin(q.x*k*.6+uAngle)*cos(q.y*k*.6-uAngle)/k;
  }
  float light=exp(-abs(field)*uSharpness*3.0);
  return palette(field*.1+.28)*(.07+light*.92);
}`},
 {id:'metaballs',name:'Metaball islands',ko:'메타볼 섬',category:'organic',palette:1,
 description:'거리장의 합으로 뭉치고 떨어지는 부드러운 액체 형태',
 code:`// @slider uBalls 3 10 1 6 | 액체 입자 수
// @slider uRadius 0.015 0.09 0.005 0.045 | 입자 크기
vec3 pattern(vec2 p) {
  float field=0.0;
  for(int i=0;i<10;i++) {
    if(i>=int(uBalls))break;float fi=float(i),a=fi*TAU/uBalls;
    vec2 pos=.64*vec2(cos(a+uAngle),sin(a-uAngle))+.16*vec2(sin(uAngle*2.0+fi),cos(uAngle*2.0-fi));
    field+=uRadius/max(dot(p-pos,p-pos),.002);
  }
  float inside=smoothstep(.9,1.1,field),edge=exp(-abs(field-1.0)*10.0);
  return palette(field*.08+.08*sin(uAngle))*(inside*.48+edge*.52);
}`},
 {id:'contour-waves',name:'Topographic dunes',ko:'지형 사구',category:'organic',palette:3,
 description:'높이장을 따라 이어지는 촘촘하고 유연한 지형 등고선',
 code:`// @slider uContours 4 24 1 14 | 등고선 수
// @slider uRelief 0.1 1.2 0.05 0.6 | 지형 굴곡
vec3 pattern(vec2 p) {
  float h=p.y+uRelief*(fbm(p*2.0+uCycle*.4)-.5)+.16*sin(p.x*2.0+uAngle);
  float wave=sin(h*uContours*PI);
  float line=stroke(wave,.09);
  return palette(h*.22+.2)*(.08+.75*line);
}`},
 {id:'plasma',name:'Harmonic plasma',ko:'하모닉 플라스마',category:'organic',palette:4,
 description:'사인파와 원형파를 혼합한 부드러운 색의 흐름',
 code:`// @slider uFrequency 1 10 0.2 4 | 파동 밀도
// @slider uBands 1 6 0.25 2 | 색 띠 수
vec3 pattern(vec2 p) {
  float v=sin(p.x*uFrequency+uAngle)+sin(p.y*uFrequency-uAngle);
  v+=sin((p.x+p.y)*uFrequency*.7+uAngle);
  v+=sin(length(p-.4*uCycle)*uFrequency*1.4);
  return palette(v*uBands*.12+.5)*(.62+.28*cos(v));
}`},
 {id:'torus',name:'Twisted torus',ko:'꼬인 토러스',category:'volume',palette:4,
 description:'비틀린 고리 표면의 거리장을 레이마칭한 3D 조각',
 code:`// @slider uTube 0.08 0.35 0.01 0.2 | 고리 두께
// @slider uTwist 0 3 0.1 1.2 | 표면 꼬임
float torusField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.5)*p.yz;
  float a=atan(p.z,p.x),r=.63+.07*sin(a*3.0+uTwist*sin(uAngle));
  return length(vec2(length(p.xz)-r,p.y))-uTube;
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3),rd=normalize(vec3(p,-2.1));float t=0.0;bool hit=false;
  for(int i=0;i<80;i++){float d=torusField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(.001,d*.7);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(torusField(q+e.xyy)-torusField(q-e.xyy),torusField(q+e.yxy)-torusField(q-e.yxy),torusField(q+e.yyx)-torusField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.6,1,1))),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(q.y*.5+q.x*.2)*(.18+.75*diff)+palette(.7)*rim*.4;
}`},
 {id:'superquadric',name:'Morphing superellipsoid',ko:'슈퍼타원체',category:'volume',palette:2,
 description:'지수에 따라 구와 둥근 정육면체 사이를 오가는 형태',
 code:`// @slider uPower 2 7 0.2 4 | 곡면 지수
// @slider uMorph 0 1 0.05 0.7 | 형태 변화
float solidField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.35*sin(uAngle))*p.yz;
  float k=max(2.0,uPower+uMorph*sin(uAngle));vec3 q=pow(abs(p),vec3(k));
  return pow(q.x+q.y+q.z,1.0/k)-.65;
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3),rd=normalize(vec3(p,-2.2));float t=0.0;bool hit=false;
  for(int i=0;i<80;i++){float d=solidField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(.001,d*.65);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(solidField(q+e.xyy)-solidField(q-e.xyy),solidField(q+e.yxy)-solidField(q-e.yxy),solidField(q+e.yyx)-solidField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.6,.9,1))),0.0);
  float lines=pow(.5+.5*cos((q.y+.1*sin(q.x*8.0))*45.0),8.0);
  return palette(q.y*.4+.2)*(.2+.65*diff)*(0.7+.3*lines)+vec3(pow(max(dot(reflect(rd,n),normalize(vec3(-.6,.9,1))),0.0),24.0))*.3;
}`},
 {id:'schwarz',name:'Schwarz P surface',ko:'슈바르츠 P 곡면',category:'volume',palette:0,
 description:'코사인 합의 영점으로 드러나는 주기적 다공성 곡면',
 code:`// @slider uFrequency 3 7 0.2 4.2 | 곡면 주파수
// @slider uThickness 0.05 0.4 0.01 0.14 | 벽 두께
float porousField(vec3 p) {
  p.xz=rotate(uAngle)*p.xz;p.yz=rotate(.2*sin(uAngle))*p.yz;
  vec3 q=cos(p*uFrequency);float surface=(abs(q.x+q.y+q.z)-uThickness)/(uFrequency*1.8);
  return max(surface,length(p)-1.05);
}
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3.3),rd=normalize(vec3(p,-2.2));float t=0.0;bool hit=false;
  for(int i=0;i<110;i++){float d=porousField(ro+rd*t);if(d<.0015){hit=true;break;}t+=max(d,.001);if(t>5.0)break;}
  if(!hit)return vec3(.008,.01,.018);
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 n=normalize(vec3(porousField(q+e.xyy)-porousField(q-e.xyy),porousField(q+e.yxy)-porousField(q-e.yxy),porousField(q+e.yyx)-porousField(q-e.yyx)));
  float diff=max(dot(n,normalize(vec3(-.8,.9,1))),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  return palette(q.y*.25+q.z*.18)*(.14+.8*diff)+palette(.65)*rim*.35;
}`}
];
