import type { BuiltInEasingName } from '../animation/easing';
import type { TrackValueKind } from '../animation/interpolators';
import type { ID, RGBA, Vec2, Vec3 } from '../utils/types';

export type BlendMode =
  | 'source-over'
  | 'multiply'
  | 'screen'
  | 'overlay'
  | 'darken'
  | 'lighten'
  | 'color-dodge'
  | 'color-burn'
  | 'hard-light'
  | 'soft-light'
  | 'difference'
  | 'exclusion';

export interface TransformJSON {
  position: Vec2;
  scale: Vec2;
  rotation: number;
  anchor: Vec2;
  opacity: number;
}

export interface MarkerJSON {
  id: ID;
  time: number;
  label: string;
  color?: RGBA;
}

export interface TrackKeyframeJSON<TValue> {
  time: number;
  value: TValue;
  easing?: BuiltInEasingName;
  hold?: boolean;
}

export interface TrackJSON<TValue> {
  id: ID;
  name: string;
  valueType: TrackValueKind | `custom:${string}`;
  keyframes: TrackKeyframeJSON<TValue>[];
  interpolator?: string;
}

export interface LayerBaseJSON {
  id: ID;
  type: string;
  name: string;
  startTime: number;
  duration: number;
  enabled: boolean;
  depth?: number;
  transform: TransformJSON;
  blendMode: BlendMode;
  masks?: MaskJSON[];
  effects?: EffectInstanceJSON[];
  tracks?: TrackBindingJSON[];
}

export interface RectLayerJSON extends LayerBaseJSON {
  type: 'rect';
  width: number;
  height: number;
  color: RGBA;
  cornerRadius?: number;
}

export interface SolidLayerJSON extends LayerBaseJSON {
  type: 'solid';
  color: RGBA;
}

export interface TextLayerJSON extends LayerBaseJSON {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight?: string;
  lineHeight?: number;
  maxWidth?: number;
  color: RGBA;
  align?: CanvasTextAlign;
}

export interface ImageLayerJSON extends LayerBaseJSON {
  type: 'image';
  assetId: ID;
  width: number;
  height: number;
}

export interface PrecompLayerJSON extends LayerBaseJSON {
  type: 'precomp';
  compId: ID;
  timeOffset?: number;
  timeScale?: number;
}

export interface CustomLayerJSON extends LayerBaseJSON {
  type: `custom:${string}`;
  [key: string]: unknown;
}

export type LayerJSON =
  | RectLayerJSON
  | SolidLayerJSON
  | TextLayerJSON
  | ImageLayerJSON
  | PrecompLayerJSON
  | CustomLayerJSON;

export interface CameraJSON {
  id: ID;
  position: Vec3;
  zoom: number;
}

export interface CompJSON {
  id: ID;
  name: string;
  width: number;
  height: number;
  fps: number;
  duration: number;
  backgroundColor: RGBA;
  layers: LayerJSON[];
  tracks?: TrackJSON<unknown>[];
  effects?: EffectInstanceJSON[];
  camera?: CameraJSON;
  markers?: MarkerJSON[];
}

export type AssetType = 'image' | 'svg' | 'audio' | 'json' | 'sprite';

export interface AssetDescriptorJSON {
  id: ID;
  type: AssetType;
  src: string;
  meta?: Record<string, unknown>;
}

export interface ProjectSettingsJSON {
  width: number;
  height: number;
  fps: number;
  duration: number;
  colorSpace: 'srgb';
}

export interface ProjectJSON {
  version: '1.0';
  id: ID;
  rootCompId: ID;
  revision: number;
  settings: ProjectSettingsJSON;
  comps: CompJSON[];
  assets: AssetDescriptorJSON[];
  markers: MarkerJSON[];
  idCounter: number;
}

export interface TrackBindingJSON {
  path: string;
  trackId: ID;
  behavior?: BehaviorJSON;
}

export interface BehaviorJSON {
  type: string;
  config: Record<string, unknown>;
}

export interface MaskJSON {
  id: ID;
  path: string;
  mode: 'add' | 'subtract';
}

export interface EffectInstanceJSON {
  id: ID;
  type: string;
  enabled: boolean;
  params: Record<string, number | string | boolean | Vec2 | Vec3 | RGBA>;
}

export interface StatePatch {
  op: 'set' | 'insert' | 'remove';
  path: string;
  value?: unknown;
  previous?: unknown;
  timestamp: number;
}
