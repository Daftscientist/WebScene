import type { AssetDescriptorJSON, AssetType } from '../core/schema';
import type { ID } from '../utils/types';

export interface AssetProgressEvent {
  loaded: number;
  total: number;
  id: ID;
  src: string;
}

export interface LoadedAsset<TData = unknown> {
  id: ID;
  type: AssetType;
  src: string;
  data: TData;
  bytes?: number;
}

export interface AssetLoaderContext {
  signal?: AbortSignal;
  onProgress?: (event: AssetProgressEvent) => void;
}

export interface AssetLoader {
  supports(type: AssetType): boolean;
  load(descriptor: AssetDescriptorJSON, context: AssetLoaderContext): Promise<LoadedAsset>;
}
