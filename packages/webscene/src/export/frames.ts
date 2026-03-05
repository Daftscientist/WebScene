import type { Engine } from '../core/engine';
import { framesToSeconds } from '../utils/time';

export interface FrameManifestEntry {
  frame: number;
  timestamp: number;
  filename: string;
}

export interface FrameManifest {
  width: number;
  height: number;
  fps: number;
  format: 'png' | 'webp';
  frames: FrameManifestEntry[];
}

export interface FrameArchiveBuilder {
  addFile(name: string, data: Blob | string): Promise<void> | void;
  finalize(): Promise<Blob>;
}

export interface ExportFramesOptions {
  engine: Engine;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  format?: 'png' | 'webp';
  quality?: number;
  startFrame?: number;
  endFrame?: number;
  archiveBuilder?: FrameArchiveBuilder;
}

export interface ExportFramesResult {
  manifest: FrameManifest;
  files: Array<{ name: string; blob: Blob }>;
  archive?: Blob;
}

const toBlob = async (
  canvas: HTMLCanvasElement | OffscreenCanvas,
  mimeType: string,
  quality: number,
): Promise<Blob> => {
  if ('convertToBlob' in canvas) {
    return canvas.convertToBlob({ type: mimeType, quality });
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Canvas toBlob returned null'));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
};

export const exportFrames = async (options: ExportFramesOptions): Promise<ExportFramesResult> => {
  const format = options.format ?? 'png';
  const quality = options.quality ?? 0.92;
  const project = options.engine.project;
  const comp = project.comps.find((candidate) => candidate.id === project.rootCompId);
  if (!comp) {
    throw new Error('Root comp missing from project');
  }

  const startFrame = options.startFrame ?? 0;
  const endFrame = options.endFrame ?? Math.max(0, Math.floor(comp.duration * comp.fps));

  const files: Array<{ name: string; blob: Blob }> = [];
  const manifestFrames: FrameManifestEntry[] = [];

  const extension = format === 'webp' ? 'webp' : 'png';
  const mimeType = format === 'webp' ? 'image/webp' : 'image/png';

  for (let frame = startFrame; frame <= endFrame; frame += 1) {
    const time = framesToSeconds(frame, comp.fps);
    options.engine.renderAt(time);

    const blob = await toBlob(options.canvas, mimeType, quality);
    const filename = `frame_${String(frame).padStart(5, '0')}.${extension}`;
    files.push({ name: filename, blob });
    manifestFrames.push({ frame, timestamp: time, filename });

    if (options.archiveBuilder) {
      await options.archiveBuilder.addFile(filename, blob);
    }
  }

  const manifest: FrameManifest = {
    width: comp.width,
    height: comp.height,
    fps: comp.fps,
    format,
    frames: manifestFrames,
  };

  if (options.archiveBuilder) {
    await options.archiveBuilder.addFile('manifest.json', JSON.stringify(manifest, null, 2));
  }

  const archive = options.archiveBuilder ? await options.archiveBuilder.finalize() : undefined;
  if (archive) {
    return {
      manifest,
      files,
      archive,
    };
  }
  return {
    manifest,
    files,
  };
};

export const downloadBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};
