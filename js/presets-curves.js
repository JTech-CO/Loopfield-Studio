/** Finite L-system curves. Vertex literals remain in each editable shader;
 * no textures, recursion, previous frames or external resources are needed.
 * Rules: https://robertdickau.com/lsys2d.html (Koch, dragon, Hilbert, Gosper).
 * Depth caps keep the longest curve below 344 segments per fragment.
 */
function vertices(axiom, rules, depth, turn) {
  let word = axiom;
  for (let level = 0; level < depth; level++) {
    word = [...word].map(symbol => rules[symbol] ?? symbol).join('');
  }
  const points = [[0, 0]];
  let x = 0, y = 0, angle = 0;
  for (const symbol of word) {
    if (symbol === '+') angle += turn;
    else if (symbol === '-') angle -= turn;
    else if (symbol === 'F') {
      x += Math.cos(angle); y += Math.sin(angle); points.push([x, y]);
    }
  }
  const xs = points.map(point => point[0]), ys = points.map(point => point[1]);
  const left = Math.min(...xs), right = Math.max(...xs);
  const bottom = Math.min(...ys), top = Math.max(...ys);
  // Reserve room for breathing, rocking and the outline at the largest settings.
  const scale = 1.46 / Math.max(right - left, top - bottom, 1);
  return points.map(([px, py]) => [(px - (left + right) / 2) * scale, (py - (bottom + top) / 2) * scale]);
}

function curveSource({ axiom, rules, turn, minimum, maximum, initial }) {
  const points = [], offsets = [], counts = [];
  for (let depth = minimum; depth <= maximum; depth++) {
    const path = vertices(axiom, rules, depth, turn);
    offsets.push(points.length); counts.push(path.length - 1); points.push(...path);
  }
  const number = value => Number(value.toFixed(6)).toFixed(6);
  const choose = values => values.map((value, index) => `if(depth==${minimum + index})return ${value};`).join('');
  return `// @slider uDepth ${minimum} ${maximum} 1 ${initial} | 재귀 깊이
// @slider uLineWidth 0.002 0.035 0.001 0.008 | 곡선 두께
// @slider uBreath 0 0.18 0.01 0.08 | 줌 호흡
// Finite vertices from the stated L-system, normalized without changing angles.
// Higher recursion depth increases per-pixel work; the default uses <=64 segments.
const vec2 curveVertices[${points.length}]=vec2[${points.length}](
${points.map(([x, y]) => `vec2(${number(x)},${number(y)})`).join(',\n')});
int curveOffset(int depth){${choose(offsets)}return ${offsets.at(-1)};}
int curveCount(int depth){${choose(counts)}return ${counts.at(-1)};}
vec2 curveDistance(vec2 p,vec2 a,vec2 b) {
  vec2 edge=b-a;float t=clamp(dot(p-a,edge)/max(dot(edge,edge),.000001),0.0,1.0);
  return vec2(length(p-a-t*edge),t);
}
vec3 pattern(vec2 p) {
  vec2 q=rotate(.09*sin(uAngle))*p*exp(-uBreath*sin(uAngle));
  int depth=clamp(int(uDepth),${minimum},${maximum}),offset=curveOffset(depth),count=curveCount(depth);
  float distance=10.0,progress=0.0;
  for(int i=0;i<${Math.max(...counts)};i++) {
    if(i>=count)break;
    vec2 hit=curveDistance(q,curveVertices[offset+i],curveVertices[offset+i+1]);
    if(hit.x<distance){distance=hit.x;progress=(float(i)+hit.y)/float(count);}
  }
  float pulse=pow(.5+.5*cos(TAU*progress-uAngle),3.0);
  float line=stroke(distance,uLineWidth),halo=.1*exp(-distance*65.0);
  return vec3(.005,.009,.018)+palette(progress*.85+.07*sin(uAngle))*(line*(.55+.5*pulse)+halo);
}`;
}

export const CURVE_PRESETS = [
  { id: 'koch', name: 'Koch snowflake', ko: '코흐 눈송이', category: 'fractal', palette: 2,
    description: '삼각형의 각 변을 네 선분으로 치환하는 유한 깊이의 코흐 눈송이',
    code: curveSource({ axiom: 'F--F--F', rules: { F: 'F+F--F+F' }, turn: Math.PI / 3,
      minimum: 1, maximum: 3, initial: 2 }) },
  { id: 'dragon', name: 'Heighway dragon', ko: '하이웨이 드래곤 곡선', category: 'fractal', palette: 1,
    description: '서로 반대 방향의 종이 접기 규칙을 반복하는 직각 드래곤 곡선',
    code: curveSource({ axiom: 'FX', rules: { X: 'X+YF+', Y: '-FX-Y' }, turn: Math.PI / 2,
      minimum: 3, maximum: 8, initial: 6 }) },
  { id: 'hilbert', name: 'Hilbert path', ko: '힐베르트 곡선', category: 'fractal', palette: 0,
    description: '회전과 반사를 반복해 정사각형 격자를 채우는 힐베르트 경로',
    code: curveSource({ axiom: 'L', rules: { L: '+RF-LFL-FR+', R: '-LF+RFR+FL-' }, turn: Math.PI / 2,
      minimum: 1, maximum: 4, initial: 3 }) },
  { id: 'gosper', name: 'Peano-Gosper curve', ko: '페아노 고스퍼 곡선', category: 'fractal', palette: 4,
    description: '60도 회전과 일곱 갈래 치환으로 육각 격자를 채우는 고스퍼 경로',
    code: curveSource({ axiom: 'FX', rules: { X: 'X+YF++YF-FX--FXFX-YF+', Y: '-FX+YFYF++YF+FX--FX-Y' },
      turn: Math.PI / 3, minimum: 1, maximum: 3, initial: 2 }) },
  { id: 'pythagoras-tree', name: 'Pythagoras tree', ko: '피타고라스 나무', category: 'fractal', palette: 3,
    description: '직각삼각형의 두 변 위에 정사각형 가지를 세우는 피타고라스 나무',
    code: `// @slider uDepth 2 7 1 5 | 재귀 깊이
// @slider uBranchAngle 0.45 1.05 0.01 0.785 | 가지 각도
// @slider uLineWidth 0.002 0.035 0.001 0.008 | 사각형 테두리
// @slider uSway 0 0.18 0.01 0.07 | 가지 흔들림
// Exact right-triangle square construction. Heap paths cap the tree at 127 squares.
float treeSquare(vec2 p,vec2 a,vec2 b) {
  vec2 edge=b-a;float size=max(length(edge),.00001);
  vec2 x=edge/size,y=vec2(-x.y,x.x),center=(a+b)*.5+y*size*.5;
  vec2 q=abs(vec2(dot(p-center,x),dot(p-center,y)))-size*.5;
  return length(max(q,vec2(0)))+min(max(q.x,q.y),0.0);
}
vec3 pattern(vec2 p) {
  vec2 q=rotate(.08*uSway*sin(uAngle))*p;
  float theta=clamp(uBranchAngle+uSway*sin(uAngle),.27,1.23);
  float ct=cos(theta),st=sin(theta),distance=10.0,nearestDepth=0.0;
  float tint=0.0,fill=0.0;
  int depth=clamp(int(uDepth),2,7),count=(1<<depth)-1;
  for(int i=0;i<127;i++) {
    if(i>=count)break;
    int address=i+1,level=0;
    for(int j=0;j<7;j++){if(address<2)break;address=address/2;level++;}
    vec2 a=vec2(-.16,-.65),b=vec2(.16,-.65);
    for(int j=0;j<6;j++) {
      if(j>=level)break;
      vec2 edge=b-a,normal=vec2(-edge.y,edge.x),left=a+normal,right=b+normal;
      vec2 apex=left+vec2(edge.x*ct-edge.y*st,edge.x*st+edge.y*ct)*ct;
      int branch=((i+1)>>(level-j-1))&1;
      if(branch==0){a=left;b=apex;}else{a=apex;b=right;}
    }
    float d=treeSquare(q,a,b);
    if(abs(d)<distance){distance=abs(d);nearestDepth=float(level);tint=a.x*.18+b.y*.2;}
    fill=max(fill,1.0-smoothstep(-.001,.003,d));
  }
  float light=stroke(distance,uLineWidth)+.07*exp(-distance*60.0);
  float pulse=.72+.22*cos(uAngle-nearestDepth*.65);
  return vec3(.006,.009,.014)+palette(nearestDepth*.11+tint+.035*sin(uAngle))*(fill*.14+light*pulse);
}` }
];
