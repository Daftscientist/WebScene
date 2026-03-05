import { registerBuiltInEffects } from '../effects/builtins';
import { EffectRegistry } from '../effects/registry';
import type { CameraJSON, CompJSON, EffectInstanceJSON, LayerJSON } from '../core/schema';
import { degToRad } from '../utils/math';
import { rgbaToCss } from '../utils/color';
import { ObjectPool } from '../utils/object-pool';
import type { RenderBackend, RenderFrameInfo, RenderStats, RenderTarget } from './backend';
import { NoiseTextureCache, PathCache, TextLayoutCache } from './cache';
import type { Canvas2DContext } from './context';
import { TrackSampler } from './track-sampler';

const MAX_PRECOMP_DEPTH = 4;

interface LayerRenderResult {
  drawCalls: number;
  effectCount: number;
}

interface ProjectionState {
  x: number;
  y: number;
  perspective: number;
}

interface EffectChainResult {
  source: HTMLCanvasElement | OffscreenCanvas;
  drawCalls: number;
  effectCount: number;
}

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

export class Canvas2DBackend implements RenderBackend {
  public readonly name = 'canvas2d';

  private readonly effects = new EffectRegistry();
  private readonly textLayouts = new TextLayoutCache();
  private readonly paths = new PathCache();
  private readonly noise = new NoiseTextureCache();
  private readonly tracks = new TrackSampler();

  private readonly projections = new ObjectPool<ProjectionState>({
    create: () => ({ x: 0, y: 0, perspective: 1 }),
    reset: (value) => {
      value.x = 0;
      value.y = 0;
      value.perspective = 1;
    },
  });

  private readonly compEffectLayer: LayerJSON = {
    id: '__comp_effects__',
    type: 'custom:comp-effects',
    name: 'comp-effects',
    startTime: 0,
    duration: 0,
    enabled: true,
    depth: 0,
    transform: {
      position: [0, 0],
      scale: [1, 1],
      rotation: 0,
      anchor: [0, 0],
      opacity: 1,
    },
    blendMode: 'source-over',
  };

  private layerCanvas: HTMLCanvasElement | OffscreenCanvas;
  private layerCtx: Canvas2DContext;
  private effectCanvas: HTMLCanvasElement | OffscreenCanvas;
  private effectCtx: Canvas2DContext;
  private compCanvas: HTMLCanvasElement | OffscreenCanvas;
  private compCtx: Canvas2DContext;
  private postCanvas: HTMLCanvasElement | OffscreenCanvas;
  private postCtx: Canvas2DContext;

  public constructor() {
    registerBuiltInEffects(this.effects);

    this.layerCanvas = createBufferCanvas(16, 16);
    this.layerCtx = getContext2D(this.layerCanvas);
    this.effectCanvas = createBufferCanvas(16, 16);
    this.effectCtx = getContext2D(this.effectCanvas);
    this.compCanvas = createBufferCanvas(16, 16);
    this.compCtx = getContext2D(this.compCanvas);
    this.postCanvas = createBufferCanvas(16, 16);
    this.postCtx = getContext2D(this.postCanvas);
  }

  public render(frame: RenderFrameInfo, target: RenderTarget): RenderStats {
    this.ensureBuffers(frame.comp.width, frame.comp.height);
    target.clear();

    const samplingContext = this.tracks.prepare(frame.comp);
    this.clearBuffer(this.compCtx, frame.comp.width, frame.comp.height);
    this.compCtx.fillStyle = rgbaToCss(frame.comp.backgroundColor);
    this.compCtx.fillRect(0, 0, frame.comp.width, frame.comp.height);

    let drawCalls = 1;
    let effectCount = 0;

    const layers = frame.comp.layers;
    for (let i = 0; i < layers.length; i += 1) {
      const sampledLayer = this.tracks.sampleLayer(layers[i], frame.time, samplingContext);
      if (!layerActiveAt(sampledLayer, frame.time)) {
        continue;
      }

      const result = this.renderLayer(frame, sampledLayer, this.compCtx, frame.time, 0);
      drawCalls += result.drawCalls;
      effectCount += result.effectCount;
    }

    const compEffects = this.applyCompEffects(frame, frame.time);
    drawCalls += compEffects.drawCalls;
    effectCount += compEffects.effectCount;

    const targetCtx = target.getContext2D();
    targetCtx.drawImage(compEffects.source, 0, 0, frame.comp.width, frame.comp.height);
    drawCalls += 1;

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
    this.tracks.clear();
  }

  private ensureBuffers(width: number, height: number): void {
    if (this.layerCanvas.width === width && this.layerCanvas.height === height) {
      return;
    }

    this.layerCanvas.width = width;
    this.layerCanvas.height = height;
    this.effectCanvas.width = width;
    this.effectCanvas.height = height;
    this.compCanvas.width = width;
    this.compCanvas.height = height;
    this.postCanvas.width = width;
    this.postCanvas.height = height;
  }

  private clearBuffer(ctx: Canvas2DContext, width: number, height: number): void {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
    ctx.clearRect(0, 0, width, height);
  }

  private applyEffects(
    frame: RenderFrameInfo,
    effects: EffectInstanceJSON[] | undefined,
    initialSource: HTMLCanvasElement | OffscreenCanvas,
    initialSourceCtx: Canvas2DContext,
    initialSwap: HTMLCanvasElement | OffscreenCanvas,
    initialSwapCtx: Canvas2DContext,
    layer: LayerJSON,
    comp: CompJSON,
    time: number,
    width: number,
    height: number,
  ): EffectChainResult {
    if (!effects || effects.length === 0) {
      return {
        source: initialSource,
        drawCalls: 0,
        effectCount: 0,
      };
    }

    let source = initialSource;
    let sourceCtx = initialSourceCtx;
    let swap = initialSwap;
    let swapCtx = initialSwapCtx;
    let drawCalls = 0;
    let effectCount = 0;

    for (let i = 0; i < effects.length; i += 1) {
      const effect = effects[i];
      if (!effect.enabled) {
        continue;
      }

      this.clearBuffer(swapCtx, width, height);

      if (effect.type === 'grain') {
        swapCtx.drawImage(source, 0, 0, width, height);
        const strength = Number(effect.params.strength ?? 0.08);
        const noiseTexture = this.noise.get(width, height, strength);
        swapCtx.globalAlpha = Math.max(0, Math.min(1, strength));
        swapCtx.globalCompositeOperation = 'overlay';
        swapCtx.drawImage(noiseTexture, 0, 0, width, height);
        swapCtx.globalAlpha = 1;
        swapCtx.globalCompositeOperation = 'source-over';
      } else {
        const builtIn = this.effects.get(effect.type);
        if (builtIn) {
          builtIn.apply(swapCtx, effect, {
            source,
            width,
            height,
            sourceCtx,
          });
        } else {
          const plugin = frame.pluginHost.getEffect(effect.type);
          if (plugin) {
            plugin.apply(swapCtx, effect, layer, comp, time);
          } else {
            swapCtx.drawImage(source, 0, 0, width, height);
          }
        }
      }

      const nextSource = swap;
      const nextSourceCtx = swapCtx;
      swap = source;
      swapCtx = sourceCtx;
      source = nextSource;
      sourceCtx = nextSourceCtx;

      drawCalls += 1;
      effectCount += 1;
    }

    return {
      source,
      drawCalls,
      effectCount,
    };
  }

  private applyCompEffects(frame: RenderFrameInfo, time: number): EffectChainResult {
    this.compEffectLayer.duration = frame.comp.duration;

    return this.applyEffects(
      frame,
      frame.comp.effects,
      this.compCanvas,
      this.compCtx,
      this.postCanvas,
      this.postCtx,
      this.compEffectLayer,
      frame.comp,
      time,
      frame.comp.width,
      frame.comp.height,
    );
  }

  private projectLayer(
    comp: CompJSON,
    layer: LayerJSON,
    camera: CameraJSON | undefined,
    out: ProjectionState,
  ): ProjectionState {
    const x = layer.transform.position[0];
    const y = layer.transform.position[1];

    if (!camera) {
      out.x = x;
      out.y = y;
      out.perspective = 1;
      return out;
    }

    const depth = layer.depth ?? 0;
    const zoom = Math.max(1, camera.zoom);
    const effectiveDepth = depth - camera.position[2];
    const perspective = zoom / Math.max(1, zoom + effectiveDepth);

    const halfW = comp.width * 0.5;
    const halfH = comp.height * 0.5;

    out.x = (x - camera.position[0] - halfW) * perspective + halfW;
    out.y = (y - camera.position[1] - halfH) * perspective + halfH;
    out.perspective = perspective;
    return out;
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
    let effectCount = 0;

    let sourceCanvas: HTMLCanvasElement | OffscreenCanvas = this.layerCanvas;
    let sourceCtx: Canvas2DContext = this.layerCtx;
    let swapCanvas: HTMLCanvasElement | OffscreenCanvas = this.effectCanvas;
    let swapCtx: Canvas2DContext = this.effectCtx;

    const layerEffects = this.applyEffects(
      frame,
      layer.effects,
      sourceCanvas,
      sourceCtx,
      swapCanvas,
      swapCtx,
      layer,
      frame.comp,
      localTime,
      width,
      height,
    );

    sourceCanvas = layerEffects.source;
    drawCalls += layerEffects.drawCalls;
    effectCount += layerEffects.effectCount;

    const projection = this.projections.acquire();
    this.projectLayer(frame.comp, layer, frame.comp.camera, projection);

    outCtx.save();
    outCtx.globalCompositeOperation = layer.blendMode;
    outCtx.globalAlpha = layer.transform.opacity;

    const { scale, rotation, anchor } = layer.transform;
    outCtx.translate(projection.x, projection.y);
    outCtx.rotate(degToRad(rotation));
    outCtx.scale(scale[0] * projection.perspective, scale[1] * projection.perspective);
    outCtx.translate(-anchor[0], -anchor[1]);
    outCtx.drawImage(sourceCanvas, 0, 0, width, height);
    outCtx.restore();

    this.projections.release(projection);

    drawCalls += 1;
    return { drawCalls, effectCount };
  }

  private drawLayerContent(
    frame: RenderFrameInfo,
    layer: LayerJSON,
    localTime: number,
    depth: number,
  ): number {
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
          this.clearBuffer(this.postCtx, precomp.width, precomp.height);
          const nestedTime = (localTime + (layer.timeOffset ?? 0)) * (layer.timeScale ?? 1);
          const nestedSampling = this.tracks.prepare(precomp);

          for (let i = 0; i < precomp.layers.length; i += 1) {
            const nestedLayer = this.tracks.sampleLayer(precomp.layers[i], nestedTime, nestedSampling);
            if (!layerActiveAt(nestedLayer, nestedTime)) {
              continue;
            }

            const nestedResult = this.renderLayer(
              {
                ...frame,
                comp: precomp,
              },
              nestedLayer,
              this.postCtx,
              nestedTime,
              depth + 1,
            );

            drawCalls += nestedResult.drawCalls;
          }

          ctx.drawImage(this.postCanvas, 0, 0, precomp.width, precomp.height);
          drawCalls += 1;
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
