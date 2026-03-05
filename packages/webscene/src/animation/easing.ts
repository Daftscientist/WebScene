import { clamp } from '../utils/math';

export type EasingFunction = (t: number) => number;

export type BuiltInEasingName =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInOutSine'
  | 'hold';

const linear: EasingFunction = (t) => t;
const easeInQuad: EasingFunction = (t) => t * t;
const easeOutQuad: EasingFunction = (t) => 1 - (1 - t) * (1 - t);
const easeInOutQuad: EasingFunction = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
const easeInCubic: EasingFunction = (t) => t * t * t;
const easeOutCubic: EasingFunction = (t) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic: EasingFunction = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInOutSine: EasingFunction = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
const hold: EasingFunction = () => 0;

const table: Record<BuiltInEasingName, EasingFunction> = {
  linear,
  easeInQuad,
  easeOutQuad,
  easeInOutQuad,
  easeInCubic,
  easeOutCubic,
  easeInOutCubic,
  easeInOutSine,
  hold,
};

export const easing = table;

export const resolveEasing = (name: BuiltInEasingName | EasingFunction | undefined): EasingFunction => {
  if (!name) {
    return linear;
  }
  if (typeof name === 'function') {
    return name;
  }
  const resolved = table[name];
  if (!resolved) {
    return linear;
  }
  return resolved;
};

export const clampUnit = (value: number): number => clamp(value, 0, 1);
