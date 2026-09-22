import asyncio, pathlib, json, base64, io
from PIL import Image
from browser_harness import mount,ROOT,OUT,ORIGIN,launch
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as pw:
  browser=await launch(pw)
  page=await browser.new_page(viewport={'width':1600,'height':1000},reduced_motion='reduce');await mount(page)
  await page.evaluate('''async()=>{const m=await import('https://loopfield.test/js/presets.js'),r=await import('https://loopfield.test/js/renderer.js');window.qa={...m,...r};qa.r=new r.Renderer(document.createElement('canvas'));qa.r.resize(320,180);}''')
  presets=await page.evaluate('qa.PRESETS.map(p=>p.id)');reports=[]
  for preset in presets:
   report=await page.evaluate('''id=>{const p=qa.defaultProject();p.layers=[qa.createLayer(id)];try{qa.r.sync(p);const loop=qa.inspectLoop(qa.r,p);qa.r.render(p,.16);const px=qa.r.pixels(),gl=qa.r.gl.getError();let sum=0,bright=0;for(let i=0;i<px.length;i+=4){sum+=px[i]+px[i+1]+px[i+2];if(Math.max(px[i],px[i+1],px[i+2])>30)bright++;}let extremes=[];for(const mode of ['min','max']){for(const c of qa.r.layers.get(p.layers[0].id).controls)p.layers[0].params[c.name]=c[mode];qa.r.render(p,.37);extremes.push({mode,error:qa.r.gl.getError()});}p.layers[0].params=qa.createLayer(id).params;qa.r.render(p,.16);return {id,pass:true,glError:gl,loop,brightness:sum/(320*180*3),brightPixels:bright,extremes,image:qa.r.canvas.toDataURL('image/png')};}catch(e){return {id,pass:false,error:e.message};}}''',preset)
   if report.get('image'):
    raw=base64.b64decode(report.pop('image').split(',')[1]);im=Image.open(io.BytesIO(raw));im.save(ROOT/f'assets/presets/{preset}.webp','WEBP',quality=87)
   print(report['id'], report.get('pass'),report.get('loop',{}).get('match'),report.get('error',''),flush=True);reports.append(report)
  await page.evaluate('qa.r.dispose()')
  (OUT/'graphics-presets.json').write_text(json.dumps(reports,ensure_ascii=False,indent=2))
  await page.locator('#modeCode').click();await page.wait_for_timeout(600)
  await page.screenshot(path=str(OUT/'loopfield-code.png'))
  print('code boxes',await page.evaluate('''()=>Object.fromEntries(['previewColumn','editorPanel','splitter','stage'].map(id=>[id,document.getElementById(id)?.getBoundingClientRect().toJSON()]))'''))
  await page.locator('#libraryToggle').click();await page.locator('#presetCategory').click();await page.screenshot(path=str(OUT/'loopfield-category.png'))
  await browser.close()
if __name__=='__main__':asyncio.run(main())
