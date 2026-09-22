// @slider uDensity 2 20 1 8 | 원의 밀도
vec3 pattern(vec2 p) {
  float wave = sin(length(p) * uDensity - uAngle);
  vec3 color = palette(length(p) * 0.4);
  return color * (0.5 + 0.5 * wave);
}
