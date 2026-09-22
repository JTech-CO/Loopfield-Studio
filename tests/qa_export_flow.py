import asyncio,json,pathlib,base64,io
from PIL import Image
from playwright.async_api import async_playwright
from browser_harness import mount,ROOT,OUT,ORIGIN,launch
async def main():
 async with async_playwright() as pw:
  browser=await launch(pw)
  page=await browser.new_page(viewport={'width':1200,'height':900},reduced_motion='reduce');await mount(page)
  await page.evaluate('''async()=>{window.qa={...(await import('https://loopfield.test/js/presets.js')),...(await import('https://loopfield.test/js/exporter.js')),...(await import('https://loopfield.test/js/avc.js')),...(await import('https://loopfield.test/js/utils.js'))};}''')
  sizes=[]
  for key,aspect in [('1080p','landscape'),('dci2k','landscape'),('qhd','landscape'),('uhd','landscape'),('uhd','portrait'),('uhd','square')]:
   data=await page.evaluate('''async ([resolution,aspect])=>{let p=qa.defaultProject();p.output.resolution=resolution;p.output.aspect=aspect;p.layers=[qa.createLayer('quasicrystal')];let b=await qa.renderPNG(p,.3);return await new Promise(resolve=>{let r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(b);});}''',[key,aspect])
   raw=base64.b64decode(data.split(',')[1]);im=Image.open(io.BytesIO(raw));expected={'1080p':(1920,1080),'dci2k':(2048,1080),'qhd':(2560,1440),'uhd':(3840,2160)}[key]
   if aspect=='portrait':expected=expected[::-1]
   if aspect=='square':expected=(expected[1],expected[1])
   assert im.size==expected
   sizes.append({'resolution':key,'aspect':aspect,'width':im.width,'height':im.height,'bytes':len(raw),'pass':True});print('PNG',sizes[-1],flush=True)
  # Deliberately instrument WebCodecs only: renderer and pixel readback are real.
  # This is NOT a native encoder/codec test. An explicit preferred exact config
  # avoids secure-context probing of APIs absent from this test origin.
  reports=await page.evaluate('''async()=>{
    const logs={frames:[],encoders:[],progress:[]};let cpu=false;
    class Frame{constructor(source,opts){this.opts=opts;this.closed=false;let value;if(source instanceof Uint8Array){value=source[0];}else{let gl=source.getContext('webgl2'),px=new Uint8Array(4);gl.readPixels(1,1,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px);value=px[0];}this.data={timestamp:opts.timestamp,duration:opts.duration,pixel:value,input:source instanceof Uint8Array?'rgba':'canvas',closed:false};logs.frames.push(this.data);}close(){this.closed=true;this.data.closed=true;}}
    class Encoder{constructor(cb){this.cb=cb;this.state='unconfigured';this.q=[];logs.encoders.push(this);}configure(c){this.c=c;this.state='configured';}encode(f,options){if(cpu&&f.data.input==='canvas')throw new Error('Simulated canvas transfer rejection');this.q.push({f:f.data,options});}async flush(){for(const {f,options}of this.q){this.cb.output({timestamp:f.timestamp,type:options.keyFrame?'key':'delta',byteLength:8,copyTo:a=>a.set([0,0,0,4,101,f.pixel,0,0])},{decoderConfig:{description:new Uint8Array([1,100,0,51,255,225,0,4,103,100,0,51,1,0,2,104,0])}});}this.q=[];}close(){this.state='closed';}}
    Object.defineProperty(window,'VideoFrame',{value:Frame,configurable:true});Object.defineProperty(window,'VideoEncoder',{value:Encoder,configurable:true});
    const results=[];
    for(const input of ['canvas','rgba']) {
      cpu=input==='rgba';logs.frames=[];logs.encoders=[];logs.progress=[];
      const p=qa.defaultProject();p.output={...p.output,resolution:'uhd',fps:24,duration:.5,direct:false};p.layers[0].source='vec3 pattern(vec2 p){return vec3(uLoop,0,0);}';p.effects={glow:0,exposure:1,contrast:1,vignette:0,aberration:0};
      const result=await qa.exportVideo(p,{config:qa.avcCandidates(p.output)[0],onProgress:v=>logs.progress.push({stage:v.stage,frame:v.frame,percent:v.percent})});
      const accepted=logs.frames.filter(f=>f.input===input);const expected=Array.from({length:12},(_,i)=>Math.round(i/24*1e6));
      if(result.width!==3840||result.height!==2160||result.frames!==12)throw new Error('wrong dimensions/frame count');
      if(accepted.length!==12||accepted.some((f,i)=>f.timestamp!==expected[i]))throw new Error('duplicate or missing frame zero');
      if(accepted.some((f,i)=>Math.abs(f.pixel-i/12*255)>2))throw new Error('render phase differs from exact frame index');
      if(logs.frames.some(f=>!f.closed)||logs.encoders.some(e=>e.state!=='closed'))throw new Error('unclosed resources');
      results.push({input,width:result.width,height:result.height,frames:accepted,progress:logs.progress,encoders:logs.encoders.length,pass:true,nativeEncoder:false});
    }
    const p=qa.defaultProject();p.output={...p.output,resolution:'1080p',fps:24,duration:2,direct:false};const c=new AbortController();cpu=false;logs.encoders=[];
    let aborted=false;try{await qa.exportVideo(p,{config:qa.avcCandidates(p.output)[0],signal:c.signal,onProgress:v=>{if(v.frame>=1)c.abort();}});}catch(e){aborted=e.name==='AbortError';}
    if(!aborted||logs.encoders.some(e=>e.state!=='closed'))throw new Error('cancel/cleanup failed');results.push({cancel:true,pass:true,nativeEncoder:false});return results;
  }''')
  (OUT/'png-resolutions.json').write_text(json.dumps(sizes,ensure_ascii=False,indent=2));(OUT/'export-instrumentation.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2));print('Export flow instrumentation PASS',flush=True)
  await browser.close()
if __name__=='__main__':asyncio.run(main())
