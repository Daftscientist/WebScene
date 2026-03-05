import type { RGBA } from './types';
import { clamp } from './math';

export const rgbaToCss = (color: RGBA): string => {
  const r = clamp(Math.round(color[0]), 0, 255);
  const g = clamp(Math.round(color[1]), 0, 255);
  const b = clamp(Math.round(color[2]), 0, 255);
  const a = clamp(color[3], 0, 1);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

export const hexToRgba = (hex: string): RGBA => {
  const normalized = hex.replace('#', '');
  if (normalized.length !== 6 && normalized.length !== 8) {
    throw new Error(`Invalid hex color: ${hex}`);
  }

  const base = normalized.length === 6 ? `${normalized}ff` : normalized;
  const parsed = Number.parseInt(base, 16);
  const r = (parsed >> 24) & 0xff;
  const g = (parsed >> 16) & 0xff;
  const b = (parsed >> 8) & 0xff;
  const a = (parsed & 0xff) / 255;
  return [r, g, b, a] as const;
};
