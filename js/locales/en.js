// Korean source phrases are presentation keys; project data and GLSL stay unchanged.
export const entries = `
MP4 렌더링|Render MP4
MP4로 저장합니다.|Export as MP4.
PNG 저장|Save PNG
.glsl 저장|Save .glsl
MP4 다운로드|Download MP4
간단한 GLSL과 레이어 조합으로 만드는 고해상도 기하학 루프 영상. 브라우저에서 1080p, QHD, 4K MP4로 내보내세요.|Create high-resolution geometric loops with GLSL and layers. Export 1080p, QHD and 4K MP4 in your browser.
기하학 루프 영상 생성기|Geometric loop video studio
작업 화면으로 이동|Skip to workspace
작업 모드|Workspace mode
만들기|Design
코드|Code
패턴|Patterns
설정|Settings
사용법|Help
열기|Open
프로젝트 저장|Save project
영상 내보내기|Export video
패턴 라이브러리|Pattern library
패턴 목록 닫기|Close pattern library
하나를 골라, 나만의 루프로.|Choose a pattern. Make it your own.
이름으로 찾기|Search by name
패턴 검색|Search patterns
모든 패턴|All patterns
패턴 분류|Pattern category
내 브라우저에서만 처리|Processed in your browser
계정 · 업로드 · API 키 없음|No account, uploads or API keys
새 프로젝트 시작|New project
루프 편집 화면|Loop workspace
프로젝트 이름|Project name
선택한 셰이더의 실시간 미리보기|Live preview of the selected shader
그래픽 가속을 확인해 주세요|Check graphics acceleration
페이지 새로고침|Reload page
전체 프레임 · 원본 비율 유지|Full frame · original aspect ratio
드래그 이동 · 휠 확대|Drag to pan · scroll to zoom
미리보기 품질|Preview quality
가볍게|Lightweight
고부하|Heavy
선택 레이어의 위치와 확대 초기화|Reset the selected layer's position and zoom
시점 초기화|Reset view
루프 검사|Check loop
해상도 선택 후 저장|Choose resolution and save
미리보기 전체 화면|Fullscreen preview
와 MP4 저장 해상도|and MP4 export resolution
저장 해상도|Export resolution
출력 해상도 선택|Choose output resolution
미리보기 일시정지|Pause preview
미리보기 재생|Play preview
처음 프레임으로|Go to first frame
루프 재생 위치|Loop playback position
합성 레이어|Compositing layers
레이어|Layer
아래에서 위로 합성|Composite from bottom to top
레이어 추가|Add layer
복제|Duplicate
복사|Copy
아래 레이어로 이동|Move toward the bottom
위 레이어로 이동|Move toward the top
위로 →|Move up →
아래로|Move down
삭제|Delete
패턴을 겹쳐 더 깊은 장면을 만드세요.|Layer patterns to add depth to your scene.
캔버스와 코드 너비 조정|Resize preview and code panels
코드 편집기|Code editor
적용됨|Applied
되돌리기|Revert
현재 편집 중인 GLSL 다운로드|Download the current GLSL source
저장|Save
적용|Apply
소스 코드|Source code
한 바퀴|One revolution
원형 궤도|Circular orbit
색상|Colors
코드 도움말|Code help
패턴과 출력 설정|Pattern and output settings
스타일 · 영상 출력|Style · Video export
설정 패널 닫기|Close settings panel
스타일|Style
영상 출력|Video export
합성 방식|Blend mode
일반|Normal
스크린|Screen
더하기|Add
곱하기|Multiply
차이|Difference
반복 횟수|Cycles
형태|Shape
확대 · 회전 · 시작 위상 · 시드|Zoom · Rotation · Phase · Seed
레이어별 팔레트|Per-layer palette
첫 번째 색상|First color
두 번째 색상|Second color
세 번째 색상|Third color
전체 배경 색상|Canvas background color
주조색|Primary
보조색|Secondary
강조색|Accent
배경|Background
마무리|Finishing
전체 레이어에 적용|Applied to all layers
블룸은 별도 저해상도 블러 패스로 합성합니다. 출력은 SDR 영상이며 HDR이 아닙니다.|Bloom uses a separate low-resolution blur pass. Output is SDR, not HDR.
숫자를 넘어, 코드로.|Shape your ideas with code.
짧은 GLSL로 직접 편집하기 →|Edit with a little GLSL →
장면을 영상으로.|Turn your scene into a video.
화면 녹화가 아닌, 한 프레임씩.|Rendered one frame at a time.
미리보기와 출력 해상도는 별개입니다.|Preview and export resolutions are independent.
화면 비율|Aspect ratio
가로|Landscape
세로|Portrait
정사각형|Square
출력 해상도|Output resolution
프레임 속도|Frame rate
루프 길이 (초)|Loop duration (seconds)
인코더 선택|Encoder preference
자동 · 가능한 인코더 탐색|Auto · Find a supported encoder
하드웨어 우선|Prefer hardware
소프트웨어 우선 · 호환성|Prefer software · Compatibility
압축 품질|Encoding quality
표준 · 작은 파일|Standard · Smaller file
고품질 · 권장|High · Recommended
최고 품질 · 큰 파일|Maximum · Larger file
오디오 없음|No audio
전체 프레임|Total frames
목표 비트레이트|Target bitrate
예상 파일 크기|Estimated file size
약 |About\u0020
디스크에 직접 저장|Save directly to disk
지원 브라우저에서 메모리 사용량을 줄입니다.|Reduces memory use in supported browsers.
인코더를 확인하지 않았습니다.|Encoder has not been tested.
실제 1프레임 출력 검사|Test one encoded frame
진단 JSON 저장|Save diagnostics JSON
렌더링|Render
선택 크기의 실제 프레임으로 인코더를 검사합니다. 실패하면 다른 프로필·소프트웨어 우선·CPU 프레임 전달을 시도합니다. 모든 경로가 실패하면 진단을 표시하며 크기는 낮추지 않습니다.|Tests an actual frame at your chosen size. If needed, tries other profiles, software preference and CPU frame input. If all attempts fail, shows diagnostics and keeps your resolution.
끊김 없는 루프를 위해|For a seamless loop
기본 패턴은 주기 함수로 움직입니다. 직접 작성한 코드는 출력 전에 경계 샘플을 검사합니다. 재생기의 파일 전환 지연까지 제거하는 기능은 아닙니다.|Built-in patterns use periodic motion. Custom code is checked at the loop boundary before export. Playback gaps caused by the video player are outside this check.
루프 경계 검사|Inspect loop boundary
브라우저에 자동 저장|Autosaved in this browser
준비 중|Preparing
해상도 선택|Choose resolution
저장 창 닫기|Close save dialog
미리보기 크기와 무관하게 선택한 크기로 다시 렌더링합니다. 아래 설정은 MP4 출력에도 동일하게 반영됩니다.|Renders again at the chosen size, regardless of preview quality. These settings also apply to MP4 export.
현재 재생 위치의 한 프레임을 저장합니다.|Save one frame at the current playback position.
처음부터, 어렵지 않게.|Your first loop, step by step.
사용법 닫기|Close help
패턴을 고릅니다.|Choose a pattern.
망델브로, 줄리아, 기하학, 유기적 패턴 중 하나로 시작하세요. 선택한 패턴은 현재 레이어에 적용됩니다.|Start with Mandelbrot, Julia, geometry or organic patterns. Your choice replaces the selected layer.
색과 형태를 바꿉니다.|Adjust color and shape.
오른쪽 슬라이더와 팔레트를 조정하세요. 레이어를 추가하면 최대 4개까지 겹칠 수 있습니다.|Use the sliders and palettes on the right. Combine up to four layers.
로 저장합니다.| export.
캔버스 아래 저장 해상도에서 1080p / 2K / 4K를 선택하고 영상 출력에서 크기, 길이, FPS를 정하고 렌더링하세요. 모든 연산은 내 기기에서 이루어집니다.|Choose 1080p, 2K or 4K below the canvas, then set size, duration and frame rate in Video export. All processing happens on your device.
코딩은 이 정도면 시작할 수 있습니다.|Start coding with a simple function.
는 픽셀 위치, | is the pixel position;\u0020
은 한 주기 동안 0에서 2π까지 움직이는 각도입니다. | moves from 0 to 2π over one cycle.\u0020
는 오른쪽에서 고른 색을 사용합니다. 숫자 8.0을 바꾸는 것만으로도 형태가 달라집니다.| uses your selected colors. Even changing 8.0 changes the shape.
데스크톱 코드 모드는 왼쪽 캔버스 / 오른쪽 편집기로 나뉩니다. 가운데 구분선을 드래그하거나 포커스 후 방향키로 너비를 조절하세요. 패턴과 스타일은 상단 패턴 / 설정 버튼으로 열 수 있습니다.|On desktop, Code mode puts the canvas on the left and editor on the right. Drag the divider or focus it and use arrow keys to resize. Open Patterns and Settings from the top bar.
숫자를 슬라이더로 만들기|Turn numbers into sliders
순서는 이름, 최솟값, 최댓값, 간격, 기본값입니다. 코드에서 |The order is name, minimum, maximum, step and default. Use\u0020
를 사용하고 적용하면 슬라이더가 만들어집니다. | in your code and apply it to create a slider.\u0020
은 자동 선언되므로 다시 쓰지 않습니다.| is declared automatically; do not declare it again.
미리 알아두면 좋은 점|Things to know
직접 작성한 코드는 |Custom code should use\u0020
처럼 주기적인 값을 사용해야 자연스럽게 이어집니다. | or similar periodic values for seamless loops.\u0020
을 직접 좌표 이동에 사용하면 루프 끝에서 점프할 수 있습니다. 경계 검사는 4개의 작은 샘플을 비교하는 검사이지 수학적 증명이 아닙니다.| can cause a jump when used for linear motion. The boundary check compares four small samples; it is not a mathematical proof.
픽셀 셰이더는 GPU에서 실행됩니다. 출처를 모르는 고부하 코드는 브라우저를 멈추게 할 수 있습니다. JavaScript 실행, 외부 텍스처, Shadertoy 다중 버퍼 가져오기는 지원하지 않습니다. 프랙탈은 32비트 부동소수점이므로 무제한 딥 줌이 아닙니다.|Pixel shaders run on the GPU. Heavy, unfamiliar code may stall the browser. JavaScript execution, external textures and Shadertoy multi-buffer imports are unsupported. Fractals use 32-bit floats, so zoom precision is limited.
재생|Play
코드 적용|Apply code
편집기의 |In the editor,\u0020
은 들여쓰기, | indents and\u0020
는 적용 버튼으로 이동합니다.| focuses Apply.
전체 사용자 가이드|Full user guide
내 기기 출력 검사|Test export on this device
도메인 연결|Custom domains
루프 검사 닫기|Close loop inspector
주기의 0%, 100%, 첫 프레임 다음, 마지막 프레임을 작은 해상도로 비교합니다. 100%를 0%로 강제 치환하지 않습니다. 얇은 선·프랙탈 경계에는 부동소수점 오차가 생길 수 있습니다.|Compares low-resolution samples at 0%, 100%, after the first frame and at the last frame. The end is not wrapped to the start. Fine lines and fractal edges may show floating-point differences.
편집으로 돌아가기|Back to editing
루프를 렌더링하고 있습니다.|Rendering your loop.
출력 창 닫기|Close export dialog
기기에서 프레임을 생성합니다. 탭을 닫거나 기기를 절전 모드로 전환하지 마세요.|Rendering on your device. Keep this tab open and your device awake.
다운로드|Download
출력 진단 JSON 저장|Save export diagnostics JSON
렌더링 취소|Cancel render
기하학|Geometry
프랙탈|Fractals
유기적 패턴|Organic
곡면|Surfaces
코드 시작점|Code starter
확인 필요|Check required
를 사용할 수 없음| unavailable
변경 사항 저장 중|Saving changes
이 브라우저에 자동 저장됨|Autosaved in this browser
자동 저장 불가 · JSON으로 저장하세요|Autosave unavailable · Save project JSON
렌더러를 사용할 수 없습니다.|renderer is unavailable.
아직 적용하지 않은 GLSL이 있습니다. 코드 모드에서 적용하거나 되돌린 뒤 출력하세요.|You have unapplied GLSL changes. Apply or revert them in Code mode before exporting.
현재 레이어의 사용자 코드를 선택한 패턴으로 바꿀까요? 프로젝트 JSON을 저장하면 코드를 보관할 수 있습니다.|Replace this layer's custom code with the selected pattern? Save your project JSON first to keep a copy.
패턴을 적용하지 못했습니다. |Could not apply the pattern.\u0020
검색 결과가 없습니다. 다른 이름이나 분류를 선택하세요.|No matching patterns. Try another name or category.
레이어 숨기기|Hide layer
레이어 표시|Show layer
직접 입력|Enter value
직접 작성한 GLSL 패턴|Custom GLSL pattern
불투명도|Opacity
확대|Zoom
회전|Rotation
시작 위상|Start phase
시드|Seed
팔레트 이동|Palette shift
블룸|Bloom
노출|Exposure
대비|Contrast
비네트|Vignette
색수차|Chromatic aberration
팔레트|Palette
파일을 조금씩 기록해 메모리 사용량을 줄입니다.|Writes the file incrementally to reduce memory use.
이 브라우저는 직접 저장 미지원 · 다운로드로 저장합니다.|Direct save unavailable · Use download instead.
예상 파일이 큽니다. 메모리 출력은 256 MiB에서 중단됩니다. 디스크 직접 저장, 더 짧은 길이, 낮은 압축 품질 중 하나를 사용하세요.|Large estimated file. In-memory output stops at 256 MiB. Save directly to disk, shorten the duration or reduce encoding quality.
수정됨 · 적용 필요|Modified · Apply changes
코드는 |Code must be at most\u0020
자 이하여야 합니다.| characters.
를 켜야 코드를 컴파일할 수 있습니다.| must be enabled to compile code.
직접 만든 패턴|Custom pattern
을 적용했습니다.| applied.
적용하지 않았습니다. 마지막으로 정상 동작한 화면을 유지합니다.|Changes were not applied. The last working preview is preserved.
고해상도 미리보기를 만들지 못해 540p로 복구했습니다. 저장 해상도는 유지됩니다. |Preview fell back to 540p. Export resolution is unchanged.\u0020
미리보기 |Preview\u0020
일시정지 · WebGL 2|Paused · WebGL 2
출력 설정이 바뀌었습니다. 실제 1프레임 검사를 실행할 수 있습니다.|Output settings changed. Run the one-frame encoder test again.
프로젝트 JSON에 레이어, 설정, GLSL을 저장했습니다.|Saved layers, settings and GLSL in the project JSON.
시작과 끝이 샘플 기준으로 일치합니다.|Start and end samples match.
시작과 끝에 차이가 있습니다.|Start and end samples differ.
평균 픽셀 차이|Mean pixel difference
최대 픽셀 차이|Maximum pixel difference
경계 움직임 RMSE|Boundary motion RMSE
검사 해상도|Test resolution
평균 끝점 차이가 0.5/255 이하입니다. 경계 움직임 수치는 마지막 이동과 첫 이동의 차이이며, 작을수록 유사합니다.|Mean endpoint difference is at most 0.5/255. Boundary motion compares the last and first movement; lower values are more similar.
또는 uLoop를 선형 이동에 사용했다면 uCycle, sin(uAngle), cos(uAngle)로 바꿔 보세요.|or uLoop used for linear motion can be replaced with uCycle, sin(uAngle) or cos(uAngle).
지원 확인 중|Checking support
탭을 닫거나 기기를 절전 모드로 전환하지 마세요. 다른 탭으로 이동하면 렌더링이 느려질 수 있습니다.|Keep this tab open and your device awake. Switching tabs may slow rendering.
예상 크기가 메모리 출력 한도에 가깝습니다. 디스크 직접 저장을 사용하거나 길이/품질을 낮추세요.|Estimated size is near the memory limit. Save directly to disk or reduce duration/quality.
영상|Video
렌더링을 취소했습니다.|Rendering cancelled.
루프 끝점 평균 차이가 |Mean loop endpoint difference:\u0020
입니다. 이어지는 부분이 튈 수 있습니다. 그래도 MP4를 만들까요?|. The loop may jump at the boundary. Export MP4 anyway?
루프 확인 후 출력을 취소했습니다.|Export cancelled after checking the loop.
프레임|frames
파일을 마무리하고 있습니다.|file is being finalized.
경과 |Elapsed\u0020
초 · 인코딩 데이터 |s · Encoded data\u0020
당신의 루프가 완성되었습니다.|Your loop is ready.
아래 버튼을 눌러 MP4 파일을 저장하세요.|Use the button below to save your MP4.
선택한 파일에 MP4 저장을 완료했습니다.|MP4 saved to the selected file.
출력 설정을 확인해 주세요.|Check your export settings.
미완성 영상을 다운로드하지 않습니다. 프로젝트는 그대로 유지됩니다.|No incomplete video will be downloaded. Your project is unchanged.
프로젝트 파일은 1 MiB 이하여야 합니다.|Project files must be 1 MiB or smaller.
현재 작업 대신 이 프로젝트를 열까요? 현재 작업은 JSON 저장으로 보관할 수 있습니다.|Replace your current work with this project? Save your current project as JSON first to keep a copy.
프로젝트를 불러왔습니다.|Project opened.
프로젝트를 열지 못했습니다. |Could not open project.\u0020
새 프로젝트를 시작할까요? 현재 작업을 보관하려면 먼저 JSON으로 저장하세요.|Start a new project? Save your current work as JSON first to keep a copy.
추가할 레이어의 패턴을 고르세요.|Choose a pattern for the new layer.
왼쪽 목록에서 추가할 패턴을 고르세요.|Choose a pattern to add from the library.
이 브라우저에서는 전체 화면 요청이 허용되지 않았습니다.|Fullscreen was not permitted by this browser.
선택 해상도로 렌더링 중|Rendering at the selected resolution
를 생성했습니다.| created.
검사 취소|Cancel test
선택 크기로 렌더링 후 실제 H.264 압축을 검사합니다|Rendering at the chosen size and testing H.264 encoding
실제 1프레임 검사 |One-frame test\u0020
실제 1프레임 통과 · |One frame passed ·\u0020
캔버스|Canvas
전달. 전체 영상 성공까지 보장하는 검사는 아닙니다.|input. This does not guarantee that the full video will succeed.
인코더 검사를 취소했습니다.|Encoder test cancelled.
진행 중인 프레임을 정리하고 있습니다|Finishing the current frame
컨텍스트가 손실되었습니다. 프로젝트를 저장하고 새로고침하세요.|context was lost. Save your project and reload.
저장된 셰이더를 컴파일할 수 없어 기본 패턴을 열었습니다. |Saved shader could not compile. Opened the default pattern.\u0020
프로젝트 미리보기와 MP4 출력을 위해 localhost 또는 GitHub Pages HTTPS로 실행하세요.|Use localhost or GitHub Pages HTTPS for preview and MP4 export.
이 스튜디오는 JavaScript와 WebGL 2가 필요합니다. JavaScript를 켜 주세요.|This studio requires JavaScript and WebGL 2. Enable JavaScript to continue.
홈|Home
초|s
오로라|Aurora
일몰|Sunset
빙하|Glacier
아날로그|Analog
캔디|Candy
모노|Mono
무한의 궤도|Infinite orbit
새 루프|New loop
대칭 수|Symmetry
빛의 겹|Light bands
꼬임|Twist
반복 정밀도|Iteration limit
줌 호흡|Zoom breathing
등고선 밀도|Contour density
실수부|Real part
허수부|Imaginary part
궤도 반경|Orbit radius
접힘 수|Folds
타일 밀도|Tile density
선 두께|Line width
격자 밀도|Grid density
교차 각도|Crossing angle
움직임|Motion
꽃잎 수|Petals
궤적 두께|Trail width
감김 밀도|Winding density
파동원 거리|Source distance
파동 주파수|Wave frequency
가로 진동 수|Horizontal frequency
세로 진동 수|Vertical frequency
입자 크기|Particle size
액체 입자 수|Particle count
흐름 강도|Flow strength
지형 크기|Terrain scale
등고선 수|Contour count
셀 밀도|Cell density
벽 두께|Wall width
곡면 주파수|Surface frequency
곡면 두께|Surface thickness
시점 궤도|Camera orbit
고리 두께|Ring thickness
표면 꼬임|Surface twist
궤도 수|Orbit count
궤도 기울기|Orbit tilt
원 밀도|Circle density
원의 밀도|Circle density
선 밀도|Line density
파면 밀도|Wavefront density
빛 집중도|Light focus
형태 변화|Morph
커튼 층 수|Curtain layers
겹 수|Layers
색 띠 수|Color bands
공간 주파수|Spatial frequency
반복 깊이|Iteration depth
재귀 깊이|Recursion depth
왜곡 강도|Distortion
회로 두께|Circuit width
나선 가지 수|Spiral arms
지형 굴곡|Terrain relief
곡면 지수|Surface exponent
방사선 수|Radial spokes
동심원 수|Concentric rings
벌집 밀도|Honeycomb density
물결 강도|Ripple strength
파동 방향 수|Wave directions
파동 밀도|Wave density
겹겹의 빛으로 만드는 회전 대칭 패턴|Rotational symmetry made of layered light
의 탈출 시간과 부드러운 카메라 루프| escape times and a smooth camera loop
복소 상수 c가 닫힌 궤도를 따라 움직이는 프랙탈|A fractal whose complex constant c follows a closed orbit
접힌 좌표 공간에 반복되는 빛의 격자|A repeating light grid in folded coordinate space
두 격자의 간섭이 만드는 큰 형태|Large forms emerging from interference between two grids
극방정식으로 겹치는 장미 모양의 발광 곡선|Glowing rose curves layered with polar equations
원을 그리며 이동하는 두 파동원|Two wave sources moving in circles
서로 다른 정수 주파수의 진동이 그리는 닫힌 곡선|Closed curves traced by different integer frequencies
거리장의 합으로 뭉치고 떨어지는 부드러운 액체 형태|Smooth liquid forms merging and separating through distance fields
주기적 좌표 이동으로 흐르는 노이즈 지형|Flowing noise terrain with periodic coordinate motion
살아 움직이는 보로노이 셀과 유리 경계|Living Voronoi cells with glass-like boundaries
구 내부의 삼중 주기 곡면을 레이마칭으로 표현|A ray-marched triply periodic surface inside a sphere
비틀린 고리 표면의 거리장을 레이마칭한 3D 조각|A ray-marched sculpture of twisted toroidal surfaces
서로 다른 축을 가진 발광 타원 궤도|Glowing elliptical orbits on different axes
겹치는 주기적 파면이 만드는 수중 빛무늬|Underwater light patterns from overlapping periodic wavefronts
천처럼 접히고 흐르는 매끄러운 곡선|Smooth curves folding and flowing like fabric
단 5줄의 함수로 시작하는 나만의 루프|Start your own loop with a five-line function
복소수의 절댓값 변환으로 나타나는 불꽃과 선박 형태|Flame and ship forms from absolute-value complex iteration
의 세 근으로 수렴하는 경로를 색으로 구분| convergence to three roots, distinguished by color
반복으로 만들어지는 다중 대칭 프랙탈|A multisymmetric fractal formed by iteration
삼각형을 축소·복제하는 반복 접힘 프랙탈|A folded fractal of scaled and duplicated triangles
무작위 방향의 사분원 타일을 연결한 그래픽 회로|Graphic circuits of randomly oriented quarter-circle tiles
극좌표의 로그 반지름이 만드는 끝없는 나선 띠|Endless spiral bands from logarithmic polar radius
높이장을 따라 이어지는 촘촘하고 유연한 지형 등고선|Fine flowing contours following a terrain height field
코사인 합의 영점으로 드러나는 주기적 다공성 곡면|A periodic porous surface defined by a sum of cosines
지수에 따라 구와 둥근 정육면체 사이를 오가는 형태|A shape morphing between a sphere and a rounded cube
층마다 흐름이 다른 수직 빛의 커튼|Vertical curtains of light flowing at different rates
동심원과 방사형 선이 교차하는 회전 격자|A rotating grid of concentric rings and radial lines
벌집 격자에서 바깥으로 번져 가는 빛의 파동|Light waves spreading across a honeycomb grid
격자마다 원형 파동이 위상을 달리하며 맥동하는 패턴|Circular waves pulsing at different phases across a grid
여러 방향의 평면파를 더한 비주기적 대칭 무늬|Aperiodic symmetry from plane waves in multiple directions
사인파와 원형파를 혼합한 부드러운 색의 흐름|Smooth color flows combining sine and radial waves
지원하지 않는 프로젝트 형식입니다. Loopfield v1 JSON 파일을 선택하세요.|Unsupported project format. Choose a Loopfield v1 JSON file.
레이어는 1~|Layer count must be 1–
개여야 합니다.|.
번 레이어의 GLSL이 잘못되었습니다.|: invalid layer GLSL.
출력은 HTTPS 또는 localhost에서 열어야 합니다. GitHub Pages HTTPS 주소를 사용하세요.|Export requires HTTPS or localhost. Use the GitHub Pages HTTPS URL.
이 브라우저에 WebCodecs VideoEncoder가 없습니다. WebCodecs 인코더를 제공하는 브라우저에서 실행해 주세요.|This browser has no WebCodecs VideoEncoder. Use a browser that supports WebCodecs encoding.
첫 프레임 인코더 응답 시간 초과|First-frame encoder response timed out
인코더가 응답하지 않습니다. 진단을 저장하고 다른 인코더 설정을 시도하세요.|Encoder is not responding. Save diagnostics and try another encoder preference.
첫 프레임 압축 데이터가 없습니다.|No encoded first-frame data.
브라우저가 H.264 디코더 설정(avcC)을 반환하지 않았습니다.|Browser did not return H.264 decoder configuration (avcC).
실제 첫 프레임 검사 |Actual first-frame test\u0020
에서 사용할 수 있는 H.264 인코더를 찾지 못했습니다. 브라우저의 하드웨어/소프트웨어 경로를 모두 검사했습니다. 4K를 1080p로 바꿔 저장하지 않았습니다. 진단 JSON을 저장해 실패 단계를 확인하세요.|: no supported H.264 encoder found after testing hardware/software paths. Your resolution was preserved. Save diagnostics JSON for details.
출력 중 GPU 컨텍스트가 손실되었습니다.|GPU context lost during export.
인코더가 첫 프레임 이후 닫혔습니다.|Encoder closed after the first frame.
인코더가 예상과 다른 타임스탬프를 반환했습니다.|Encoder returned an unexpected timestamp.
인코딩 도중 AVC 구성이 바뀌었습니다.|AVC configuration changed during encoding.
출력을 완료하지 못했습니다. |Export could not finish.\u0020
그래픽 컨텍스트가 해제되었습니다. 페이지를 새로고침하세요.|Graphics context released. Reload the page.
그래픽 컨텍스트가 해제되었습니다.|Graphics context released.
컨텍스트가 손실되었습니다. 해상도나 레이어 수를 줄이세요.|Context lost. Reduce resolution or layer count.
를 사용할 수 없습니다. 브라우저의 그래픽 가속을 켜고 다시 열어 주세요.| is unavailable. Enable browser graphics acceleration and reopen the page.
셰이더 연결 실패|Shader link failed
셰이더 컴파일 실패|Shader compilation failed
먼저 렌더 크기를 지정하세요.|Set render size first.
이 GPU의 최대 렌더 크기는 |Maximum render size for this GPU:\u0020
입니다.|.
메모리가 부족하거나 이 렌더 크기를 지원하지 않습니다. 해상도를 낮추세요.|Insufficient memory or unsupported render size. Reduce resolution.
레이어가 컴파일되지 않았습니다.|Layer has not been compiled.
비교할 프레임 크기가 다릅니다.|Frame dimensions do not match.
생성에 실패했습니다.| generation failed.
함수를 작성하세요.| function is required.
은 자동으로 추가됩니다. 코드에서 제거하세요.| is added automatically. Remove it from your code.
대신 vec3 pattern(vec2 p) 또는 mainImage()를 사용하세요.|use vec3 pattern(vec2 p) or mainImage() instead.
한 레이어에는 슬라이더를 16개까지 사용할 수 있습니다.|Each layer supports up to 16 sliders.
예약되었거나 중복된 이름입니다.|Reserved or duplicate name.
슬라이더 범위가 올바르지 않습니다.|Invalid slider range.
가 uniform을 자동 선언합니다. 중복 uniform 선언을 지우세요.| declares its uniform automatically. Remove the duplicate declaration.
형식: 이름 최솟값 최댓값 간격 기본값 |Format: name minimum maximum step default\u0020
표시 이름|Label
가 너무 큽니다.| is too large.
가 쓰기 가능한 상태가 아닙니다.| is not writable.
가 이미 시작되었습니다.| has already started.
가 종료되었습니다.| has ended.
메모리 내보내기 한도(256 MiB)를 넘었습니다. 디스크 직접 저장을 사용하거나 길이/비트레이트를 낮추세요.|Exceeded the 256 MiB in-memory export limit. Save directly to disk or reduce duration/bitrate.
유효한 AVC decoder configuration record가 필요합니다.|A valid AVC decoder configuration record is required.
잘못된 MP4 트랙 설정입니다.|Invalid MP4 track configuration.
에 필요한 AVC 설정 정보가 없습니다.| is missing required AVC configuration.
중복되거나 누락된 프레임 타임스탬프입니다.|Duplicate or missing frame timestamp.
비어 있는 인코딩 프레임입니다.|Empty encoded frame.
첫 프레임은 키 프레임이어야 합니다.|First frame must be a keyframe.
예상보다 많은 프레임이 인코딩되었습니다.|More frames encoded than expected.
프레임 수 불일치: |Frame count mismatch:\u0020
오프셋 크기가 예상과 다릅니다.|Unexpected offset size.
`;
