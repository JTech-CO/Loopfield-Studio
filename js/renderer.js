import { VERTEX, COMPOSITE, BLUR, FINISH, buildFragment } from './glsl.js';
import { hexRGB, TAU, endpointMetrics } from './utils.js';
const BLENDS={normal:0,screen:1,add:2,multiply:3,difference:4};
export class ShaderError extends Error {
  constructor(message,layerId=null) { super(message);this.name='ShaderError';this.layerId=layerId; }
}
/** A stateless, deterministic, multi-pass WebGL 2 renderer. No feedback/history buffers. */
export class Renderer {
  constructor(canvas,{onLost=()=>{}}={}) {
    this.canvas=canvas; this.lost=false;this.disposed=false;this.layers=new Map();this.targets=[];
    const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,preserveDrawingBuffer:true,powerPreference:'high-performance',depth:false,stencil:false});
    if(!gl)throw new Error('WebGL 2를 사용할 수 없습니다. 브라우저의 그래픽 가속을 켜고 다시 열어 주세요.');
    this.gl=gl;this.limit=Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),...gl.getParameter(gl.MAX_VIEWPORT_DIMS));
    this.lossHandler=e=>{e.preventDefault();this.lost=true;onLost();};canvas.addEventListener('webglcontextlost',this.lossHandler);
    this.vao=gl.createVertexArray();gl.bindVertexArray(this.vao);
    try { this.composite=this.program(COMPOSITE);this.blur=this.program(BLUR);this.finish=this.program(FINISH); }
    catch(e){this.dispose();throw e;}
    gl.disable(gl.DEPTH_TEST);gl.disable(gl.BLEND);gl.disable(gl.DITHER);
  }
  program(fragment) {
    const gl=this.gl;
    const compile=(type,code)=>{
      const sh=gl.createShader(type);gl.shaderSource(sh,code);gl.compileShader(sh);
      if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){const log=gl.getShaderInfoLog(sh);gl.deleteShader(sh);throw new ShaderError(log||'셰이더 컴파일 실패');}return sh;
    };
    let vs,fs,p;
    try {
      vs=compile(gl.VERTEX_SHADER,VERTEX);fs=compile(gl.FRAGMENT_SHADER,fragment);p=gl.createProgram();gl.attachShader(p,vs);gl.attachShader(p,fs);gl.linkProgram(p);
      if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw new ShaderError(gl.getProgramInfoLog(p)||'셰이더 연결 실패');
      return {p,uniforms:new Map()};
    }catch(e){if(p)gl.deleteProgram(p);throw e;}
    finally{if(vs)gl.deleteShader(vs);if(fs)gl.deleteShader(fs);}
  }
  sync(project) {
    if(this.lost||this.disposed)throw new Error('그래픽 컨텍스트가 해제되었습니다. 페이지를 새로고침하세요.');
    const next=new Map(),created=[];
    try{
      for(const layer of project.layers){
        const current=this.layers.get(layer.id);
        if(current?.source===layer.source){next.set(layer.id,current);continue;}
        try{const built=buildFragment(layer.source);const obj={...this.program(built.code),source:layer.source,controls:built.controls};created.push(obj);next.set(layer.id,obj);}
        catch(e){e.layerId=layer.id;throw e;}
      }
    }catch(e){created.forEach(o=>this.gl.deleteProgram(o.p));throw e;}
    for(const [id,old] of this.layers)if(next.get(id)!==old)this.gl.deleteProgram(old.p);
    this.layers=next;
  }
  uniform(prog,name,type,value) {
    const gl=this.gl;
    if(!prog.uniforms.has(name))prog.uniforms.set(name,gl.getUniformLocation(prog.p,name));
    const loc=prog.uniforms.get(name);if(loc===null)return;
    if(type==='1f')gl.uniform1f(loc,value);else if(type==='1i')gl.uniform1i(loc,value);
    else if(type==='2f')gl.uniform2fv(loc,value);else if(type==='3f')gl.uniform3fv(loc,value);
  }
  texture(prog,name,target,unit) {
    const gl=this.gl;gl.activeTexture(gl.TEXTURE0+unit);gl.bindTexture(gl.TEXTURE_2D,target.tex);this.uniform(prog,name,'1i',unit);
  }
  target(width,height) {
    const gl=this.gl,tex=gl.createTexture(),fb=gl.createFramebuffer();
    try{
      gl.bindTexture(gl.TEXTURE_2D,tex);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA8,width,height,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,tex,0);
      if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE||gl.getError()!==gl.NO_ERROR)throw new Error('GPU 메모리가 부족하거나 이 렌더 크기를 지원하지 않습니다. 해상도를 낮추세요.');
      return {tex,fb,width,height};
    }catch(e){gl.deleteTexture(tex);gl.deleteFramebuffer(fb);throw e;}
  }
  resize(width,height) {
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||Math.max(width,height)>this.limit)throw new Error(`이 GPU의 최대 렌더 크기는 ${this.limit}px입니다.`);
    if(this.width===width&&this.height===height)return;
    this.releaseTargets();this.canvas.width=width;this.canvas.height=height;
    try{
      for(let i=0;i<3;i++)this.targets.push(this.target(width,height));
      for(let i=0;i<2;i++)this.targets.push(this.target(Math.max(1,Math.ceil(width/4)),Math.max(1,Math.ceil(height/4))));
      this.width=width;this.height=height;
    }catch(e){this.releaseTargets();throw e;}
  }
  bind(target) {
    const gl=this.gl;gl.bindFramebuffer(gl.FRAMEBUFFER,target?.fb||null);gl.viewport(0,0,target?.width||this.width,target?.height||this.height);
  }
  draw() { this.gl.drawArrays(this.gl.TRIANGLES,0,3); }
  render(project,phase,{frame=0}={}) {
    if(this.lost||this.disposed)throw new Error('그래픽 컨텍스트가 해제되었습니다.');
    if(!this.width)throw new Error('먼저 렌더 크기를 지정하세요.');
    const gl=this.gl;gl.bindVertexArray(this.vao);const [layerTarget,pingA,pingB,bloomA,bloomB]=this.targets;
    let read=pingA,write=pingB;
    this.bind(read);const bg=hexRGB(project.background);gl.clearColor(...bg,1);gl.clear(gl.COLOR_BUFFER_BIT);
    for(const layer of project.layers){
      if(!layer.enabled||layer.opacity<=0)continue;
      const prog=this.layers.get(layer.id);if(!prog)throw new Error('레이어가 컴파일되지 않았습니다.');
      this.bind(layerTarget);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog.p);
      // Intentionally NOT modulo-wrapped: phase=1 is a real endpoint test.
      const loop=phase*layer.cycles+layer.phase,angle=loop*TAU;
      const u=(n,t,v)=>this.uniform(prog,n,t,v);
      u('uResolution','2f',[this.width,this.height]);u('uLoop','1f',loop);u('uAngle','1f',angle);u('uCycle','2f',[Math.cos(angle),Math.sin(angle)]);
      u('uTime','1f',phase*project.output.duration);u('uDuration','1f',project.output.duration);u('uFrame','1i',frame);
      u('uZoom','1f',layer.zoom);u('uRotation','1f',layer.rotation*Math.PI/180);u('uOffset','2f',layer.offset);u('uSeed','1f',layer.seed);u('uHue','1f',layer.hue);
      ['uColorA','uColorB','uColorC'].forEach((n,i)=>u(n,'3f',hexRGB(layer.colors[i])));
      prog.controls.forEach(c=>u(c.name,'1f',layer.params[c.name]??c.value));this.draw();
      this.bind(write);gl.useProgram(this.composite.p);this.texture(this.composite,'uBase',read,0);this.texture(this.composite,'uLayer',layerTarget,1);
      this.uniform(this.composite,'uOpacity','1f',layer.opacity);this.uniform(this.composite,'uBlend','1i',BLENDS[layer.blend]||0);this.draw();
      [read,write]=[write,read];
    }
    const fx=project.effects;
    if(fx.glow>0){
      this.bind(bloomA);gl.useProgram(this.blur.p);this.texture(this.blur,'uTexture',read,0);this.uniform(this.blur,'uDirection','2f',[4/this.width,0]);this.uniform(this.blur,'uExtract','1f',1);this.draw();
      this.bind(bloomB);this.texture(this.blur,'uTexture',bloomA,0);this.uniform(this.blur,'uDirection','2f',[0,1/bloomA.height]);this.uniform(this.blur,'uExtract','1f',0);this.draw();
    }else{this.bind(bloomB);gl.clearColor(0,0,0,1);gl.clear(gl.COLOR_BUFFER_BIT);}
    this.bind(null);gl.useProgram(this.finish.p);this.texture(this.finish,'uTexture',read,0);this.texture(this.finish,'uBloom',bloomB,1);
    const u=(n,v)=>this.uniform(this.finish,n,'1f',v);
    this.uniform(this.finish,'uResolution','2f',[this.width,this.height]);u('uGlow',fx.glow);u('uExposure',fx.exposure);u('uContrast',fx.contrast);u('uVignette',fx.vignette);u('uAberration',fx.aberration);this.draw();
    if(gl.isContextLost())throw new Error('GPU 컨텍스트가 손실되었습니다. 해상도나 레이어 수를 줄이세요.');
  }
  pixels() {
    const gl=this.gl,out=new Uint8Array(this.width*this.height*4);gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.readPixels(0,0,this.width,this.height,gl.RGBA,gl.UNSIGNED_BYTE,out);return out;
  }
  releaseTargets() { for(const t of this.targets){this.gl.deleteTexture(t.tex);this.gl.deleteFramebuffer(t.fb);}this.targets=[];this.width=0;this.height=0; }
  dispose() {
    if(this.disposed)return;this.disposed=true;this.releaseTargets();
    for(const l of this.layers.values())this.gl.deleteProgram(l.p);this.layers.clear();
    for(const p of [this.composite,this.blur,this.finish])if(p)this.gl.deleteProgram(p.p);
    if(this.vao)this.gl.deleteVertexArray(this.vao);this.canvas.removeEventListener('webglcontextlost',this.lossHandler);
    this.gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
export function inspectLoop(renderer,project) {
  const total=project.output.duration*project.output.fps,dt=1/total;
  renderer.render(project,0,{frame:0});const a=renderer.pixels();
  renderer.render(project,1,{frame:total});const b=renderer.pixels();
  const endpoints=endpointMetrics(a,b);
  renderer.render(project,dt,{frame:1});const after=renderer.pixels();
  renderer.render(project,1-dt,{frame:total-1});const before=renderer.pixels();
  let sq=0,n=0;
  for(let i=0;i<a.length;i++){if(i%4===3)continue;const d=(after[i]-a[i])-(b[i]-before[i]);sq+=d*d;n++;}
  return {...endpoints,motionRMSE:Math.sqrt(sq/n),width:renderer.width,height:renderer.height,samples:4};
}
