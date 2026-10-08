/** Six distinct planar constructions. Every helper is in the editable shader;
 * work is bounded and animation uses integer harmonics or periodic transforms. */
const SEGMENT = `
float planarSegment(vec2 p,vec2 a,vec2 b) {
  vec2 v=b-a;float h=clamp(dot(p-a,v)/max(dot(v,v),.000001),0.0,1.0);
  return length(p-a-v*h);
}
`;

export const PLANAR_PRESETS = [
 {id:'penrose',name:'Penrose rhombi',ko:'펜로즈 마름모',category:'geometry',palette:3,
 description:'황금비로 분할한 로빈슨 삼각형을 짝지은 비주기적 P3 마름모 타일',
 code:`// @slider uDepth 2 6 1 4 | 타일 분할 깊이
// @slider uTileSize 0.7 1.8 0.05 1.35 | 타일 영역 크기
// @slider uThickness 0.002 0.02 0.001 0.006 | 타일 경계 두께
${SEGMENT}
float penroseCross(vec2 a,vec2 b){return a.x*b.y-a.y*b.x;}
bool penroseInside(vec2 p,vec2 a,vec2 b,vec2 c) {
  vec3 d=vec3(penroseCross(b-a,p-a),penroseCross(c-b,p-b),penroseCross(a-c,p-c));
  return all(greaterThanEqual(d,vec3(-.000001)))||all(lessThanEqual(d,vec3(.000001)));
}
vec3 pattern(vec2 p) {
  vec3 bg=vec3(.008,.012,.02);vec2 q=rotate(.16*sin(uAngle))*p/uTileSize;
  float sector=floor(mod(atan(q.y,q.x),TAU)/(TAU/10.0));
  float a0=sector*TAU/10.0,a1=(sector+1.0)*TAU/10.0;
  vec2 A=vec2(0),B=vec2(cos(a0),sin(a0)),C=vec2(cos(a1),sin(a1));
  if(mod(sector,2.0)>0.5){vec2 swap=B;B=C;C=swap;}
  if(!penroseInside(q,A,B,C))return bg;
  int kind=0;const float golden=1.61803398875;
  // Robinson substitution: two children for an acute triangle, three for an obtuse one.
  for(int i=0;i<6;i++) {
    if(i>=int(uDepth))break;
    if(kind==0) {
      vec2 P=A+(B-A)/golden;
      if(penroseInside(q,C,P,B)){A=C;C=B;B=P;}
      else {B=C;C=A;A=P;kind=1;}
    }else {
      vec2 Q=B+(A-B)/golden,R=B+(C-B)/golden;
      if(penroseInside(q,R,C,A)){B=C;C=A;A=R;}
      else if(penroseInside(q,Q,R,B)){A=Q;C=B;B=R;}
      else {C=A;A=R;B=Q;kind=0;}
    }
  }
  // BC is the shared diagonal of paired half-rhombi; draw only AB and AC.
  float edge=min(planarSegment(q,A,B),planarSegment(q,A,C));
  vec2 center=(B+C)*.5;
  float pulse=.5+.5*cos(uAngle+length(center)*8.0);
  vec3 fill=palette(float(kind)*.29+length(center)*.16)*(.26+.18*pulse);
  return fill+palette(.64+float(kind)*.12)*stroke(edge,uThickness)*.7;
}`},
 {id:'hyperbolic',name:'Hyperbolic tessellation',ko:'쌍곡 평면 타일링',category:'geometry',palette:2,
 description:'푸앵카레 원판에서 직교 원 반사로 펼치는 정규 {p,3} 타일링',
 code:`// @slider uSides 7 10 1 7 | 다각형 변 수
// @slider uOrbit 0 0.45 0.01 0.2 | 원판 이동 반경
// @slider uThickness 0.002 0.012 0.001 0.004 | 측지선 두께
vec2 hyperbolicDivide(vec2 a,vec2 b){return vec2(dot(a,b),a.y*b.x-a.x*b.y)/max(dot(b,b),.00001);}
vec3 pattern(vec2 p) {
  vec3 bg=vec3(.006,.012,.026);vec2 z=p/1.02;float radial=length(z);
  if(radial>.995)return bg+palette(.65)*stroke(radial-.995,.003)*.3;
  vec2 shift=uOrbit*uCycle;
  vec2 denominator=vec2(1.0-dot(shift,z),shift.y*z.x-shift.x*z.y);
  vec2 q=hyperbolicDivide(z-shift,denominator);
  float scale=(1.0-dot(shift,shift))/max(dot(denominator,denominator),.00001);
  // q=3, p>=7 always satisfies 1/p+1/q<1/2; no Euclidean/spherical combinations.
  float sectorHalf=PI/uSides,corner=PI/3.0;
  float ch=cos(sectorHalf)*cos(corner)/max(sin(sectorHalf)*sin(corner),.00001);
  float vertex=sqrt(max(.00001,(ch-1.0)/(ch+1.0)));
  float center=(1.0+vertex*vertex)/(2.0*vertex*cos(sectorHalf));
  float radius=sqrt(max(.00001,center*center-1.0));
  float reflections=0.0;
  for(int i=0;i<28;i++) {
    float sector=floor(atan(q.y,q.x)/(2.0*sectorHalf)+.5)*(2.0*sectorHalf);
    q=rotate(sector)*q;
    vec2 v=q-vec2(center,0);float lengthSquared=dot(v,v);
    if(lengthSquared>=radius*radius-.000001)break;
    float inversion=radius*radius/max(lengthSquared,.00001);
    q=vec2(center,0)+v*inversion;scale=min(scale*inversion,100000.0);reflections+=1.0;
  }
  float distanceToEdge=abs(length(q-vec2(center,0))-radius)/max(scale,.00001);
  float edge=stroke(distanceToEdge,uThickness);
  float fade=1.0-smoothstep(.975,.995,radial);
  vec3 fill=palette(reflections*.145+length(q)*.25+.045*sin(uAngle))*.34;
  return mix(bg,fill+palette(.68+reflections*.08)*edge*.66,fade);
}`},
 {id:'islamic-stars',name:'Hankin star lattice',ko:'행킨 별 격자',category:'geometry',palette:0,
 description:'팔각형·정사각형 타일의 변 중점에서 이어지는 별과 교차 띠',
 code:`// @slider uDensity 1 4 0.1 2 | 격자 밀도
// @slider uContact 25 70 1 55 | 띠 접촉각
// @slider uThickness 0.008 0.045 0.001 0.02 | 교차 띠 두께
${SEGMENT}
vec2 hankinMotif(vec2 q,float sides,float apothem,float orientation) {
  float sectorHalf=PI/sides,beta=PI*.5-uContact*PI/180.0;
  float inner=apothem*sin(beta)/max(.001,sin(beta+sectorHalf));
  vec2 distances=vec2(10);
  for(int k=0;k<8;k++) {
    if(k>=int(sides))break;
    float a=orientation+float(k)*TAU/sides;
    vec2 M=apothem*vec2(cos(a),sin(a));
    vec2 N=apothem*vec2(cos(a+2.0*sectorHalf),sin(a+2.0*sectorHalf));
    vec2 V=inner*vec2(cos(a+sectorHalf),sin(a+sectorHalf));
    distances.x=min(distances.x,planarSegment(q,M,V));
    // The under-strand stops before the shared midpoint, leaving an over/under gap.
    float shorten=min(.3,2.4*uThickness/max(length(N-V),.0001));
    distances.y=min(distances.y,planarSegment(q,V,mix(V,N,1.0-shorten)));
  }
  return distances;
}
vec3 pattern(vec2 p) {
  vec2 world=rotate(.075*sin(uAngle))*p*uDensity;
  // Regular 4.8.8 tiling: octagons at integer centers, squares in the corner gaps.
  vec2 octagon=fract(world+.5)-.5,diamond=fract(world)-.5;
  vec2 oct=hankinMotif(octagon,8.0,.5,0.0);
  vec2 sq=hankinMotif(diamond,4.0,(sqrt(2.0)-1.0)*.5,PI*.25);
  vec2 d=min(oct,sq);
  float over=stroke(d.x,uThickness),under=stroke(d.y,uThickness);
  float shimmer=.8+.2*cos(uAngle+world.x*1.7+world.y*1.3);
  return vec3(.007,.015,.024)+palette(.1+world.x*.025)*under*.55
    +palette(.64+world.y*.03)*over*shimmer+.06*palette(.35)*exp(-min(d.x,d.y)*28.0);
}`},
 {id:'fourier-epicycles',name:'Fourier epicycles',ko:'푸리에 회전원',category:'geometry',palette:4,
 description:'양·음의 정수 고조파 회전원 합으로 그리는 닫힌 푸리에 경로',
 code:`// @slider uHarmonics 3 6 1 5 | 고조파 수
// @slider uFalloff 0.8 2.2 0.05 1.35 | 고조파 감쇠
// @slider uShape 0 1 0.05 0.45 | 고조파 상대 위상
${SEGMENT}
vec2 fourierTerm(int k,float angle) {
  float n=float(k)+1.0,frequency=k%2==0?n:-n;
  float radius=.55/pow(n,uFalloff),phase=frequency*angle+uShape*n*n*.48;
  return radius*vec2(cos(phase),sin(phase));
}
vec2 fourierPath(float angle) {
  vec2 point=vec2(0);
  for(int k=0;k<6;k++){if(k>=int(uHarmonics))break;point+=fourierTerm(k,angle);}
  return point;
}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.008,.012,.027);vec2 previous=fourierPath(0.0);
  // A fixed closed polyline previews the analytic Fourier sum; no frame history/reset.
  for(int j=1;j<=72;j++) {
    float t=float(j)/72.0;vec2 point=fourierPath(t*TAU);
    float d=planarSegment(p,previous,point);
    color=max(color,palette(t*.85)*stroke(d,.007)*.6);previous=point;
  }
  vec2 center=vec2(0);
  for(int k=0;k<6;k++) {
    if(k>=int(uHarmonics))break;
    vec2 term=fourierTerm(k,uAngle),end=center+term;
    float circle=stroke(length(p-center)-length(term),.003);
    float arm=stroke(planarSegment(p,center,end),.003);
    color+=palette(float(k)*.16)*(circle*.17+arm*.24);
    center=end;
  }
  float tracer=stroke(length(p-center),.025);
  return color+palette(.2)*tracer+.2*palette(.6)*exp(-length(p-center)*35.0);
}`},
 {id:'pendulum-waves',name:'Pendulum waves',ko:'진자 파동',category:'geometry',palette:2,
 description:'정수 진동 횟수를 가진 진자들의 위상 정렬과 파동',
 code:`// @slider uPendulums 6 16 1 12 | 진자 수
// @slider uSwing 0.1 0.65 0.01 0.38 | 진자 진폭
// @slider uBaseCycles 2 6 1 3 | 기본 진동 횟수
${SEGMENT}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.005,.012,.025);
  color+=palette(.55)*stroke(planarSegment(p,vec2(-1.42,.62),vec2(1.42,.62)),.006)*.45;
  // Prescribed small-angle harmonic motion, not a large-angle physical integrator.
  // Short loops cap integer frequencies at 2 Hz to avoid a rapidly aliased preview.
  float frequencyCap=max(1.0,floor(uDuration*2.0));
  for(int i=0;i<16;i++) {
    if(i>=int(uPendulums))break;
    float index=float(i),x=mix(-1.28,1.28,index/max(uPendulums-1.0,1.0));
    float frequency=min(uBaseCycles+index,frequencyCap);
    float rod=.58+.25*uBaseCycles/(uBaseCycles+index);
    float angle=uSwing*sin(uAngle*frequency);
    vec2 pivot=vec2(x,.62),bob=pivot+rod*vec2(sin(angle),-cos(angle));
    vec3 tint=palette(index/(uPendulums+1.0)*.85);
    color+=tint*stroke(planarSegment(p,pivot,bob),.004)*.32;
    color+=tint*stroke(length(p-bob),.031)*.83;
    color+=tint*exp(-length(p-bob)*45.0)*.12;
  }
  return color;
}`},
 {id:'reuleaux',name:'Reuleaux rotor',ko:'뢸로 삼각형 회전자',category:'geometry',palette:1,
 description:'세 원판의 교집합으로 만든 일정한 폭의 삼각형이 정사각형 안에서 회전',
 code:`// @slider uWidth 0.7 1.7 0.05 1.3 | 일정한 폭
// @slider uThickness 0.003 0.025 0.001 0.009 | 윤곽 두께
// @slider uGuides 0 0.6 0.05 0.15 | 생성 삼각형 표시
${SEGMENT}
vec2 reuleauxVertex(int index,float angle) {
  float a=PI*.5+float(index)*TAU/3.0;
  return rotate(angle)*(uWidth/sqrt(3.0)*vec2(cos(a),sin(a)));
}
float reuleauxSupport(vec2 direction,float angle) {
  float support=-10.0;
  for(int i=0;i<3;i++) {
    vec2 vertex=reuleauxVertex(i,angle);
    support=max(support,dot(vertex,direction));
    vec2 candidate=vertex+uWidth*direction;bool inside=true;
    for(int j=0;j<3;j++)if(length(candidate-reuleauxVertex(j,angle))>uWidth+.00001)inside=false;
    if(inside)support=max(support,dot(candidate,direction));
  }
  return support;
}
vec3 pattern(vec2 p) {
  float turn=-uAngle;
  // Center the bounding box by exact support extrema; every axis remains width uWidth.
  vec2 shift=-.5*vec2(reuleauxSupport(vec2(1,0),turn)-reuleauxSupport(vec2(-1,0),turn),
    reuleauxSupport(vec2(0,1),turn)-reuleauxSupport(vec2(0,-1),turn));
  vec2 q=rotate(uAngle)*(p-shift);float field=-10.0,triangle=10.0;
  for(int i=0;i<3;i++) {
    vec2 a=reuleauxVertex(i,0.0),b=reuleauxVertex((i+1)%3,0.0);
    field=max(field,length(q-a)-uWidth);triangle=min(triangle,planarSegment(q,a,b));
  }
  float filled=1.0-smoothstep(-.002,.002,field),outline=stroke(field,uThickness);
  vec2 box=abs(p)-vec2(uWidth*.5);
  float square=max(box.x,box.y);
  vec3 color=vec3(.012,.009,.022)+palette(.68)*stroke(square,.003)*.3;
  color+=palette(q.y/uWidth*.2+.08*sin(uAngle))*(filled*.19+outline*.73);
  color+=palette(.48)*stroke(triangle,.004)*uGuides;
  return color;
}`}
];
