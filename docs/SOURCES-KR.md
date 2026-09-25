# 구현 시 확인한 공식 참고자료

[English](SOURCES.md) · **한국어**

확인일: 2026-09-22. 아래 문서를 참고해 API 계약을 확인했으며, 외부 라이브러리 코드를 번들에 포함하지 않았다.

1. [W3C WebCodecs](https://www.w3.org/TR/webcodecs/): VideoEncoder, VideoFrame, timestamp, flush, close, 지원 조회.
2. [Chrome Developers - Video processing with WebCodecs](https://developer.chrome.com/docs/web-platform/best-practices/webcodecs): Canvas에서 프레임 생성, 실제 설정 조회, 프레임 자원 해제, secure context.
3. [W3C AVC (H.264) WebCodecs Registration](https://www.w3.org/TR/webcodecs-avc-codec-registration/): AVC 형식 청크와 decoder configuration record. H.264 지원 자체는 구현 의무가 아니다.
4. [GitHub Pages - Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): Pages artifact, 배포 환경과 권한.
5. [GitHub Pages - About custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages): 사용자 도메인 연결.

6. [Chromium H.264 level limits](https://chromium.googlesource.com/chromium/src/+/refs/tags/143.0.7499.183/media/parsers/h264_level_limits.h): level별 매크로블록 수·처리율·비트레이트 제약.

실제 검증 증거는 외부 문서가 아니라 TEST_REPORT-KR.md와 validation/의 실행 결과이다. 브라우저와 OS의 코덱 제공 상태는 문서만으로 확정할 수 없어 앱과 테스트 페이지에서 동적으로 검사한다.
