import { MAX_SOURCE, clamp } from './utils.js';

const RESERVED = new Set(['uResolution','uLoop','uAngle','uCycle','uTime','uDuration','uFrame','uZoom','uRotation','uOffset','uSeed','uHue','uColorA','uColorB','uColorC','iTime','iResolution','iFrame','PI','TAU']);
/** Syntax: // @slider uPetals 3 24 1 8 | 꽃잎 수 */
export function parseControls(source) {
  if (typeof source !== 'string' || source.length > MAX_SOURCE) throw new Error(`GLSL은 ${MAX_SOURCE.toLocaleString()}자 이하여야 합니다.`);
  const list = [], seen = new Set();
  for (const line of source.split('\n')) {
    if (!/^\s*\/\/\s*@slider\b/.test(line)) continue;
    const m = line.match(/^\s*\/\/\s*@slider\s+([a-zA-Z_]\w*)\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)\s+([-+.\deE]+)\s*\|\s*(.+?)\s*$/);
    if (!m) throw new Error('@slider 형식: 이름 최솟값 최댓값 간격 기본값 | 표시 이름');
    const [, name, min, max, step, value, label] = m;
    const nums = [min, max, step, value].map(Number);
    if (!nums.every(Number.isFinite) || nums[0] >= nums[1] || nums[2] <= 0) throw new Error(`${name}: 슬라이더 범위가 올바르지 않습니다.`);
    if (RESERVED.has(name) || name.startsWith('gl_') || name.includes('__') || seen.has(name)) throw new Error(`${name}: 예약되었거나 중복된 이름입니다.`);
    if (new RegExp(`\\buniform\\s+(?:lowp\\s+|mediump\\s+|highp\\s+)?float\\s+${name}\\b`).test(source)) throw new Error(`${name}: @slider가 uniform을 자동 선언합니다. 중복 uniform 선언을 지우세요.`);
    seen.add(name); list.push({ name, min: nums[0], max: nums[1], step: nums[2], value: clamp(nums[3], nums[0], nums[1]), label: label.slice(0, 50) });
  }
  if (list.length > 16) throw new Error('한 레이어에는 슬라이더를 16개까지 사용할 수 있습니다.');
  return list;
}
export const VERTEX = `#version 300 es
precision highp float;
out vec2 vUV;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUV = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;
export const COMMON = `
precision highp float;
precision highp int;
uniform vec2 uResolution;
uniform float uLoop, uAngle, uTime, uDuration, uZoom, uRotation, uSeed, uHue;
uniform int uFrame;
uniform vec2 uCycle, uOffset;
uniform vec3 uColorA, uColorB, uColorC;
#define PI 3.14159265358979323846
#define TAU 6.28318530717958647692
#define iTime uTime
#define iResolution vec3(uResolution, 1.0)
#define iFrame uFrame
mat2 rotate(float a) { float c=cos(a), s=sin(a); return mat2(c,-s,s,c); }
vec3 palette(float t) {
  vec3 w = pow(0.5 + 0.5 * cos(TAU * (t + uHue + vec3(0.0, 0.3333333, 0.6666667))), vec3(2.0));
  return (uColorA*w.x + uColorB*w.y + uColorC*w.z) / max(0.0001,w.x+w.y+w.z);
}
float hash21(vec2 p) {
  vec3 p3=fract(vec3(p.xyx)*.1031); p3+=dot(p3,p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z);
}
float noise2(vec2 p) {
  vec2 i=floor(p),f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash21(i),hash21(i+vec2(1,0)),f.x),mix(hash21(i+vec2(0,1)),hash21(i+1.0),f.x),f.y);
}
float fbm(vec2 p) {
  float v=0.0,a=0.5;
  for(int i=0;i<5;i++){v+=a*noise2(p);p=rotate(.53)*p*2.03+7.1;a*=.5;}
  return v;
}
float stroke(float d,float width){return 1.0-smoothstep(width,width+max(fwidth(d),0.001),abs(d));}
`;
export function buildFragment(source) {
  const controls = parseControls(source);
  if (/^\s*#version/m.test(source)) throw new Error('#version은 자동으로 추가됩니다. 코드에서 제거하세요.');
  if (/\bvoid\s+main\s*\(/.test(source)) throw new Error('main() 대신 vec3 pattern(vec2 p) 또는 mainImage()를 사용하세요.');
  const advanced = /\bvoid\s+mainImage\s*\(/.test(source);
  if (!advanced && !/\bvec3\s+pattern\s*\(/.test(source)) throw new Error('vec3 pattern(vec2 p) 함수를 작성하세요.');
  const header = `#version 300 es\n${COMMON}\n${controls.map(c => `uniform float ${c.name};`).join('\n')}\nout vec4 outColor;\n`;
  // #line maps compiler error lines to the user's source instead of the injected header.
  return { controls, code: header + '\n#line 1\n' + source + '\n#line 50000\nvoid main(){\n' + (advanced
    ? 'vec4 c=vec4(0); mainImage(c,gl_FragCoord.xy); if(any(isnan(c))||any(isinf(c)))c=vec4(0); outColor=vec4(clamp(c.rgb,0.0,1.0),clamp(c.a,0.0,1.0));'
    : 'vec2 p=(2.0*gl_FragCoord.xy-uResolution)/uResolution.y; p=rotate(uRotation)*p/uZoom+uOffset; vec3 c=pattern(p); if(any(isnan(c))||any(isinf(c)))c=vec3(0); outColor=vec4(clamp(c,0.0,1.0),1.0);') + '\n}' };
}
export const COMPOSITE = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uBase,uLayer;
uniform float uOpacity;
uniform int uBlend;
out vec4 outColor;
void main(){
 vec3 a=texture(uBase,vUV).rgb; vec4 s=texture(uLayer,vUV); vec3 b=s.rgb;
 vec3 c=b;
 if(uBlend==1)c=1.0-(1.0-a)*(1.0-b);
 if(uBlend==2)c=a+b;
 if(uBlend==3)c=a*b;
 if(uBlend==4)c=abs(a-b);
 outColor=vec4(clamp(mix(a,c,uOpacity*s.a),0.0,1.0),1.0);
}`;
export const BLUR = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTexture;
uniform vec2 uDirection;
uniform float uExtract;
out vec4 outColor;
vec3 readColor(vec2 uv){vec3 c=texture(uTexture,uv).rgb;return mix(c,max(c-0.52,0.0),uExtract);}
void main(){
 vec3 c=readColor(vUV)*0.227027;
 c+=(readColor(vUV+uDirection*1.384615)+readColor(vUV-uDirection*1.384615))*0.316216;
 c+=(readColor(vUV+uDirection*3.230769)+readColor(vUV-uDirection*3.230769))*0.070270;
 outColor=vec4(c,1);
}`;
export const FINISH = `#version 300 es
precision highp float;
in vec2 vUV;
uniform sampler2D uTexture,uBloom;
uniform vec2 uResolution;
uniform float uGlow,uExposure,uContrast,uVignette,uAberration;
out vec4 outColor;
void main(){
 vec2 off=(vUV-.5)*uAberration*.012;
 vec3 c=vec3(texture(uTexture,vUV+off).r,texture(uTexture,vUV).g,texture(uTexture,vUV-off).b);
 c+=texture(uBloom,vUV).rgb*uGlow*1.6;
 c=(c*uExposure-.5)*uContrast+.5;
 float v=smoothstep(.15,.82,length(vUV-.5)); c*=1.0-uVignette*v;
 // Static ordered dither is deterministic at the loop boundary.
 float d=fract(52.9829189*fract(dot(gl_FragCoord.xy,vec2(.06711056,.00583715))))-.5;
 c+=d/255.0;
 outColor=vec4(clamp(c,0.0,1.0),1.0);
}`;
