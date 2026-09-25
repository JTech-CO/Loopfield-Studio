import { initLanguage, translate, getLanguage } from './i18n.js';
import { PRESETS, PALETTES, createLayer, duplicateLayer, defaultProject, presetById } from './presets.js';
import { readLocalProject, saveLocalProject, validateProject } from './project.js';
import { Renderer, inspectLoop } from './renderer.js';
import { CodeEditor } from './editor.js';
import { parseControls } from './glsl.js';
import { testEncoder, exportVideo, renderPNG } from './exporter.js';
import { MAX_LAYERS, MAX_SOURCE, clone, clamp, mod, dimensions, bitrateFor, safeName, downloadBlob, formatBytes, sleep } from './utils.js';
const confirm = message => window.confirm(translate(message));
const $=s=>document.querySelector(s);
const node=(tag,className='',text='')=>{const n=document.createElement(tag);n.className=className;if(text)n.textContent=text;return n;};
const icon=id=>{const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');const use=document.createElementNS('http://www.w3.org/2000/svg','use');use.setAttribute('href',`./assets/icons.svg#${id}`);svg.append(use);return svg;};
const categoryName={geometry:'기하학',fractal:'프랙탈',organic:'유기적 패턴',volume:'3D 곡면',code:'코드 시작점'};
let project=readLocalProject()||defaultProject();
const state={selected:project.layers[0].id,phase:0,playing:!matchMedia('(prefers-reduced-motion: reduce)').matches,busy:false,dirty:true,revision:0,
  mode:'design',previewSize:540,pendingAdd:false,lastClock:performance.now(),lastPaint:0,loop:null,codec:null,result:null,controller:null,diagnostics:null};
let renderer=null,saveTimer,toastTimer;
const selected=()=>project.layers.find(l=>l.id===state.selected)||project.layers[0];
function toast(message,type='info'){
  const t=$('#toast');t.textContent=message;t.className=`toast ${type}`;t.hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.hidden=true,6500);
}
function graphicsFailure(error){
  $('#canvasError').hidden=false;$('#canvasErrorText').textContent=error.message||String(error);
  $('#renderState').textContent='GPU 확인 필요';$('#performanceStatus').textContent='WebGL 2를 사용할 수 없음';
  for(const id of ['renderVideo','snapshot','checkLoop','checkLoopExport'])$('#'+id).disabled=true;
  state.playing=false;renderPlayButton();
}
function changed(){
  state.dirty=true;state.revision++;state.loop=null;
  $('#saveStatus').textContent='변경 사항 저장 중';
  clearTimeout(saveTimer);saveTimer=setTimeout(()=>{
    try{saveLocalProject(project);$('#saveStatus').textContent='이 브라우저에 자동 저장됨';}
    catch{$('#saveStatus').textContent='자동 저장 불가 · JSON으로 저장하세요';}
  },400);
}
function draftExists(){return project.layers.some(l=>l.draft!==null&&l.draft!==undefined&&l.draft!==l.source);}
function assertReady(){
  if(!renderer||renderer.lost)throw new Error('WebGL 2 렌더러를 사용할 수 없습니다.');
  if(draftExists())throw new Error('아직 적용하지 않은 GLSL이 있습니다. 코드 모드에서 적용하거나 되돌린 뒤 출력하세요.');
}
function setSelected(id){
  state.selected=id;state.pendingAdd=false;$('.library-intro').textContent='하나를 골라, 나만의 루프로.';
  renderLayers();renderInspector();renderLibrary();loadEditor();
}
function syncAutoName(){
  if(project.nameMode!=='auto')return;
  const preset=presetById(project.namePreset);
  const name=getLanguage()==='en'?preset.name:preset.ko;
  if(project.name!==name){project.name=name;changed();}
  $('#projectName').value=project.name;
}
document.addEventListener('languagechange',syncAutoName);
function choosePreset(id){
  if(state.busy)return;
  const current=selected();
  if(!state.pendingAdd&&(current.preset==='custom'||current.draft)&&!confirm('현재 레이어의 사용자 코드를 선택한 패턴으로 바꿀까요? 프로젝트 JSON을 저장하면 코드를 보관할 수 있습니다.'))return;
  const layer=createLayer(id);let next;
  if(state.pendingAdd){if(project.layers.length>=MAX_LAYERS)return;next=[...project.layers,layer];layer.blend='screen';}
  else{Object.assign(layer,{id:current.id,opacity:current.opacity,blend:current.blend,enabled:current.enabled});next=project.layers.map(l=>l.id===current.id?layer:l);}
  try{renderer?.sync({...project,layers:next});project.layers=next;if(project.nameMode==='auto'){project.namePreset=id;syncAutoName();}setSelected(layer.id);changed();closeLibrary();}
  catch(e){toast(`패턴을 적용하지 못했습니다. ${e.message}`,'error');}
}
function renderLibrary(){
  const search=$('#presetSearch').value.toLowerCase(),cat=$('#presetCategory').dataset.value;
  const items=PRESETS.filter(p=>(cat==='all'||p.category===cat)&&`${p.name} ${p.ko} ${p.description} ${translate(p.description,'en')}`.toLowerCase().includes(search));
  const frag=document.createDocumentFragment();
  for(const p of items){
    const b=node('button',`preset-card${selected().preset===p.id&&!state.pendingAdd?' active':''}`);b.type='button';b.dataset.preset=p.id;b.title=p.description;
    b.setAttribute('aria-pressed',String(selected().preset===p.id&&!state.pendingAdd));
    const img=node('img','preset-thumb');img.src=`./assets/presets/${p.id}.webp`;img.alt='';img.width=96;img.height=80;img.loading='lazy';
    img.addEventListener('error',()=>{img.hidden=true;},{once:true});
    const text=node('div');text.append(node('strong','',p.ko),node('small','',categoryName[p.category]));b.append(img,text);b.addEventListener('click',()=>choosePreset(p.id));frag.append(b);
  }
  if(!items.length)frag.append(node('p','empty-state','검색 결과가 없습니다. 다른 이름이나 분류를 선택하세요.'));
  $('#presetList').replaceChildren(frag);$('#presetCount').textContent=items.length;
}
function renderLayers(){
  const frag=document.createDocumentFragment();
  project.layers.forEach((l,i)=>{
    const tile=node('div',`layer-tile${l.id===state.selected?' selected':''}${!l.enabled?' disabled':''}`);
    const pick=node('button','layer-select');pick.setAttribute('aria-pressed',String(l.id===state.selected));pick.title=l.name;
    const name=node('span');name.append(node('strong','',l.name),node('small','',`${l.blend.toUpperCase()} · ${Math.round(l.opacity*100)}%`));
    pick.append(node('span','',String(i+1).padStart(2,'0')),name);pick.addEventListener('click',()=>setSelected(l.id));
    const visibility=node('button','visibility');visibility.append(icon('eye'));visibility.title=l.enabled?'레이어 숨기기':'레이어 표시';visibility.setAttribute('aria-label',`${l.name} ${visibility.title}`);visibility.setAttribute('aria-pressed',String(l.enabled));
    visibility.addEventListener('click',()=>{l.enabled=!l.enabled;renderLayers();changed();});tile.append(pick,visibility);frag.append(tile);
  });
  $('#layerList').replaceChildren(frag);$('#layerCount').textContent=`${project.layers.length} / ${MAX_LAYERS}`;
  $('#addLayer').disabled=project.layers.length>=MAX_LAYERS;$('#duplicateLayer').disabled=project.layers.length>=MAX_LAYERS;$('#removeLayer').disabled=project.layers.length<=1;
  const index=project.layers.findIndex(l=>l.id===state.selected);$('#moveLayerDown').disabled=index<=0;$('#moveLayerUp').disabled=index>=project.layers.length-1;
}
function control(parent,{name,min,max,step,value,onChange}){
  const outer=node('div','control'),head=node('div','control-head'),label=node('label','',name);
  const id=`ctrl-${control.index++}`,range=node('input'),num=node('input','control-value');
  range.type='range';num.type='number';range.id=id;label.htmlFor=id;
  for(const input of [range,num]){input.min=min;input.max=max;input.step=step;input.value=value;}
  range.setAttribute('aria-label',name);num.setAttribute('aria-label',`${name} 직접 입력`);
  const commit=(raw,from)=>{const parsed=Number(raw);if(!Number.isFinite(parsed)||raw===''){from.value=range.value;return;}const v=clamp(parsed,min,max);range.value=v;num.value=v;onChange(v);changed();};
  range.addEventListener('input',()=>commit(range.value,range));num.addEventListener('change',()=>commit(num.value,num));
  head.append(label,num);outer.append(head,range);parent.append(outer);return outer;
}
control.index=0;
function renderInspector(){
  const l=selected(),p=presetById(l.preset);
  $('#selectedLayerName').textContent=l.name;$('#selectedDescription').textContent=l.preset==='custom'?'직접 작성한 GLSL 패턴':p.description;
  $('#blendMode').value=l.blend;$('#layerCycles').value=l.cycles;
  $('#opacityControl').replaceChildren();control($('#opacityControl'),{name:'불투명도',min:0,max:1,step:.01,value:l.opacity,onChange:v=>{l.opacity=v;renderLayers();}});
  $('#parameterControls').replaceChildren();
  try{for(const c of parseControls(l.source))control($('#parameterControls'),{name:c.label,min:c.min,max:c.max,step:c.step,value:l.params[c.name]??c.value,onChange:v=>l.params[c.name]=v});}catch{}
  $('#transformControls').replaceChildren();
  for(const c of [{name:'확대',key:'zoom',min:.25,max:8,step:.01},{name:'회전',key:'rotation',min:-180,max:180,step:1},{name:'시작 위상',key:'phase',min:0,max:1,step:.01},{name:'시드',key:'seed',min:0,max:999,step:1}]){
    control($('#transformControls'),{...c,max:c.key==='zoom'?64:c.max,value:l[c.key],onChange:v=>l[c.key]=v});
  }
  renderPalettes();
  ['colorA','colorB','colorC'].forEach((id,i)=>$('#'+id).value=l.colors[i]);$('#backgroundColor').value=project.background;
  $('#hueControl').replaceChildren();control($('#hueControl'),{name:'팔레트 이동',min:0,max:1,step:.01,value:l.hue,onChange:v=>l.hue=v});
  $('#effectControls').replaceChildren();
  for(const c of [{name:'블룸',key:'glow',min:0,max:1.5,step:.01},{name:'노출',key:'exposure',min:.3,max:2,step:.01},{name:'대비',key:'contrast',min:.5,max:1.8,step:.01},{name:'비네트',key:'vignette',min:0,max:1,step:.01},{name:'색수차',key:'aberration',min:0,max:1,step:.01}]){
    control($('#effectControls'),{...c,value:project.effects[c.key],onChange:v=>project.effects[c.key]=v});
  }
}
function renderPalettes(){
  const frag=document.createDocumentFragment();
  PALETTES.forEach(p=>{
    const match=p.colors.every((c,i)=>c.toLowerCase()===selected().colors[i].toLowerCase());
    const b=node('button',`palette-chip${match?' active':''}`);b.title=p.name;b.setAttribute('aria-label',`${p.name} 팔레트`);b.setAttribute('aria-pressed',String(match));
    p.colors.forEach(c=>{const swatch=node('span');swatch.style.backgroundColor=c;b.append(swatch);});
    b.addEventListener('click',()=>{selected().colors=[...p.colors];['colorA','colorB','colorC'].forEach((id,i)=>$('#'+id).value=p.colors[i]);renderPalettes();changed();});frag.append(b);
  });$('#paletteList').replaceChildren(frag);
}
function renderOutput(){
  const o=project.output;
  for(const [id,key]of [['outputResolution','resolution'],['outputAspect','aspect'],['outputFPS','fps'],['outputDuration','duration'],['outputQuality','quality'],['outputEncoder','encoder']])$('#'+id).value=o[key];
  $('#outputAspect').disabled=o.resolution==='dci2k';if(o.resolution==='dci2k')$('#outputAspect').value='landscape';
  const direct=typeof window.showSaveFilePicker==='function';$('#directSave').checked=o.direct&&direct;$('#directSave').disabled=!direct;
  $('#directSaveHint').textContent=direct?'파일을 조금씩 기록해 메모리 사용량을 줄입니다.':'이 브라우저는 직접 저장 미지원 · 다운로드로 저장합니다.';
  const [w,h]=dimensions(o),bitrate=bitrateFor(o),bytes=bitrate/8*o.duration;
  $('#outputDimensions').textContent=`${w} × ${h}`;$('#outputFrames').textContent=(o.fps*o.duration).toLocaleString();
  $('#outputBitrate').textContent=`${(bitrate/1e6).toFixed(0)} Mbps`;$('#outputSize').textContent=`약 ${formatBytes(bytes)}`;
  const warning=$('#memoryWarning');warning.hidden=!(bytes>180e6&&!$('#directSave').checked);
  warning.textContent='예상 파일이 큽니다. 메모리 출력은 256 MiB에서 중단됩니다. 디스크 직접 저장, 더 짧은 길이, 낮은 압축 품질 중 하나를 사용하세요.';
  $('#quickDimensions').textContent=`${w} × ${h}`;
  document.querySelectorAll('#quickResolution button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.resolution===o.resolution)));
  $('#snapshotResolution').value=o.resolution;$('#snapshotAspect').value=o.resolution==='dci2k'?'landscape':o.aspect;
  $('#snapshotAspect').disabled=o.resolution==='dci2k';$('#snapshotDimensions').textContent=`${w} × ${h}`;
  $('#previewShell').style.setProperty('--output-aspect',`${w} / ${h}`);
  $('#previewShell').dataset.aspect=o.resolution==='dci2k'?'landscape':o.aspect;
  $('#endTime').textContent=`${o.duration}초`;$('#timelineSpec').textContent=`${o.duration}s / ${o.fps}fps`;updateTimeline();
}
function loadEditor(){
  const l=selected();editor.setValue(l.draft??l.source);$('#codeFilename').textContent=`${l.preset==='custom'?'custom':l.preset}.glsl`;$('#compileError').hidden=true;updateCodeStatus();
}
function updateCodeStatus(){
  const l=selected(),dirty=l.draft!==null&&l.draft!==undefined&&l.draft!==l.source;
  $('#codeStatus').textContent=dirty?'수정됨 · 적용 필요':'적용됨';$('#codeStatus').style.color=dirty?'var(--accent)':'';
}
const editor=new CodeEditor($('#codeEditor'),$('#codeHighlight'),$('#lineNumbers'),value=>{
  if(value.length>MAX_SOURCE){toast(`코드는 ${MAX_SOURCE.toLocaleString()}자 이하여야 합니다.`,'warning');return;}
  selected().draft=value===selected().source?null:value;updateCodeStatus();changed();
});
function compileCode(){
  if(!renderer){toast('WebGL 2를 켜야 코드를 컴파일할 수 있습니다.','error');return;}
  const l=selected(),source=editor.value;
  try{
    const controls=parseControls(source),next={...l,source,draft:null,preset:'custom',name:l.preset==='custom'?l.name:'직접 만든 패턴',params:Object.fromEntries(controls.map(c=>[c.name,clamp(l.params[c.name]??c.value,c.min,c.max)]))};
    const layers=project.layers.map(x=>x.id===l.id?next:x);renderer.sync({...project,layers});project.layers=layers;
    $('#compileError').hidden=true;renderInspector();renderLayers();renderLibrary();updateCodeStatus();changed();toast('GLSL을 적용했습니다.');
  }catch(e){$('#compileError').textContent=`적용하지 않았습니다. 마지막으로 정상 동작한 화면을 유지합니다.\n\n${e.message}`;$('#compileError').hidden=false;}
}
function setMode(mode){
  state.mode=mode;document.body.classList.toggle('code-layout',mode==='code');$('#splitter').hidden=mode!=='code';closeInspector();closeLibrary();$('#stage').scrollTop=0;$('#workspace').classList.toggle('code-mode',mode==='code');$('#editorPanel').hidden=mode!=='code';
  $('#modeCode').classList.toggle('active',mode==='code');$('#modeDesign').classList.toggle('active',mode==='design');$('#modeCode').setAttribute('aria-pressed',String(mode==='code'));$('#modeDesign').setAttribute('aria-pressed',String(mode==='design'));
  requestAnimationFrame(fitPreview);
}
function showTab(tab){
  const style=tab==='style';$('#stylePanel').hidden=!style;$('#exportPanel').hidden=style;
  for(const [id,active]of [['styleTab',style],['exportTab',!style]]){$('#'+id).classList.toggle('active',active);$('#'+id).setAttribute('aria-selected',String(active));$('#'+id).tabIndex=active?0:-1;}
  if(!style)renderOutput();
}
function fitPreview(){
  const [w,h]=dimensions(project.output),shell=$('#previewShell');
  // The shell follows the output aspect ratio; it is no longer a large empty flex box.
  const maxW=shell.clientWidth,maxH=shell.clientHeight;
  const width=Math.max(1,Math.min(maxW,maxH*w/h)),height=width*h/w;
  $('#preview').style.width=`${width}px`;$('#preview').style.height=`${height}px`;
  if(renderer&&!renderer.lost){
    const scale=state.previewSize/Math.min(w,h),pw=Math.round(w*scale),ph=Math.round(h*scale);
    try{renderer.resize(pw,ph);$('#previewInfo').textContent=`${pw} × ${ph}`;state.dirty=true;}
    catch(e){
      // A too-large preview must not disable a separate, possibly usable export path.
      if(state.previewSize>540&&!renderer.gl.isContextLost()){
        state.previewSize=540;$('#previewQuality').value='540';toast(`고해상도 미리보기를 만들지 못해 540p로 복구했습니다. 저장 해상도는 유지됩니다. ${e.message}`,'warning');fitPreview();
      }else graphicsFailure(e);
    }
  }
}
function updateTimeline(){
  $('#scrub').value=Math.round(state.phase*10000);$('#currentTime').textContent=`${(state.phase*project.output.duration).toFixed(2)}s`;
}
function renderPlayButton(){
  const b=$('#playPause');b.replaceChildren(icon(state.playing?'pause':'play'));b.setAttribute('aria-label',state.playing?'미리보기 일시정지':'미리보기 재생');
}
function togglePlay(){state.playing=!state.playing;state.lastClock=performance.now();renderPlayButton();}
let statClock=performance.now(),paintCount=0;
function tick(now){
  requestAnimationFrame(tick);const delta=Math.min(.15,(now-state.lastClock)/1000);state.lastClock=now;
  if(state.busy||document.hidden||!renderer||renderer.lost)return;
  if(state.playing){state.phase=mod(state.phase+delta/project.output.duration);state.dirty=true;}
  if(state.dirty&&(now-state.lastPaint>1000/30||!state.playing)){
    try{renderer.render(project,state.phase,{frame:Math.floor(state.phase*project.output.duration*project.output.fps)});state.dirty=false;state.lastPaint=now;paintCount++;updateTimeline();}
    catch(e){graphicsFailure(e);renderer.lost=true;}
  }
  if(now-statClock>1200){$('#performanceStatus').textContent=state.playing?`미리보기 ${Math.round(paintCount*1000/(now-statClock))} fps · WebGL 2`:'일시정지 · WebGL 2';paintCount=0;statClock=now;}
}
function openLibrary(){
  $('#library').classList.add('is-open');$('#libraryToggle').setAttribute('aria-expanded','true');
}
function closeLibrary(){closeCategory();$('#library').classList.remove('is-open');$('#libraryToggle').setAttribute('aria-expanded','false');}
function openInspector(){closeLibrary();$('#inspector').classList.add('is-open');$('#inspectorToggle').setAttribute('aria-expanded','true');}
function closeInspector(){$('#inspector').classList.remove('is-open');$('#inspectorToggle').setAttribute('aria-expanded','false');}
function closeCategory(focus=false){$('#categoryMenu').hidden=true;$('#presetCategory').setAttribute('aria-expanded','false');if(focus)$('#presetCategory').focus();}
function buildCategories(){
  const menu=$('#categoryMenu');menu.replaceChildren();
  for(const [id,label] of [['all','모든 패턴'],...Object.entries(categoryName)]){
    const b=node('button','category-option');b.type='button';b.dataset.category=id;b.setAttribute('role','option');
    b.setAttribute('aria-selected',String(id===$('#presetCategory').dataset.value));b.tabIndex=-1;
    b.append(node('span','',label),node('small','',String(id==='all'?PRESETS.length:PRESETS.filter(p=>p.category===id).length)));
    b.addEventListener('click',()=>{ $('#presetCategory').dataset.value=id;$('#categoryLabel').textContent=label;buildCategories();renderLibrary();closeCategory(true); });
    menu.append(b);
  }
}
function openCategory(last=false){
  buildCategories();$('#categoryMenu').hidden=false;$('#presetCategory').setAttribute('aria-expanded','true');
  const options=[...$('#categoryMenu').children],active=options.find(b=>b.getAttribute('aria-selected')==='true');
  (last?options.at(-1):active||options[0])?.focus();
}
function updateOutputSetting(key,value){
  if(key==='fps')value=Number(value);if(key==='duration')value=Math.round(clamp(Number(value)||8,2,60));
  project.output[key]=value;state.codec=null;state.diagnostics=null;$('#codecDiagnostics').hidden=true;
  $('#codecStatus').textContent='출력 설정이 바뀌었습니다. 실제 1프레임 검사를 실행할 수 있습니다.';
  renderOutput();fitPreview();changed();
}
function saveDiagnostics(){
  const data=state.diagnostics||state.result?.diagnostics||[];
  downloadBlob(new Blob([JSON.stringify({app:'Loopfield Studio 1.1.0',at:new Date().toISOString(),settings:project.output,secureContext:isSecureContext,
    videoEncoder:typeof VideoEncoder,userAgent:navigator.userAgent,gpuRenderLimit:renderer?.limit,attempts:data},null,2)],{type:'application/json'}),'Loopfield-encoder-diagnostics.json');
}
function saveProject(){
  downloadBlob(new Blob([JSON.stringify(project,null,2)],{type:'application/json'}),`${safeName(project.name)}.loopfield.json`);
  toast('프로젝트 JSON에 레이어, 설정, GLSL을 저장했습니다.');
}
function replaceProject(next){
  renderer?.sync(next);project=next;syncAutoName();state.selected=next.layers[0].id;state.phase=0;state.codec=null;
  $('#projectName').value=project.name;renderLibrary();renderLayers();renderInspector();renderOutput();loadEditor();fitPreview();changed();
}
async function computeLoop(){
  assertReady();
  if(state.loop?.revision===state.revision)return state.loop;
  let probe;
  try{
    const [w,h]=dimensions(project.output);probe=new Renderer(document.createElement('canvas'));probe.sync(project);
    const scale=180/Math.min(w,h);probe.resize(Math.round(w*scale),Math.round(h*scale));
    await sleep(0);const report=inspectLoop(probe,project);state.loop={...report,revision:state.revision};return state.loop;
  }finally{probe?.dispose();}
}
async function showLoop(){
  try{
    const report=await computeLoop();const frag=document.createDocumentFragment();
    frag.append(node('div',`loop-score${report.match?'':' warn'}`,report.match?'시작과 끝이 샘플 기준으로 일치합니다.':'시작과 끝에 차이가 있습니다.'));
    const details=node('div','loop-data');
    for(const [label,val]of [['평균 픽셀 차이',`${report.mae.toFixed(3)} / 255`],['최대 픽셀 차이',`${report.max} / 255`],['경계 움직임 RMSE',report.motionRMSE.toFixed(3)],['검사 해상도',`${report.width} × ${report.height}`]]){
      const d=node('div');d.append(node('small','',label),node('strong','',val));details.append(d);
    }
    frag.append(details,node('p','',report.match?'평균 끝점 차이가 0.5/255 이하입니다. 경계 움직임 수치는 마지막 이동과 첫 이동의 차이이며, 작을수록 유사합니다.':'uTime 또는 uLoop를 선형 이동에 사용했다면 uCycle, sin(uAngle), cos(uAngle)로 바꿔 보세요.'));
    $('#loopResults').replaceChildren(frag);$('#loopDialog').showModal();
  }catch(e){toast(e.message,'error');}
}
function exportDialogReset(){
  if(state.result?.url)URL.revokeObjectURL(state.result.url);state.result=null;
  const video=$('#resultVideo');video.pause();video.removeAttribute('src');video.load();video.hidden=true;
  $('#exportProgressArea').hidden=false;$('#exportResult').hidden=true;$('#downloadVideo').hidden=true;$('#closeExport').hidden=true;$('#cancelExport').hidden=false;$('#exportDiagnostics').hidden=true;$('#cancelExport').disabled=false;
  $('#cancelExport').textContent='렌더링 취소';$('#exportTitle').textContent='루프를 렌더링하고 있습니다.';$('#exportProgress').value=0;$('#exportPercent').textContent='0%';$('#exportFrameCount').textContent='지원 확인 중';
  $('#exportMessage').textContent='탭을 닫거나 기기를 절전 모드로 전환하지 마세요. 다른 탭으로 이동하면 렌더링이 느려질 수 있습니다.';
}
async function renderVideo(){
  if(state.busy)return;
  let handle=null,writable=null;
  try{
    assertReady();
    const snapshot=clone(project),[w,h]=dimensions(snapshot.output),filename=`${safeName(snapshot.name)}-${w}x${h}-${snapshot.output.fps}fps.mp4`;
    const direct=snapshot.output.direct&&typeof window.showSaveFilePicker==='function';
    if(!direct&&bitrateFor(snapshot.output)/8*snapshot.output.duration>240e6)throw new Error('예상 크기가 메모리 출력 한도에 가깝습니다. 디스크 직접 저장을 사용하거나 길이/품질을 낮추세요.');
    // Must be invoked inside the user's click activation, before any encoder probe awaits.
    if(direct)handle=await window.showSaveFilePicker({suggestedName:filename,types:[{description:'H.264 MP4 영상',accept:{'video/mp4':['.mp4']}}],excludeAcceptAllOption:true});
    state.busy=true;state.controller=new AbortController();exportDialogReset();$('#exportDialog').showModal();
    const report=await computeLoop();
    if(state.controller.signal.aborted)throw new DOMException('렌더링을 취소했습니다.','AbortError');
    if(!report.match&&!confirm(`루프 끝점 평균 차이가 ${report.mae.toFixed(2)}/255입니다. 이어지는 부분이 튈 수 있습니다. 그래도 MP4를 만들까요?`))throw new DOMException('루프 확인 후 출력을 취소했습니다.','AbortError');
    if(handle)writable=await handle.createWritable();
    const result=await exportVideo(snapshot,{signal:state.controller.signal,writable,onProgress:p=>{
      $('#exportProgress').value=p.percent;$('#exportPercent').textContent=`${Math.floor(p.percent*100)}%`;
      $('#exportFrameCount').textContent=`${p.frame.toLocaleString()} / ${p.total.toLocaleString()} 프레임`;
      if(p.stage==='finalize')$('#exportTitle').textContent='MP4 파일을 마무리하고 있습니다.';
      $('#exportMessage').textContent=`${w} × ${h} · ${snapshot.output.fps}fps · ${p.codec}\n${p.message||`경과 ${p.elapsed.toFixed(1)}초 · 인코딩 데이터 ${formatBytes(p.bytes)}`}`;
    }});
    writable=null;state.diagnostics=result.diagnostics;$('#codecDiagnostics').hidden=false;state.result={...result,filename,url:result.blob?URL.createObjectURL(result.blob):null};
    $('#exportTitle').textContent='당신의 루프가 완성되었습니다.';$('#exportProgressArea').hidden=true;$('#exportResult').hidden=false;
    $('#exportResult').textContent=`${result.width} × ${result.height} · ${result.fps}fps · ${snapshot.output.duration}초 · ${result.frames}프레임\n${formatBytes(result.bytes)} · ${result.codec}\n${result.blob?'아래 버튼을 눌러 MP4 파일을 저장하세요.':'선택한 파일에 MP4 저장을 완료했습니다.'}`;
    $('#exportResult').style.whiteSpace='pre-line';
    if(result.blob){$('#resultVideo').src=state.result.url;$('#resultVideo').hidden=false;$('#downloadVideo').hidden=false;}
  }catch(e){
    state.diagnostics=e.diagnostics||[];$('#codecDiagnostics').hidden=false;
    if(writable)try{await writable.abort();}catch{}
    if(!$('#exportDialog').open){if(e.name!=='AbortError')toast(e.message,'error');return;}
    $('#exportTitle').textContent=e.name==='AbortError'?'렌더링을 취소했습니다.':'출력 설정을 확인해 주세요.';
    $('#exportProgressArea').hidden=true;$('#exportResult').hidden=false;$('#exportResult').textContent=e.name==='AbortError'?'미완성 영상을 다운로드하지 않습니다. 프로젝트는 그대로 유지됩니다.':e.message;
  }finally{
    state.busy=false;state.controller=null;state.lastClock=performance.now();state.dirty=true;
    if($('#exportDialog').open){$('#exportDiagnostics').hidden=false;$('#cancelExport').hidden=true;$('#closeExport').hidden=false;$('#closeExport').focus();}
  }
}

// Project controls.
$('#projectName').addEventListener('input',e=>{project.name=e.target.value;project.nameMode='custom';changed();});
$('#saveProject').addEventListener('click',saveProject);
$('#openProject').addEventListener('click',()=>$('#projectFile').click());
$('#projectFile').addEventListener('change',async e=>{
  const file=e.target.files[0];e.target.value='';if(!file)return;
  try{
    if(file.size>1024*1024)throw new Error('프로젝트 파일은 1 MiB 이하여야 합니다.');
    const next=validateProject(JSON.parse(await file.text()));
    if(!confirm('현재 작업 대신 이 프로젝트를 열까요? 현재 작업은 JSON 저장으로 보관할 수 있습니다.'))return;
    replaceProject(next);toast('프로젝트를 불러왔습니다.');
  }catch(error){toast(`프로젝트를 열지 못했습니다. ${error.message}`,'error');}
});
$('#newProject').addEventListener('click',()=>{if(confirm('새 프로젝트를 시작할까요? 현재 작업을 보관하려면 먼저 JSON으로 저장하세요.')){replaceProject(defaultProject());closeLibrary();}});
$('#modeDesign').addEventListener('click',()=>setMode('design'));$('#modeCode').addEventListener('click',()=>setMode('code'));$('#openCodeHint').addEventListener('click',()=>setMode('code'));
$('#styleTab').addEventListener('click',()=>showTab('style'));$('#exportTab').addEventListener('click',()=>showTab('export'));
$('.inspector-tabs').addEventListener('keydown',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=$('#styleTab').getAttribute('aria-selected')==='true'?'export':'style';showTab(next);$('#'+next+'Tab').focus();}});
$('#openExport').addEventListener('click',()=>{showTab('export');if(state.mode==='code')openInspector();if(matchMedia('(max-width:760px)').matches)$('#inspector').scrollIntoView({behavior:'smooth',block:'start'});});
$('#presetSearch').addEventListener('input',renderLibrary);
$('#presetCategory').addEventListener('click',()=>$('#categoryMenu').hidden?openCategory():closeCategory());
$('#presetCategory').addEventListener('keydown',e=>{if(['ArrowDown','ArrowUp'].includes(e.key)){e.preventDefault();openCategory(e.key==='ArrowUp');}});
$('#categoryMenu').addEventListener('keydown',e=>{
  const options=[...e.currentTarget.children],index=options.indexOf(document.activeElement);
  if(e.code==='Space'){e.preventDefault();e.stopPropagation();options[index]?.click();return;}
  if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?options.length-1:(index+(e.key==='ArrowDown'?1:-1)+options.length)%options.length;options[next].focus();}
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();closeCategory(true);}if(e.key==='Tab')closeCategory();
});
document.addEventListener('pointerdown',e=>{if(!$('#categoryPicker').contains(e.target))closeCategory();});
$('#categoryPicker').addEventListener('focusout',()=>setTimeout(()=>{if(!$('#categoryPicker').contains(document.activeElement))closeCategory();},0));
$('#inspectorToggle').addEventListener('click',()=>$('#inspector').classList.contains('is-open')?closeInspector():openInspector());
$('#closeInspector').addEventListener('click',closeInspector);
$('#codecDiagnostics').addEventListener('click',saveDiagnostics);
$('#exportDiagnostics').addEventListener('click',saveDiagnostics);
$('#quickResolution').addEventListener('click',e=>{const b=e.target.closest('button[data-resolution]');if(b)updateOutputSetting('resolution',b.dataset.resolution);});
$('#snapshotResolution').addEventListener('change',e=>updateOutputSetting('resolution',e.target.value));
$('#snapshotAspect').addEventListener('change',e=>updateOutputSetting('aspect',e.target.value));
$('#libraryToggle').addEventListener('click',()=>$('#library').classList.contains('is-open')?closeLibrary():openLibrary());$('#closeLibrary').addEventListener('click',closeLibrary);
$('#addLayer').addEventListener('click',()=>{state.pendingAdd=true;$('.library-intro').textContent='추가할 레이어의 패턴을 고르세요.';openLibrary();renderLibrary();toast('왼쪽 목록에서 추가할 패턴을 고르세요.');});
$('#duplicateLayer').addEventListener('click',()=>{
  if(project.layers.length>=MAX_LAYERS)return;
  const layer=duplicateLayer(selected());try{renderer?.sync({...project,layers:[...project.layers,layer]});project.layers.push(layer);setSelected(layer.id);changed();}catch(e){toast(e.message,'error');}
});
$('#removeLayer').addEventListener('click',()=>{
  if(project.layers.length<=1)return;
  const next=project.layers.filter(l=>l.id!==state.selected);renderer?.sync({...project,layers:next});project.layers=next;setSelected(next.at(-1).id);changed();
});
function moveLayer(delta){const index=project.layers.findIndex(l=>l.id===state.selected),to=index+delta;if(to<0||to>=project.layers.length)return;[project.layers[index],project.layers[to]]=[project.layers[to],project.layers[index]];renderLayers();changed();}
$('#moveLayerDown').addEventListener('click',()=>moveLayer(-1));$('#moveLayerUp').addEventListener('click',()=>moveLayer(1));
$('#blendMode').addEventListener('change',e=>{selected().blend=e.target.value;renderLayers();changed();});$('#layerCycles').addEventListener('change',e=>{selected().cycles=Number(e.target.value);changed();});
['colorA','colorB','colorC'].forEach((id,i)=>$('#'+id).addEventListener('input',e=>{selected().colors[i]=e.target.value;renderPalettes();changed();}));$('#backgroundColor').addEventListener('input',e=>{project.background=e.target.value;changed();});
$('#compileCode').addEventListener('click',compileCode);$('#resetCode').addEventListener('click',()=>{selected().draft=null;loadEditor();changed();});$('#saveGLSL').addEventListener('click',()=>downloadBlob(new Blob([editor.value],{type:'text/plain'}),`${safeName(selected().name)}.glsl`));
$('#playPause').addEventListener('click',togglePlay);$('#rewind').addEventListener('click',()=>{state.phase=0;state.dirty=true;updateTimeline();});
$('#scrub').addEventListener('input',e=>{state.phase=Math.min(.999999,Number(e.target.value)/10000);state.playing=false;state.dirty=true;renderPlayButton();updateTimeline();});
$('#previewQuality').addEventListener('change',e=>{state.previewSize=Number(e.target.value);fitPreview();});
$('#resetView').addEventListener('click',()=>{Object.assign(selected(),{zoom:1,rotation:0,offset:[0,0]});renderInspector();changed();});
$('#fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#previewShell').requestFullscreen();}catch{toast('이 브라우저에서는 전체 화면 요청이 허용되지 않았습니다.','warning');}});
$('#snapshot').addEventListener('click',()=>{
  if(state.busy)return;renderOutput();$('#snapshotMessage').textContent='현재 재생 위치의 한 프레임을 저장합니다.';$('#snapshotDialog').showModal();
});
$('#confirmSnapshot').addEventListener('click',async()=>{
  if(state.busy)return;
  try{assertReady();state.busy=true;$('#confirmSnapshot').disabled=true;$('#snapshotMessage').textContent='선택 해상도로 렌더링 중…';
    const snapshot=clone(project),blob=await renderPNG(snapshot,state.phase),[w,h]=dimensions(snapshot.output);
    downloadBlob(blob,`${safeName(snapshot.name)}-${w}x${h}.png`);$('#snapshotDialog').close();toast(`${w} × ${h} PNG를 생성했습니다.`);
  }catch(e){$('#snapshotMessage').textContent=e.message;toast(e.message,'error');}
  finally{state.busy=false;$('#confirmSnapshot').disabled=false;state.lastClock=performance.now();}
});
for(const [id,key]of [['outputResolution','resolution'],['outputAspect','aspect'],['outputFPS','fps'],['outputDuration','duration'],['outputQuality','quality'],['outputEncoder','encoder']])$('#'+id).addEventListener('change',e=>updateOutputSetting(key,e.target.value));
$('#directSave').addEventListener('change',e=>{project.output.direct=e.target.checked;renderOutput();changed();});
$('#checkCodec').addEventListener('click',async()=>{
  if(state.busy){if(state.probing)state.controller?.abort();return;}const button=$('#checkCodec'),snapshot=clone(project),key=JSON.stringify(snapshot.output);state.busy=true;state.probing=true;state.controller=new AbortController();button.textContent='검사 취소';
  $('#codecStatus').textContent='선택 크기로 렌더링 후 실제 H.264 압축을 검사합니다…';
  try{
    assertReady();const result=await testEncoder(snapshot,{signal:state.controller.signal,onAttempt:a=>{if(JSON.stringify(project.output)===key)$('#codecStatus').textContent=`실제 1프레임 검사 ${a.attempt} · ${a.codec} · ${a.preference} · ${a.input}`;}});
    if(JSON.stringify(project.output)!==key)return;
    state.codec=result.config;state.diagnostics=result.diagnostics;$('#codecDiagnostics').hidden=false;
    $('#codecStatus').textContent=`실제 1프레임 통과 · ${result.config.width} × ${result.config.height} · ${result.config.codec} · ${result.input==='canvas'?'캔버스':'CPU RGBA'} 전달. 전체 영상 성공까지 보장하는 검사는 아닙니다.`;
  }catch(e){if(JSON.stringify(project.output)===key){state.diagnostics=e.diagnostics||[];$('#codecDiagnostics').hidden=false;$('#codecStatus').textContent=e.name==='AbortError'?'인코더 검사를 취소했습니다.':e.message;}}
  finally{button.disabled=false;button.textContent='실제 1프레임 출력 검사';state.busy=false;state.probing=false;state.controller=null;state.lastClock=performance.now();}
});
$('#renderVideo').addEventListener('click',renderVideo);$('#downloadVideo').addEventListener('click',()=>{if(state.result?.blob)downloadBlob(state.result.blob,state.result.filename);});
$('#cancelExport').addEventListener('click',()=>{state.controller?.abort();$('#cancelExport').disabled=true;$('#cancelExport').textContent='진행 중인 프레임을 정리하고 있습니다…';});
$('#exportDialog').addEventListener('cancel',e=>{if(state.busy){e.preventDefault();state.controller?.abort();}});
$('#closeExport').addEventListener('click',()=>{if(!state.busy){$('#resultVideo').pause();$('#exportDialog').close();}});
$('#checkLoop').addEventListener('click',showLoop);$('#checkLoopExport').addEventListener('click',showLoop);
for(const id of ['helpButton','codeHelp'])$('#'+id).addEventListener('click',()=>$('#helpDialog').showModal());
document.querySelectorAll('[data-close]').forEach(b=>b.addEventListener('click',()=>$('#'+b.dataset.close).close()));$('#reloadButton').addEventListener('click',()=>location.reload());
// Canvas gestures operate only on the selected layer; project values remain resolution-independent.
let drag=null;
$('#preview').addEventListener('pointerdown',e=>{if(state.busy||e.button!==0)return;drag={x:e.clientX,y:e.clientY,offset:[...selected().offset],id:selected().id};e.currentTarget.setPointerCapture(e.pointerId);});
$('#preview').addEventListener('pointermove',e=>{
  if(!drag)return;const l=project.layers.find(l=>l.id===drag.id);if(!l)return;
  const h=e.currentTarget.getBoundingClientRect().height,dx=(e.clientX-drag.x)*2/h/l.zoom,dy=-(e.clientY-drag.y)*2/h/l.zoom,a=l.rotation*Math.PI/180;
  l.offset=[clamp(drag.offset[0]-(Math.cos(a)*dx+Math.sin(a)*dy),-100,100),clamp(drag.offset[1]-(-Math.sin(a)*dx+Math.cos(a)*dy),-100,100)];changed();
});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('#preview').addEventListener(type,()=>{drag=null;});
$('#preview').addEventListener('wheel',e=>{if(state.busy)return;e.preventDefault();const l=selected();l.zoom=clamp(l.zoom*Math.exp(-e.deltaY*.0015),.25,64);renderInspector();changed();},{passive:false});
window.addEventListener('keydown',e=>{
  const input=/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName),modal=document.querySelector('dialog[open]');
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();if(!state.busy)saveProject();return;}
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'&&state.mode==='code'&&!state.busy&&!modal){e.preventDefault();compileCode();return;}
  if(e.code==='Space'&&!input&&e.target.tagName!=='BUTTON'&&!modal&&!state.busy){e.preventDefault();togglePlay();}
  if(e.key==='Escape'&&!modal){closeLibrary();closeInspector();}
});
window.addEventListener('beforeunload',e=>{
  if(state.busy){e.preventDefault();e.returnValue='';}
  try{saveLocalProject(project);}catch{}
});
document.addEventListener('visibilitychange',()=>state.lastClock=performance.now());
// Resizable, keyboard-accessible split. Only layout preference is stored separately.
let splitting=false;
function setSplit(value){const v=clamp(value,30,70);$('#stage').style.setProperty('--preview-share',`${v}%`);$('#splitter').setAttribute('aria-valuenow',String(Math.round(v)));try{localStorage.setItem('loopfield.split.v1',String(v));}catch{}}
try{const saved=Number(localStorage.getItem('loopfield.split.v1'));setSplit(saved>=30&&saved<=70?saved:56);}catch{setSplit(56);}
$('#splitter').addEventListener('pointerdown',e=>{if(e.button!==0)return;splitting=true;e.currentTarget.setPointerCapture(e.pointerId);document.body.classList.add('is-resizing');});
$('#splitter').addEventListener('pointermove',e=>{if(!splitting)return;const rect=$('#stage').getBoundingClientRect(),style=getComputedStyle($('#stage')),pad=parseFloat(style.paddingLeft);setSplit((e.clientX-rect.left-pad)/(rect.width-pad-parseFloat(style.paddingRight))*100);});
for(const type of ['pointerup','pointercancel','lostpointercapture'])$('#splitter').addEventListener(type,()=>{splitting=false;document.body.classList.remove('is-resizing');});
$('#splitter').addEventListener('keydown',e=>{const v=Number(e.currentTarget.getAttribute('aria-valuenow'));if(['ArrowLeft','ArrowRight','Home'].includes(e.key)){e.preventDefault();setSplit(e.key==='Home'?56:v+(e.key==='ArrowLeft'?-2:2));}});
new ResizeObserver(()=>fitPreview()).observe($('#previewShell'));
function start(){
  try{
    renderer=new Renderer($('#preview'),{onLost:()=>graphicsFailure(new Error('GPU 컨텍스트가 손실되었습니다. 프로젝트를 저장하고 새로고침하세요.'))});
    try{renderer.sync(project);}catch(e){project=defaultProject();state.selected=project.layers[0].id;renderer.sync(project);toast(`저장된 셰이더를 컴파일할 수 없어 기본 패턴을 열었습니다. ${e.message}`,'warning');}
  }catch(e){renderer=null;graphicsFailure(e);}
  $('#projectName').value=project.name;renderLibrary();renderLayers();renderInspector();renderOutput();loadEditor();renderPlayButton();showTab('style');
  requestAnimationFrame(()=>{fitPreview();requestAnimationFrame(tick);});
  if(location.protocol==='file:')toast('프로젝트 미리보기와 MP4 출력을 위해 localhost 또는 GitHub Pages HTTPS로 실행하세요.','warning');
}
start();
initLanguage();
