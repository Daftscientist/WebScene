import { ArrayBufferTarget, Muxer } from 'webm-muxer';
import type { Engine } from '../core/engine';
import { framesToSeconds } from '../utils/time';

export interface WebMWebCodecsExportOptions {
  engine: Engine;
  canvas: HTMLCanvasElement | OffscreenCanvas;
  experimental: true;
  codec?: string;
  bitrate?: number;
  startFrame?: number;
  endFrame?: number;
  webmCodec?: 'V_VP9' | 'V_VP8' | 'V_AV1';
}

export interface WebMWebCodecsExportResult {
  codec: string;
  webmCodec: string;
  fps: number;
  width: number;
  height: number;
  blob: Blob;
  bytes: number;
  note: string;
}

export const exportVideoWebM = async (
  options: WebMWebCodecsExportOptions,
): Promise<WebMWebCodecsExportResult> => {
  if (!options.experimental) {
    throw new Error('WebM export is behind an explicit experimental flag');
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
  const webmCodec = options.webmCodec ?? 'V_VP9';
  const bitrate = options.bitrate ?? 5_000_000;
  const startFrame = options.startFrame ?? 0;
  const endFrame = options.endFrame ?? Math.floor(comp.duration * comp.fps);

  const target = new ArrayBufferTarget();
  const muxer = new Muxer({
    target,
    video: {
      codec: webmCodec,
      width: comp.width,
      height: comp.height,
      frameRate: comp.fps,
    },
    firstTimestampBehavior: 'offset',
  });

  const encoder = new VideoEncoder({
    output(chunk, meta) {
      muxer.addVideoChunk(chunk, meta);
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

    encoder.encode(videoFrame, {
      keyFrame: frame === startFrame || frame % Math.round(comp.fps) === 0,
    });

    videoFrame.close();
  }

  await encoder.flush();
  encoder.close();

  muxer.finalize();

  const buffer = target.buffer;
  const blob = new Blob([buffer], { type: 'video/webm' });

  return {
    codec,
    webmCodec,
    fps: comp.fps,
    width: comp.width,
    height: comp.height,
    blob,
    bytes: buffer.byteLength,
    note: 'Experimental path. Browser support and codec/container compatibility vary.',
  };
};
