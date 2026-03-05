import type {
  ImageLayerJSON,
  LayerBaseJSON,
  PrecompLayerJSON,
  RectLayerJSON,
  SolidLayerJSON,
  TextLayerJSON,
  TransformJSON,
} from './schema';
import type { ID, RGBA, Vec2 } from '../utils/types';

export const defaultTransform = (): TransformJSON => ({
  position: [0, 0],
  scale: [1, 1],
  rotation: 0,
  anchor: [0, 0],
  opacity: 1,
});

export interface LayerBaseCreateOptions {
  id: ID;
  name: string;
  startTime?: number;
  duration: number;
}

const createBase = (options: LayerBaseCreateOptions): LayerBaseJSON => ({
  id: options.id,
  type: 'custom:layer',
  name: options.name,
  startTime: options.startTime ?? 0,
  duration: options.duration,
  enabled: true,
  transform: defaultTransform(),
  blendMode: 'source-over',
});

export const createSolidLayer = (
  options: LayerBaseCreateOptions & {
    color: RGBA;
  },
): SolidLayerJSON => ({
  ...createBase(options),
  type: 'solid',
  color: options.color,
});

export const createRectLayer = (
  options: LayerBaseCreateOptions & {
    width: number;
    height: number;
    color: RGBA;
    cornerRadius?: number;
  },
): RectLayerJSON => ({
  ...createBase(options),
  type: 'rect',
  width: options.width,
  height: options.height,
  color: options.color,
  cornerRadius: options.cornerRadius,
});

export const createTextLayer = (
  options: LayerBaseCreateOptions & {
    text: string;
    color: RGBA;
    fontSize: number;
    fontFamily: string;
    fontWeight?: string;
    maxWidth?: number;
    align?: CanvasTextAlign;
  },
): TextLayerJSON => ({
  ...createBase(options),
  type: 'text',
  text: options.text,
  color: options.color,
  fontSize: options.fontSize,
  fontFamily: options.fontFamily,
  fontWeight: options.fontWeight,
  maxWidth: options.maxWidth,
  align: options.align,
});

export const createImageLayer = (
  options: LayerBaseCreateOptions & {
    assetId: ID;
    width: number;
    height: number;
  },
): ImageLayerJSON => ({
  ...createBase(options),
  type: 'image',
  assetId: options.assetId,
  width: options.width,
  height: options.height,
});

export const createPrecompLayer = (
  options: LayerBaseCreateOptions & {
    compId: ID;
    timeOffset?: number;
    timeScale?: number;
  },
): PrecompLayerJSON => ({
  ...createBase(options),
  type: 'precomp',
  compId: options.compId,
  timeOffset: options.timeOffset,
  timeScale: options.timeScale,
});

export const transformWithPosition = (transform: TransformJSON, x: number, y: number): TransformJSON => ({
  ...transform,
  position: [x, y] as Vec2,
});
