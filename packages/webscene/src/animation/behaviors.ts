import type { TrackValue } from '../utils/types';

export interface Behavior<TValue extends TrackValue> {
  sample(time: number, baseValue: TValue): TValue;
}

export class WiggleBehavior implements Behavior<number> {
  public constructor(
    private readonly frequency = 1,
    private readonly amplitude = 1,
    private readonly seed = 0,
  ) {}

  public sample(time: number, baseValue: number): number {
    const phase = (time + this.seed * 0.123456789) * this.frequency * Math.PI * 2;
    const noise = Math.sin(phase) + Math.sin(phase * 0.5 + 1.234) * 0.5;
    return baseValue + noise * this.amplitude;
  }
}

export class SpringBehavior implements Behavior<number> {
  public constructor(
    private readonly target: number,
    private readonly damping = 8,
    private readonly stiffness = 16,
  ) {}

  public sample(time: number, baseValue: number): number {
    const delta = baseValue - this.target;
    const envelope = Math.exp(-this.damping * time);
    return this.target + delta * envelope * Math.cos(this.stiffness * time);
  }
}
