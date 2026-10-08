/** Analytic spatial models. Every exported shader embeds its own helpers,
 * uses bounded work, and depends only on the current periodic phase.
 * Equations: Karcher's 3D-XplorMath Klein bottle / associate family / sphere
 * inversion; Hopf fibers are simultaneous complex-circle rotations in S3.
 */
const WIRE = `
vec3 spatialSpin(vec3 q) {
  q.xz=rotate(uAngle)*q.xz;q.yz=rotate(.45+.2*sin(uAngle))*q.yz;return q;
}
vec2 spatialProject(vec3 q) {return q.xy*2.8/max(1.2,3.6-q.z);}
vec3 spatialLine(vec2 p,vec3 a,vec3 b,float width,float tint) {
  vec2 start=spatialProject(a),end=spatialProject(b),edge=end-start;
  float h=clamp(dot(p-start,edge)/max(dot(edge,edge),.000001),0.0,1.0);
  float d=length(p-start-h*edge),depth=mix(a.z,b.z,h);
  float light=stroke(d,width)+.09*exp(-d*65.0);
  return palette(tint+depth*.15)*light*clamp(.8+depth*.18,.4,1.15);
}
`;
const MESH = `
vec3 pattern(vec2 p) {
  vec3 color=vec3(.006,.009,.018);const float count=8.0;
  for(int i=0;i<8;i++)for(int j=0;j<8;j++) {
    vec2 uv=vec2(float(i),float(j))/count;
    vec3 a=spatialSpin(surfacePoint(uv));
    vec3 b=spatialSpin(surfacePoint(uv+vec2(1.0/count,0)));
    vec3 c=spatialSpin(surfacePoint(uv+vec2(0,1.0/count)));
    vec3 ab=spatialSpin(surfacePoint(uv+vec2(.5/count,0)));
    vec3 ac=spatialSpin(surfacePoint(uv+vec2(0,.5/count)));
    color=max(color,spatialLine(p,a,ab,.006,uv.y*.55));
    color=max(color,spatialLine(p,ab,b,.006,uv.y*.55));
    color=max(color,spatialLine(p,a,ac,.006,uv.x*.55+.18));
    color=max(color,spatialLine(p,ac,c,.006,uv.x*.55+.18));
  }
  return color;
}
`;

export const SPATIAL_PRESETS = [
 {id:'klein-bottle',name:'Klein bottle immersion',ko:'클라인 병 투영',category:'volume',palette:4,
 description:'8자 단면을 반 바퀴 비틀어 닫은 클라인 병의 자기 교차 3D 표현',
 code:`// @slider uRingRadius 1.8 3 0.05 2.1 | 병 중심 반경
// @slider uSectionSize 0.35 1 0.05 0.8 | 8자 단면 크기
// @slider uSectionBreath 0 0.3 0.01 0.16 | 단면 호흡
${WIRE}
vec3 surfacePoint(vec2 uv) {
  float u=uv.x*TAU,v=uv.y*TAU;
  float size=uSectionSize*(1.0+uSectionBreath*sin(uAngle));
  float radial=uRingRadius+size*(cos(v*.5)*sin(u)-sin(v*.5)*sin(2.0*u));
  float height=size*(sin(v*.5)*sin(u)+cos(v*.5)*sin(2.0*u));
  return vec3(radial*cos(v),height,radial*sin(v))*.3;
}
${MESH}`},
 {id:'catenoid-helicoid',name:'Catenoid–helicoid morph',ko:'카테노이드·헬리코이드 변형',category:'volume',palette:2,
 description:'같은 계량을 가진 카테노이드와 헬리코이드 사이를 오가는 연속 극소곡면',
 code:`// @slider uNeckRadius 0.18 0.42 0.01 0.3 | 곡면 목 반경
// @slider uSurfaceExtent 0.7 1.8 0.05 1.2 | 곡면 펼침 범위
// @slider uAssociate 0 1 0.05 0.5 | 극소곡면 변형 위치
// @slider uAssociateTravel 0 1 0.05 1 | 극소곡면 왕복 폭
${WIRE}
vec3 surfacePoint(vec2 uv) {
  float u=(uv.x*2.0-1.0)*PI,v=(uv.y*2.0-1.0)*uSurfaceExtent;
  float alpha=PI*.5*clamp(uAssociate+.5*uAssociateTravel*sin(uAngle),0.0,1.0);
  float c=cos(alpha),s=sin(alpha),sh=sinh(v),ch=cosh(v);
  vec3 q=vec3(c*sh*sin(u)+s*ch*cos(u),
    c*u+s*v,-c*sh*cos(u)+s*ch*sin(u));
  return q*uNeckRadius*1.05;
}
${MESH}`},
 {id:'cyclide',name:'Dupin inversion cyclide',ko:'뒤팽 반전 사이클라이드',category:'volume',palette:1,
 description:'토러스를 구에 반전시켜 원형 곡률선을 유지하는 비대칭 사이클라이드',
 code:`// @slider uMajorRadius 0.65 0.95 0.05 0.8 | 원환 중심 반경
// @slider uMinorRadius 0.15 0.35 0.01 0.27 | 원환 단면 반경
// @slider uInversionOffset 0 0.65 0.05 0.45 | 반전 중심 이동
// @slider uInversionRadius 0.65 1.1 0.05 0.95 | 반전 구 반경
${WIRE}
vec3 surfacePoint(vec2 uv) {
  float u=uv.x*TAU,v=uv.y*TAU;
  float radius=uMajorRadius+uMinorRadius*cos(u);
  vec3 torus=vec3(radius*cos(v),radius*sin(v),uMinorRadius*sin(u));
  // The inversion center stays above the torus: distance >= .8-.35.
  vec3 center=vec3(uInversionOffset,0,.8),delta=torus-center;
  float inverseScale=uInversionRadius*uInversionRadius;
  vec3 inverted=center+inverseScale*delta/max(dot(delta,delta),.0001);
  vec3 anchor=center-inverseScale*center/max(dot(center,center),.0001);
  vec3 q=(inverted-anchor)*.9;
  q.xz=rotate(-.65)*q.xz;
  q.yz=rotate(.25*sin(uAngle))*q.yz;
  return q;
}
${MESH}`},
 {id:'hopf-fibers',name:'Hopf linked fibers',ko:'호프 연결 섬유',category:'volume',palette:0,
 description:'3차원 구면 S³의 실제 호프 섬유를 입체 투영한 서로 연결된 원 묶음',
 code:`// @slider uFiberCount 3 9 1 6 | 호프 섬유 수
// @slider uBasePolar 0.5 1.6 0.05 1.2 | 밑구면 극각
// @slider uPolarTravel 0 0.25 0.01 0.16 | 밑구면 왕복 폭
// @slider uFiberWidth 0.003 0.02 0.001 0.007 | 호프 섬유 두께
${WIRE}
vec3 fiberPoint(float t,float base) {
  float polar=uBasePolar+uPolarTravel*sin(uAngle);
  float a=cos(polar*.5),b=sin(polar*.5);
  // (z1,z2)=(a*exp(it),b*exp(i(t+base))) is one genuine Hopf fiber.
  vec4 q=vec4(a*cos(t),a*sin(t),b*cos(t+base),b*sin(t+base));
  // polar <= 1.85, hence 1-q.w remains safely above .2.
  vec3 projected=q.xyz/max(.18,1.0-q.w);
  return spatialSpin(projected*.34);
}
vec3 pattern(vec2 p) {
  vec3 color=vec3(.005,.009,.018);
  for(int i=0;i<9;i++) {
    if(i>=int(uFiberCount))break;
    float base=TAU*float(i)/uFiberCount;
    vec3 previous=fiberPoint(0.0,base);
    for(int j=1;j<=40;j++) {
      float t=TAU*float(j)/40.0;vec3 current=fiberPoint(t,base);
      color=max(color,spatialLine(p,previous,current,uFiberWidth,float(i)/uFiberCount));
      previous=current;
    }
  }
  return color;
}`},
 {id:'five-cell',name:'5-cell / 4D simplex',ko:'5셀 4차원 단체',category:'volume',palette:3,
 description:'서로 같은 거리에 있는 5개 꼭짓점과 10개 모서리의 실제 4차원 정단체',
 code:`// @slider uSimplexProjection 2 5 0.1 3 | 정단체 투영 거리
// @slider uSimplexTilt 0 1.2 0.05 0.55 | 정단체 4차원 기울기
// @slider uSimplexSize 0.45 1.1 0.05 0.9 | 정단체 크기
// @slider uSimplexWidth 0.004 0.025 0.001 0.012 | 정단체 모서리 두께
${WIRE}
vec3 simplexPoint(vec4 q) {
  q.xw=rotate(uAngle)*q.xw;q.yz=rotate(uAngle)*q.yz;
  q.zw=rotate(uSimplexTilt*sin(uAngle))*q.zw;
  vec3 v=q.xyz*uSimplexProjection/max(1.0,uSimplexProjection-q.w);
  v.yz=rotate(.55)*v.yz;v.xz=rotate(.3)*v.xz;return v*uSimplexSize;
}
vec3 pattern(vec2 p) {
  // Each vertex has norm 1 and distinct pairs have dot product -1/4.
  float a=sqrt(5.0)*.25;vec3 vertices[5];
  vertices[0]=simplexPoint(vec4(a,a,a,-.25));
  vertices[1]=simplexPoint(vec4(a,-a,-a,-.25));
  vertices[2]=simplexPoint(vec4(-a,a,-a,-.25));
  vertices[3]=simplexPoint(vec4(-a,-a,a,-.25));
  vertices[4]=simplexPoint(vec4(0,0,0,1));
  vec3 color=vec3(.006,.009,.018);
  for(int i=0;i<5;i++)for(int j=0;j<5;j++) {
    if(j>i)color=max(color,spatialLine(p,vertices[i],vertices[j],uSimplexWidth,float(i+j)*.11));
  }
  return color;
}`}
];
