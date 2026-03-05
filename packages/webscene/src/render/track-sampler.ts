import { SpringBehavior, WiggleBehavior } from '../animation/behaviors';
import type { TrackValueKind } from '../animation/interpolators';
import { Track } from '../core/track';
import type { BehaviorJSON, CompJSON, LayerJSON, TrackJSON } from '../core/schema';

interface CompSamplingCache {
  tracksRef: TrackJSON<unknown>[] | undefined;
  trackMap: Map<string, Track<unknown>>;
  layerMap: Map<string, LayerJSON>;
}

export interface SamplingContext {
  trackMap: Map<string, Track<unknown>>;
  layerMap: Map<string, LayerJSON>;
}

const setByPath = (target: Record<string, unknown>, path: string, value: unknown): void => {
  const keys = path.split('.');
  let cursor: unknown = target;

  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (cursor === null || cursor === undefined) {
      return;
    }

    if (Array.isArray(cursor)) {
      const index = Number.parseInt(key, 10);
      cursor = cursor[index];
    } else {
      cursor = (cursor as Record<string, unknown>)[key];
    }
  }

  const leaf = keys[keys.length - 1];
  if (Array.isArray(cursor)) {
    const index = Number.parseInt(leaf, 10);
    cursor[index] = value;
    return;
  }

  (cursor as Record<string, unknown>)[leaf] = value;
};

const applyBehavior = (value: unknown, behavior: BehaviorJSON | undefined, time: number): unknown => {
  if (!behavior || typeof value !== 'number') {
    return value;
  }

  if (behavior.type === 'wiggle') {
    const instance = new WiggleBehavior(
      Number(behavior.config.frequency ?? 1),
      Number(behavior.config.amplitude ?? 1),
      Number(behavior.config.seed ?? 0),
    );
    return instance.sample(time, value);
  }

  if (behavior.type === 'spring') {
    const instance = new SpringBehavior(
      Number(behavior.config.target ?? value),
      Number(behavior.config.damping ?? 8),
      Number(behavior.config.stiffness ?? 16),
    );
    return instance.sample(time, value);
  }

  return value;
};

const copyLayerBase = (target: LayerJSON, source: LayerJSON): void => {
  target.name = source.name;
  target.enabled = source.enabled;
  target.startTime = source.startTime;
  target.duration = source.duration;
  target.depth = source.depth;
  target.blendMode = source.blendMode;
  target.masks = source.masks;
  target.effects = source.effects;
  target.tracks = source.tracks;

  const targetPosition = target.transform.position as unknown as [number, number];
  const targetScale = target.transform.scale as unknown as [number, number];
  const targetAnchor = target.transform.anchor as unknown as [number, number];

  targetPosition[0] = source.transform.position[0];
  targetPosition[1] = source.transform.position[1];
  targetScale[0] = source.transform.scale[0];
  targetScale[1] = source.transform.scale[1];
  targetAnchor[0] = source.transform.anchor[0];
  targetAnchor[1] = source.transform.anchor[1];
  target.transform.rotation = source.transform.rotation;
  target.transform.opacity = source.transform.opacity;
};

const copyLayerTypeData = (target: LayerJSON, source: LayerJSON): void => {
  if (source.type === 'solid' && target.type === 'solid') {
    const color = target.color as unknown as [number, number, number, number];
    color[0] = source.color[0];
    color[1] = source.color[1];
    color[2] = source.color[2];
    color[3] = source.color[3];
    return;
  }

  if (source.type === 'rect' && target.type === 'rect') {
    target.width = source.width;
    target.height = source.height;
    target.cornerRadius = source.cornerRadius;
    const color = target.color as unknown as [number, number, number, number];
    color[0] = source.color[0];
    color[1] = source.color[1];
    color[2] = source.color[2];
    color[3] = source.color[3];
    return;
  }

  if (source.type === 'text' && target.type === 'text') {
    target.text = source.text;
    target.fontSize = source.fontSize;
    target.fontFamily = source.fontFamily;
    target.fontWeight = source.fontWeight;
    target.lineHeight = source.lineHeight;
    target.maxWidth = source.maxWidth;
    target.align = source.align;
    const color = target.color as unknown as [number, number, number, number];
    color[0] = source.color[0];
    color[1] = source.color[1];
    color[2] = source.color[2];
    color[3] = source.color[3];
    return;
  }

  if (source.type === 'image' && target.type === 'image') {
    target.assetId = source.assetId;
    target.width = source.width;
    target.height = source.height;
    return;
  }

  if (source.type === 'precomp' && target.type === 'precomp') {
    target.compId = source.compId;
    target.timeOffset = source.timeOffset;
    target.timeScale = source.timeScale;
    return;
  }

  Object.assign(target as Record<string, unknown>, source as Record<string, unknown>);
};

const syncSampledLayer = (target: LayerJSON, source: LayerJSON): void => {
  copyLayerBase(target, source);
  copyLayerTypeData(target, source);
};

export class TrackSampler {
  private readonly compCache = new Map<string, CompSamplingCache>();

  public prepare(comp: CompJSON): SamplingContext {
    let cache = this.compCache.get(comp.id);
    if (!cache) {
      cache = {
        tracksRef: undefined,
        trackMap: new Map<string, Track<unknown>>(),
        layerMap: new Map<string, LayerJSON>(),
      };
      this.compCache.set(comp.id, cache);
    }

    if (cache.tracksRef !== comp.tracks) {
      cache.trackMap.clear();
      const tracks: TrackJSON<unknown>[] = comp.tracks ?? [];
      for (let i = 0; i < tracks.length; i += 1) {
        const trackJson = tracks[i];
        const track = new Track<unknown>({
          ...trackJson,
          valueType: trackJson.valueType as TrackValueKind,
        });
        cache.trackMap.set(trackJson.id, track);
      }
      cache.tracksRef = comp.tracks;
    }

    return {
      trackMap: cache.trackMap,
      layerMap: cache.layerMap,
    };
  }

  public sampleLayer(layer: LayerJSON, time: number, context: SamplingContext): LayerJSON {
    if (!layer.tracks || layer.tracks.length === 0) {
      return layer;
    }

    let sampled = context.layerMap.get(layer.id);
    if (!sampled || sampled.type !== layer.type) {
      sampled = structuredClone(layer);
      context.layerMap.set(layer.id, sampled);
    } else {
      syncSampledLayer(sampled, layer);
    }

    for (let i = 0; i < layer.tracks.length; i += 1) {
      const binding = layer.tracks[i];
      const track = context.trackMap.get(binding.trackId);
      if (!track) {
        continue;
      }

      const value = track.evaluate(time);
      const withBehavior = applyBehavior(value, binding.behavior, time);
      setByPath(sampled as unknown as Record<string, unknown>, binding.path, withBehavior);
    }

    return sampled;
  }

  public clear(): void {
    this.compCache.clear();
  }
}
