import type { Engine } from '../core/engine';
import { framesToSeconds } from '../utils/time';

export interface WebCodecsExportOptions {
  engine: Engine;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  codec?: string;
  bitrate?: number;
  startFrame?: number;
  endFrame?: number;
  experimental: true;
}

export interface EncodedChunk {
  readonly timestamp: number;
  readonly duration: number;
  readonly type: EncodedVideoChunkType;
  readonly data: Uint8Array;
}

export interface WebCodecsExportResult {
  codec: string;
  fps: number;
  width: number;
  height: number;
  chunks: EncodedChunk[];
  note: string;
}

export const exportVideoWebCodecs = async (
  options: WebCodecsExportOptions,
): Promise<WebCodecsExportResult> => {
  if (!options.experimental) {
    throw new Error('WebCodecs export is behind an explicit experimental flag');
  }

  if (typeof VideoEncoder === 'undefined' || typeof VideoFrame === 'undefined') {
    throw new Error('WebCodecs is not supported in this environment');
  }

  const project = options.engine.project;
  const comp = project.comps.find((candidate) => candidate.id === project.rootCompId);
  if (!comp) {
    throw new Error('Root comp missing from project');
  }

  const codec = options.codec ?? 'vp09.00.10.08';
  const bitrate = options.bitrate ?? 5_000_000;
  const startFrame = options.startFrame ?? 0;
  const endFrame = options.endFrame ?? Math.floor(comp.duration * comp.fps);

  const chunks: EncodedChunk[] = [];

  const encoder = new VideoEncoder({
    output(chunk) {
      const bytes = new Uint8Array(chunk.byteLength);
      chunk.copyTo(bytes);
      chunks.push({
        timestamp: chunk.timestamp,
        duration: chunk.duration ?? 0,
        type: chunk.type,
        data: bytes,
      });
    },
    error(error) {
      throw error;
    },
  });

  encoder.configure({
    codec,
    width: comp.width,
    height: comp.height,
    bitrate,
    framerate: comp.fps,
  });

  for (let frame = startFrame; frame <= endFrame; frame += 1) {
    const time = framesToSeconds(frame, comp.fps);
    options.engine.renderAt(time);

    const videoFrame = new VideoFrame(options.canvas, {
      timestamp: Math.round((frame / comp.fps) * 1_000_000),
    });

    encoder.encode(videoFrame, { keyFrame: frame === startFrame || frame % Math.round(comp.fps) === 0 });
    videoFrame.close();
  }

  await encoder.flush();
  encoder.close();

  return {
    codec,
    fps: comp.fps,
    width: comp.width,
    height: comp.height,
    chunks,
    note:
      'Raw encoded chunks are returned. For MP4/WebM output, combine with a container muxer (e.g. mp4box.js or webm-muxer).',
  };
};
