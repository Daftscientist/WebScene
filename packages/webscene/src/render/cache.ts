import { LruCache } from '../utils/cache';
import type { Canvas2DContext } from './context';

export interface TextLayout {
  readonly lines: readonly string[];
  readonly width: number;
}

const createCanvas = (width: number, height: number): HTMLCanvasElement | OffscreenCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document !== 'undefined') {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  throw new Error('No canvas implementation available for this environment');
};

const layoutKey = (
  text: string,
  font: string,
  maxWidth: number | undefined,
  align: CanvasTextAlign | undefined,
): string => `${font}::${align ?? 'left'}::${maxWidth ?? 'none'}::${text}`;

export class TextLayoutCache {
  private readonly cache = new LruCache<string, TextLayout>(256);

  public get(
    ctx: Canvas2DContext,
    text: string,
    font: string,
    maxWidth?: number,
    align?: CanvasTextAlign,
  ): TextLayout {
    const key = layoutKey(text, font, maxWidth, align);
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    ctx.save();
    ctx.font = font;
    const lines: string[] = [];

    if (!maxWidth) {
      lines.push(text);
    } else {
      const words = text.split(/\s+/);
      let line = '';
      for (let i = 0; i < words.length; i += 1) {
        const candidate = line ? `${line} ${words[i]}` : words[i];
        if (ctx.measureText(candidate).width <= maxWidth) {
          line = candidate;
        } else {
          if (line) {
            lines.push(line);
          }
          line = words[i];
        }
      }
      if (line) {
        lines.push(line);
      }
    }

    let width = 0;
    for (let i = 0; i < lines.length; i += 1) {
      width = Math.max(width, ctx.measureText(lines[i]).width);
    }
    ctx.restore();

    const layout: TextLayout = { lines, width };
    this.cache.set(key, layout);
    return layout;
  }
}

export class PathCache {
  private readonly cache = new LruCache<string, Path2D>(256);

  public roundedRect(width: number, height: number, radius = 0): Path2D {
    const key = `${width}:${height}:${radius}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const path = new Path2D();
    if (radius <= 0) {
      path.rect(0, 0, width, height);
    } else {
      const r = Math.min(radius, width * 0.5, height * 0.5);
      path.moveTo(r, 0);
      path.arcTo(width, 0, width, height, r);
      path.arcTo(width, height, 0, height, r);
      path.arcTo(0, height, 0, 0, r);
      path.arcTo(0, 0, width, 0, r);
      path.closePath();
    }

    this.cache.set(key, path);
    return path;
  }
}

export class NoiseTextureCache {
  private readonly cache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();

  private hashSeed(key: string): number {
    let hash = 2166136261;
    for (let i = 0; i < key.length; i += 1) {
      hash ^= key.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  private next(seed: Uint32Array): number {
    seed[0] = (1664525 * seed[0] + 1013904223) >>> 0;
    return seed[0] / 0xffffffff;
  }

  public get(width: number, height: number, strength: number): HTMLCanvasElement | OffscreenCanvas {
    const key = `${width}:${height}:${strength.toFixed(3)}`;
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not create 2D context for noise cache');
    }

    const imageData = ctx.createImageData(width, height);
    const data = imageData.data;
    const seed = new Uint32Array([this.hashSeed(key)]);
    for (let i = 0; i < data.length; i += 4) {
      const value = Math.floor(this.next(seed) * 255);
      data[i] = value;
      data[i + 1] = value;
      data[i + 2] = value;
      data[i + 3] = Math.floor(255 * strength);
    }
    ctx.putImageData(imageData, 0, 0);

    this.cache.set(key, canvas);
    return canvas;
  }

  public clear(): void {
    this.cache.clear();
  }
}
