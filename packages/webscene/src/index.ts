export { Engine } from './core/engine';
export { Project } from './core/project';
export { Comp } from './core/comp';
export { Layer } from './core/layer';
export { Track } from './core/track';
export { createEngine } from './core/create-engine';
export { createIdGenerator, makeStableId } from './core/ids';
export { createPatch, valueAtPath } from './core/state-patch';
export {
  createSolidLayer,
  createRectLayer,
  createTextLayer,
  createImageLayer,
  createPrecompLayer,
  defaultTransform,
  transformWithPosition,
} from './core/layer-factories';
export { serializeProject, deserializeProject } from './core/serialization';
export { aspectPresets, withAspectPreset } from './core/presets';

export { Canvas2DBackend } from './render/canvas2d-backend';
export { CanvasRenderTarget, createOffscreenTarget } from './render/target';

export { AssetRegistry } from './assets/registry';
export { defaultAssetLoaders, ImageAssetLoader, AudioAssetLoader, JsonAssetLoader } from './assets/loaders';

export { easing, resolveEasing } from './animation/easing';
export { registerInterpolator, getInterpolator } from './animation/interpolators';
export { KeyframeTrack } from './animation/keyframe-track';
export { WiggleBehavior, SpringBehavior } from './animation/behaviors';

export { EffectRegistry } from './effects/registry';
export { registerBuiltInEffects } from './effects/builtins';

export { PluginHost } from './plugins/host';

export { AudioMixer } from './audio/mixer';

export { Player } from './player/player';
export { createPlayerControls } from './player/controls';

export { exportFrames, downloadBlob } from './export/frames';
export { exportVideoWebCodecs } from './export/webcodecs';

export type {
  ProjectJSON,
  CompJSON,
  LayerJSON,
  TrackJSON,
  StatePatch,
  MarkerJSON,
  TransformJSON,
  EffectInstanceJSON,
  AssetDescriptorJSON,
  TrackBindingJSON,
  ProjectSettingsJSON,
  BlendMode,
  CameraJSON,
  BehaviorJSON,
} from './core/schema';

export type { TrackValueKind, Interpolator } from './animation/interpolators';
export type { Keyframe } from './animation/keyframe-track';
export type { EnginePlugin, LayerPlugin, EffectPlugin, ImporterPlugin } from './plugins/types';
export type { AudioTimeline, AudioClip } from './audio/types';
export type { ExportFramesOptions, ExportFramesResult, FrameArchiveBuilder } from './export/frames';
export type { WebCodecsExportOptions, WebCodecsExportResult } from './export/webcodecs';
export type { Vec2, Vec3, RGBA, ID } from './utils/types';

export const WEBSCENE_VERSION = '0.1.0';
