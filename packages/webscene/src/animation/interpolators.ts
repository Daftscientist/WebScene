import type { MutableRGBA, MutableVec2, MutableVec3, RGBA, Vec2, Vec3 } from '../utils/types';
import { lerp, lerpColor, lerpVec2, lerpVec3 } from '../utils/math';

export type TrackValueKind = 'number' | 'vec2' | 'vec3' | 'color' | 'boolean' | 'string';

export interface Interpolator<TValue> {
  interpolate(from: TValue, to: TValue, t: number, out?: TValue): TValue;
}

class NumberInterpolator implements Interpolator<number> {
  public interpolate(from: number, to: number, t: number): number {
    return lerp(from, to, t);
  }
}

class Vec2Interpolator implements Interpolator<Vec2> {
  private readonly tmp = new Float32Array(2) as unknown as MutableVec2;

  public interpolate(from: Vec2, to: Vec2, t: number, out?: Vec2): Vec2 {
    if (out) {
      return lerpVec2(from, to, t, out as unknown as MutableVec2) as Vec2;
    }
    return lerpVec2(from, to, t, this.tmp) as Vec2;
  }
}

class Vec3Interpolator implements Interpolator<Vec3> {
  private readonly tmp = new Float32Array(3) as unknown as MutableVec3;

  public interpolate(from: Vec3, to: Vec3, t: number, out?: Vec3): Vec3 {
    if (out) {
      return lerpVec3(from, to, t, out as unknown as MutableVec3) as Vec3;
    }
    return lerpVec3(from, to, t, this.tmp) as Vec3;
  }
}

class ColorInterpolator implements Interpolator<RGBA> {
  private readonly tmp = new Float32Array(4) as unknown as MutableRGBA;

  public interpolate(from: RGBA, to: RGBA, t: number, out?: RGBA): RGBA {
    if (out) {
      return lerpColor(from, to, t, out as unknown as MutableRGBA) as RGBA;
    }
    return lerpColor(from, to, t, this.tmp) as RGBA;
  }
}

class HoldInterpolator<TValue> implements Interpolator<TValue> {
  public interpolate(from: TValue): TValue {
    return from;
  }
}

const interpolatorRegistry = new Map<string, Interpolator<unknown>>([
  ['number', new NumberInterpolator()],
  ['vec2', new Vec2Interpolator()],
  ['vec3', new Vec3Interpolator()],
  ['color', new ColorInterpolator()],
  ['boolean', new HoldInterpolator<boolean>()],
  ['string', new HoldInterpolator<string>()],
]);

export const registerInterpolator = <TValue>(name: string, interpolator: Interpolator<TValue>): void => {
  interpolatorRegistry.set(name, interpolator as Interpolator<unknown>);
};

export const getInterpolator = <TValue>(name: string): Interpolator<TValue> => {
  const resolved = interpolatorRegistry.get(name);
  if (!resolved) {
    throw new Error(`Interpolator not found: ${name}`);
  }
  return resolved as Interpolator<TValue>;
};
