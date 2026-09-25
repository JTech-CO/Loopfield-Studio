# GLSL API v1

[English](GLSL_API.md) · **한국어**

WebGL 2 / GLSL ES 3.00 fragment shader이다. `#version`, 공통 uniform, 최종 main은 엔진이 넣는다. 사용자는 다음 둘 중 하나만 작성한다.

```glsl
vec3 pattern(vec2 p) { return palette(length(p)); }
```

```glsl
void mainImage(out vec4 color, in vec2 fragCoord) {
  vec2 p = (2.0 * fragCoord - uResolution) / uResolution.y;
  color = vec4(palette(length(p)), 1.0);
}
```

`pattern`의 p는 화면 중앙이 0이며 위쪽 y가 양수인 종횡비 보정 좌표이다. 화면 세로 범위는 변환 전 -1~1이다. 선택 레이어의 회전·확대·이동이 적용된다. `mainImage`는 원시 픽셀 좌표를 받아 공통 시점 변환이 자동 적용되지 않는다. 필요하면 직접 적용해야 한다. vec4 alpha는 레이어 합성에 사용되지만 최종 MP4는 불투명이다.

결과 색은 0~1로 제한된다. NaN/Infinity는 검정으로 처리한다. discard 픽셀은 해당 레이어의 투명 배경으로 남으며 이전 프레임을 참조하지 않는다. 사용자 코드가 긴 GPU 연산을 수행할 수 있으므로 무한 루프나 매우 큰 중첩 반복은 피한다.

## 공통 변수

| 이름 | 타입 | 값 |
|---|---|---|
| uResolution | vec2 | 현재 렌더 타깃 픽셀 크기. 미리보기와 출력은 다르다. |
| uLoop | float | 전체 위상 × 레이어 반복 횟수 + 레이어 시작 위상 |
| uAngle | float | TAU × uLoop |
| uCycle | vec2 | cos(uAngle), sin(uAngle) |
| uTime | float | 전체 위상 × 영상 길이, 단위 초 |
| uDuration | float | 영상 전체 길이, 단위 초 |
| uFrame | int | 프레임 인덱스. 실제 출력에서는 0부터 순차 증가 |
| uZoom | float | 확대값 0.25~64 |
| uRotation | float | 레이어 회전 라디안 |
| uOffset | vec2 | 패턴 좌표계 이동값 |
| uSeed | float | 시드 0~999. 사용하는 코드에서만 영향을 준다. |
| uHue | float | palette() 색상 진행 위치 |
| uColorA/B/C | vec3 | 선택한 세 색의 RGB, 0~1 |
| iTime / iResolution / iFrame | 매크로 | uTime / vec3(uResolution,1) / uFrame 호환 별칭 |

`uTime`과 `uFrame`은 루프 경계에서 자동으로 같은 값이 되지 않는다. 엔진은 진짜 끝점을 검사하기 위해 위상 1을 0으로 강제로 감싸지 않는다. 주기 코드는 uCycle이나 sin/cos의 정수 회전 배수를 사용한다.

## 함수

`rotate(float)`은 mat2, `palette(float)`는 세 팔레트 색을 혼합한 vec3, `hash21(vec2)`는 의사난수 float, `noise2(vec2)`는 보간 값 노이즈, `fbm(vec2)`는 5옥타브 노이즈를 반환한다. `stroke(float distance, float halfWidth)`는 도함수를 사용한 부드러운 선 마스크이다. PI와 TAU 상수를 제공한다.

노이즈를 애니메이션하려면 좌표를 직선으로 계속 보내기보다 원을 따라 이동시킨다.

```glsl
vec3 pattern(vec2 p) {
  float n = fbm(p * 3.0 + uCycle * 0.6 + vec2(uSeed));
  return palette(n + 0.1 * uCycle.y) * (0.3 + n);
}
```

## 사용자 슬라이더

```glsl
// @slider uPetals 3 24 1 8 | 꽃잎 수
```

순서: 변수명 / 최소 / 최대 / 간격 / 기본 / | / 표시 이름. 레이어당 16개까지이며 **float uniform을 자동 선언**한다. 같은 uniform을 코드에 다시 선언하면 거부한다. 예약된 공통 변수, 중복 이름, gl_ 접두어, 이중 밑줄 이름을 쓰지 않는다. int가 필요하면 `int(uPetals + 0.5)`처럼 변환한다.

입력 UI는 범위를 제한하지만 모든 코드가 이 값을 정수처럼 처리한다는 보장은 없다. 주기 횟수에 쓰려면 round() 또는 정수 변환으로 고정한다. 코드는 레이어당 48,000자까지 저장한다.

## 루프를 끊는 흔한 실수

`p.x += uTime`은 출발점과 도착점이 다르다. `p += uCycle * radius`는 같은 점으로 돌아온다. `sin(uAngle * 1.5)`는 한 주기 끝에서 일반적으로 연결되지 않는다. 정수 배수로 바꾸거나 전체 기간을 재설계한다. 프레임 인덱스에 따라 무작위 값을 바꾸면 결정론적 영상이어도 루프가 튈 수 있다.

## 호환 범위

Shadertoy 스타일 mainImage와 세 기본 별칭만 일부 제공한다. iChannel0~3, Buffer A/B/C/D, 영상·오디오·이미지 텍스처, mouse/date/channel uniforms, 다중 패스 피드백은 지원하지 않는다. 임의 셰이더를 붙여 넣으면 전부 실행되는 가져오기 도구가 아니다.

내장 프랙탈은 float 기반 시각화이다. deep-zoom perturbation, double-double 또는 임의 정밀도를 구현하지 않았다. 안티앨리어싱은 일부 선의 도함수 처리를 사용하며 전체 장면 초과 샘플링이나 시간적 안티앨리어싱을 제공하지 않는다.
