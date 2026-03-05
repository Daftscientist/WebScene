import { SpringBehavior, WiggleBehavior } from '../animation/behaviors';
import type { TrackValueKind } from '../animation/interpolators';
import { Track } from '../core/track';
import type { BehaviorJSON, CompJSON, LayerJSON, TrackJSON } from '../core/schema';

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

const cloneLayerForSampling = (layer: LayerJSON): LayerJSON => {
  const transform = {
    position: [layer.transform.position[0], layer.transform.position[1]] as const,
    scale: [layer.transform.scale[0], layer.transform.scale[1]] as const,
    rotation: layer.transform.rotation,
    anchor: [layer.transform.anchor[0], layer.transform.anchor[1]] as const,
    opacity: layer.transform.opacity,
  };

  return {
    ...layer,
    transform,
  } as LayerJSON;
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

export class TrackSampler {
  public createTrackMap(comp: CompJSON): Map<string, Track<unknown>> {
    const map = new Map<string, Track<unknown>>();
    const tracks: TrackJSON<unknown>[] = comp.tracks ?? [];

    for (let i = 0; i < tracks.length; i += 1) {
      const trackJson = tracks[i];
      const track = new Track<unknown>({
        ...trackJson,
        valueType: trackJson.valueType as TrackValueKind,
      });
      map.set(trackJson.id, track);
    }

    return map;
  }

  public sampleLayer(layer: LayerJSON, time: number, trackMap: Map<string, Track<unknown>>): LayerJSON {
    if (!layer.tracks || layer.tracks.length === 0) {
      return layer;
    }

    const sampled = cloneLayerForSampling(layer);

    for (let i = 0; i < layer.tracks.length; i += 1) {
      const binding = layer.tracks[i];
      const track = trackMap.get(binding.trackId);
      if (!track) {
        continue;
      }

      const value = track.evaluate(time);
      const withBehavior = applyBehavior(value, binding.behavior, time);
      setByPath(sampled as unknown as Record<string, unknown>, binding.path, withBehavior);
    }

    return sampled;
  }
}
