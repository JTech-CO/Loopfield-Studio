# Changelog

## 1.0.0 / 2026-09-22

ShaderDesk와 독립된 첫 구현이다. 12개 GLSL 프리셋, 4레이어 합성, 후처리, 코드/슬라이더 편집, 샘플 기반 루프 검사, 1080p/QHD/DCI 2K/UHD 프레임 출력, WebCodecs H.264와 자체 MP4 writer, JSON/GLSL/PNG 보관, 정적 Pages 배포를 포함한다.

개발 검증은 계층별로 기록했다. 실제 WebGL·4K 프레임·MP4 muxer의 AVC 디코딩·UI는 통과했다. 대상 기기의 native WebCodecs와 File System Access 실기기 검증은 별도의 테스트 페이지를 통해 수행해야 한다. 완전한 플랫폼 인증 또는 상용 SLA를 뜻하는 버전은 아니다.
