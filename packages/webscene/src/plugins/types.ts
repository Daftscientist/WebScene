import type { CompJSON, EffectInstanceJSON, LayerJSON, ProjectJSON } from '../core/schema';
import type { Canvas2DContext } from '../render/context';

export interface LayerPlugin {
  type: string;
  render(context: Canvas2DContext, layer: LayerJSON, comp: CompJSON, time: number): boolean;
}

export interface EffectPlugin {
  type: string;
  apply(
    context: Canvas2DContext,
    effect: EffectInstanceJSON,
    layer: LayerJSON,
    comp: CompJSON,
    time: number,
  ): void;
}

export interface ImporterPlugin {
  type: string;
  import(payload: unknown): Promise<Partial<ProjectJSON>>;
}

export interface EnginePlugin {
  name: string;
  layers?: LayerPlugin[];
  effects?: EffectPlugin[];
  importers?: ImporterPlugin[];
}
