# 검증 보고서 / 2026-09-22

## 판정 범위

v1.0.0은 기능 구현과 분리 계층 검증을 마친 실행 가능한 정적 앱이다. **실제 GPU 셰이더 렌더링과 MP4 container 처리를 검증했으나 이 제작 환경에서 브라우저 네이티브 WebCodecs H.264 인코딩 전체 경로를 실행하지 못했다.** 따라서 모든 Chrome/Edge/Safari/Firefox·하드웨어의 영상 출력을 검증했다고 해석하면 안 된다.

## 실행 결과

| 계층 | 수행 | 결과 |
|---|---|---|
| JS 문법 | js/*.js 파싱 | 통과 |
| Node 순수 로직 / muxer | controls, JSON, 시간축, 크기, MP4 box, seek writer, 오류와 abort 17건 | 17 통과 |
| 실제 WebGL 2 | 12개 GLSL 프리셋 컴파일·렌더 | 12 통과 |
| 루프 샘플 | 기본 프리셋 0/1 끝점, 320×180 | 12 통과 |
| 고의 불연속 코드 | RGB가 uLoop에 따라 선형 변화 | 평균 차이 85/255, 올바르게 미일치 |
| 실제 4K 렌더 | 3840×2160 RGBA 프레임·readPixels | 33,177,600 bytes, glError 0 |
| UI | 프리셋 검색·레이어·코드 실패/복구·사용자 슬라이더·루프·해상도·오류·JSON 다운로드·모바일 등 | 26 통과 |
| 실제 AVC→MP4 | 7개 설정 × 메모리/직접 writer | 14 통과 |
| 추가 그래픽 회귀 | 포함된 브라우저 검사 페이지, discard 잔상/4레이어/실패 복구 포함 | 16 통과 |
| 샘플 프로젝트 | 3개 JSON 검증·GLSL 컴파일·루프 검사 | 3 통과 |
| 출력 루프 계측 | 실제 WebGL + 인코더 스텁, 시간축·프레임 해제·취소 검사 | 통과, 네이티브 코덱 검사는 아님 |
| 브라우저 native WebCodecs | target secure origin에서 실제 인코딩 | 이 환경에서 미실행 |
| 네이티브 파일 선택기 / 디스크 | OS 권한 창·실제 File System Access 저장 | 미실행, seek/abort adapter 검증만 수행 |
| 실제 localStorage 영속성 | 재시작·도메인 이동 등 | 이 환경에서 미실행 |

검사기와 상세 JSON은 `validation/`에 있다. 스크린샷은 실제 앱에서 캡처했다. UI 테스트는 1600×1000 데스크톱과 390px 폭 모바일 레이아웃에서 가로 넘침이 없음을 확인했다. 테스트 도중 잡히지 않은 JS 예외는 없었다.

## 브라우저 환경 제한

테스트 브라우저의 정책상 외부/localhost 페이지로 직접 이동할 수 없었다. Playwright의 about:blank 문서와 로컬 파일 라우팅으로 실제 모듈을 실행했다. 이 문서는 secure context가 아니어서 VideoEncoder가 노출되지 않았다. WebGL 2는 Chromium + ANGLE SwiftShader + Xvfb에서 실제 컴파일·프레임버퍼 렌더·readPixels를 수행했다. 하드웨어 GPU의 처리 시간 벤치마크는 아니다.

라우팅 UI 시험에서는 테스트 문서만 CSP meta를 제거했고, about:blank의 외부 SVG 제한 때문에 동일 SVG 심볼을 테스트 문서에 인라인 배치했다. 배포 소스의 CSP와 외부 아이콘 경로는 바꾸지 않았다. 이 테스트로 실제 GitHub Pages HTTP 응답이나 CSP 네트워크 동작이 검증되는 것은 아니다. 그래픽 엔진의 그림을 가짜 이미지로 대체하거나 canvas 모킹으로 통과시키지 않았다.

## MP4 검사 방법

개발 머신의 FFmpeg/libx264로 실제 H.264 참조 영상을 생성했다. ffprobe에서 AVCDecoderConfigurationRecord와 각 압축 샘플, PTS, 키프레임 정보를 추출하여 앱과 같은 js/mp4.js에 전달했다. 메모리 Blob 경로와 랜덤 접근 직접 쓰기 어댑터 경로로 각각 MP4를 만들었다.

1920×1080/30fps, 2560×1440/30fps, 2048×1080/24fps, 3840×2160/30fps, 3840×2160/60fps, 1080×1920/30fps는 각 12프레임으로 검사했다. B-frame 순서가 바뀌는 320×180/30fps 스트림은 24프레임으로 검사했다. ffprobe로 코덱·해상도·FPS·길이·프레임 수를 확인하고 FFmpeg로 다시 디코딩했다. 디코딩한 각 프레임의 해시가 참조 파일과 순서까지 일치했다.

출력 모듈은 별도로 실제 WebGL에서 선형 위상에 따른 픽셀 값을 읽고 VideoFrame/VideoEncoder를 계측 스텁으로 대체해 12프레임의 타임스탬프·진행률·자원 해제·취소를 검사했다. 이는 인코더 API 호출 흐름 검사이며 네이티브 코덱을 실행한 결과가 아니다. `export-instrumentation.json`의 마지막 한 프레임은 별도 취소 테스트의 프레임이다.

이는 **컨테이너와 타이밍의 실제 AVC 호환 검사**이다. FFmpeg를 앱의 인코더로 사용한 것이 아니며 네이티브 WebCodecs 실행을 대신 검증했다고 주장하지 않는다. 테스트에 사용한 FFmpeg/Node/Python은 제품 런타임 의존성이 아니다.

## 재현

```sh
node --test tests/*.test.mjs
python tests/validate_media.py --out /원하는/임시/폴더
```

브라우저에서는 HTTPS 또는 localhost의 `tests/browser.html`을 연다. 그래픽 검사와 **실제 WebCodecs → MP4 → HTMLVideoElement 디코딩** 검사를 수행하고 JSON 결과를 저장할 수 있다. 이 네이티브 검사는 장치에서 버튼을 눌러야 시작하며, 2초/30fps/60프레임이다.

## 공개 서비스 전 남은 검증

Windows/macOS의 목표 Chrome·Edge에서 1080p/QHD/DCI 2K/UHD, 24/30/60fps의 native encoder를 각각 확인한다. Safari/Firefox/모바일 지원은 동적 probe와 실제 출력 결과에 따라 문서화한다. 4레이어 프랙탈의 UHD 장시간 출력, 디스크 저장·취소·기존 파일 보존, 메모리 상한, 탭 이동·절전 복귀·GPU 손실을 실기기로 확인한다.

루프 샘플 통과는 수학적 증명이 아니다. 아주 작은 요소는 저해상도 평균 차이에서 잘 드러나지 않을 수 있다. 4K 결과를 실제 반복 재생해 시각적 경계도 확인한다. 보편적 기기별 성능 수치는 아직 제공하지 않는다.
