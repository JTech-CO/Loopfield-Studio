"""80-pattern UI smoke test with the original HTML/CSP on loopback HTTP.
Run after thumbnail generation: python -X utf8 tests/qa_library_ui.py.
"""
import asyncio
import functools
import json
import threading
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from playwright.async_api import async_playwright
from browser_harness import ROOT, OUT, launch


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *_args):
        pass


async def main():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    server = ThreadingHTTPServer(('127.0.0.1', 0), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    checks = []
    try:
        async with async_playwright() as pw:
            browser = await launch(pw)
            page = await browser.new_page(viewport={'width':1600, 'height':1000}, reduced_motion='reduce')
            errors, failed = [], []
            page.on('pageerror', lambda error: errors.append(str(error)))
            page.on('requestfailed', lambda request: failed.append(request.url))
            page.on('response', lambda response: failed.append(f'{response.status} {response.url}') if response.status >= 400 else None)
            response = await page.goto(f'http://127.0.0.1:{server.server_port}/', wait_until='networkidle')
            assert response.status == 200
            await page.wait_for_function("document.querySelectorAll('.preset-card').length === 80")
            assert await page.locator('html').get_attribute('lang') == 'en'
            assert await page.locator('#projectName').input_value() == 'Prism Bloom'
            assert await page.locator('#bootError').is_hidden()
            assert await page.locator('#canvasError').is_hidden()
            presets = await page.evaluate('''async () => {
              const a=await import('/js/presets-curves.js'),b=await import('/js/presets-planar.js'),c=await import('/js/presets-spatial.js');
              return [...a.CURVE_PRESETS,...b.PLANAR_PRESETS,...c.SPATIAL_PRESETS].map(p=>({id:p.id,name:p.name,ko:p.ko}));
            }''')
            for preset in presets:
                await page.locator('#presetSearch').fill('')
                await page.locator(f'[data-preset="{preset["id"]}"]').click()
                await page.wait_for_function('(name)=>document.querySelector("#selectedLayerName").textContent===name', arg=preset['name'])
                assert await page.locator('#projectName').input_value() == preset['name']
                assert await page.locator('#parameterControls input[type=range]').count() >= 2
                assert await page.locator('#canvasError').is_hidden()
                # Real UI edits and reset restore every shape control.
                slider = page.locator('#parameterControls input[type=range]').first
                await slider.evaluate("el=>{el.value=el.max;el.dispatchEvent(new Event('input',{bubbles:true}));}")
                assert await page.locator('#resetParameters').is_enabled()
                await page.locator('#resetParameters').click()
                assert await page.locator('#resetParameters').is_disabled()
                await page.locator('#languageToggle').click()
                await page.wait_for_function('(name)=>document.querySelector("#selectedLayerName").textContent===name', arg=preset['ko'])
                assert await page.locator('#projectName').input_value() == preset['ko']
                await page.locator('#presetSearch').fill(preset['ko'])
                assert await page.locator('.preset-card').count() == 1
                await page.locator('#languageToggle').click()
                checks.append(preset['id'])
                print('PASS UI', preset['id'], flush=True)
            await page.locator('#presetSearch').fill('')
            await page.locator('#projectName').fill('My 80-pattern loop')
            await page.locator('[data-preset="koch"]').click()
            assert await page.locator('#projectName').input_value() == 'My 80-pattern loop'
            await page.screenshot(path=str(OUT / 'library-80-studio.png'), full_page=True)
            assert not errors, errors
            assert not failed, failed
            (OUT / 'library-80-ui.json').write_text(json.dumps({'startup':'EN / Prism Bloom', 'presets':80, 'newPresets':checks, 'errors':errors, 'failedRequests':failed}, indent=2), encoding='utf-8')
            await browser.close()
    finally:
        server.shutdown()
        server.server_close()
    print('PASS original CSP, 80 cards, 16 selections/resets, EN/KR names/search and custom title', flush=True)


if __name__ == '__main__':
    asyncio.run(main())
