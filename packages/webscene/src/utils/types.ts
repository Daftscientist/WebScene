export type ID = string;

export type Vec2 = readonly [number, number];
export type Vec3 = readonly [number, number, number];
export type RGBA = readonly [number, number, number, number];

export interface MutableVec2 {
  0: number;
  1: number;
}

export interface MutableVec3 {
  0: number;
  1: number;
  2: number;
}

export interface MutableRGBA {
  0: number;
  1: number;
  2: number;
  3: number;
}

export type PrimitiveTrackValue = number | boolean | string;
export type CompositeTrackValue = Vec2 | Vec3 | RGBA;
export type TrackValue = PrimitiveTrackValue | CompositeTrackValue;

export interface Disposable {
  dispose(): void;
}

export interface Serializable<T> {
  toJSON(): T;
}
