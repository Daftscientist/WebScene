import type { AssetDescriptorJSON } from '../core/schema';
import type { AssetLoader, AssetLoaderContext, LoadedAsset } from './types';

const fetchBuffer = async (
  descriptor: AssetDescriptorJSON,
  context: AssetLoaderContext,
): Promise<ArrayBuffer> => {
  const response = await fetch(
    descriptor.src,
    context.signal ? { signal: context.signal } : undefined,
  );
  if (!response.ok) {
    throw new Error(`Failed to load asset ${descriptor.id} (${response.status})`);
  }

  const buffer = await response.arrayBuffer();
  context.onProgress?.({ loaded: buffer.byteLength, total: buffer.byteLength, id: descriptor.id, src: descriptor.src });
  return buffer;
};

export class ImageAssetLoader implements AssetLoader {
  public supports(type: string): boolean {
    return type === 'image' || type === 'svg';
  }

  public async load(descriptor: AssetDescriptorJSON, context: AssetLoaderContext): Promise<LoadedAsset<ImageBitmap>> {
    const buffer = await fetchBuffer(descriptor, context);
    const blobType = descriptor.type === 'svg' ? 'image/svg+xml' : 'image/*';
    const blob = new Blob([buffer], { type: blobType });
    const bitmap = await createImageBitmap(blob);
    return {
      id: descriptor.id,
      type: descriptor.type,
      src: descriptor.src,
      data: bitmap,
      bytes: buffer.byteLength,
    };
  }
}

export class AudioAssetLoader implements AssetLoader {
  public supports(type: string): boolean {
    return type === 'audio';
  }

  public async load(descriptor: AssetDescriptorJSON, context: AssetLoaderContext): Promise<LoadedAsset<ArrayBuffer>> {
    const buffer = await fetchBuffer(descriptor, context);
    return {
      id: descriptor.id,
      type: descriptor.type,
      src: descriptor.src,
      data: buffer,
      bytes: buffer.byteLength,
    };
  }
}

export class JsonAssetLoader implements AssetLoader {
  public supports(type: string): boolean {
    return type === 'json' || type === 'sprite';
  }

  public async load(
    descriptor: AssetDescriptorJSON,
    context: AssetLoaderContext,
  ): Promise<LoadedAsset<Record<string, unknown>>> {
    const response = await fetch(
      descriptor.src,
      context.signal ? { signal: context.signal } : undefined,
    );
    if (!response.ok) {
      throw new Error(`Failed to load asset ${descriptor.id} (${response.status})`);
    }

    const json = (await response.json()) as Record<string, unknown>;
    context.onProgress?.({ loaded: 1, total: 1, id: descriptor.id, src: descriptor.src });
    return {
      id: descriptor.id,
      type: descriptor.type,
      src: descriptor.src,
      data: json,
    };
  }
}

export const defaultAssetLoaders = (): AssetLoader[] => [
  new ImageAssetLoader(),
  new AudioAssetLoader(),
  new JsonAssetLoader(),
];
