import type { RenderTarget } from './backend';
import type { Canvas2DContext } from './context';

const ensure2DContext = (canvas: HTMLCanvasElement | OffscreenCanvas): Canvas2DContext => {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) {
    throw new Error('Canvas2D context is not available on target canvas');
  }
  return ctx;
};

export class CanvasRenderTarget implements RenderTarget {
  private readonly ctx: Canvas2DContext;

  public constructor(private readonly canvas: HTMLCanvasElement | OffscreenCanvas) {
    this.ctx = ensure2DContext(canvas);
  }

  public get width(): number {
    return this.canvas.width;
  }

  public get height(): number {
    return this.canvas.height;
  }

  public getContext2D(): Canvas2DContext {
    return this.ctx;
  }

  public clear(): void {
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
}

export const createOffscreenTarget = (width: number, height: number): CanvasRenderTarget => {
  if (typeof OffscreenCanvas === 'undefined') {
    throw new Error('OffscreenCanvas is not available in this environment');
  }
  return new CanvasRenderTarget(new OffscreenCanvas(width, height));
};
