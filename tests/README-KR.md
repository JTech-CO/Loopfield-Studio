# 개발 테스트

[English](README.md) · **한국어** · [프로젝트 README](../README-KR.md)

다음 도구는 선택적인 개발 의존성입니다. 배포 앱은 Python, Node, FFmpeg, Pillow, Playwright를 사용하지 않습니다.

## 순수 JavaScript

```sh
node --test tests/*.test.mjs
```

프리셋, JSON 호환성, H.264 레벨 후보, 출력 크기, RGBA 행 순서, 첫 프레임 재시도와 취소, MP4 박스·타임스탬프·writer를 검사합니다. Node의 VideoEncoder 검사는 모의 객체를 사용하며 네이티브 코덱 검증이 아닙니다.

## 실제 AVC 컨테이너

FFmpeg/ffprobe, Python, Node를 준비하고 실행합니다.

```sh
python tests/validate_media.py --out ./test-artifacts/media
```

14개 결과를 디코딩해 참조 AVC와 프레임별로 비교합니다. WebCodecs 검사는 아닙니다.

## 그래픽과 UI

Python의 playwright, pillow 및 Chromium을 준비합니다.

```sh
python tests/qa_graphics.py
python -X utf8 tests/qa_library.py
python tests/qa_ui.py
python tests/qa_export_flow.py
```

LOOPFIELD_BROWSER로 실행 파일을 지정할 수 있습니다. LOOPFIELD_HEADED=1은 창 모드이며 Linux에서는 디스플레이/Xvfb가 필요합니다. WebGL 초기화 실패는 컴파일 성공으로 간주하지 않습니다.

기존 검사는 about:blank 문서에 로컬 파일을 라우팅합니다. 테스트 문서만 CSP를 생략하고 SVG를 인라인 처리합니다. 배포 CSP나 Pages 동작을 검증하는 방법은 아닙니다. 결과는 test-artifacts/browser/에 저장하며 그래픽 검사는 프리셋 썸네일, UI 검사는 docs/images/를 다시 생성합니다. 출력 흐름 검사는 실제 WebGL과 인코더 모의 객체를 사용합니다.

`qa_library.py`는 64개 전체 셰이더와 추가 32개의 개별·전체 조절값 양 끝을 검사합니다. 기존 이미지를 보존하고 새 썸네일만 생성하며, `library-64.json`과 `library-expansion.png`에 결과를 저장합니다. 테서랙트의 한국어·영어 검색과 조절 항목도 확인합니다.

## 언어·브랜드 회귀검사

로컬 서버를 실행한 뒤 별도 터미널에서 검사합니다.

```sh
python -m http.server 8000 --bind 127.0.0.1
python -X utf8 tests/qa_language.py
```

실제 localhost와 배포 CSP를 유지한 채 언어 전환·재로드·초안과 프로젝트 보존·접근성·문서 링크·모바일 너비·동작 줄이기·내보내기 결과를 확인합니다. 네이티브 인코더가 지원되면 1080p MP4 저장과 video 재생도 검사합니다. 결과는 test-artifacts/language/에 저장합니다.

## 네이티브 코덱

실제 HTTPS/localhost의 tests/browser.html에서 선택 해상도와 24/30/60fps로 2초 영상을 인코딩하고 MP4를 다시 디코딩합니다. 브라우저·OS·설정과 함께 JSON 보고서를 저장하세요. 긴 영상과 OS 파일 선택기는 Studio에서 별도로 검사합니다.

localhost:8000에서 `python -X utf8 tests/qa_titles.py`로 EN·Prism 기본값, 자동 제목, 직접 입력 후 유지, 새로고침, 새 프로젝트와 JSON 불러오기를 검사합니다.
