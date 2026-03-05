import { strToU8, zipSync } from 'fflate';
import type { FrameArchiveBuilder } from './frames';

export interface ZipArchiveBuilderOptions {
  level?: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export class ZipArchiveBuilder implements FrameArchiveBuilder {
  private readonly files: Record<string, Uint8Array> = {};
  private readonly level: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

  public constructor(options: ZipArchiveBuilderOptions = {}) {
    this.level = options.level ?? 6;
  }

  public async addFile(name: string, data: Blob | string): Promise<void> {
    if (typeof data === 'string') {
      this.files[name] = strToU8(data);
      return;
    }

    const buffer = await data.arrayBuffer();
    this.files[name] = new Uint8Array(buffer);
  }

  public finalize(): Promise<Blob> {
    const zipped = zipSync(this.files, { level: this.level });
    const copy = new Uint8Array(zipped.byteLength);
    copy.set(zipped);
    return Promise.resolve(new Blob([copy.buffer], { type: 'application/zip' }));
  }
}

export const createZipArchiveBuilder = (options?: ZipArchiveBuilderOptions): ZipArchiveBuilder =>
  new ZipArchiveBuilder(options);
