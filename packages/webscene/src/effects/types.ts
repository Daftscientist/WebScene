import type { EffectInstanceJSON } from '../core/schema';
import type { Canvas2DContext } from '../render/context';

export interface EffectApplyContext {
  source: CanvasImageSource;
  width: number;
  height: number;
  sourceCtx?: Canvas2DContext;
}

export interface EffectHandler {
  type: string;
  apply(targetCtx: Canvas2DContext, effect: EffectInstanceJSON, context: EffectApplyContext): void;
}
