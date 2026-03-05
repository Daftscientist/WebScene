import { KeyframeTrack } from '../animation/keyframe-track';
import { getInterpolator, type TrackValueKind } from '../animation/interpolators';
import type { TrackJSON, TrackKeyframeJSON } from './schema';

export class Track<TValue> {
  private readonly runtime: KeyframeTrack<TValue>;

  public constructor(public readonly json: TrackJSON<TValue>) {
    const interpolatorName = json.interpolator ?? json.valueType;
    this.runtime = new KeyframeTrack(json.keyframes, getInterpolator(interpolatorName));
  }

  public evaluate(time: number, out?: TValue): TValue {
    return this.runtime.evaluate(time, { out });
  }

  public static fromKeyframes<TValue>(
    id: string,
    name: string,
    valueType: TrackValueKind,
    keyframes: TrackKeyframeJSON<TValue>[],
    interpolator?: string,
  ): Track<TValue> {
    return new Track<TValue>({
      id,
      name,
      valueType,
      keyframes,
      interpolator,
    });
  }
}
