"""Real WebGL library checks and thumbnails. Run: python -X utf8 tests/qa_library.py.
Only the 32 expansion thumbnails are written; existing artwork is preserved.
The local-route harness does not validate deployment CSP or native MP4 encoding.
"""
import asyncio
import base64
import io
import json
from PIL import Image, ImageDraw
from playwright.async_api import async_playwright
from browser_harness import mount, ROOT, OUT, launch


async def main():
    reports = []
    images = []
    async with async_playwright() as pw:
        browser = await launch(pw)
        page = await browser.new_page(viewport={'width': 1600, 'height': 1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        await mount(page)
        assert await page.locator('.preset-card').count() == 64
        assert await page.locator('#canvasError').is_hidden()
        await page.evaluate('''async () => {
          const presets = await import('https://loopfield.test/js/presets.js');
          const expansion = await import('https://loopfield.test/js/presets-expanded.js');
          const graphics = await import('https://loopfield.test/js/renderer.js');
          const utils = await import('https://loopfield.test/js/utils.js');
          window.qa = {...presets, ...graphics, ...utils, expanded: new Set(expansion.EXPANDED_PRESETS.map(p => p.id))};
          qa.renderer = new graphics.Renderer(document.createElement('canvas'));
          qa.renderer.resize(240, 144);
        }''')
        ids = await page.evaluate('qa.PRESETS.map(p => p.id)')
        for preset_id in ids:
            report = await page.evaluate('''id => {
              const project = qa.defaultProject(), layer = qa.createLayer(id), r = qa.renderer;
              project.layers = [layer];
              try {
                r.sync(project);
                const loop = qa.inspectLoop(r, project);
                r.render(project, .16);const pixels = r.pixels();
                let lo=255, hi=0, bright=0;
                for(let i=0;i<pixels.length;i+=4) {
                  lo=Math.min(lo,pixels[i],pixels[i+1],pixels[i+2]);
                  hi=Math.max(hi,pixels[i],pixels[i+1],pixels[i+2]);
                  if(Math.max(pixels[i],pixels[i+1],pixels[i+2])>30)bright++;
                }
                r.render(project, .37);const reference=r.pixels(),motion=qa.endpointMetrics(pixels,reference);
                const variants=[];const controls=r.layers.get(layer.id).controls;
                if(qa.expanded.has(id)) {
                  for(const control of controls) for(const mode of ['min','max']) {
                    layer.params={...qa.createLayer(id).params,[control.name]:control[mode]};
                    r.render(project,.37);
                    variants.push({control:control.name,mode,variation:qa.endpointMetrics(reference,r.pixels()).mae,glError:r.gl.getError()});
                  }
                  for(const mode of ['min','max']) {
                    layer.params=Object.fromEntries(controls.map(c=>[c.name,c[mode]]));
                    variants.push({mode,loop:qa.inspectLoop(r,project),glError:r.gl.getError()});
                  }
                }
                layer.params=qa.createLayer(id).params;
                let image=null;
                if(qa.expanded.has(id)) {
                  r.resize(320,180);r.render(project,.16);image=r.canvas.toDataURL('image/png');r.resize(240,144);
                }
                const glError=r.gl.getError();
                return {id,name:qa.presetById(id).name,expanded:qa.expanded.has(id),loop,motion,
                  brightPixels:bright,colorRange:hi-lo,variants,glError,image,
                  pass:loop.match&&motion.rmse>.05&&hi-lo>15&&bright>0&&glError===0
                    &&variants.every(v=>v.glError===0&&(!v.loop||v.loop.match))
                    &&(!qa.expanded.has(id)||controls.every(c=>variants.some(v=>v.control===c.name&&v.variation>.001)))};
              } catch(error) {return {id,pass:false,error:error.message};}
            }''', preset_id)
            image_data = report.pop('image', None)
            if image_data:
                image = Image.open(io.BytesIO(base64.b64decode(image_data.split(',')[1]))).convert('RGB')
                image.save(ROOT / f'assets/presets/{preset_id}.webp', 'WEBP', quality=87)
                images.append((report['name'], image))
            reports.append(report)
            print(('PASS' if report['pass'] else 'FAIL'), preset_id,
                  report.get('error') or f"loop={report['loop']['match']} motion={report['motion']['rmse']:.2f}", flush=True)
        assert not errors, errors
        await page.locator('#presetSearch').fill('tesseract')
        assert await page.locator('.preset-card').count() == 1
        await page.locator('.preset-card').click()
        assert 'Tesseract' in await page.locator('#selectedLayerName').inner_text()
        assert await page.locator('#parameterControls input[type=range]').count() == 4
        await page.locator('#languageToggle').click()
        assert await page.locator('#selectedLayerName').inner_text() == '테서랙트 초입방체'
        await page.locator('#presetSearch').fill('초입방체')
        assert await page.locator('.preset-card').count() == 1
        await page.evaluate('qa.renderer.dispose()')
        await browser.close()
    (OUT / 'library-64.json').write_text(json.dumps(reports, ensure_ascii=False, indent=2), encoding='utf-8')
    sheet = Image.new('RGB', (1280, 8*206), '#080b12')
    draw = ImageDraw.Draw(sheet)
    for index, (name, image) in enumerate(images):
        x, y = (index % 4)*320, (index // 4)*206
        sheet.paste(image, (x, y))
        draw.text((x+8, y+182), name, fill='#eef4ff')
    sheet.save(OUT / 'library-expansion.png')
    assert all(report['pass'] for report in reports), 'See test-artifacts/browser/library-64.json'
    assert len(images) == 32
    print('PASS 64 WebGL patterns, 32 new thumbnails, EN/KR tesseract search and controls', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
