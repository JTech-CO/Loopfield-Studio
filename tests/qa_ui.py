import asyncio,pathlib,json,base64,io,re,struct
from PIL import Image
from playwright.async_api import async_playwright
from browser_harness import mount,ROOT,OUT,ORIGIN,launch
records=[]
def check(name,condition,detail=None):
 records.append({'name':name,'pass':bool(condition),'detail':detail});print('PASS' if condition else 'FAIL',name,detail or '',flush=True)
 if not condition: raise AssertionError(name)
async def boxes(page):
 return await page.evaluate('''()=>Object.fromEntries(['preview','previewShell','previewColumn','editorPanel','splitter','stage'].map(id=>[id,document.getElementById(id)?.getBoundingClientRect().toJSON()]))''')
async def shot(page,name):
 await page.wait_for_function("document.querySelector('#toast').hidden",timeout=10000)
 await page.screenshot(path=str(OUT/f'{name}.png'),full_page=True)
 im=Image.open(str(OUT/f'{name}.png'));im.save(ROOT/f'docs/images/{name}.webp','WEBP',quality=88)
async def main():
 async with async_playwright() as pw:
  browser=await launch(pw)
  page=await browser.new_page(viewport={'width':1600,'height':1000},reduced_motion='reduce');errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda dialog:dialog.accept())
  await mount(page)
  check('WebGL boot',await page.locator('#canvasError').is_hidden())
  check('32 presets in library',await page.locator('.preset-card').count()==32)
  b=await boxes(page);check('Normal preview fills its shell',b['preview']['width']/b['previewShell']['width']>.99 and b['preview']['height']/b['previewShell']['height']>.99,b)
  await shot(page,'studio-desktop')
  await page.locator('#presetCategory').click();check('Category listbox visible',await page.locator('#categoryMenu').is_visible())
  styles=await page.locator('.category-option').nth(1).evaluate('(el)=>({bg:getComputedStyle(el).backgroundColor,fg:getComputedStyle(el).color})')
  check('Category colors explicitly dark/light',styles['bg']=='rgb(32, 38, 48)' and styles['fg']=='rgb(242, 243, 245)',styles)
  await shot(page,'studio-library')
  await page.locator('.category-option').filter(has_text='프랙탈').click();check('Fractal filter includes six presets',await page.locator('.preset-card').count()==6)
  await page.locator('#presetCategory').focus();await page.keyboard.press('ArrowDown');await page.keyboard.press('Home');await page.keyboard.press('Enter');check('Category keyboard selection',await page.locator('.preset-card').count()==32)
  await page.locator('#presetSearch').fill('뉴턴');check('Korean search finds Newton',await page.locator('.preset-card').count()==1)
  await page.locator('.preset-card').click();check('New preset applied',await page.locator('#selectedLayerName').text_content()=='뉴턴 수렴 영역')
  await page.locator('#presetSearch').fill('prism');await page.locator('.preset-card').click();await page.locator('#presetSearch').fill('')
  await page.locator('#modeCode').click();await page.wait_for_timeout(250);b=await boxes(page)
  check('Code preview LEFT and editor RIGHT',b['previewColumn']['right']<=b['editorPanel']['left'] and abs(b['previewColumn']['top']-b['editorPanel']['top'])<1,b)
  check('Code editor uses full available height',b['editorPanel']['height']>800)
  await page.locator('#splitter').focus();await page.keyboard.press('ArrowRight');check('Keyboard split width',await page.locator('#splitter').get_attribute('aria-valuenow')=='58')
  await page.keyboard.press('Home');await page.wait_for_timeout(150);b=await boxes(page);await page.mouse.move(b['splitter']['x']+4,b['splitter']['y']+100);await page.mouse.down();await page.mouse.move(700,300,steps=8);await page.wait_for_timeout(80);await page.mouse.up();check('Pointer split width',int(await page.locator('#splitter').get_attribute('aria-valuenow'))<50)
  await page.locator('#splitter').focus();await page.keyboard.press('Home');await page.mouse.move(1200,45)
  await page.locator('#inspectorToggle').click();check('Code style drawer opens',await page.locator('#inspector').is_visible());await page.locator('#closeInspector').click();check('Code style drawer closes',await page.locator('#inspector').is_hidden())
  await page.locator('#quickResolution button[data-resolution="uhd"]').click();check('Quick 4K updates output selector',await page.locator('#outputResolution').input_value()=='uhd');check('Quick 4K labels 3840x2160','3840' in await page.locator('#quickDimensions').text_content())
  await page.locator('#openExport').click();check('Export drawer reveals 4K setting',await page.locator('#outputResolution').is_visible() and await page.locator('#outputResolution').input_value()=='uhd')
  await page.locator('#checkCodec').click();await page.wait_for_function("document.querySelector('#checkCodec').textContent.includes('실제')");msg=await page.locator('#codecStatus').text_content();check('Insecure-origin native check fails explicitly','HTTPS' in msg,msg);check('Native failure preserves UHD setting',await page.locator('#outputResolution').input_value()=='uhd')
  await page.locator('#closeInspector').click();await shot(page,'studio-code')
  await page.locator('#snapshot').click();check('PNG dialog exposes same 4K setting',await page.locator('#snapshotResolution').input_value()=='uhd');await page.locator('#snapshotResolution').select_option('dci2k');check('PNG DCI2K selection synchronizes MP4 output',await page.locator('#outputResolution').input_value()=='dci2k' and await page.locator('#snapshotAspect').is_disabled())
  await page.locator('#snapshotResolution').select_option('uhd');await shot(page,'studio-png')
  async with page.expect_download(timeout=90000) as d:
   await page.locator('#confirmSnapshot').click()
  download=await d.value;dest=OUT/'Loopfield-Studio-v1.1.0-4K.png';await download.save_as(dest)
  im=Image.open(dest);check('UI PNG download has real 3840x2160 pixels',im.size==(3840,2160),{'size':im.size,'bytes':dest.stat().st_size})
  await page.locator('#modeDesign').click();await page.locator('#exportTab').click();await page.locator('#outputAspect').select_option('portrait');await page.wait_for_timeout(200);b=await boxes(page);check('Portrait frame keeps 9:16 aspect',abs(b['preview']['width']/b['preview']['height']-9/16)<.002)
  await page.locator('#outputAspect').select_option('square');await page.wait_for_timeout(200);b=await boxes(page);check('Square frame remains square',abs(b['preview']['width']-b['preview']['height'])<=1)
  await page.locator('#outputAspect').select_option('landscape');await page.locator('#styleTab').click();
  await page.locator('#modeCode').click();old=await page.locator('#codeInput').input_value() if await page.locator('#codeInput').count() else ''
  # Compilation transaction and recovery, through editor UI.
  text=page.locator('.code-stack textarea');old=await text.input_value();await text.fill('vec3 pattern(vec2 p){THIS_IS_INVALID;}');await page.locator('#compileCode').click();check('Bad GLSL stays a failed draft',await page.locator('#compileError').is_visible());await page.locator('#resetCode').click();check('GLSL draft revert restores original source',await text.input_value()==old)
  for width,height in [(1024,768),(768,1024),(390,844)]:
   await page.set_viewport_size({'width':width,'height':height});await page.wait_for_timeout(300)
   overflow=await page.evaluate('document.documentElement.scrollWidth>innerWidth');check(f'Code page has no horizontal overflow at {width}px',not overflow)
   b=await boxes(page)
   if width>760:check(f'Tablet horizontal split at {width}px',b['previewColumn']['right']<=b['editorPanel']['left'])
   else:check('Phone uses readable stacked panes',b['editorPanel']['top']>=b['previewColumn']['bottom'])
  await shot(page,'studio-mobile-code');await page.locator('#modeDesign').click();await page.wait_for_timeout(200);check('Mobile normal page has no horizontal overflow',not await page.evaluate('document.documentElement.scrollWidth>innerWidth'));await shot(page,'studio-mobile')
  check('No uncaught application exceptions',not errors,errors)
  (OUT/'ui-regression.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
  await browser.close()
if __name__=='__main__':
 try:asyncio.run(main())
 finally:(OUT/'ui-regression.json').write_text(json.dumps(records,ensure_ascii=False,indent=2))
