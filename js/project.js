import { clamp, finite, MAX_LAYERS, MAX_SOURCE, uid } from './utils.js';
import { parseControls } from './glsl.js';
import { defaultProject, PRESETS } from './presets.js';
const KEY='loopfield.project.v1';
const color = (v,d) => /^#[0-9a-f]{6}$/i.test(String(v)) ? v : d;
const enumValue=(v,values,d)=>values.includes(v)?v:d;
export function validateProject(raw) {
  if (!raw || raw.format!=='loopfield-project' || raw.version!==1) throw new Error('지원하지 않는 프로젝트 형식입니다. Loopfield v1 JSON 파일을 선택하세요.');
  if (!Array.isArray(raw.layers) || raw.layers.length<1 || raw.layers.length>MAX_LAYERS) throw new Error(`레이어는 1~${MAX_LAYERS}개여야 합니다.`);
  const d=defaultProject();
  const ids=new Set();
  const layers=raw.layers.map((l,index)=>{
    if(!l || typeof l.source!=='string' || l.source.length>MAX_SOURCE)throw new Error(`${index+1}번 레이어의 GLSL이 잘못되었습니다.`);
    const controls=parseControls(l.source);
    let id=typeof l.id==='string'&&l.id.length<=80?l.id:uid(); if(ids.has(id))id=uid();ids.add(id);
    return { id, name:String(l.name||`레이어 ${index+1}`).slice(0,60), preset:String(l.preset||'custom').slice(0,40),source:l.source,
      draft:typeof l.draft==='string'?l.draft.slice(0,MAX_SOURCE):null,
      enabled:l.enabled!==false,opacity:clamp(finite(l.opacity,1),0,1),blend:enumValue(l.blend,['normal','screen','add','multiply','difference'],'normal'),
      zoom:clamp(finite(l.zoom,1),.25,64),rotation:clamp(finite(l.rotation,0),-180,180),
      offset:[clamp(finite(l.offset?.[0],0),-100,100),clamp(finite(l.offset?.[1],0),-100,100)],
      cycles:Math.round(clamp(finite(l.cycles,1),1,8)),phase:clamp(finite(l.phase,0),0,1),seed:clamp(finite(l.seed,3),0,999),hue:clamp(finite(l.hue,0),0,1),
      colors:[0,1,2].map(i=>color(l.colors?.[i],d.layers[0].colors[i])),
      params:Object.fromEntries(controls.map(c=>[c.name,clamp(finite(l.params?.[c.name],c.value),c.min,c.max)]))
    };
  });
  const out=raw.output||{},fx=raw.effects||{};
  return { format:'loopfield-project',version:1,appVersion:'1.1.0',name:String(raw.name??'새 루프').slice(0,80),
    nameMode:raw.nameMode==='auto'?'auto':'custom',
    namePreset:PRESETS.some(p=>p.id===raw.namePreset)?raw.namePreset:layers[0].preset,
    layers,background:color(raw.background,d.background),
    effects:{glow:clamp(finite(fx.glow,.35),0,1.5),exposure:clamp(finite(fx.exposure,1.15),.3,2),contrast:clamp(finite(fx.contrast,1.08),.5,1.8),vignette:clamp(finite(fx.vignette,.25),0,1),aberration:clamp(finite(fx.aberration,0),0,1)},
    output:{resolution:enumValue(out.resolution,['1080p','qhd','uhd','dci2k'],'1080p'),aspect:enumValue(out.aspect,['landscape','portrait','square'],'landscape'),
      fps:enumValue(Number(out.fps),[24,30,60],30),duration:Math.round(clamp(finite(out.duration,8),2,60)),quality:enumValue(out.quality,['standard','high','master'],'high'),encoder:enumValue(out.encoder,['auto','hardware','software'],'auto'),direct:out.direct!==false}
  };
}
export function readLocalProject() {
  try {
    const raw=localStorage.getItem(KEY);
    if(!raw)return null;
    const project=validateProject(JSON.parse(raw));
    for(const layer of project.layers)layer.enabled=true;
    return project;
  }
  catch { return null; }
}
export function saveLocalProject(project) { localStorage.setItem(KEY,JSON.stringify(project)); }
export function clearLocalProject() { localStorage.removeItem(KEY); }
