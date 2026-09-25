"""KR/EN regression against the actual localhost app, including its CSP.
Run a local server on port 8000, then python -X utf8 tests/qa_language.py.
Requires Playwright with Chromium. Artifacts are ignored by Git.
"""
import asyncio, json, re
from pathlib import Path
from playwright.async_api import async_playwright

OUT = Path(__file__).resolve().parents[1] / 'test-artifacts/language'

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    results = []
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = await browser.new_page(viewport={'width':1600, 'height':1000}, reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        async def check(name, condition):
            assert condition, name
            results.append(name)
            print('PASS', name, flush=True)
        await page.goto('http://127.0.0.1:8000')
        await page.wait_for_function("() => document.querySelectorAll('.preset-card').length === 32")
        await check('Default Korean and WebGL boot', await page.locator('html').get_attribute('lang') == 'ko' and await page.locator('#canvasError').is_hidden())
        await page.locator('#projectName').fill('내 프로젝트 — Keep my name')
        await page.locator('#modeCode').click()
        source = await page.locator('#codeEditor').input_value()
        draft = source + '\n// 내 초안은 번역하지 않습니다.'
        await page.locator('#codeEditor').fill(draft)
        await page.wait_for_timeout(500)
        before = await page.evaluate("localStorage.getItem('loopfield.project.v1')")
        await page.locator('#languageToggle').click()
        await check('Immediate English and preserved draft', await page.locator('html').get_attribute('lang') == 'en' and await page.locator('#codeEditor').input_value() == draft)
        await check('Project data unchanged', before == await page.evaluate("localStorage.getItem('loopfield.project.v1')"))
        await check('English accessible labels', await page.locator('#playPause').get_attribute('aria-label') == 'Play preview')
        await page.locator('#languageToggle').click()
        await check('Lossless Korean restoration', await page.locator('#codeStatus').inner_text() == '수정됨 · 적용 필요')
        await page.locator('#languageToggle').click()
        await page.reload()
        await page.wait_for_function("() => document.documentElement.lang === 'en'")
        await check('Language and draft survive reload', await page.locator('#codeEditor').input_value() == draft)
        await page.locator('#modeCode').click()
        await page.locator('#resetCode').click()
        await page.locator('#modeDesign').click()
        await page.locator('#presetSearch').fill('julia')
        await page.locator('.preset-card').click()
        await check('English preset names and controls', await page.locator('#selectedLayerName').inner_text() == 'Julia orbit' and 'Orbit radius' in await page.locator('#parameterControls').inner_text())
        await page.locator('#presetSearch').fill('')
        await page.locator('#helpButton').click()
        await check('English documentation links', (await page.locator('[data-doc="USER_GUIDE"]').get_attribute('href')).endswith('/USER_GUIDE.md'))
        await page.locator('[data-close="helpDialog"]').click()
        await page.locator('#openExport').click()
        await page.locator('#outputDuration').fill('2')
        await page.locator('#outputDuration').press('Tab')
        await page.locator('#outputFPS').select_option('24')
        await page.locator('#directSave').uncheck()
        await page.locator('#renderVideo').click()
        await page.wait_for_function("() => document.querySelector('#exportDialog').open")
        await check('Shared logo and reduced-motion export indicator', await page.locator('.export-orbit img').get_attribute('src') == './assets/favicon.svg' and await page.locator('.orbit-tracer').evaluate('(e)=>getComputedStyle(e).animationName') == 'none')
        await page.screenshot(path=str(OUT/'english-export.png'))
        await page.wait_for_function("() => !document.querySelector('#closeExport').hidden", timeout=120000)
        export_result = await page.locator('#exportResult').inner_text()
        await check('Export result is localized', not re.search('[가-힣]', export_result))
        if await page.locator('#downloadVideo').is_visible():
            async with page.expect_download() as download_info:
                await page.locator('#downloadVideo').click()
            await (await download_info.value).save_as(OUT/'native-1080p.mp4')
            await page.locator('#resultVideo').evaluate('(v)=>v.play()')
            await page.wait_for_function("() => document.querySelector('#resultVideo').videoWidth === 1920 && document.querySelector('#resultVideo').currentTime > 0")
            await check('Native 1080p MP4 encode and video playback', True)
        else:
            print('Native encoder unavailable:', export_result, flush=True)
        await page.locator('#closeExport').click()
        await page.locator('#styleTab').click()
        await page.screenshot(path=str(OUT/'english-desktop.png'))
        for width in [1024, 768, 390]:
            await page.set_viewport_size({'width':width,'height':900})
            await page.wait_for_timeout(200)
            await check(f'No horizontal overflow at {width}px', await page.evaluate('document.documentElement.scrollWidth <= innerWidth'))
            await check(f'Language button reachable at {width}px', await page.locator('#languageToggle').is_visible())
            await page.screenshot(path=str(OUT/f'english-{width}.png'), full_page=True)
        await page.locator('#languageToggle').click()
        await page.screenshot(path=str(OUT/'korean-mobile.png'), full_page=True)
        await check('No browser exceptions', not errors)
        (OUT/'results.json').write_text(json.dumps({'passed':results,'errors':errors,'export':export_result},ensure_ascii=False,indent=2),encoding='utf-8')
        await browser.close()

asyncio.run(main())
