# 아키텍처 / v1.1.0

[English](ARCHITECTURE.md) · **한국어**

## 경계

호스트는 HTML·CSS·JS·SVG·WebP만 서빙한다. 브라우저가 코드를 편집하고 GPU에 셰이더를 컴파일하며 H.264로 인코딩한다. 사용자 프로젝트나 영상 페이로드를 서버에 올리는 API는 없다. 정적 리소스 요청과 일반 호스팅 로그는 존재할 수 있다. 별도 네트워크 엔드포인트, API 키, 유료 인코딩 작업이 없다.

## 모듈

app.js는 화면 상태와 이벤트, editor.js는 텍스트 편집·강조, project.js는 저장 및 검증을 담당한다. presets.js와 presets-extra.js는 32개 자체 GLSL 소스와 초기값, glsl.js는 공통 API와 컴파일 wrapper를 제공한다. renderer.js는 GPU 타깃과 합성, avc.js는 AVC 프로필/레벨 후보와 지원 조회, exporter.js는 첫 프레임 검증·프레임 생성·WebCodecs·취소, mp4.js는 AVC 한 트랙용 ISO BMFF writer이다. utils.js에 순수 계산과 저장 헬퍼를 모았다.

## 화면 구조

일반 모드는 라이브러리 / 프리뷰 / 설정의 세 영역이다. 프리뷰는 남는 높이를 늘리는 flex 박스가 아니라 출력 aspect-ratio를 따르는 박스다. canvas는 이 영역을 contain으로 채우므로 자르거나 비율을 왜곡하지 않는다.

코드 모드는 라이브러리와 설정을 서랍으로 전환하고 가운데 stage를 preview / separator / editor의 CSS grid로 만든다. 분할 비율은 30~70%, 기본 56%이며 별도 localStorage 키에 보관한다. 작은 스마트폰만 세로로 쌓는다. 미리보기 품질은 UI state, 출력 크기는 project.output이다. 빠른 해상도 버튼, 영상 출력 설정, PNG 대화상자는 같은 project.output을 읽고 쓴다.

패턴 분류는 HTML listbox 버튼이며 OS의 native option 색에 의존하지 않는다. 다른 select에는 배경색/글자색/color-scheme을 명시한다. 프리셋 썸네일은 실제 GLSL 렌더에서 생성한 로컬 WebP이다.

## GPU 파이프라인

3개의 출력 크기 RGBA8 타깃을 사용한다. 하나는 매 레이어의 임시 타깃, 둘은 합성 결과 ping-pong이다. 임시 타깃은 레이어마다 투명하게 초기화하므로 discard와 투명 mainImage가 프레임 잔상을 만들지 않는다. 팔레트·변환·반복 횟수·슬라이더를 uniform으로 전달한다.

합성 후 가로·세로 1/4 크기의 타깃 두 개로 밝기 임계값 추출과 가우시안 블러를 수행한다. 마지막 패스가 블룸·노출·대비·색수차·비네트·시간에 의존하지 않는 디더링을 적용한다. 선형 HDR 광학 모델이 아닌 SDR 예술적 후처리이다. GPU float texture 확장에 기대지 않는다.

프레임은 과거 결과를 읽지 않는다. 동일 기기·설정·위상에서 재현하는 것을 지향하되 서로 다른 GPU 드라이버 사이의 비트 단위 동일성이나 코덱 출력 동일성을 약속하지 않는다. compile은 트랜잭션 방식으로 새 프로그램을 모두 준비한 뒤 교체한다. 하나가 실패하면 새 프로그램만 해제하고 기존 화면을 보존한다.

## 프레임 시간

총 프레임 수 N = duration × fps. 프레임 i의 phase=i/N, timestamp=round(i×1,000,000/fps)이다. duration은 인접 timestamp 차이다. 마지막은 (N-1)/N이며 별도의 phase=1 프레임을 추가하지 않는다. 미리보기 wall-clock은 편집용이고 오프라인 출력 시간축에 영향을 주지 않는다.

루프 검사는 phase 0,1,1/N,1-1/N 네 장을 저해상도로 비교한다. 종료 위상을 모듈로 감싸서 억지로 통과시키지 않는다. 평균 RGB 끝점 차이 0.5/255 이하는 진단 기준이지 전역 연속성 증명이 아니다.

## H.264 / MP4

VideoEncoder.isConfigSupported에 **출력과 동일한 크기·FPS·목표 비트레이트**를 넣는다. 가로/세로를 각각 16픽셀 매크로블록으로 올림한 뒤 MaxFS, MaxMBPS, 치수 제약과 프로필별 MaxBR로 AVC High/Main/Baseline 후보를 만든다. DCI 2K/30은 적어도 4.2, QHD/30은 5.0, UHD/30은 5.1, UHD/60은 5.2가 필요하며 비트레이트가 더 높은 레벨을 요구할 수도 있다. 모든 2K를 무조건 5.1로 요청하지 않는다.

조회가 통과해도 실제 인코더 초기화는 실패할 수 있다. 후보마다 새 인코더로 정확한 출력 크기의 프레임 0을 encode/flush한다. 실패하면 canvas 대신 readPixels의 행을 뒤집은 top-down RGBA VideoFrame을 시도하고, 다른 프로필/레벨/하드웨어 선호 경로도 탐색한다. 최초 성공 청크는 메모리에 보류한 뒤 MP4 writer를 열어 커밋한다. 이후 루프는 프레임 1부터 시작하므로 첫 프레임이 중복되지 않는다. 실패한 인코더/프레임은 모두 해제한다. 이미 본격 출력이 시작된 이후의 오류는 결과를 폐기하며 중간부터 다른 코덱을 연결하지 않는다.

`hardwareAcceleration`의 prefer-hardware/prefer-software는 브라우저 힌트일 뿐 실제 실행 장치의 증거가 아니다. raw RGBA는 **프레임 입력 전달 방식**의 폴백이지 소프트웨어 H.264 구현이 아니다. 제품에 WASM/FFmpeg 인코더를 번들하지 않았다. 모든 후보가 실패하면 선택 해상도를 유지한 채 오류/진단을 반환한다.

AVC output을 길이 접두어 NAL 단위 형식으로 요청하고, metadata.decoderConfig.description의 AVCDecoderConfigurationRecord를 avcC에 넣는다. 출력 청크의 타임스탬프를 검증한다. 한 프레임마다 VideoFrame을 close한다. 첫 프레임과 이후 작은 배치마다 flush하고 파일 기록도 기다려 무제한 큐 누적을 피한다. GPU 렌더링 호출은 주 스레드에 있으며 네이티브 인코더 처리는 브라우저 구현에 따른다. 향후 Worker 이전은 별도 확장이다.

MP4 writer는 원본 구현이며 범용 미디어 라이브러리가 아니다. 한 개의 AVC 영상 트랙, 정사각 픽셀, 일정 FPS, 무음 출력을 대상으로 한다. mvhd/tkhd/mdhd/stsd/avc1/avcC/stts/stsc/stsz/stco 또는 co64/stss를 기록한다. 청크 순서와 표시 순서가 다를 때 signed ctts를 넣는다. 정확한 샘플 수, 고유 PTS, 시작 키프레임, 일관된 AVC 설정이 필수이다.

메모리 저장은 ftyp → moov → mdat 구조의 fast-start Blob이다. 인코딩 페이로드는 256 MiB까지만 모으므로 탭 RAM 전체를 안전하게 보장하는 한도는 아니다. GPU 텍스처·코덱·Blob 처리 메모리는 별도이다.

직접 저장은 ftyp → 64bit mdat → moov이다. 완료 시 mdat 크기를 seek write하고 close한다. 미디어 데이터가 RAM에 전부 쌓이지 않지만 샘플 테이블은 프레임 수에 비례한다. moov가 뒤에 있으므로 이 경로의 파일은 온라인 점진 재생용 fast-start 최적화가 아니다. 실패나 취소는 abort 경로를 사용한다. OS 권한 창의 신규 빈 파일 생성 여부까지 통제하지 않는다.

## 프로젝트 / 보안

프로젝트 JSON은 format/version과 레이어 1~4개, 소스 최대 48,000자, 전체 파일 최대 1 MiB, 수치 범위, 색과 enum을 확인한다. JS eval이나 프로젝트 내 스크립트 실행은 하지 않는다. 텍스트는 textContent로 출력하며 코드 강조도 텍스트 노드로 처리한다. 초안과 적용 소스는 분리된다.

이것은 적대적인 GLSL에 대한 GPU 샌드박스 제품은 아니다. 커스텀 셰이더는 GPU 시간을 과점유할 수 있다. 현재는 개인 파일 가져오기 모델이며 공개 셰이더 업로드 서비스가 없다. 공개 갤러리·공유 URL·원격 코드를 추가할 때 별도 검토와 제한이 필요하다.

CSP는 self 자원과 필요한 blob 이미지/영상, 동적 UI 스타일을 허용한다. eval과 외부 script를 요구하지 않는다. 사용자가 만든 데이터를 업로드하지 않으며 추적 스크립트를 포함하지 않았다. SharedArrayBuffer/멀티스레드 WASM을 쓰지 않아 COOP/COEP 헤더를 요구하지 않는다.

## 확장 방향

현재 기준을 유지하며 확장할 후보는 Worker 기반 출력, 여러 출력 작업 큐, AA 품질 선택, 파라미터 키프레임의 주기성 검증, 정밀 프랙탈 렌더러이다. 오디오 트랙이나 다른 코덱은 muxer 구조까지 함께 확장해야 한다. 내장 경로를 자동으로 범용 MP4 시스템으로 간주하지 않는다.

## 언어와 브랜드 자산

i18n.js와 locales/en.js는 화면 문구와 접근성 속성을 번역한다. 원문을 보관해 언어 전환을 되돌릴 수 있으며 MutationObserver로 동적 상태 메시지도 반영한다. 편집기 원문과 입력값, 프로젝트 JSON은 변경하지 않는다. 확인 대화상자는 호출 시 번역한다. 언어는 별도 loopfield.language.v1 키에 저장한다. 외부 번역 서비스는 사용하지 않는다. 로고와 출력 진행 표시가 같은 궤도 SVG를 사용하며 동작 줄이기 설정에서는 애니메이션을 정지한다.
