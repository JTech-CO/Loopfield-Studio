import test from 'node:test';
import assert from 'node:assert/strict';
import { dimensions, frameTiming, endpointMetrics, bitrateFor, MAX_SOURCE, safeName } from '../js/utils.js';
import { parseControls, buildFragment } from '../js/glsl.js';
import { PRESETS, defaultProject, createLayer, duplicateLayer } from '../js/presets.js';
import { validateProject } from '../js/project.js';

test('all 32 presets use the injected GLSL API and valid control ranges',()=>{
  assert.equal(PRESETS.length,32);
  assert.equal(new Set(PRESETS.map(p=>p.id)).size,32);
  for(const p of PRESETS){const l=createLayer(p.id),c=buildFragment(l.source);assert.match(c.code,/#version 300 es/);assert.match(c.code,/#line 1/);assert.ok(c.controls.length<=16);for(const x of c.controls)assert.ok(l.params[x.name]>=x.min&&l.params[x.name]<=x.max);}
});
test('1080p / QHD / DCI 2K / UHD dimensions and portrait / square',()=>{
  for(const [r,w,h] of [['1080p',1920,1080],['qhd',2560,1440],['uhd',3840,2160]]){
    assert.deepEqual(dimensions({resolution:r,aspect:'landscape'}),[w,h]);
    assert.deepEqual(dimensions({resolution:r,aspect:'portrait'}),[h,w]);
    assert.deepEqual(dimensions({resolution:r,aspect:'square'}),[h,h]);
  }
  assert.deepEqual(dimensions({resolution:'dci2k',aspect:'portrait'}),[2048,1080]);
});
test('integer microsecond timestamps have no cumulative drift at 24, 30, 60fps',()=>{
  for(const fps of [24,30,60]){let end=0;for(let i=0;i<fps*60;i++){const f=frameTiming(i,fps);assert.equal(f.timestamp,end);assert.ok(f.duration>0);end=f.timestamp+f.duration;}assert.equal(end,60000000);}
});
test('export phases exclude the duplicate endpoint',()=>{
  const n=8*30,phases=Array.from({length:n},(_,i)=>i/n);assert.equal(phases[0],0);assert.equal(phases.at(-1),239/240);assert.ok(phases.every(p=>p<1));
});
test('sliders are auto uniforms, clamped and safely labeled',()=>{
  const s='// @slider uR 0 10 .1 20 | 반지름\nvec3 pattern(vec2 p){return vec3(uR);}';
  const c=buildFragment(s);assert.equal(c.controls[0].value,10);assert.match(c.code,/uniform float uR;/);
});
test('invalid and colliding controls are rejected',()=>{
  for(const s of ['// @slider uTime 0 2 .1 1 | nope','// @slider gl_x 0 2 .1 1 | nope','// @slider uX 2 1 .1 1 | nope','// @slider uX 0 2 0 1 | nope','// @slider uX 0 2 .1 1 | x\n// @slider uX 0 2 .1 1 | x','// @slider uX 0 2 .1 1 | x\nuniform float uX;'])assert.throws(()=>parseControls(s));
  assert.throws(()=>parseControls('x'.repeat(MAX_SOURCE+1)));
  assert.throws(()=>parseControls(Array.from({length:17},(_,i)=>`// @slider uX${i} 0 1 .1 .5 | x`).join('\n')));
});
test('main wrapper rejects duplicate main and supports mainImage with NaN guard',()=>{
  assert.throws(()=>buildFragment('void main(){}'));assert.throws(()=>buildFragment('#version 300 es\nvec3 pattern(vec2 p){return vec3(0);}'));
  assert.match(buildFragment('void mainImage(out vec4 c,in vec2 p){c=vec4(1);}').code,/any\(isnan\(c\)\)/);
});
test('project JSON round-trip, duplicates, clamping and enum fallbacks',()=>{
  const p=defaultProject();assert.equal(validateProject(JSON.parse(JSON.stringify(p))).layers.length,1);
  p.layers.push(duplicateLayer(p.layers[0]));p.layers[1].id=p.layers[0].id;p.layers[0].opacity=3;p.layers[0].cycles=3.6;p.layers[0].colors[0]='url(evil)';p.output.duration=900;p.output.resolution='8k';p.output.fps=100;p.layers[0].params.evil=99;
  const v=validateProject(p);assert.notEqual(v.layers[0].id,v.layers[1].id);assert.equal(v.layers[0].opacity,1);assert.equal(v.layers[0].cycles,4);assert.equal(v.output.duration,60);assert.equal(v.output.fps,30);assert.equal(v.output.resolution,'1080p');assert.ok(!('evil' in v.layers[0].params));assert.match(v.layers[0].colors[0],/^#[0-9a-f]{6}$/i);
});
test('project rejects unsupported schema and layer/source overflow',()=>{
  assert.throws(()=>validateProject({}));let p=defaultProject();p.layers=[];assert.throws(()=>validateProject(p));p=defaultProject();p.layers=Array.from({length:5},()=>createLayer('prism'));assert.throws(()=>validateProject(p));p=defaultProject();p.layers[0].source='x'.repeat(MAX_SOURCE+1);assert.throws(()=>validateProject(p));
});
test('endpoint comparison ignores alpha, does not hide real RGB discontinuity',()=>{
  assert.equal(endpointMetrics(new Uint8Array([0,0,0,255]),new Uint8Array([0,0,0,0])).match,true);
  assert.equal(endpointMetrics(new Uint8Array([0,0,0,255]),new Uint8Array([255,0,0,255])).match,false);
  assert.throws(()=>endpointMetrics(new Uint8Array(4),new Uint8Array(8)));
});
test('quality target scaling and filename sanitation',()=>{
  const a={resolution:'1080p',aspect:'landscape',fps:30,quality:'high'};assert.equal(bitrateFor(a),20000000);assert.ok(bitrateFor({...a,resolution:'uhd'})>bitrateFor(a));assert.equal(safeName('a/b:c?'),'abc');
});
