import type { MutableRGBA, MutableVec2, MutableVec3, RGBA, Vec2, Vec3 } from './types';

export const EPSILON = 1e-6;

export const clamp = (value: number, min: number, max: number): number =>
  value < min ? min : value > max ? max : value;

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const lerpVec2 = (a: Vec2, b: Vec2, t: number, out: MutableVec2): MutableVec2 => {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  return out;
};

export const lerpVec3 = (a: Vec3, b: Vec3, t: number, out: MutableVec3): MutableVec3 => {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  return out;
};

export const lerpColor = (a: RGBA, b: RGBA, t: number, out: MutableRGBA): MutableRGBA => {
  out[0] = lerp(a[0], b[0], t);
  out[1] = lerp(a[1], b[1], t);
  out[2] = lerp(a[2], b[2], t);
  out[3] = lerp(a[3], b[3], t);
  return out;
};

export const degToRad = (degrees: number): number => (degrees * Math.PI) / 180;

export const approxEqual = (a: number, b: number, epsilon = EPSILON): boolean =>
  Math.abs(a - b) <= epsilon;
