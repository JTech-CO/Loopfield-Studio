"""Run against localhost:8000: python -X utf8 tests/qa_titles.py."""
import asyncio, json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as pw:
        browser = await pw.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        page = await browser.new_page(reduced_motion='reduce')
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('dialog', lambda dialog: dialog.accept())
        async def title(expected):
            assert await page.locator('#projectName').input_value() == expected
        async def choose(preset):
            await page.locator(f'[data-preset="{preset}"]').click()
        await page.goto('http://127.0.0.1:8000')
        await page.wait_for_selector('.preset-card')
        assert await page.locator('html').get_attribute('lang') == 'en'
        assert await page.locator('[data-preset="prism"]').get_attribute('aria-pressed') == 'true'
        await title('Prism Bloom')
        await choose('julia')
        await title('Julia orbit')
        await page.wait_for_timeout(500)
        await page.reload()
        await page.wait_for_selector('.preset-card')
        await title('Julia orbit')
        await choose('mandelbrot')
        await title('Mandelbrot')
        await page.locator('#languageToggle').click()
        await title('망델브로 집합')
        await page.locator('#languageToggle').click()
        await title('Mandelbrot')
        # Focusing the input alone must not lock the title.
        await page.locator('#projectName').click()
        await choose('prism')
        await title('Prism Bloom')
        await page.locator('#projectName').fill('My custom loop / 내 루프')
        await choose('julia')
        await title('My custom loop / 내 루프')
        await page.wait_for_timeout(500)
        saved = json.loads(await page.evaluate("localStorage.getItem('loopfield.project.v1')"))
        assert saved['nameMode'] == 'custom'
        await page.reload()
        await page.wait_for_selector('.preset-card')
        await choose('prism')
        await title('My custom loop / 내 루프')
        await page.locator('#languageToggle').click()
        await title('My custom loop / 내 루프')
        await page.locator('#newProject').click()
        await title('프리즘 블룸')
        await choose('julia')
        await title('줄리아 궤도')
        # Imported JSON retains the explicit manual-title preference.
        await page.locator('#projectFile').set_input_files({'name':'saved.loopfield.json','mimeType':'application/json','buffer':json.dumps(saved).encode()})
        await page.wait_for_timeout(200)
        await choose('mandelbrot')
        await title('My custom loop / 내 루프')
        assert not errors, errors
        print('PASS: EN/Prism defaults, automatic pattern/localized titles, focus without edits, manual-title persistence, reload, new project and JSON import')
        await browser.close()

asyncio.run(main())
