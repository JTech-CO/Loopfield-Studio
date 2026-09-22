# v1.0.0 → v1.1.0 적용

기존 저장소 루트의 파일을 새 ZIP의 `Loopfield-Studio/` 안 **내용물 전체**로 교체한다. 일부 JS만 교체하면 HTML ID와 모듈 구조가 맞지 않으므로 반드시 `index.html`, `css`, `js`, `assets`, `tests`, `docs`를 함께 갱신한다. `js/avc.js`, `js/presets-extra.js`와 새 프리셋 WebP가 추가되었다.

작업을 보관하려면 먼저 기존 앱에서 프로젝트 JSON을 저장한다. 프로젝트 schema version은 1로 유지했으며 v1.0.0 JSON의 GLSL·레이어·해상도를 읽는다. 누락된 encoder 설정만 auto로 기본 처리한다. 같은 origin의 자동 저장 키도 유지한다. 도메인을 바꾸면 origin이 달라지므로 JSON으로 옮긴다.

사용자 도메인을 이미 설정했다면 기존 CNAME과 DNS 설정은 유지한다. ZIP은 도메인을 임의로 지정하지 않는다. GitHub Pages 배포가 완료되면 Ctrl+Shift+R로 새로고침하고 하단 `Loopfield 1.1.0`을 확인한다. 앱은 service worker를 사용하지 않는다.

## 달라진 조작

- 코드: 왼쪽 프리뷰, 오른쪽 편집기. 패턴·설정은 상단 버튼으로 여는 서랍이다. 구분선을 움직여 너비 조절.
- 해상도: 캔버스 아래의 저장 해상도가 PNG/MP4 공통 설정이다. 미리보기 품질과 혼동하지 않는다.
- PNG: 카메라 버튼 → 해상도 확인 → PNG 저장.
- MP4: 저장 해상도 선택 → 영상 내보내기 → FPS/길이/품질 → 실제 1프레임 출력 검사 → MP4 렌더링.
- 실패 진단: 설정 패널 또는 출력 결과 창에서 JSON 저장. 모든 기기에서 H.264 4K 인코더 제공을 보장하지 않는다.

전체 변경점은 [CHANGELOG](../CHANGELOG.md), 실제 검증 범위는 [TEST_REPORT](TEST_REPORT.md)에 있다.
