import type { AssetDescriptorJSON } from '../core/schema';
import { EventEmitter } from '../utils/event-emitter';
import type { AssetLoader, AssetProgressEvent, LoadedAsset } from './types';
import { defaultAssetLoaders } from './loaders';

interface AssetRegistryEvents {
  progress: AssetProgressEvent;
  loaded: LoadedAsset;
  disposed: { id: string };
}

export class AssetRegistry {
  private readonly assets = new Map<string, LoadedAsset>();
  private readonly loaders: AssetLoader[];
  private readonly events = new EventEmitter<AssetRegistryEvents>();

  public constructor(loaders: AssetLoader[] = defaultAssetLoaders()) {
    this.loaders = loaders;
  }

  public on = this.events.on.bind(this.events);

  public async load(descriptor: AssetDescriptorJSON, signal?: AbortSignal): Promise<LoadedAsset> {
    const cached = this.assets.get(descriptor.id);
    if (cached) {
      return cached;
    }

    const loader = this.loaders.find((item) => item.supports(descriptor.type));
    if (!loader) {
      throw new Error(`No loader registered for asset type: ${descriptor.type}`);
    }

    const asset = await loader.load(descriptor, {
      signal,
      onProgress: (event) => this.events.emit('progress', event),
    });

    this.assets.set(asset.id, asset);
    this.events.emit('loaded', asset);
    return asset;
  }

  public async preload(descriptors: AssetDescriptorJSON[], signal?: AbortSignal): Promise<void> {
    for (let i = 0; i < descriptors.length; i += 1) {
      const descriptor = descriptors[i];
      await this.load(descriptor, signal);
    }
  }

  public get<TData = unknown>(id: string): LoadedAsset<TData> | undefined {
    return this.assets.get(id) as LoadedAsset<TData> | undefined;
  }

  public has(id: string): boolean {
    return this.assets.has(id);
  }

  public dispose(id: string): void {
    const asset = this.assets.get(id);
    if (!asset) {
      return;
    }

    if (typeof ImageBitmap !== 'undefined' && asset.data instanceof ImageBitmap) {
      asset.data.close();
    }

    this.assets.delete(id);
    this.events.emit('disposed', { id });
  }

  public clear(): void {
    for (const id of this.assets.keys()) {
      this.dispose(id);
    }
  }
}
