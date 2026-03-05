import type { BuiltInEasingName, EasingFunction } from './easing';
import { clampUnit, resolveEasing } from './easing';
import type { Interpolator } from './interpolators';

export interface Keyframe<TValue> {
  readonly time: number;
  readonly value: TValue;
  readonly easing?: BuiltInEasingName | EasingFunction;
  readonly hold?: boolean;
}

export interface TrackEvalOptions<TValue> {
  out?: TValue;
}

export class KeyframeTrack<TValue> {
  private readonly keyframes: Keyframe<TValue>[];

  public constructor(
    keyframes: Keyframe<TValue>[],
    private readonly interpolator: Interpolator<TValue>,
  ) {
    this.keyframes = [...keyframes].sort((a, b) => a.time - b.time);
  }

  public evaluate(time: number, options?: TrackEvalOptions<TValue>): TValue {
    const out = options?.out;
    const frames = this.keyframes;
    if (frames.length === 0) {
      throw new Error('Cannot evaluate an empty track');
    }

    const lastIndex = frames.length - 1;
    const firstFrame = frames[0];
    const lastFrame = frames[lastIndex];

    if (time <= firstFrame.time) {
      return firstFrame.value;
    }
    if (time >= lastFrame.time) {
      return lastFrame.value;
    }

    let low = 0;
    let high = lastIndex;

    while (low <= high) {
      const mid = (low + high) >> 1;
      const frame = frames[mid];
      if (frame.time === time) {
        return frame.value;
      }
      if (frame.time < time) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }

    const from = frames[high];
    const to = frames[low];

    if (from.hold || from.easing === 'hold') {
      return from.value;
    }

    const range = to.time - from.time;
    const rawT = range <= 0 ? 0 : (time - from.time) / range;
    const easing = resolveEasing(from.easing);
    const easedT = clampUnit(easing(rawT));
    return this.interpolator.interpolate(from.value, to.value, easedT, out);
  }

  public toJSON(): Keyframe<TValue>[] {
    return this.keyframes;
  }
}
