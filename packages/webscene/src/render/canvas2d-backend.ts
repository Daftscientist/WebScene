import type { AssetRegistry } from '../assets/registry';
import { registerBuiltInEffects } from '../effects/builtins';
import { EffectRegistry } from '../effects/registry';
import type { CompJSON, EffectInstanceJSON, LayerJSON, ProjectJSON } from '../core/schema';
import type { PluginHost } from '../plugins/host';
import { rgbaToCss } from '../utils/color';
import { degToRad } from '../utils/math';
import { ObjectPool } from '../utils/object-pool';
import type { RenderBackend, RenderFrameInfo, RenderStats, RenderTarget } from './backend';
import { NoiseTextureCache, PathCache, TextLayoutCache } from './cache';
import type { Canvas2DContext } from './context';
import { TrackSampler } from './track-sampler';

const MAX_PRECOMP_DEPTH = 4;

interface ProjectionState {
  x: number;
  y: number;
  perspective: number;
}

interface RenderCounters {
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

  private readonly counters: RenderCounters = {
    drawCalls: 0,
    effectCount: 0,
  };

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

  private lookupProjectRef: ProjectJSON | null = null;
  private readonly compLookup = new Map<string, CompJSON>();

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
    this.ensureCompLookup(frame.project);

    this.counters.drawCalls = 0;
    this.counters.effectCount = 0;

    this.clearBuffer(this.compCtx, frame.comp.width, frame.comp.height);
    this.compCtx.fillStyle = rgbaToCss(frame.comp.backgroundColor);
    this.compCtx.fillRect(0, 0, frame.comp.width, frame.comp.height);
    this.counters.drawCalls += 1;

    this.renderCompLayers(frame.project, frame.assetRegistry, frame.pluginHost, frame.comp, frame.time, this.compCtx, 0);

    const compSource = this.applyCompEffects(
      frame.project,
      frame.assetRegistry,
      frame.pluginHost,
      frame.comp,
      frame.time,
      frame.comp.width,
      frame.comp.height,
    );

    target.clear();
    const targetCtx = target.getContext2D();
    targetCtx.drawImage(compSource, 0, 0, frame.comp.width, frame.comp.height);
    this.counters.drawCalls += 1;

    return {
      frame: frame.frame,
      time: frame.time,
      drawCalls: this.counters.drawCalls,
      layerCount: frame.comp.layers.length,
      effectCount: this.counters.effectCount,
    };
  }

  public dispose(): void {
    this.noise.clear();
    this.tracks.clear();
  }

  private ensureCompLookup(project: ProjectJSON): void {
    if (this.lookupProjectRef === project) {
      return;
    }

    this.compLookup.clear();
    for (let i = 0; i < project.comps.length; i += 1) {
      const comp = project.comps[i];
      this.compLookup.set(comp.id, comp);
    }
    this.lookupProjectRef = project;
  }

  private resolveComp(compId: string): CompJSON | undefined {
    return this.compLookup.get(compId);
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
    project: ProjectJSON,
    assets: AssetRegistry,
    plugins: PluginHost,
    comp: CompJSON,
    layer: LayerJSON,
    time: number,
    effects: EffectInstanceJSON[] | undefined,
    initialSource: HTMLCanvasElement | OffscreenCanvas,
    initialSourceCtx: Canvas2DContext,
    initialSwap: HTMLCanvasElement | OffscreenCanvas,
    initialSwapCtx: Canvas2DContext,
    width: number,
    height: number,
  ): HTMLCanvasElement | OffscreenCanvas {
    if (!effects || effects.length === 0) {
      return initialSource;
    }

    let source = initialSource;
    let sourceCtx = initialSourceCtx;
    let swap = initialSwap;
    let swapCtx = initialSwapCtx;

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
          const pluginEffect = plugins.getEffect(effect.type);
          if (pluginEffect) {
            pluginEffect.apply(swapCtx, effect, layer, comp, time);
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

      this.counters.drawCalls += 1;
      this.counters.effectCount += 1;
    }

    return source;
  }

  private applyCompEffects(
    project: ProjectJSON,
    assets: AssetRegistry,
    plugins: PluginHost,
    comp: CompJSON,
    time: number,
    width: number,
    height: number,
  ): HTMLCanvasElement | OffscreenCanvas {
    this.compEffectLayer.duration = comp.duration;

    return this.applyEffects(
      project,
      assets,
      plugins,
      comp,
      this.compEffectLayer,
      time,
      comp.effects,
      this.compCanvas,
      this.compCtx,
      this.postCanvas,
      this.postCtx,
      width,
      height,
    );
  }

  private projectLayer(comp: CompJSON, layer: LayerJSON, out: ProjectionState): void {
    const x = layer.transform.position[0];
    const y = layer.transform.position[1];
    const camera = comp.camera;

    if (!camera) {
      out.x = x;
      out.y = y;
      out.perspective = 1;
      return;
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
  }

  private renderCompLayers(
    project: ProjectJSON,
    assets: AssetRegistry,
    plugins: PluginHost,
    comp: CompJSON,
    time: number,
    outCtx: Canvas2DContext,
    depth: number,
  ): void {
    const sampling = this.tracks.prepare(comp);
    const layers = comp.layers;

    for (let i = 0; i < layers.length; i += 1) {
      const sampledLayer = this.tracks.sampleLayer(layers[i], time, sampling);
      if (!layerActiveAt(sampledLayer, time)) {
        continue;
      }

      this.renderLayer(project, assets, plugins, comp, sampledLayer, time, outCtx, depth);
    }
  }

  private renderLayer(
    project: ProjectJSON,
    assets: AssetRegistry,
    plugins: PluginHost,
    comp: CompJSON,
    layer: LayerJSON,
    time: number,
    outCtx: Canvas2DContext,
    depth: number,
  ): void {
    const width = comp.width;
    const height = comp.height;
    const localTime = time - layer.startTime;

    this.clearBuffer(this.layerCtx, width, height);
    this.clearBuffer(this.effectCtx, width, height);

    this.drawLayerContent(project, assets, plugins, comp, layer, localTime, depth);

    const source = this.applyEffects(
      project,
      assets,
      plugins,
      comp,
      layer,
      localTime,
      layer.effects,
      this.layerCanvas,
      this.layerCtx,
      this.effectCanvas,
      this.effectCtx,
      width,
      height,
    );

    const projection = this.projections.acquire();
    this.projectLayer(comp, layer, projection);

    outCtx.save();
    outCtx.globalCompositeOperation = layer.blendMode;
    outCtx.globalAlpha = layer.transform.opacity;

    const { scale, rotation, anchor } = layer.transform;
    outCtx.translate(projection.x, projection.y);
    outCtx.rotate(degToRad(rotation));
    outCtx.scale(scale[0] * projection.perspective, scale[1] * projection.perspective);
    outCtx.translate(-anchor[0], -anchor[1]);
    outCtx.drawImage(source, 0, 0, width, height);
    outCtx.restore();

    this.projections.release(projection);
    this.counters.drawCalls += 1;
  }

  private drawLayerContent(
    project: ProjectJSON,
    assets: AssetRegistry,
    plugins: PluginHost,
    comp: CompJSON,
    layer: LayerJSON,
    localTime: number,
    depth: number,
  ): void {
    const ctx = this.layerCtx;

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
      ctx.fillRect(0, 0, comp.width, comp.height);
      this.counters.drawCalls += 1;
    } else if (layer.type === 'rect') {
      ctx.fillStyle = rgbaToCss(layer.color);
      const path = this.paths.roundedRect(layer.width, layer.height, layer.cornerRadius ?? 0);
      ctx.fill(path);
      this.counters.drawCalls += 1;
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
        this.counters.drawCalls += 1;
      }
    } else if (layer.type === 'image') {
      const loaded = assets.get<ImageBitmap>(layer.assetId);
      if (loaded?.data) {
        ctx.drawImage(loaded.data, 0, 0, layer.width, layer.height);
        this.counters.drawCalls += 1;
      }
    } else if (layer.type === 'precomp') {
      if (depth < MAX_PRECOMP_DEPTH) {
        const precomp = this.resolveComp(layer.compId);
        if (precomp) {
          this.clearBuffer(this.postCtx, comp.width, comp.height);
          const nestedTime = (localTime + (layer.timeOffset ?? 0)) * (layer.timeScale ?? 1);
          this.renderCompLayers(project, assets, plugins, precomp, nestedTime, this.postCtx, depth + 1);
          ctx.drawImage(this.postCanvas, 0, 0, precomp.width, precomp.height);
          this.counters.drawCalls += 1;
        }
      }
    } else {
      const pluginLayer = plugins.getLayer(layer.type);
      if (pluginLayer) {
        const didRender = pluginLayer.render(ctx, layer, comp, localTime);
        if (didRender) {
          this.counters.drawCalls += 1;
        }
      }
    }

    if (layer.masks && layer.masks.length > 0) {
      ctx.restore();
    }
  }
}
