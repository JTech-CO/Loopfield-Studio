// @slider uRings 2 24 1 10 | 고리 수
// @slider uBreathe 0 1 0.01 0.3 | 숨쉬기
vec3 pattern(vec2 p) {
  float r = length(p) * (1.0 + uBreathe * uCycle.x);
  float rings = 0.5 + 0.5 * cos(r * uRings);
  return palette(r * 0.3 + uCycle.y * 0.12) * rings;
}
