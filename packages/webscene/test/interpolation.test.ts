import { describe, expect, it } from 'vitest';
import { KeyframeTrack } from '../src/animation/keyframe-track';
import { getInterpolator } from '../src/animation/interpolators';

describe('KeyframeTrack number interpolation', () => {
  it('interpolates with linear easing', () => {
    const track = new KeyframeTrack<number>(
      [
        { time: 0, value: 0, easing: 'linear' },
        { time: 1, value: 10 },
      ],
      getInterpolator<number>('number'),
    );

    expect(track.evaluate(0.5)).toBe(5);
  });

  it('supports hold keyframes', () => {
    const track = new KeyframeTrack<number>(
      [
        { time: 0, value: 2, hold: true },
        { time: 1, value: 8 },
      ],
      getInterpolator<number>('number'),
    );

    expect(track.evaluate(0.5)).toBe(2);
  });
});

describe('vector and color interpolation', () => {
  it('interpolates vec2', () => {
    const track = new KeyframeTrack<readonly [number, number]>(
      [
        { time: 0, value: [0, 0] },
        { time: 1, value: [10, 20] },
      ],
      getInterpolator('vec2'),
    );

    const result = track.evaluate(0.25);
    expect(result[0]).toBeCloseTo(2.5);
    expect(result[1]).toBeCloseTo(5);
  });

  it('interpolates vec3', () => {
    const track = new KeyframeTrack<readonly [number, number, number]>(
      [
        { time: 0, value: [1, 2, 3] },
        { time: 1, value: [5, 6, 7] },
      ],
      getInterpolator('vec3'),
    );

    const result = track.evaluate(0.5);
    expect(result[0]).toBeCloseTo(3);
    expect(result[1]).toBeCloseTo(4);
    expect(result[2]).toBeCloseTo(5);
  });

  it('interpolates color channels', () => {
    const track = new KeyframeTrack<readonly [number, number, number, number]>(
      [
        { time: 0, value: [0, 0, 0, 0] },
        { time: 1, value: [255, 128, 64, 1] },
      ],
      getInterpolator('color'),
    );

    const result = track.evaluate(0.5);
    expect(result[0]).toBeCloseTo(127.5);
    expect(result[1]).toBeCloseTo(64);
    expect(result[2]).toBeCloseTo(32);
    expect(result[3]).toBeCloseTo(0.5);
  });
});
