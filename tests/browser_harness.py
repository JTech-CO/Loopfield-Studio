"""Local-route Playwright harness. Test documents only; no product/runtime dependency.
Run with Python + Playwright + Pillow installed. Set LOOPFIELD_BROWSER to an
installed Chromium executable, or install Playwright Chromium. Set
LOOPFIELD_HEADED=1 for headed GL tests (Linux also needs an X display).
This about:blank origin cannot verify native secure-context VideoEncoder.
"""
import os, shutil
import asyncio, pathlib, re, mimetypes, json, base64
from playwright.async_api import async_playwright
from PIL import Image
ROOT=pathlib.Path(__file__).resolve().parents[1]
OUT=ROOT/'test-artifacts/browser'; OUT.mkdir(parents=True,exist_ok=True)
ORIGIN='https://loopfield.test/'
async def mount(page,path='index.html'):
    async def route_handler(route):
        from urllib.parse import urlparse, unquote
        url=urlparse(route.request.url)
        relative=unquote(url.path).lstrip('/')
        f=(ROOT/(relative or 'index.html')).resolve()
        if not f.is_relative_to(ROOT) or not f.is_file():
            print('NOT FOUND', relative)
            await route.fulfill(status=404,body='Not found');return
        mime=mimetypes.guess_type(str(f))[0] or 'application/octet-stream'
        body=f.read_bytes()
        if f.name=='app.js':
            body=body.replace(b'./assets/icons.svg#',b'#')
        await route.fulfill(status=200,body=body,content_type=mime,headers={'Access-Control-Allow-Origin':'*'})
    await page.route(ORIGIN+'**',route_handler)
    html=(ROOT/path).read_text()
    html=re.sub(r'<meta\s+http-equiv="Content-Security-Policy"[^>]*>','',html,flags=re.I)
    html=html.replace('<head>','<head><base href="'+ORIGIN+('tests/' if path.startswith('tests/') else '')+'">')
    html=html.replace('./assets/icons.svg#','#')
    icons=(ROOT/'assets/icons.svg').read_text()
    icons=icons.replace('<svg ', '<svg style="display:none" ',1)
    html=html.replace('<body>', '<body>'+icons)
    await page.set_content(html,wait_until='networkidle',timeout=30000)
    await page.wait_for_timeout(800)

async def launch(pw):
    executable=os.environ.get('LOOPFIELD_BROWSER') or shutil.which('chromium') or shutil.which('google-chrome')
    options=dict(headless=os.environ.get('LOOPFIELD_HEADED')!='1',args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
    if executable:options['executable_path']=executable
    return await pw.chromium.launch(**options)
