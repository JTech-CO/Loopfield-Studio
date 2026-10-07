/** Procedural library expansion: independent constructions, bounded work and
 * periodic animation. Helpers are embedded in each editable/exportable shader. */
const SEGMENT = `
float pathDistance(vec2 p,vec2 a,vec2 b) {
  vec2 v=b-a;float t=clamp(dot(p-a,v)/max(dot(v,v),.000001),0.0,1.0);
  return length(p-a-t*v);
}
`;
const WIRE = `
vec3 spinModel(vec3 q) {
  q.xz=rotate(uAngle)*q.xz;q.yz=rotate(.5+.18*sin(uAngle))*q.yz;return q;
}
vec2 projectPoint(vec3 q) {return q.xy*2.6/max(1.4,3.4-q.z);}
vec3 wireLine(vec2 p,vec3 a,vec3 b,float width,float tint) {
  vec2 aa=projectPoint(a),bb=projectPoint(b),v=bb-aa;
  float h=clamp(dot(p-aa,v)/max(dot(v,v),.000001),0.0,1.0);
  float d=length(p-aa-h*v),depth=mix(a.z,b.z,h);
  float light=stroke(d,width)+.12*exp(-d*55.0);
  return palette(tint+depth*.16)*light*clamp(.7+depth*.2,.35,1.1);
}
`;
const SOLID = `
vec3 pattern(vec2 p) {
  vec3 ro=vec3(0,0,3.4),rd=normalize(vec3(p,-2.5));float t=0.0;bool hit=false;
  for(int i=0;i<96;i++) {
    float d=modelField(ro+rd*t);if(d<.0018){hit=true;break;}
    t+=max(.001,d*.55);if(t>6.0)break;
  }
  if(!hit)return vec3(.006,.01,.02)+palette(.65)*.012*exp(-dot(p,p));
  vec3 q=ro+rd*t;vec2 e=vec2(.002,0);
  vec3 gradient=vec3(modelField(q+e.xyy)-modelField(q-e.xyy),
    modelField(q+e.yxy)-modelField(q-e.yxy),modelField(q+e.yyx)-modelField(q-e.yyx));
  vec3 n=gradient/max(length(gradient),.00001),light=normalize(vec3(-.7,1,1.5));
  float diffuse=max(dot(n,light),0.0),rim=pow(1.0-max(dot(n,-rd),0.0),3.0);
  float specular=pow(max(dot(reflect(rd,n),light),0.0),28.0);
  return palette(q.y*.35+q.z*.22)*(.18+.7*diffuse)+palette(.7)*rim*.3+vec3(specular*.3);
}
`;
const MESH = `
vec3 pattern(vec2 p) {
  vec3 color=vec3(.006,.009,.017);float count=uMeshDensity;
  for(int i=0;i<16;i++) {
    if(i>=int(count))break;
    for(int j=0;j<16;j++) {
      if(j>=int(count))break;
      vec2 uv=vec2(float(i),float(j))/count;
      vec3 a=spinModel(surfacePoint(uv));
      vec3 b=spinModel(surfacePoint(uv+vec2(1.0/count,0)));
      vec3 c=spinModel(surfacePoint(uv+vec2(0,1.0/count)));
      color=max(color,wireLine(p,a,b,.007,uv.y*.5));
      color=max(color,wireLine(p,a,c,.007,uv.y*.5));
    }
  }
  return color;
}
`;
const FOUR_D = `
vec3 projectFour(vec4 q) {
  q.xw=rotate(uAngle)*q.xw;q.yz=rotate(uAngle)*q.yz;
  q.zw=rotate(uTilt*sin(uAngle))*q.zw;
  vec3 v=q.xyz*uProjection/max(.8,uProjection-q.w);
  v.yz=rotate(.55)*v.yz;v.xz=rotate(.3)*v.xz;return v*uModelSize;
}
`;

export const EXPANDED_PRESETS = [
 {id:'tricorn',name:'Tricorn mirror',ko:'트라이콘 거울',category:'fractal',palette:2,
 description:'켤레 복소수의 제곱 반복으로 나타나는 세 갈래 프랙탈',
 code:`// @slider uIterations 48 256 16 144 | 반복 정밀도
// @slider uBreath 0 0.45 0.01 0.16 | 줌 호흡
// @slider uContour 0.02 0.12 0.005 0.055 | 등고선 밀도
vec3 pattern(vec2 p) {
  vec2 c=p*1.35*exp(uBreath*cos(uAngle))+vec2(-.18,0),z=vec2(0);float n=0.0;
  for(int i=0;i<256;i++) {
    if(i>=int(uIterations))break;
    z=vec2(z.x*z.x-z.y*z.y,-2.0*z.x*z.y)+c;n=float(i)+1.0;
    if(dot(z,z)>256.0)break;
  }
  if(n>=uIterations)return vec3(.006,.01,.024);
  float smoothN=n+1.0-log2(max(.001,log2(max(length(z),1.0001))));
  return palette(smoothN*uContour+.08*sin(uAngle))*(.35+.6*(1.0-exp(-smoothN*.16)));
}`},
 {id:'phoenix',name:'Phoenix memory',ko:'피닉스 기억 프랙탈',category:'fractal',palette:1,
 description:'이전 복소수 상태를 다시 더해 깃털처럼 갈라지는 프랙탈',
 code:`// @slider uIterations 48 192 16 112 | 반복 정밀도
// @slider uMemory -0.7 -0.1 0.01 -0.5 | 기억 계수
// @slider uConstant 0.3 0.7 0.005 0.566 | 복소 상수
vec3 pattern(vec2 p) {
  vec2 z=p*1.3,previous=vec2(0);float trap=10.0,n=0.0;
  vec2 c=vec2(uConstant,.012*sin(uAngle));
  for(int i=0;i<192;i++) {
    if(i>=int(uIterations))break;
    vec2 next=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c+uMemory*previous;
    previous=z;z=next;n=float(i)+1.0;trap=min(trap,abs(z.x)+abs(z.y)*.35);
    if(dot(z,z)>100.0)break;
  }
  if(n>=uIterations)return palette(trap*.3)*.04;
  return palette(n*.045+trap*.22)*(.3+.6*exp(-trap*2.0));
}`},
 {id:'magnet',name:'Magnet attractor',ko:'마그넷 끌개',category:'fractal',palette:0,
 description:'복소 유리함수의 제곱 반복이 만드는 탈출 영역과 끌개',
 code:`// @slider uIterations 24 128 8 64 | 반복 정밀도
// @slider uReal -0.5 1.5 0.01 0.7 | c 실수부
// @slider uOrbit 0 0.25 0.01 0.08 | 궤도 반경
vec2 magnetMultiply(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec3 pattern(vec2 p) {
  vec2 z=p*1.4,c=vec2(uReal,.35)+uOrbit*uCycle;float n=0.0,trap=10.0;
  for(int i=0;i<128;i++) {
    if(i>=int(uIterations))break;
    vec2 a=magnetMultiply(z,z)+c-vec2(1,0),b=2.0*z+c-vec2(2,0);
    vec2 ratio=vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),.00001);
    z=magnetMultiply(ratio,ratio);n=float(i)+1.0;
    trap=min(trap,length(z-vec2(1,0)));
    if(dot(z,z)>10000.0||trap<.0002)break;
  }
  return palette(n*.06+trap*.12)*(.18+.75*exp(-min(trap,8.0)*.6));
}`},
 {id:'lyapunov',name:'Lyapunov atlas',ko:'리아푸노프 지도',category:'fractal',palette:4,
 description:'두 로지스틱 계수를 번갈아 적용해 안정성과 혼돈을 시각화',
 code:`// @slider uIterations 32 96 8 64 | 반복 정밀도
// @slider uCenter 2.5 3.7 0.01 3.3 | 로지스틱 중심
// @slider uSpan 0.2 1.1 0.01 0.65 | 계수 탐색 폭
vec3 pattern(vec2 p) {
  vec2 rates=clamp(uCenter+p*uSpan+.06*uCycle,vec2(.5),vec2(3.98));
  float x=.5,sum=0.0,count=0.0;
  for(int i=0;i<108;i++) {
    if(i>=int(uIterations)+12)break;float r=i%4<2?rates.x:rates.y;
    x=clamp(r*x*(1.0-x),.00001,.99999);
    if(i>=12){sum+=log(max(abs(r*(1.0-2.0*x)),.00001));count+=1.0;}
  }
  float exponent=sum/max(count,1.0),border=exp(-abs(exponent)*9.0);
  return palette(exponent*.24+.45)*(.28+.55*border)+uColorC*.1*max(exponent,0.0);
}`},
 {id:'sierpinski-carpet',name:'Sierpinski carpet',ko:'시에르핀스키 카펫',category:'fractal',palette:3,
 description:'정사각형의 중앙을 재귀적으로 비워 만드는 아홉 칸 격자',
 code:`// @slider uDepth 2 6 1 4 | 재귀 깊이
// @slider uBreath 0 0.2 0.01 0.08 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 q=rotate(.12*sin(uAngle))*p*.45*exp(uBreath*cos(uAngle))+.5;
  if(any(lessThan(q,vec2(0)))||any(greaterThan(q,vec2(1))))return vec3(.008);
  float level=0.0,filled=1.0;
  for(int i=0;i<6;i++) {
    if(i>=int(uDepth))break;vec2 cell=floor(q*3.0);
    if(cell.x==1.0&&cell.y==1.0){filled=0.0;level=float(i);break;}
    q=fract(q*3.0);level=float(i)+1.0;
  }
  float edge=min(min(q.x,q.y),min(1.0-q.x,1.0-q.y));
  return palette(level*.13+.07*sin(uAngle))*(.045+filled*(.5+.3*exp(-edge*18.0)));
}`},
 {id:'vicsek',name:'Vicsek cross',ko:'빅섹 십자 프랙탈',category:'fractal',palette:0,
 description:'세로와 가로 십자 가지를 다섯 부분으로 되풀이하는 프랙탈',
 code:`// @slider uDepth 2 6 1 4 | 재귀 깊이
// @slider uTurn 0 0.3 0.01 0.12 | 흔들림 각도
vec3 pattern(vec2 p) {
  vec2 q=rotate(uTurn*sin(uAngle))*p*.44+.5;
  if(any(lessThan(q,vec2(0)))||any(greaterThan(q,vec2(1))))return vec3(.006,.01,.02);
  float filled=1.0,depth=0.0;
  for(int i=0;i<6;i++) {
    if(i>=int(uDepth))break;vec2 cell=floor(q*3.0);
    if(cell.x!=1.0&&cell.y!=1.0){filled=0.0;break;}
    q=fract(q*3.0);depth+=1.0;
  }
  return palette(length(p)*.3+depth*.08)*(.025+filled*(.7+.15*cos(uAngle+length(p)*5.0)));
}`},
 {id:'cantor-dust',name:'Cantor dust',ko:'칸토어 먼지',category:'fractal',palette:2,
 description:'중앙 행과 열을 제거해 네 모서리에 남기는 자기유사 점 집합',
 code:`// @slider uDepth 2 6 1 4 | 재귀 깊이
// @slider uBreath 0 0.25 0.01 0.1 | 줌 호흡
vec3 pattern(vec2 p) {
  vec2 q=rotate(uAngle)*p*.42*exp(uBreath*sin(uAngle))+.5;
  if(any(lessThan(q,vec2(0)))||any(greaterThan(q,vec2(1))))return vec3(.005,.009,.018);
  float filled=1.0,level=0.0;
  for(int i=0;i<6;i++) {
    if(i>=int(uDepth))break;vec2 cell=floor(q*3.0);
    if(cell.x==1.0||cell.y==1.0){filled=0.0;level=float(i);break;}
    q=fract(q*3.0);level=float(i)+1.0;
  }
  return palette(level*.14+length(p)*.12)*(.04+filled*.9);
}`},
 {id:'apollonian',name:'Inversion circle packing',ko:'반전 원 채움',category:'fractal',palette:1,
 description:'격자 접힘과 원 반전을 반복해 빈틈을 채우는 원형 프랙탈',
 code:`// @slider uDepth 3 9 1 6 | 재귀 깊이
// @slider uPacking 0.8 1.5 0.01 1.15 | 반전 배율
vec3 pattern(vec2 p) {
  vec2 q=p*.9+.04*uCycle;float scale=1.0,trap=10.0;
  for(int i=0;i<9;i++) {
    if(i>=int(uDepth))break;q=mod(q+1.0,2.0)-1.0;
    float factor=uPacking/max(dot(q,q),.045);q*=factor;scale*=factor;
    trap=min(trap,abs(length(q)-1.0)/max(scale,.001));
  }
  float line=exp(-trap*65.0),shade=exp(-length(q)/max(scale,.001)*4.0);
  return palette(log(max(scale,.001))*.065+trap*.8)*(.1+.65*line+.2*shade);
}`},
 {id:'kleinian',name:'Kleinian mirror',ko:'클라인 거울 프랙탈',category:'fractal',palette:4,
 description:'띠 접힘과 복소 반전이 만들어 내는 반복적인 원형 경계',
 code:`// @slider uDepth 4 16 1 10 | 재귀 깊이
// @slider uSpacing 0.6 1.5 0.01 1 | 거울 간격
// @slider uHeight 1.5 2.5 0.01 1.9 | 반전 높이
vec3 pattern(vec2 p) {
  vec2 q=p*1.8+.06*uCycle;float scale=1.0,trap=10.0;
  for(int i=0;i<16;i++) {
    if(i>=int(uDepth))break;
    q.x=mod(q.x+uSpacing,2.0*uSpacing)-uSpacing;q.y=abs(q.y);
    float inverse=1.0/max(dot(q,q),.025);
    q=vec2(q.x,-q.y)*inverse+vec2(0,uHeight);scale*=inverse;
    trap=min(trap,abs(q.y-uHeight*.5)/max(scale,.0001));
  }
  return palette(log(max(scale,.0001))*.08+trap*.15)*(.12+.78*exp(-trap*9.0));
}`},
 {id:'levy-curve',name:'Levy C curve',ko:'레비 C 곡선',category:'fractal',palette:0,
 description:'두 복소 축소 변환을 재귀적으로 이어 붙인 C 모양 곡선',
 code:`// @slider uDepth 2 7 1 6 | 재귀 깊이
// @slider uWidth 0.004 0.03 0.002 0.01 | 궤적 두께
${SEGMENT}
vec2 levyMultiply(vec2 a,vec2 b){return vec2(a.x*b.x-a.y*b.y,a.x*b.y+a.y*b.x);}
vec2 levyPoint(float t) {
  vec2 a=vec2(1,0),b=vec2(0);t=min(t,.999999);
  for(int j=0;j<7;j++) {
    if(j>=int(uDepth))break;
    if(t<.5){a=levyMultiply(a,vec2(.5,.5));t*=2.0;}
    else{b+=levyMultiply(a,vec2(.5,.5));a=levyMultiply(a,vec2(.5,-.5));t=t*2.0-1.0;}
  }
  return rotate(uAngle)*(b+levyMultiply(a,vec2(t,0))-vec2(.5,.25))*.82;
}
vec3 pattern(vec2 p) {
  float d=10.0,nearT=0.0,count=exp2(uDepth);vec2 previous=levyPoint(0.0);
  for(int i=1;i<=128;i++) {
    if(float(i)>count)break;float t=float(i)/count;vec2 current=levyPoint(t);
    float next=pathDistance(p,previous,current);if(next<d){d=next;nearT=t;}previous=current;
  }
  return palette(nearT)*(.85*stroke(d,uWidth)+.16*exp(-d*45.0));
}`},
 {id:'epicycloid',name:'Epicycloid wheel',ko:'에피사이클로이드',category:'geometry',palette:1,
 description:'큰 원의 바깥을 구르는 작은 원이 그리는 닫힌 궤적',
 code:`// @slider uCusps 2 10 1 5 | 첨점 수
// @slider uWidth 0.005 0.035 0.002 0.013 | 궤적 두께
${SEGMENT}
vec2 wheelPoint(float t) {
  float k=uCusps+1.0;
  return rotate(uAngle)*((k*vec2(cos(t),sin(t))-vec2(cos(k*t),sin(k*t)))*.82/(k+1.0));
}
vec3 pattern(vec2 p) {
  float d=10.0,nearT=0.0;vec2 previous=wheelPoint(0.0);
  for(int i=1;i<=160;i++) {
    float t=TAU*float(i)/160.0;vec2 current=wheelPoint(t);
    float next=pathDistance(p,previous,current);if(next<d){d=next;nearT=t/TAU;}previous=current;
  }
  return palette(nearT+.1*sin(uAngle))*(stroke(d,uWidth)+.12*exp(-d*35.0));
}`},
 {id:'hypotrochoid',name:'Hypotrochoid spirograph',ko:'하이포트로코이드',category:'geometry',palette:4,
 description:'원 안쪽을 구르는 원의 펜 위치로 만드는 스피로그래프',
 code:`// @slider uRatio 3 9 1 5 | 구름 반지름 비
// @slider uPen 0.2 2.2 0.05 1.5 | 펜 거리
// @slider uWidth 0.004 0.025 0.001 0.009 | 궤적 두께
${SEGMENT}
vec2 spiroPoint(float t) {
  float k=uRatio-1.0;vec2 q=k*vec2(cos(t),sin(t))+uPen*vec2(cos(k*t),-sin(k*t));
  return rotate(uAngle)*q*.85/(k+uPen);
}
vec3 pattern(vec2 p) {
  float d=10.0,nearT=0.0;vec2 previous=spiroPoint(0.0);
  for(int i=1;i<=160;i++) {
    float t=TAU*float(i)/160.0;vec2 current=spiroPoint(t);
    float next=pathDistance(p,previous,current);if(next<d){d=next;nearT=t/TAU;}previous=current;
  }
  return palette(nearT)*(.9*stroke(d,uWidth)+.18*exp(-d*40.0));
}`},
 {id:'superformula',name:'Superformula bloom',ko:'슈퍼포뮬러 꽃',category:'geometry',palette:0,
 description:'극좌표 슈퍼포뮬러의 지수를 바꿔 꽃과 별 사이를 오가는 윤곽',
 code:`// @slider uPetals 2 12 2 6 | 꽃잎 수
// @slider uExponent 0.5 8 0.1 2 | 곡면 지수
// @slider uPinch 0.3 4 0.1 0.9 | 윤곽 조임
// @slider uMorph 0 1 0.05 0.35 | 형태 변화
vec3 pattern(vec2 p) {
  float a=atan(p.y,p.x)+.2*sin(uAngle),r=length(p);
  float exponent=max(.3,uExponent+uMorph*sin(uAngle));
  float v=pow(abs(cos(uPetals*a*.25)),exponent)+pow(abs(sin(uPetals*a*.25)),exponent);
  float radius=clamp(.7*pow(max(v,.001),-1.0/uPinch),.15,.92);
  float d=r-radius,edge=stroke(d,.012),fill=1.0-smoothstep(-.02,.02,d);
  return palette(a/TAU+r*.25)*(.12*fill+.82*edge+.12*exp(-abs(d)*25.0));
}`},
 {id:'phyllotaxis',name:'Phyllotaxis seeds',ko:'황금각 씨앗 배열',category:'geometry',palette:3,
 description:'황금각과 제곱근 반지름으로 씨앗을 배치한 식물형 나선',
 code:`// @slider uSeeds 40 180 10 120 | 씨앗 수
// @slider uRadius 0.012 0.045 0.001 0.025 | 씨앗 반경
// @slider uBreath 0 0.25 0.01 0.1 | 줌 호흡
vec3 pattern(vec2 p) {
  vec3 color=vec3(.008);float scale=.82*(1.0+uBreath*sin(uAngle));
  for(int i=0;i<180;i++) {
    if(i>=int(uSeeds))break;float f=float(i),a=f*2.39996323+uAngle;
    vec2 center=scale*sqrt((f+.5)/uSeeds)*vec2(cos(a),sin(a));
    float d=length(p-center),dotLight=1.0-smoothstep(uRadius,uRadius+.004,d);
    color+=palette(f/uSeeds)*(.75*dotLight+.07*exp(-d*55.0));
  }
  return color;
}`},
 {id:'chladni',name:'Chladni resonance',ko:'클라드니 공명',category:'geometry',palette:2,
 description:'진동판의 두 정수 모드가 만드는 정상파 마디 무늬',
 code:`// @slider uModeX 1 9 1 3 | 가로 진동 모드
// @slider uModeY 1 9 1 5 | 세로 진동 모드
// @slider uMix 0.2 1.5 0.05 1 | 모드 혼합
vec3 pattern(vec2 p) {
  vec2 q=p+.025*uCycle;
  float first=cos(uModeX*PI*q.x)*cos(uModeY*PI*q.y);
  float second=cos(uModeY*PI*q.x)*cos(uModeX*PI*q.y);
  float field=first-uMix*second*(.8+.2*cos(uAngle));
  float line=exp(-abs(field)*20.0);
  return palette(field*.3+length(q)*.18)*(.08+.8*line);
}`},
 {id:'conformal-grid',name:'Mobius conformal grid',ko:'뫼비우스 변환 격자',category:'geometry',palette:4,
 description:'복소 뫼비우스 변환으로 휘어지는 직교 격자와 체크무늬',
 code:`// @slider uGrid 2 12 1 6 | 격자 밀도
// @slider uWarp 0.1 0.65 0.01 0.35 | 변환 강도
// @slider uLineWidth 0.015 0.12 0.005 0.04 | 격자 두께
vec3 pattern(vec2 p) {
  vec2 a=uWarp*uCycle,top=p-a;
  vec2 bottom=vec2(1.0-dot(a,p),a.y*p.x-a.x*p.y);
  vec2 q=vec2(dot(top,bottom),top.y*bottom.x-top.x*bottom.y)/max(dot(bottom,bottom),.005);
  vec2 wave=sin(q*uGrid*PI);float line=max(stroke(wave.x,uLineWidth),stroke(wave.y,uLineWidth));
  float checkers=.5+.5*sign(wave.x*wave.y);
  return palette(length(q)*.17)*(.07+.16*checkers+.65*line);
}`},
 {id:'braided-ribbons',name:'Braided ribbons',ko:'기하학 리본 땋기',category:'geometry',palette:1,
 description:'깊이가 번갈아 바뀌는 여러 리본을 엮은 주기적 땋기',
 code:`// @slider uStrands 2 5 1 3 | 리본 가닥 수
// @slider uFrequency 1 8 0.5 3 | 땋기 밀도
// @slider uWidth 0.03 0.16 0.005 0.08 | 리본 너비
vec3 pattern(vec2 p) {
  vec3 color=vec3(.007,.009,.017);float front=-2.0;
  for(int i=0;i<5;i++) {
    if(i>=int(uStrands))break;float fi=float(i),a=p.x*uFrequency+uAngle+fi*TAU/uStrands;
    float y=.45*sin(a),z=cos(a),d=abs(p.y-y);
    if(d<uWidth+.008&&z>front) {
      float coverage=1.0-smoothstep(uWidth,uWidth+.008,d);
      color=mix(color,palette(fi/uStrands)*(.38+.45*sqrt(max(0.0,1.0-d*d/(uWidth*uWidth)))),coverage);front=z;
    }
  }
  return color;
}`},
 {id:'chord-web',name:'Modular chord web',ko:'모듈러 현 그물',category:'geometry',palette:0,
 description:'원 위의 점을 정수 배수로 연결해 만드는 현의 포락선',
 code:`// @slider uPoints 24 96 8 64 | 연결 점 수
// @slider uMultiplier 2 9 1 3 | 연결 배수
// @slider uWidth 0.002 0.012 0.001 0.004 | 선 두께
${SEGMENT}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.005,.009,.018);
  for(int i=0;i<96;i++) {
    if(i>=int(uPoints))break;float t=TAU*float(i)/uPoints;
    vec2 a=.82*vec2(cos(t),sin(t)),b=.82*vec2(cos(t*uMultiplier+uAngle),sin(t*uMultiplier+uAngle));
    float d=pathDistance(p,a,b);color+=palette(float(i)/uPoints)*stroke(d,uWidth)*.28;
  }
  return color+palette(.4)*stroke(length(p)-.82,.008)*.6;
}`},
 {id:'gear-train',name:'Radial gear train',ko:'방사형 기어',category:'geometry',palette:3,
 description:'톱니와 살이 맞물려 반대 방향으로 도는 세 개의 기어',
 code:`// @slider uTeeth 8 24 1 14 | 톱니 수
// @slider uToothDepth 0.02 0.09 0.005 0.045 | 톱니 깊이
// @slider uSpokes 3 8 1 5 | 기어 살 수
vec3 pattern(vec2 p) {
  vec3 color=vec3(.007,.01,.018);
  for(int i=0;i<3;i++) {
    vec2 center=i==0?vec2(-.4,-.22):(i==1?vec2(.4,-.22):vec2(0,.473));
    vec2 q=p-center;float a=atan(q.y,q.x),r=length(q),angle=i==1?-uAngle:uAngle;
    float radius=.35+uToothDepth*(.5+.5*tanh(3.0*cos((a-angle)*uTeeth+float(i)*PI)));
    float disk=(1.0-smoothstep(radius-.004,radius+.004,r))*smoothstep(.08,.09,r);
    float spokes=.3+.7*stroke(sin((a-angle)*uSpokes),.3);
    color+=palette(float(i)*.27)*(disk*spokes*.55+stroke(r-radius,.008)*.55);
  }
  return color;
}`},
 {id:'origami-fan',name:'Origami folding fan',ko:'종이접기 부채',category:'geometry',palette:4,
 description:'삼각형 면의 높낮이를 번갈아 접는 입체 방사형 부채',
 code:`// @slider uPanels 6 24 2 12 | 접힘 면 수
// @slider uFold 0 0.8 0.02 0.45 | 접힘 높이
// @slider uSpread 0.45 1.1 0.01 0.85 | 펼침 반경
${WIRE}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.007,.009,.018);float front=-10.0;
  for(int i=0;i<24;i++) {
    if(i>=int(uPanels))break;float f=float(i),a=TAU*f/uPanels,b=TAU*(f+1.0)/uPanels;
    float fold=uFold*(.65+.35*cos(uAngle));
    vec3 v0=spinModel(vec3(0)),v1=spinModel(vec3(uSpread*cos(a),uSpread*sin(a),i%2==0?fold:-fold));
    vec3 v2=spinModel(vec3(uSpread*cos(b),uSpread*sin(b),i%2==0?-fold:fold));
    vec2 aa=projectPoint(v0),bb=projectPoint(v1),cc=projectPoint(v2),v=bb-aa,w=cc-aa,q=p-aa;
    float determinant=v.x*w.y-v.y*w.x;if(abs(determinant)<.00001)continue;
    float s=(q.x*w.y-q.y*w.x)/determinant,t=(v.x*q.y-v.y*q.x)/determinant;
    float edge=min(min(s,t),1.0-s-t),z=v0.z*(1.0-s-t)+v1.z*s+v2.z*t;
    if(edge>=0.0&&z>front) {
      vec3 normal=normalize(cross(v1-v0,v2-v0));float light=.25+.65*abs(dot(normal,normalize(vec3(-.5,1,1))));
      color=palette(f/uPanels)*light+palette(.7)*exp(-edge*80.0)*.12;front=z;
    }
  }
  return color;
}`},
 {id:'tesseract',name:'Tesseract / 4D hypercube',ko:'테서랙트 초입방체',category:'volume',palette:0,
 description:'16개 꼭짓점과 32개 모서리를 가진 4차원 초입방체의 회전 투영',
 code:`// @slider uProjection 2 5 0.1 3 | 4차원 투영 거리
// @slider uTilt 0 1.5 0.05 0.7 | 4차원 기울기
// @slider uModelSize 0.45 1.4 0.05 0.95 | 모델 크기
// @slider uWidth 0.003 0.025 0.001 0.009 | 모서리 두께
${WIRE}${FOUR_D}
vec3 pattern(vec2 p) {
  vec3 vertices[16];
  for(int i=0;i<16;i++) {
    vec4 q=vec4((i&1)==0?-1.0:1.0,(i&2)==0?-1.0:1.0,(i&4)==0?-1.0:1.0,(i&8)==0?-1.0:1.0)*.52;
    vertices[i]=projectFour(q);
  }
  vec3 color=vec3(.005,.009,.018);
  for(int i=0;i<16;i++)for(int axis=0;axis<4;axis++) {
    int j=i^(1<<axis);if(i<j)color=max(color,wireLine(p,vertices[i],vertices[j],uWidth,float(axis)*.19));
  }
  return color;
}`},
 {id:'sixteen-cell',name:'16-cell / 4D cross-polytope',ko:'16셀 교차 다면체',category:'volume',palette:1,
 description:'네 축 위의 8개 꼭짓점을 24개 모서리로 잇는 4차원 교차 다면체',
 code:`// @slider uProjection 2 5 0.1 3 | 4차원 투영 거리
// @slider uTilt 0 1.5 0.05 0.8 | 4차원 기울기
// @slider uModelSize 0.5 1.5 0.05 1.05 | 모델 크기
// @slider uWidth 0.003 0.025 0.001 0.009 | 모서리 두께
${WIRE}${FOUR_D}
vec3 pattern(vec2 p) {
  vec3 vertices[8];
  for(int i=0;i<8;i++){vec4 q=vec4(0);q[i/2]=i%2==0?.9:-.9;vertices[i]=projectFour(q);}
  vec3 color=vec3(.007,.009,.017);
  for(int i=0;i<8;i++)for(int j=0;j<8;j++) {
    if(j>i&&i/2!=j/2)color=max(color,wireLine(p,vertices[i],vertices[j],uWidth,float(i+j)*.08));
  }
  return color;
}`},
 {id:'twenty-four-cell',name:'24-cell / 4D lattice',ko:'24셀 정다포체',category:'volume',palette:2,
 description:'두 축에만 좌표를 둔 24개 꼭짓점과 96개 모서리의 4차원 격자',
 code:`// @slider uProjection 2 5 0.1 3.5 | 4차원 투영 거리
// @slider uTilt 0 1.5 0.05 0.6 | 4차원 기울기
// @slider uModelSize 0.4 1.2 0.05 0.8 | 모델 크기
// @slider uWidth 0.002 0.02 0.001 0.005 | 모서리 두께
${WIRE}${FOUR_D}
vec3 pattern(vec2 p) {
  vec4 original[24];vec3 vertices[24];int index=0;
  for(int a=0;a<4;a++)for(int b=0;b<4;b++) {
    if(b<=a)continue;
    for(int sign=0;sign<4;sign++) {
      vec4 q=vec4(0);q[a]=(sign&1)==0?-.65:.65;q[b]=(sign&2)==0?-.65:.65;
      original[index]=q;vertices[index]=projectFour(q);index++;
    }
  }
  vec3 color=vec3(.006,.009,.018);
  for(int i=0;i<24;i++)for(int j=0;j<24;j++) {
    if(j<=i)continue;vec4 delta=original[i]-original[j];
    if(abs(dot(delta,delta)-.845)<.01)color=max(color,wireLine(p,vertices[i],vertices[j],uWidth,float(i)*.055));
  }
  return color;
}`},
 {id:'icosahedron',name:'Icosahedron cage',ko:'정이십면체 케이지',category:'volume',palette:3,
 description:'황금비 좌표로 만든 12개 꼭짓점과 30개 모서리의 정이십면체',
 code:`// @slider uModelSize 0.35 0.8 0.01 0.52 | 모델 크기
// @slider uWidth 0.003 0.025 0.001 0.009 | 모서리 두께
${WIRE}
vec3 pattern(vec2 p) {
  vec3 original[12];vec3 vertices[12];float golden=1.61803399;
  for(int i=0;i<12;i++) {
    int sign=i%4;float a=(sign&1)==0?-1.0:1.0,b=(sign&2)==0?-golden:golden;
    vec3 q=i<4?vec3(0,a,b):(i<8?vec3(a,b,0):vec3(b,0,a));
    original[i]=q;vertices[i]=spinModel(q*uModelSize);
  }
  vec3 color=vec3(.006,.009,.018);
  for(int i=0;i<12;i++)for(int j=0;j<12;j++) {
    if(j<=i)continue;vec3 delta=original[i]-original[j];
    if(abs(dot(delta,delta)-4.0)<.01)color=max(color,wireLine(p,vertices[i],vertices[j],uWidth,float(i)*.08));
  }
  return color;
}`},
 {id:'torus-knot',name:'Torus knot',ko:'토러스 매듭',category:'volume',palette:4,
 description:'고리의 두 방향을 정수 횟수로 감아 만든 닫힌 3D 매듭',
 code:`// @slider uWinding 2 5 1 2 | 고리 감김 수
// @slider uLobes 3 7 1 3 | 단면 감김 수
// @slider uTube 0.1 0.3 0.01 0.2 | 매듭 굴곡
// @slider uWidth 0.004 0.03 0.002 0.014 | 궤적 두께
${WIRE}
vec3 knotPoint(float t) {
  float r=.62+uTube*cos(uLobes*t);
  return spinModel(vec3(r*cos(uWinding*t),uTube*sin(uLobes*t),r*sin(uWinding*t)));
}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.006,.009,.018),previous=knotPoint(0.0);
  for(int i=1;i<=144;i++) {
    float t=TAU*float(i)/144.0;vec3 current=knotPoint(t);
    color=max(color,wireLine(p,previous,current,uWidth,t/TAU));previous=current;
  }
  return color;
}`},
 {id:'mobius-strip',name:'Mobius strip mesh',ko:'뫼비우스 띠 메시',category:'volume',palette:0,
 description:'한 바퀴에서 반 바퀴 뒤집히는 단면을 가진 한쪽 면의 띠',
 code:`// @slider uMeshDensity 6 16 1 12 | 메시 분할 수
// @slider uBandWidth 0.12 0.45 0.01 0.28 | 띠 너비
${WIRE}
vec3 surfacePoint(vec2 uv) {
  float a=uv.x*TAU,v=(uv.y*2.0-1.0)*uBandWidth,r=.6+v*cos(a*.5);
  return vec3(r*cos(a),v*sin(a*.5),r*sin(a));
}
${MESH}`},
 {id:'enneper',name:'Enneper saddle',ko:'에네페르 안장 곡면',category:'volume',palette:2,
 description:'다항식 매개변수로 만든 자기교차 안장형 최소곡면',
 code:`// @slider uMeshDensity 6 16 1 12 | 메시 분할 수
// @slider uExtent 0.7 1.6 0.05 1.2 | 곡면 범위
${WIRE}
vec3 surfacePoint(vec2 uv) {
  vec2 q=(uv*2.0-1.0)*uExtent;float s=q.x,t=q.y;
  return vec3(s-s*s*s/3.0+s*t*t,s*s-t*t,t-t*t*t/3.0+t*s*s)*.3;
}
${MESH}`},
 {id:'dini',name:'Dini spiral surface',ko:'디니 나선 곡면',category:'volume',palette:1,
 description:'음의 곡률을 가진 곡면을 축 방향으로 비틀어 올린 나선',
 code:`// @slider uMeshDensity 6 16 1 14 | 메시 분할 수
// @slider uTurns 1 3 1 2 | 나선 회전 수
// @slider uPitch 0.03 0.2 0.01 0.1 | 나선 상승 폭
${WIRE}
vec3 surfacePoint(vec2 uv) {
  float a=uv.x*TAU*uTurns,v=.35+uv.y*2.25;
  float height=cos(v)+log(max(tan(v*.5),.001))+uPitch*(a-PI*uTurns);
  return vec3(cos(a)*sin(v),height,sin(a)*sin(v))*.55;
}
${MESH}`},
 {id:'menger',name:'Menger sponge',ko:'멩거 스펀지',category:'fractal',palette:3,
 description:'정육면체에서 십자 통로를 반복해 비워 만드는 입체 프랙탈',
 code:`// @slider uDepth 1 3 1 2 | 재귀 깊이
// @slider uModelSize 0.5 1 0.05 0.75 | 모델 크기
${WIRE}
float modelField(vec3 p) {
  vec3 q=spinModel(p)/uModelSize,a=abs(q)-1.0;
  float d=length(max(a,0.0))+min(max(a.x,max(a.y,a.z)),0.0),scale=1.0;
  for(int i=0;i<3;i++) {
    if(i>=int(uDepth))break;vec3 cell=abs(mod(q*scale+1.0,2.0)-1.0)-1.0/3.0;
    float crossHole=min(max(cell.x,cell.y),min(max(cell.y,cell.z),max(cell.z,cell.x)));
    d=max(d,-crossHole/scale);scale*=3.0;
  }
  return d*uModelSize;
}
${SOLID}`},
 {id:'mandelbulb',name:'Mandelbulb sculpture',ko:'만델벌브 조각',category:'fractal',palette:0,
 description:'구면 좌표의 거듭제곱 반복으로 솟아나는 입체 프랙탈',
 code:`// @slider uPower 3 10 1 8 | 프랙탈 차수
// @slider uIterations 4 10 1 7 | 반복 정밀도
${WIRE}
float modelField(vec3 p) {
  p=spinModel(p);vec3 z=p;float derivative=1.0,r=0.0;
  for(int i=0;i<10;i++) {
    if(i>=int(uIterations))break;r=length(z);if(r>3.0)break;
    r=max(r,.0001);float theta=acos(clamp(z.z/r,-1.0,1.0)),phi=atan(z.y,z.x);
    derivative=pow(r,uPower-1.0)*uPower*derivative+1.0;
    float radius=pow(r,uPower);theta*=uPower;phi*=uPower;
    z=radius*vec3(sin(theta)*cos(phi),sin(theta)*sin(phi),cos(theta))+p;
  }
  r=max(length(z),.0001);
  return max(.5*log(r)*r/max(derivative,.0001),length(p)-1.3);
}
${SOLID}`},
 {id:'octahedron',name:'Hollow octahedral crystal',ko:'속 빈 팔면체 결정',category:'volume',palette:2,
 description:'팔면체의 평면과 구형 내부 공간을 조합한 회전 결정',
 code:`// @slider uCavity 0.3 0.9 0.01 0.74 | 내부 공동 반경
// @slider uRound 0 0.12 0.005 0.035 | 모서리 둥글기
${WIRE}
float modelField(vec3 p) {
  vec3 q=spinModel(p);float shell=(abs(q.x)+abs(q.y)+abs(q.z)-1.15)*.57735027-uRound;
  return max(shell,uCavity-length(q));
}
${SOLID}`},
 {id:'harmonic-sphere',name:'Spherical harmonic shell',ko:'구면 조화 껍질',category:'volume',palette:4,
 description:'경도와 위도의 정수 파동으로 표면이 물결치는 구형 조각',
 code:`// @slider uLobes 2 8 1 4 | 경도 굴곡 수
// @slider uBands 2 8 1 3 | 위도 굴곡 수
// @slider uRelief 0.02 0.18 0.01 0.1 | 표면 굴곡
${WIRE}
float modelField(vec3 p) {
  vec3 q=spinModel(p);float r=max(length(q),.0001),theta=acos(clamp(q.y/r,-1.0,1.0)),phi=atan(q.z,q.x);
  float wave=sin(theta*uBands)*cos(phi*uLobes)*sin(theta);
  return (r-(.72+uRelief*wave*cos(uAngle)))*.4;
}
${SOLID}`}
];
