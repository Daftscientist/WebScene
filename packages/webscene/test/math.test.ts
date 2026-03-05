import { describe, expect, it } from 'vitest';
import { approxEqual, clamp, degToRad, lerp } from '../src/utils/math';

describe('math utilities', () => {
  it('clamps values', () => {
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(6, 0, 10)).toBe(6);
    expect(clamp(14, 0, 10)).toBe(10);
  });

  it('lerps scalar values', () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });

  it('converts degrees to radians', () => {
    expect(approxEqual(degToRad(180), Math.PI)).toBe(true);
  });
});
