import { registerBuiltInEffects } from '../effects/builtins';
import { EffectRegistry } from '../effects/registry';
import type { LayerJSON } from '../core/schema';
import { degToRad } from '../utils/math';
import { rgbaToCss } from '../utils/color';
import type { RenderBackend, RenderFrameInfo, RenderStats, RenderTarget } from './backend';
import { NoiseTextureCache, PathCache, TextLayoutCache } from './cache';
import type { Canvas2DContext } from './context';
import { TrackSampler } from './track-sampler';

const MAX_PRECOMP_DEPTH = 4;

const createBufferCanvas = (width: number, height: number): HTMLCanvasElement | OffscreenCanvas => {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }
  if (typeof document === 'undefined') {
    throw new Error('No canvas constructor available in this environment');
  }
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

const getContext2D = (canvas: HTMLCanvasElement | OffscreenCanvas): Canvas2DContext => {
  const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
  if (!ctx) {
    throw new Error('Could not create Canvas2D context');
  }
  return ctx;
};

const layerActiveAt = (layer: LayerJSON, time: number): boolean => {
  if (!layer.enabled) {
    return false;
  }
  return time >= layer.startTime && time <= layer.startTime + layer.duration;
};

interface LayerRenderResult {
  drawCalls: number;
  effectCount: number;
}

export class Canvas2DBackend implements RenderBackend {
  public readonly name = 'canvas2d';

  private readonly effects = new EffectRegistry();
  private readonly textLayouts = new TextLayoutCache();
  private readonly paths = new PathCache();
  private readonly noise = new NoiseTextureCache();
  private readonly tracks = new TrackSampler();

  private layerCanvas: HTMLCanvasElement | OffscreenCanvas;
  private layerCtx: Canvas2DContext;
  private effectCanvas: HTMLCanvasElement | OffscreenCanvas;
  private effectCtx: Canvas2DContext;

  public constructor() {
    registerBuiltInEffects(this.effects);

    this.layerCanvas = createBufferCanvas(16, 16);
    this.layerCtx = getContext2D(this.layerCanvas);
    this.effectCanvas = createBufferCanvas(16, 16);
    this.effectCtx = getContext2D(this.effectCanvas);
  }

  public render(frame: RenderFrameInfo, target: RenderTarget): RenderStats {
    this.ensureBuffers(frame.comp.width, frame.comp.height);
    target.clear();

    const ctx = target.getContext2D();
    ctx.save();
    ctx.fillStyle = rgbaToCss(frame.comp.backgroundColor);
    ctx.fillRect(0, 0, frame.comp.width, frame.comp.height);

    let drawCalls = 1;
    let effectCount = 0;
    const layers = frame.comp.layers;
    const trackMap = this.tracks.createTrackMap(frame.comp);

    for (let i = 0; i < layers.length; i += 1) {
      const layer = this.tracks.sampleLayer(layers[i], frame.time, trackMap);
      if (!layerActiveAt(layer, frame.time)) {
        continue;
      }

      const result = this.renderLayer(frame, layer, ctx, frame.time, 0);
      drawCalls += result.drawCalls;
      effectCount += result.effectCount;
    }

    ctx.restore();

    return {
      frame: frame.frame,
      time: frame.time,
      drawCalls,
      layerCount: frame.comp.layers.length,
      effectCount,
    };
  }

  public dispose(): void {
    this.noise.clear();
  }

  private ensureBuffers(width: number, height: number): void {
    if (this.layerCanvas.width !== width || this.layerCanvas.height !== height) {
      this.layerCanvas.width = width;
      this.layerCanvas.height = height;
      this.effectCanvas.width = width;
      this.effectCanvas.height = height;
    }
  }

  private clearBuffer(ctx: Canvas2DContext, width: number, height: number): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.clearRect(0, 0, width, height);
  }

  private renderLayer(
    frame: RenderFrameInfo,
    layer: LayerJSON,
    outCtx: Canvas2DContext,
    time: number,
    depth: number,
  ): LayerRenderResult {
    const width = frame.comp.width;
    const height = frame.comp.height;
    const localTime = time - layer.startTime;

    this.clearBuffer(this.layerCtx, width, height);
    this.clearBuffer(this.effectCtx, width, height);

    let drawCalls = this.drawLayerContent(frame, layer, localTime, depth);

    let sourceCanvas: CanvasImageSource = this.layerCanvas;
    const effects = layer.effects;
    let effectCount = 0;

    if (effects && effects.length > 0) {
      for (let i = 0; i < effects.length; i += 1) {
        const effect = effects[i];
        if (!effect.enabled) {
          continue;
        }

        this.clearBuffer(this.effectCtx, width, height);

        if (effect.type === 'grain') {
          this.effectCtx.drawImage(sourceCanvas, 0, 0, width, height);
          const strength = Number(effect.params.strength ?? 0.08);
          const noiseTexture = this.noise.get(width, height, strength);
          this.effectCtx.globalAlpha = Math.max(0, Math.min(1, strength));
          this.effectCtx.globalCompositeOperation = 'overlay';
          this.effectCtx.drawImage(noiseTexture, 0, 0, width, height);
          this.effectCtx.globalAlpha = 1;
          this.effectCtx.globalCompositeOperation = 'source-over';
        } else {
          const builtIn = this.effects.get(effect.type);
          if (builtIn) {
            builtIn.apply(this.effectCtx, effect, {
              source: sourceCanvas,
              width,
              height,
              sourceCtx: this.layerCtx,
            });
          } else {
            const plugin = frame.pluginHost.getEffect(effect.type);
            if (plugin) {
              plugin.apply(this.effectCtx, effect, layer, frame.comp, localTime);
            } else {
              this.effectCtx.drawImage(sourceCanvas, 0, 0, width, height);
            }
          }
        }

        sourceCanvas = this.effectCanvas;
        this.layerCtx.clearRect(0, 0, width, height);
        this.layerCtx.drawImage(this.effectCanvas, 0, 0, width, height);
        sourceCanvas = this.layerCanvas;
        effectCount += 1;
        drawCalls += 1;
      }
    }

    outCtx.save();
    outCtx.globalCompositeOperation = layer.blendMode;
    outCtx.globalAlpha = layer.transform.opacity;

    const { position, scale, rotation, anchor } = layer.transform;
    outCtx.translate(position[0], position[1]);
    outCtx.rotate(degToRad(rotation));
    outCtx.scale(scale[0], scale[1]);
    outCtx.translate(-anchor[0], -anchor[1]);
    outCtx.drawImage(this.layerCanvas, 0, 0, width, height);
    outCtx.restore();

    drawCalls += 1;
    return { drawCalls, effectCount };
  }

  private drawLayerContent(frame: RenderFrameInfo, layer: LayerJSON, localTime: number, depth: number): number {
    const ctx = this.layerCtx;
    let drawCalls = 0;

    if (layer.masks && layer.masks.length > 0) {
      ctx.save();
      for (let i = 0; i < layer.masks.length; i += 1) {
        const mask = layer.masks[i];
        const path = new Path2D(mask.path);
        if (mask.mode === 'add') {
          ctx.clip(path);
        } else {
          ctx.save();
          ctx.globalCompositeOperation = 'destination-out';
          ctx.fill(path);
          ctx.restore();
        }
      }
    }

    if (layer.type === 'solid') {
      ctx.fillStyle = rgbaToCss(layer.color);
      ctx.fillRect(0, 0, frame.comp.width, frame.comp.height);
      drawCalls += 1;
    } else if (layer.type === 'rect') {
      ctx.fillStyle = rgbaToCss(layer.color);
      const path = this.paths.roundedRect(layer.width, layer.height, layer.cornerRadius ?? 0);
      ctx.fill(path);
      drawCalls += 1;
    } else if (layer.type === 'text') {
      const fontWeight = layer.fontWeight ?? '400';
      const lineHeight = layer.lineHeight ?? layer.fontSize * 1.2;
      const font = `${fontWeight} ${layer.fontSize}px ${layer.fontFamily}`;
      ctx.font = font;
      ctx.fillStyle = rgbaToCss(layer.color);
      ctx.textAlign = layer.align ?? 'left';
      ctx.textBaseline = 'top';

      const layout = this.textLayouts.get(ctx, layer.text, font, layer.maxWidth, layer.align);
      for (let i = 0; i < layout.lines.length; i += 1) {
        const line = layout.lines[i];
        ctx.fillText(line, 0, i * lineHeight, layer.maxWidth);
        drawCalls += 1;
      }
    } else if (layer.type === 'image') {
      const loaded = frame.assetRegistry.get<ImageBitmap>(layer.assetId);
      if (loaded?.data) {
        ctx.drawImage(loaded.data, 0, 0, layer.width, layer.height);
        drawCalls += 1;
      }
    } else if (layer.type === 'precomp') {
      if (depth < MAX_PRECOMP_DEPTH) {
        const precomp = frame.project.comps.find((candidate) => candidate.id === layer.compId);
        if (precomp) {
          const nestedTime = (localTime + (layer.timeOffset ?? 0)) * (layer.timeScale ?? 1);
          for (let i = 0; i < precomp.layers.length; i += 1) {
            const nestedLayer = precomp.layers[i];
            if (!layerActiveAt(nestedLayer, nestedTime)) {
              continue;
            }
            const nestedResult = this.renderLayer(
              {
                ...frame,
                comp: precomp,
              },
              nestedLayer,
              ctx,
              nestedTime,
              depth + 1,
            );
            drawCalls += nestedResult.drawCalls;
          }
        }
      }
    } else {
      const plugin = frame.pluginHost.getLayer(layer.type);
      if (plugin) {
        const didRender = plugin.render(ctx, layer, frame.comp, localTime);
        if (didRender) {
          drawCalls += 1;
        }
      }
    }

    if (layer.masks && layer.masks.length > 0) {
      ctx.restore();
    }

    return drawCalls;
  }
}
